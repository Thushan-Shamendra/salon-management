import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Beautician from "@/models/Beautician";
import { deleteCloudinaryImage, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

function isValidHttpsUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/admin/beauticians/[id] - ADMIN ONLY: fetch a single beautician
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
        { success: false, message: "Invalid beautician ID" },
        { status: 400 }
      );
    }

    const beautician = await Beautician.findById(id).lean();

    if (!beautician) {
      return NextResponse.json(
        { success: false, message: "Beautician not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      beautician,
    });
  } catch (error) {
    console.error("GET /api/admin/beauticians/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load beautician" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/beauticians/[id] - ADMIN ONLY: update beautician metadata / replace photo
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
        { success: false, message: "Invalid beautician ID" },
        { status: 400 }
      );
    }

    const existingBeautician = await Beautician.findById(id);
    if (!existingBeautician) {
      return NextResponse.json(
        { success: false, message: "Beautician not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { success: false, message: "Name cannot be empty" },
          { status: 400 }
        );
      }
      if (body.name.trim().length > 100) {
        return NextResponse.json(
          { success: false, message: "Name cannot exceed 100 characters" },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.jobTitle !== undefined) {
      if (typeof body.jobTitle !== "string" || !body.jobTitle.trim()) {
        return NextResponse.json(
          { success: false, message: "Job title cannot be empty" },
          { status: 400 }
        );
      }
      if (body.jobTitle.trim().length > 100) {
        return NextResponse.json(
          { success: false, message: "Job title cannot exceed 100 characters" },
          { status: 400 }
        );
      }
      updateData.jobTitle = body.jobTitle.trim();
    }

    if (body.bio !== undefined) {
      if (typeof body.bio === "string" && body.bio.trim().length > 500) {
        return NextResponse.json(
          { success: false, message: "Bio cannot exceed 500 characters" },
          { status: 400 }
        );
      }
      updateData.bio = typeof body.bio === "string" ? body.bio.trim() : "";
    }

    if (body.experienceYears !== undefined && body.experienceYears !== null && body.experienceYears !== "") {
      const exp = Number(body.experienceYears);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        return NextResponse.json(
          {
            success: false,
            message: "Years of experience must be a valid number between 0 and 60",
          },
          { status: 400 }
        );
      }
      updateData.experienceYears = exp;
    }

    if (body.specialties !== undefined) {
      if (Array.isArray(body.specialties)) {
        updateData.specialties = body.specialties
          .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean);
      } else if (typeof body.specialties === "string") {
        updateData.specialties = body.specialties
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
    }

    if (body.instagram !== undefined) {
      if (typeof body.instagram === "string" && body.instagram.trim() !== "") {
        if (!isValidHttpsUrl(body.instagram)) {
          return NextResponse.json(
            {
              success: false,
              message: "Instagram URL must be a valid https link (e.g., https://instagram.com/username)",
            },
            { status: 400 }
          );
        }
        updateData.instagram = body.instagram.trim();
      } else {
        updateData.instagram = "";
      }
    }

    if (body.facebook !== undefined) {
      if (typeof body.facebook === "string" && body.facebook.trim() !== "") {
        if (!isValidHttpsUrl(body.facebook)) {
          return NextResponse.json(
            {
              success: false,
              message: "Facebook URL must be a valid https link (e.g., https://facebook.com/username)",
            },
            { status: 400 }
          );
        }
        updateData.facebook = body.facebook.trim();
      } else {
        updateData.facebook = "";
      }
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
    const oldPublicId = existingBeautician.imagePublicId;
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
      if (!trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.BEAUTICIANS)) {
        return NextResponse.json(
          {
            success: false,
            message: `Profile photo must belong to ${CLOUDINARY_FOLDERS.BEAUTICIANS}`,
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

    // 1. Update MongoDB successfully first
    const updatedBeautician = await Beautician.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBeautician) {
      return NextResponse.json(
        { success: false, message: "Beautician not found" },
        { status: 404 }
      );
    }

    // 2. Only AFTER successful DB update, delete old Cloudinary image if it was replaced
    if (isImageReplaced && oldPublicId) {
      if (oldPublicId.startsWith(CLOUDINARY_FOLDERS.BEAUTICIANS)) {
        try {
          await deleteCloudinaryImage(oldPublicId);
        } catch (cldErr) {
          console.error("Failed to delete previous beautician photo from Cloudinary:", cldErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Beautician updated successfully",
      beautician: updatedBeautician,
    });
  } catch (error) {
    console.error("PATCH /api/admin/beauticians/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update beautician" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/beauticians/[id] - ADMIN ONLY: delete beautician record and Cloudinary asset
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
        { success: false, message: "Invalid beautician ID" },
        { status: 400 }
      );
    }

    const beautician = await Beautician.findById(id);
    if (!beautician) {
      return NextResponse.json(
        { success: false, message: "Beautician not found" },
        { status: 404 }
      );
    }

    const imagePublicId = beautician.imagePublicId;

    // 1. Delete from MongoDB first
    await Beautician.findByIdAndDelete(id);

    // 2. Delete from Cloudinary safely after DB deletion
    if (imagePublicId && imagePublicId.startsWith(CLOUDINARY_FOLDERS.BEAUTICIANS)) {
      try {
        await deleteCloudinaryImage(imagePublicId);
      } catch (cldErr) {
        console.error("Failed to delete beautician image from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Beautician deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/beauticians/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete beautician" },
      { status: 500 }
    );
  }
}
