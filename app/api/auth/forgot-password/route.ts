import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateSecureOtp, hashOtp } from "@/lib/auth-crypto";
import { sendPasswordResetOtpEmail } from "@/lib/email";

// POST /api/auth/forgot-password - Request 6-digit OTP for admin password reset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Email address is required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    // 1. Locate administrator account
    const user = await User.findOne({
      email: normalizedEmail,
      role: "admin",
    });

    // 2. Generic success message to eliminate account enumeration vectors
    const genericSuccessResponse = {
      success: true,
      message:
        "If an administrator account exists for this email, a verification code will be sent shortly.",
    };

    // If admin doesn't exist or is deactivated, return generic success without generating or sending anything
    if (!user || !user.isActive) {
      return NextResponse.json(genericSuccessResponse, { status: 200 });
    }

    // 3. Enforce 60-second cooldown rate limit per admin email
    const cooldownMs = 60 * 1000;
    if (user.passwordResetRequestedAt) {
      const elapsedMs =
        Date.now() - new Date(user.passwordResetRequestedAt).getTime();

      if (elapsedMs < cooldownMs) {
        // Cooldown is active: do not generate another OTP, do not send email, return identical generic response
        return NextResponse.json(genericSuccessResponse, { status: 200 });
      }
    }

    // 4. Cooldown has expired: Generate cryptographically secure 6-digit OTP
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);

    // 5. Expiry: 10 minutes from now
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 6. Update user reset state in MongoDB
    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = otpExpiresAt;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetVerified = false;
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    user.passwordResetRequestedAt = new Date();

    await user.save();

    // 7. Dispatch branded email (never log plain OTP, SMTP password, or reset token)
    try {
      const emailResult = await sendPasswordResetOtpEmail({
        to: user.email,
        otp,
        userName: user.name,
      });

      if (!emailResult.success) {
        console.error(
          `[Auth] Password reset email dispatch failed for admin: ${user.email}`
        );
      }
    } catch {
      console.error(
        `[Auth] Unexpected error during password reset email dispatch for: ${user.email}`
      );
    }

    // 8. Return identical generic response
    return NextResponse.json(genericSuccessResponse, { status: 200 });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while processing your request.",
      },
      { status: 500 }
    );
  }
}
