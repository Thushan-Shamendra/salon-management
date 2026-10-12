import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashOtp, generatePasswordResetToken } from "@/lib/auth-crypto";

// POST /api/auth/verify-otp - Verify 6-digit OTP and issue a short-lived reset token
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body || {};

    if (!email || !otp || typeof email !== "string" || typeof otp !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Email address and 6-digit verification code are required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedOtp = otp.trim();

    // Verify OTP format: 6 numeric digits
    if (!/^\d{6}$/.test(trimmedOtp)) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification code must be 6 digits",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      email: normalizedEmail,
      role: "admin",
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or verification code",
        },
        { status: 400 }
      );
    }

    // 1. Check if an active OTP exists
    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: "No active verification code found. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // 2. Check if attempts already reached/exceeded 5
    const currentAttempts = user.passwordResetOtpAttempts || 0;
    if (currentAttempts >= 5) {
      // Invalidate current OTP
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
      user.passwordResetOtpAttempts = 0;
      await user.save();

      return NextResponse.json(
        {
          success: false,
          message:
            "Too many failed attempts. This code has been invalidated. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // 3. Check if OTP has expired (10 minutes)
    if (new Date() > new Date(user.passwordResetOtpExpiresAt)) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
      user.passwordResetOtpAttempts = 0;
      await user.save();

      return NextResponse.json(
        {
          success: false,
          message: "Verification code has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // 4. Compare hash of submitted OTP
    const incomingHash = hashOtp(trimmedOtp);
    const isMatch = incomingHash === user.passwordResetOtpHash;

    if (!isMatch) {
      const updatedAttempts = currentAttempts + 1;
      user.passwordResetOtpAttempts = updatedAttempts;

      if (updatedAttempts >= 5) {
        // Exceeded attempt limit - invalidate OTP
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpiresAt = undefined;
        user.passwordResetOtpAttempts = 0;
        await user.save();

        return NextResponse.json(
          {
            success: false,
            message:
              "Too many failed attempts. This code has been invalidated. Please request a new code.",
          },
          { status: 400 }
        );
      }

      await user.save();
      const remaining = 5 - updatedAttempts;

      return NextResponse.json(
        {
          success: false,
          message: `Incorrect verification code. ${remaining} attempt${
            remaining === 1 ? "" : "s"
          } remaining.`,
        },
        { status: 400 }
      );
    }

    // 5. OTP verified!
    // Invalidate the one-time OTP
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpAttempts = 0;

    // Generate short-lived secure password reset token (15 mins)
    const { rawToken, tokenHash } = generatePasswordResetToken();
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.passwordResetVerified = true;
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = tokenExpiresAt;

    await user.save();

    // 6. Return the raw reset token to authorized client flow
    return NextResponse.json(
      {
        success: true,
        message: "Code verified successfully.",
        resetToken: rawToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/auth/verify-otp error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during verification.",
      },
      { status: 500 }
    );
  }
}
