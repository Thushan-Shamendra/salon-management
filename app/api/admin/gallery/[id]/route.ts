import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Gallery from "@/models/Gallery";
import { deleteCloudinaryImage, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/admin/gallery/[id] - ADMIN ONLY: fetch a single gallery photo
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid gallery photo ID" },
        { status: 400 }
      );
    }

    const photo = await Gallery.findById(id).lean();

    if (!photo) {
      return NextResponse.json(
        { success: false, message: "Gallery photo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error("GET /api/admin/gallery/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load gallery photo" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/gallery/[id] - ADMIN ONLY: update gallery photo metadata / replace image
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid gallery photo ID" },
        { status: 400 }
      );
    }

    const existingPhoto = await Gallery.findById(id);
    if (!existingPhoto) {
      return NextResponse.json(
        { success: false, message: "Gallery photo not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { success: false, message: "Title cannot be empty" },
          { status: 400 }
        );
      }
      if (body.title.trim().length > 120) {
        return NextResponse.json(
          { success: false, message: "Title cannot exceed 120 characters" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description === "string" && body.description.trim().length > 500) {
        return NextResponse.json(
          { success: false, message: "Description cannot exceed 500 characters" },
          { status: 400 }
        );
      }
      updateData.description = typeof body.description === "string" ? body.description.trim() : "";
    }

    if (body.category !== undefined) {
      if (typeof body.category !== "string" || !body.category.trim()) {
        return NextResponse.json(
          { success: false, message: "Category cannot be empty" },
          { status: 400 }
        );
      }
      updateData.category = body.category.trim();
    }

    if (body.altText !== undefined) {
      if (typeof body.altText === "string" && body.altText.trim().length > 160) {
        return NextResponse.json(
          { success: false, message: "Alt text cannot exceed 160 characters" },
          { status: 400 }
        );
      }
      updateData.altText = typeof body.altText === "string" ? body.altText.trim() : "";
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(body.isFeatured);
    }

    if (body.displayOrder !== undefined) {
      const order = Number(body.displayOrder);
      updateData.displayOrder = isNaN(order) ? 0 : order;
    }

    // Handle Image Replacement
    const oldPublicId = existingPhoto.imagePublicId;
    let isImageReplaced = false;

    if (body.image !== undefined || body.imagePublicId !== undefined) {
      if (!body.image || typeof body.image !== "string" || !body.image.trim()) {
        return NextResponse.json(
          { success: false, message: "Valid image URL is required" },
          { status: 400 }
        );
      }
      if (!body.imagePublicId || typeof body.imagePublicId !== "string" || !body.imagePublicId.trim()) {
        return NextResponse.json(
          { success: false, message: "Valid image public ID is required" },
          { status: 400 }
        );
      }

      const trimmedPublicId = body.imagePublicId.trim();
      if (!trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.GALLERY)) {
        return NextResponse.json(
          {
            success: false,
            message: `Image must belong to ${CLOUDINARY_FOLDERS.GALLERY}`,
          },
          { status: 400 }
        );
      }

      updateData.image = body.image.trim();
      updateData.imagePublicId = trimmedPublicId;

      if (oldPublicId && trimmedPublicId !== oldPublicId) {
        isImageReplaced = true;
      }
    }

    // 1. Update MongoDB successfully
    const updatedPhoto = await Gallery.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPhoto) {
      return NextResponse.json(
        { success: false, message: "Gallery photo not found" },
        { status: 404 }
      );
    }

    // 2. Only AFTER successful DB update, delete old Cloudinary image if it was replaced
    if (isImageReplaced && oldPublicId) {
      if (oldPublicId.startsWith(CLOUDINARY_FOLDERS.GALLERY)) {
        try {
          await deleteCloudinaryImage(oldPublicId);
        } catch (cldErr) {
          console.error("Failed to delete previous gallery photo from Cloudinary:", cldErr);
          // Do not fail the API response because the database update was already successful
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gallery photo updated successfully",
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error("PATCH /api/admin/gallery/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update gallery photo" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/gallery/[id] - ADMIN ONLY: delete gallery record and Cloudinary asset
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid gallery photo ID" },
        { status: 400 }
      );
    }

    const photo = await Gallery.findByIdAndDelete(id);

    if (!photo) {
      return NextResponse.json(
        { success: false, message: "Gallery photo not found" },
        { status: 404 }
      );
    }

    // Safely delete Cloudinary image: only within salon-management/gallery namespace
    if (
      photo.imagePublicId &&
      photo.imagePublicId.startsWith(CLOUDINARY_FOLDERS.GALLERY)
    ) {
      try {
        await deleteCloudinaryImage(photo.imagePublicId);
      } catch (cldErr) {
        console.error("Failed to delete removed gallery photo from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gallery photo deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/gallery/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete gallery photo" },
      { status: 500 }
    );
  }
}
