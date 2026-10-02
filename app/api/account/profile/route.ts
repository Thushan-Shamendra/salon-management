import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s\-().]{7,25}$/;

// GET /api/account/profile - Get currently authenticated customer profile
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage || "",
        profileImagePublicId: user.profileImagePublicId || "",
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load profile",
      },
      { status: 500 }
    );
  }
}

// PUT /api/account/profile - Update customer profile information
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone, profileImage, profileImagePublicId } = body;

    // 1. Name validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required and must be at least 2 characters",
        },
        { status: 400 }
      );
    }

    // 2. Email validation
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid email address is required",
        },
        { status: 400 }
      );
    }

    // 3. Phone validation
    if (!phone || typeof phone !== "string" || !PHONE_REGEX.test(phone.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid phone number is required (at least 7 digits)",
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPhone = phone.trim();
    const trimmedImage =
      typeof profileImage === "string" ? profileImage.trim() : "";
    const trimmedPublicId =
      typeof profileImagePublicId === "string" ? profileImagePublicId.trim() : "";

    await connectDB();

    // 4. Duplicate email check
    if (normalizedEmail !== user.email) {
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "An account with this email already exists",
          },
          { status: 409 }
        );
      }
    }

    const oldPublicId = user.profileImagePublicId;

    // 5. Update only permitted fields (strictly exclude role, isActive, password, _id)
    user.name = trimmedName;
    user.email = normalizedEmail;
    user.phone = trimmedPhone;
    user.profileImage = trimmedImage;
    user.profileImagePublicId = trimmedPublicId || undefined;

    await user.save();

    // After DB save succeeds, delete previous Cloudinary profile photo if replaced or removed
    if (oldPublicId && oldPublicId !== trimmedPublicId) {
      try {
        await deleteCloudinaryImage(oldPublicId);
      } catch (cldErr) {
        console.error("Failed to delete previous customer profile image from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage || "",
        profileImagePublicId: user.profileImagePublicId || "",
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
