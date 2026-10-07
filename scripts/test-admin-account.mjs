import mongoose from "mongoose";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let mongoUri = process.env.MONGODB_URI;
let adminEmail = process.env.ADMIN_EMAIL || "admin@salon.com";
let initialPassword = process.env.ADMIN_INITIAL_PASSWORD || "TemporaryPass123!";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [k, ...v] = trimmed.split("=");
      const val = v.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (k === "MONGODB_URI") mongoUri = val;
      if (k === "ADMIN_EMAIL") adminEmail = val;
      if (k === "ADMIN_INITIAL_PASSWORD") initialPassword = val;
    }
  }
}

async function runAll12Tests() {
  console.log("==================================================");
  console.log("STARTING 12 TEST CASES FOR ADMIN ACCOUNT SETUP");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function report(name, condition, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${detail ? `- ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // Connect to DB directly for state assertions
  await mongoose.connect(mongoUri);
  const usersCol = mongoose.connection.db.collection("users");

  // Reset admin for initial seed test
  await usersCol.deleteMany({ role: "admin" });

  // -------------------------------------------------------------------------
  // TEST 1: Initial seed command creates admin
  // -------------------------------------------------------------------------
  try {
    const out1 = execSync("npm run seed:admin", { encoding: "utf-8" });
    const userInDb = await usersCol.findOne({ email: adminEmail.toLowerCase() });
    const pass1 =
      out1.includes("Initial admin account created successfully") &&
      userInDb &&
      userInDb.role === "admin" &&
      userInDb.mustChangePassword === true;
    report("TEST 1: Run npm run seed:admin creates admin", pass1, `mustChangePassword=${userInDb?.mustChangePassword}`);
  } catch (err) {
    report("TEST 1: Run npm run seed:admin creates admin", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Run seed command again -> no duplicate, password not changed
  // -------------------------------------------------------------------------
  try {
    const adminBefore = await usersCol.findOne({ email: adminEmail.toLowerCase() });
    const out2 = execSync("npm run seed:admin", { encoding: "utf-8" });
    const adminAfter = await usersCol.findOne({ email: adminEmail.toLowerCase() });
    const adminCount = await usersCol.countDocuments({ role: "admin" });

    const pass2 =
      out2.includes("Admin account already exists") &&
      adminCount === 1 &&
      adminBefore.password === adminAfter.password;
    report("TEST 2: Seed command again does not overwrite or duplicate", pass2, `Admin count: ${adminCount}`);
  } catch (err) {
    report("TEST 2: Seed command again", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Login with seeded admin succeeds
  // -------------------------------------------------------------------------
  let seededCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: initialPassword }),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) seededCookie = setCookie.split(";")[0];
    const data = await res.json();

    const pass3 =
      res.ok &&
      data.success &&
      data.user?.role === "admin" &&
      data.user?.mustChangePassword === true;
    report("TEST 3: Login with seeded admin succeeds", pass3, `User: ${data.user?.email}, mustChangePassword: ${data.user?.mustChangePassword}`);
  } catch (err) {
    report("TEST 3: Login with seeded admin succeeds", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Seeded admin with mustChangePassword=true attempts /admin -> Redirects
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: seededCookie },
      redirect: "manual",
    });
    const location = res.headers.get("location");
    const pass4 =
      (res.status === 307 || res.status === 302 || res.status === 308) &&
      location?.includes("/admin/change-password");
    report("TEST 4: Seeded admin accessing /admin redirects to /admin/change-password", pass4, `Status ${res.status}, Location: ${location}`);
  } catch (err) {
    report("TEST 4: Seeded admin accessing /admin redirects", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Wrong current password rejected
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: seededCookie,
      },
      body: JSON.stringify({
        currentPassword: "WrongPassword999!",
        newPassword: "BrandNewPass123!",
        confirmPassword: "BrandNewPass123!",
      }),
    });
    const data = await res.json();
    const pass5 = res.status === 400 && data.success === false && data.message?.includes("Current password is incorrect");
    report("TEST 5: Wrong current password rejected", pass5, `Status: ${res.status}, Message: ${data.message}`);
  } catch (err) {
    report("TEST 5: Wrong current password rejected", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: New passwords do not match rejected
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: seededCookie,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: "BrandNewPass123!",
        confirmPassword: "MismatchPass456!",
      }),
    });
    const data = await res.json();
    const pass6 = res.status === 400 && data.success === false && data.message?.includes("New passwords do not match");
    report("TEST 6: Password confirmation mismatch rejected", pass6, `Status: ${res.status}, Message: ${data.message}`);
  } catch (err) {
    report("TEST 6: Password confirmation mismatch rejected", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: Correct password change -> bcrypt hashed, mustChangePassword=false
  // -------------------------------------------------------------------------
  const newPasswordVal = "PermanentAdminPass123!";
  try {
    const res = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: seededCookie,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: newPasswordVal,
        confirmPassword: newPasswordVal,
      }),
    });
    const data = await res.json();
    const adminInDb = await usersCol.findOne({ email: adminEmail.toLowerCase() });

    const pass7 =
      res.status === 200 &&
      data.success === true &&
      adminInDb.mustChangePassword === false;
    report("TEST 7: Correct password change updates DB with mustChangePassword=false", pass7, `mustChangePassword=${adminInDb?.mustChangePassword}`);
  } catch (err) {
    report("TEST 7: Correct password change", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: Old password login is rejected
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: initialPassword }),
    });
    const pass8 = res.status === 401;
    report("TEST 8: Login with old temporary password is rejected", pass8, `Status: ${res.status}`);
  } catch (err) {
    report("TEST 8: Login with old temporary password", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9: New password login succeeds & redirects to /admin
  // -------------------------------------------------------------------------
  let activeAdminCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: newPasswordVal }),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) activeAdminCookie = setCookie.split(";")[0];
    const data = await res.json();

    // Verify /admin now returns 200 without redirect
    const adminPageRes = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: activeAdminCookie },
      redirect: "manual",
    });

    const pass9 =
      res.ok &&
      data.success &&
      data.user?.mustChangePassword === false &&
      adminPageRes.status === 200;
    report("TEST 9: New password login succeeds and /admin accessible (Status 200)", pass9, `Login ok: ${data.success}, /admin status: ${adminPageRes.status}`);
  } catch (err) {
    report("TEST 9: New password login succeeds", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10: Non-admin / Customer login is blocked by /api/auth/login
  // -------------------------------------------------------------------------
  try {
    const custRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "customer@test.com", password: "Password123!" }),
    });
    const custData = await custRes.json().catch(() => ({}));
    const pass10 =
      (custRes.status === 403 || custRes.status === 401) &&
      (custData.message?.includes("Access restricted") || custData.message?.includes("Invalid"));
    report("TEST 10: Non-admin login is blocked by admin-only auth", pass10, `Status: ${custRes.status}, Message: ${custData.message}`);
  } catch (err) {
    report("TEST 10: Non-admin login is blocked by admin-only auth", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 11: Logged-out user attempts /admin/change-password -> Redirects to /admin/login
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/admin/change-password`, {
      redirect: "manual",
    });
    const location = res.headers.get("location");
    const pass11 =
      (res.status === 307 || res.status === 302 || res.status === 308) &&
      location?.includes("/admin/login");
    report("TEST 11: Logged-out user accessing /admin/change-password redirects to /admin/login", pass11, `Status: ${res.status}, Location: ${location}`);
  } catch (err) {
    report("TEST 11: Logged-out user accessing /admin/change-password", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 12: Admin changes password again later -> Works normally
  // -------------------------------------------------------------------------
  const finalPasswordVal = "UpdatedLaterAdminPass789!";
  try {
    const res = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: activeAdminCookie,
      },
      body: JSON.stringify({
        currentPassword: newPasswordVal,
        newPassword: finalPasswordVal,
        confirmPassword: finalPasswordVal,
      }),
    });
    const data = await res.json();

    // Verify login with final updated password
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: finalPasswordVal }),
    });

    const pass12 = res.status === 200 && data.success && loginRes.status === 200;
    report("TEST 12: Admin changes password again later works normally", pass12, `Change ok: ${data.success}, Login with final password ok: ${loginRes.status === 200}`);
  } catch (err) {
    report("TEST 12: Admin changes password again later", false, err.message);
  }

  // Cleanup: Reset admin back to initial bootstrap state for user convenience
  try {
    const bcrypt = (await import("bcryptjs")).default;
    const initialHashed = await bcrypt.hash(initialPassword, 10);
    await usersCol.updateOne(
      { email: adminEmail.toLowerCase() },
      { $set: { password: initialHashed, mustChangePassword: true } }
    );
    console.log(`[CLEANUP] Admin account restored to initial temporary password.`);
  } catch (cleanErr) {
    console.error("[CLEANUP] Failed to restore admin account:", cleanErr.message);
  }

  await mongoose.disconnect();

  console.log(`\n==================================================`);
  console.log(`ADMIN ACCOUNT SETUP RESULTS: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} TOTAL`);
  console.log(`==================================================\n`);

  if (failed > 0) process.exit(1);
}

runAll12Tests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
