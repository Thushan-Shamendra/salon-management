import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashResetToken } from "@/lib/auth-crypto";

// POST /api/auth/reset-password - Secure password update using verified reset token
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, resetToken, newPassword } = body || {};

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, reset token, and new password are required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedToken = resetToken.trim();

    // 1. Password strength validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
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
          message: "Invalid or expired reset session",
        },
        { status: 400 }
      );
    }

    // 2. Validate reset verification state and token existence
    if (
      !user.passwordResetVerified ||
      !user.passwordResetTokenHash ||
      !user.passwordResetTokenExpiresAt
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "No verified reset session found. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // 3. Check token expiry (10-15 minutes)
    if (new Date() > new Date(user.passwordResetTokenExpiresAt)) {
      // Clear expired state
      user.passwordResetVerified = false;
      user.passwordResetTokenHash = undefined;
      user.passwordResetTokenExpiresAt = undefined;
      await user.save();

      return NextResponse.json(
        {
          success: false,
          message: "Password reset session has expired. Please restart the reset process.",
        },
        { status: 400 }
      );
    }

    // 4. Compare token hash
    const incomingTokenHash = hashResetToken(trimmedToken);
    if (incomingTokenHash !== user.passwordResetTokenHash) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid password reset token.",
        },
        { status: 400 }
      );
    }

    // 5. Hash new password with bcryptjs (12 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 6. Update password and clear ALL reset fields
    user.password = hashedPassword;
    user.mustChangePassword = false;

    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetVerified = false;
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    user.passwordResetRequestedAt = undefined;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while resetting your password.",
      },
      { status: 500 }
    );
  }
}
