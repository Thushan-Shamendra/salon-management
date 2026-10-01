import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// PUT /api/admin/change-password - ADMIN ONLY
export async function PUT(request: Request) {
  try {
    // 1. Authenticate user
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Authorize role: admin only
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // 3. Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "All password fields are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New passwords do not match" },
        { status: 400 }
      );
    }

    // Password strength validation: min 8 chars, uppercase, lowercase, number
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters long",
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
            "New password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // 4. Load admin from MongoDB including password hash
    const adminUser = await User.findById(currentUser._id);

    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: "Admin account not found" },
        { status: 404 }
      );
    }

    // 5. Compare current password
    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      adminUser.password
    );

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // 6. Check that new password differs from current
    const isSamePassword = await bcrypt.compare(
      newPassword,
      adminUser.password
    );

    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password cannot be identical to your current password",
        },
        { status: 400 }
      );
    }

    // 7. Hash new password & clear mustChangePassword flag
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    adminUser.password = hashedNewPassword;
    adminUser.mustChangePassword = false;
    await adminUser.save();

    // 8. Return safe response (no passwords/hashes exposed)
    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin change password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change admin password" },
      { status: 500 }
    );
  }
}
