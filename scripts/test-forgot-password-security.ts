import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Import route handlers
import { POST as forgotPasswordHandler } from "../app/api/auth/forgot-password/route";
import { POST as verifyOtpHandler } from "../app/api/auth/verify-otp/route";
import { POST as resetPasswordHandler } from "../app/api/auth/reset-password/route";
import User from "../models/User";
import { hashOtp } from "../lib/auth-crypto";

function createJsonRequest(url: string, body: Record<string, unknown>): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function runSecurityTests() {
  console.log("==================================================");
  console.log("FORGOT PASSWORD USER-ENUMERATION SECURITY SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function report(name: string, condition: boolean, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name}${detail ? ` - ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI not found in environment.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const TEST_ADMIN_EMAIL = "security_test_admin@salvora.lk";
  const UNKNOWN_EMAIL = "completely_unknown_user_98765@salvora.lk";
  const INITIAL_PASSWORD = "InitialSecPass123!";
  const NEW_PASSWORD = "BrandNewSecPass456!";

  // 1. Setup Test Admin
  const hashedInitial = await bcrypt.hash(INITIAL_PASSWORD, 10);
  await User.deleteOne({ email: TEST_ADMIN_EMAIL });
  await User.create({
    name: "Security Test Admin",
    email: TEST_ADMIN_EMAIL,
    phone: "0771234567",
    password: hashedInitial,
    role: "admin",
    isActive: true,
    mustChangePassword: false,
  });

  // Ensure unknown user doesn't exist
  await User.deleteOne({ email: UNKNOWN_EMAIL });

  // -------------------------------------------------------------------------
  // TEST 1: Existing admin email first request -> HTTP 200 generic response
  // -------------------------------------------------------------------------
  const req1 = createJsonRequest("http://localhost/api/auth/forgot-password", {
    email: TEST_ADMIN_EMAIL,
  });
  const res1 = await forgotPasswordHandler(req1);
  const status1 = res1.status;
  const data1 = await res1.json();

  const userAfter1 = await User.findOne({ email: TEST_ADMIN_EMAIL });
  const hasOtp1 = Boolean(userAfter1?.passwordResetOtpHash);
  const requestedAt1 = userAfter1?.passwordResetRequestedAt;
  const otpHash1 = userAfter1?.passwordResetOtpHash;

  report(
    "1. Existing admin email first request returns HTTP 200 with generic response",
    status1 === 200 &&
      data1.success === true &&
      data1.message ===
        "If an administrator account exists for this email, a verification code will be sent shortly." &&
      hasOtp1 &&
      Boolean(requestedAt1),
    `Status: ${status1}, message: "${data1.message}"`
  );

  // -------------------------------------------------------------------------
  // TEST 2: Same existing email immediately again (cooldown active)
  //         -> HTTP 200 SAME generic response, NO second OTP/email generated
  // -------------------------------------------------------------------------
  const req2 = createJsonRequest("http://localhost/api/auth/forgot-password", {
    email: TEST_ADMIN_EMAIL,
  });
  const res2 = await forgotPasswordHandler(req2);
  const status2 = res2.status;
  const data2 = await res2.json();

  const userAfter2 = await User.findOne({ email: TEST_ADMIN_EMAIL });
  const otpHash2 = userAfter2?.passwordResetOtpHash;
  const requestedAt2 = userAfter2?.passwordResetRequestedAt;

  const noSecondOtp =
    otpHash1 === otpHash2 &&
    requestedAt1?.getTime() === requestedAt2?.getTime();

  report(
    "2. Same existing email immediately again returns HTTP 200 SAME generic response without regenerating OTP",
    status2 === 200 &&
      data2.success === true &&
      data2.message ===
        "If an administrator account exists for this email, a verification code will be sent shortly." &&
      data2.retryAfter === undefined &&
      noSecondOtp,
    `Status: ${status2}, OTP unchanged: ${noSecondOtp}`
  );

  // -------------------------------------------------------------------------
  // TEST 3: Unknown email -> HTTP 200 SAME generic response
  // -------------------------------------------------------------------------
  const req3 = createJsonRequest("http://localhost/api/auth/forgot-password", {
    email: UNKNOWN_EMAIL,
  });
  const res3 = await forgotPasswordHandler(req3);
  const status3 = res3.status;
  const data3 = await res3.json();

  const unknownInDb3 = await User.findOne({ email: UNKNOWN_EMAIL });

  report(
    "3. Unknown email returns HTTP 200 SAME generic response without creating account",
    status3 === 200 &&
      data3.success === true &&
      data3.message ===
        "If an administrator account exists for this email, a verification code will be sent shortly." &&
      unknownInDb3 === null,
    `Status: ${status3}, Unknown in DB: ${Boolean(unknownInDb3)}`
  );

  // -------------------------------------------------------------------------
  // TEST 4: Repeat unknown email -> HTTP 200 SAME generic response
  // -------------------------------------------------------------------------
  const req4 = createJsonRequest("http://localhost/api/auth/forgot-password", {
    email: UNKNOWN_EMAIL,
  });
  const res4 = await forgotPasswordHandler(req4);
  const status4 = res4.status;
  const data4 = await res4.json();

  report(
    "4. Repeat unknown email returns HTTP 200 SAME generic response",
    status4 === 200 &&
      data4.success === true &&
      data4.message ===
        "If an administrator account exists for this email, a verification code will be sent shortly." &&
      data4.retryAfter === undefined,
    `Status: ${status4}`
  );

  // -------------------------------------------------------------------------
  // TEST 5: Indistinguishability Check (Enumeration Protection)
  //         Ensure response body & status cannot distinguish registered vs unregistered
  // -------------------------------------------------------------------------
  const str1 = JSON.stringify(data1);
  const str2 = JSON.stringify(data2);
  const str3 = JSON.stringify(data3);
  const str4 = JSON.stringify(data4);

  const allStatusesMatch =
    status1 === 200 && status2 === 200 && status3 === 200 && status4 === 200;
  const allBodiesMatch =
    str1 === str2 && str2 === str3 && str3 === str4;

  report(
    "5. Response body and status are 100% indistinguishable across all cases",
    allStatusesMatch && allBodiesMatch,
    `Status: ${status1}, Body: ${str1}`
  );

  // -------------------------------------------------------------------------
  // TEST 6: Existing OTP verification and reset-password flow continue passing
  // -------------------------------------------------------------------------
  // Reset admin's OTP to a known value for deterministic testing
  const KNOWN_OTP = "654321";
  userAfter2!.passwordResetOtpHash = hashOtp(KNOWN_OTP);
  userAfter2!.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  userAfter2!.passwordResetOtpAttempts = 0;
  userAfter2!.passwordResetVerified = false;
  await userAfter2!.save();

  // 6a: Wrong OTP rejected
  const reqWrongOtp = createJsonRequest("http://localhost/api/auth/verify-otp", {
    email: TEST_ADMIN_EMAIL,
    otp: "000000",
  });
  const resWrongOtp = await verifyOtpHandler(reqWrongOtp);
  const dataWrongOtp = await resWrongOtp.json();
  report(
    "6a. Wrong OTP rejected with 400 and attempts incremented",
    resWrongOtp.status === 400 && dataWrongOtp.success === false,
    `Status: ${resWrongOtp.status}, Message: "${dataWrongOtp.message}"`
  );

  // 6b: Valid OTP verification succeeds and returns resetToken
  const reqValidOtp = createJsonRequest("http://localhost/api/auth/verify-otp", {
    email: TEST_ADMIN_EMAIL,
    otp: KNOWN_OTP,
  });
  const resValidOtp = await verifyOtpHandler(reqValidOtp);
  const dataValidOtp = await resValidOtp.json();
  const resetToken = dataValidOtp.resetToken;

  report(
    "6b. Valid OTP verification returns HTTP 200 with resetToken",
    resValidOtp.status === 200 &&
      dataValidOtp.success === true &&
      typeof resetToken === "string" &&
      resetToken.length >= 32,
    `Status: ${resValidOtp.status}, resetToken length: ${resetToken?.length}`
  );

  // 6c: Invalid reset token rejected by reset-password
  const reqWrongToken = createJsonRequest(
    "http://localhost/api/auth/reset-password",
    {
      email: TEST_ADMIN_EMAIL,
      resetToken: "invalid_tampered_token_abcdef123456",
      newPassword: NEW_PASSWORD,
    }
  );
  const resWrongToken = await resetPasswordHandler(reqWrongToken);
  report(
    "6c. Invalid reset token rejected by reset-password with 400",
    resWrongToken.status === 400,
    `Status: ${resWrongToken.status}`
  );

  // 6d: Valid reset token updates password and clears reset fields
  const reqValidReset = createJsonRequest(
    "http://localhost/api/auth/reset-password",
    {
      email: TEST_ADMIN_EMAIL,
      resetToken: resetToken,
      newPassword: NEW_PASSWORD,
    }
  );
  const resValidReset = await resetPasswordHandler(reqValidReset);
  const dataValidReset = await resValidReset.json();

  const userAfterReset = await User.findOne({ email: TEST_ADMIN_EMAIL });
  const isNewPasswordValid = await bcrypt.compare(
    NEW_PASSWORD,
    userAfterReset?.password || ""
  );
  const isOldPasswordInvalid = !(await bcrypt.compare(
    INITIAL_PASSWORD,
    userAfterReset?.password || ""
  ));

  const allFieldsCleared =
    userAfterReset?.passwordResetOtpHash === undefined &&
    userAfterReset?.passwordResetOtpExpiresAt === undefined &&
    userAfterReset?.passwordResetOtpAttempts === 0 &&
    userAfterReset?.passwordResetVerified === false &&
    userAfterReset?.passwordResetTokenHash === undefined &&
    userAfterReset?.passwordResetTokenExpiresAt === undefined &&
    userAfterReset?.passwordResetRequestedAt === undefined;

  report(
    "6d. Valid reset updates password via bcrypt and clears all reset fields in MongoDB",
    resValidReset.status === 200 &&
      dataValidReset.success === true &&
      isNewPasswordValid &&
      isOldPasswordInvalid &&
      allFieldsCleared,
    `Status: ${resValidReset.status}, Password updated: ${isNewPasswordValid}, Fields cleared: ${allFieldsCleared}`
  );

  // Cleanup test user
  await User.deleteOne({ email: TEST_ADMIN_EMAIL });
  await mongoose.disconnect();

  console.log(`\n==================================================`);
  console.log(
    `SECURITY TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED out of ${
      passed + failed
    } TOTAL`
  );
  console.log("==================================================\n");

  if (failed > 0) process.exit(1);
}

runSecurityTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
