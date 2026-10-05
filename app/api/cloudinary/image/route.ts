import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteCloudinaryImage, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Account is inactive" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { publicId } = body;

    if (!publicId || typeof publicId !== "string" || !publicId.trim()) {
      return NextResponse.json(
        { success: false, message: "A valid publicId is required" },
        { status: 400 }
      );
    }

    const trimmedPublicId = publicId.trim();

    // Security check: Only allow deleting assets within our application namespace
    if (!trimmedPublicId.startsWith("salon-management/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Deletion outside salon-management namespace is prohibited",
        },
        { status: 403 }
      );
    }

    // Role check: Service, salon, and gallery images require admin role
    if (
      (trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.SERVICES) ||
        trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.SALON) ||
        trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.GALLERY)) &&
      user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin role required to delete service, salon, or gallery media",
        },
        { status: 403 }
      );
    }

    // Customer profile ownership check
    if (
      trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.PROFILES) &&
      user.role !== "admin"
    ) {
      // If user has a profileImagePublicId, verify it matches
      if (
        user.profileImagePublicId &&
        user.profileImagePublicId !== trimmedPublicId
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "You can only delete your own profile photo",
          },
          { status: 403 }
        );
      }
    }

    const result = await deleteCloudinaryImage(trimmedPublicId);

    return NextResponse.json({
      success: true,
      message: "Image successfully removed",
      result,
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete image from Cloudinary" },
      { status: 500 }
    );
  }
}
