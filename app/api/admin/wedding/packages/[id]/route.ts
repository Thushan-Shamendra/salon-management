import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import WeddingPackage from "@/models/WeddingPackage";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid wedding package ID" },
        { status: 400 }
      );
    }

    const pkg = await WeddingPackage.findById(id);
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: "Wedding package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error("Get wedding package error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load wedding package" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid wedding package ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const existingPackage = await WeddingPackage.findById(id);
    if (!existingPackage) {
      return NextResponse.json(
        { success: false, message: "Wedding package not found" },
        { status: 404 }
      );
    }

    // Validation
    if (body.price !== undefined && Number(body.price) < 0) {
      return NextResponse.json(
        { success: false, message: "Price cannot be negative" },
        { status: 400 }
      );
    }
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Package name cannot be empty" },
        { status: 400 }
      );
    }
    if (body.description !== undefined && !body.description.trim()) {
      return NextResponse.json(
        { success: false, message: "Package description cannot be empty" },
        { status: 400 }
      );
    }
    if (body.durationText !== undefined && !body.durationText.trim()) {
      return NextResponse.json(
        { success: false, message: "Duration text cannot be empty" },
        { status: 400 }
      );
    }
    if (body.includedItems !== undefined) {
      const items = Array.isArray(body.includedItems)
        ? body.includedItems.map((item: unknown) => String(item).trim()).filter(Boolean)
        : [];
      if (items.length === 0) {
        return NextResponse.json(
          { success: false, message: "At least one included item is required" },
          { status: 400 }
        );
      }
      body.includedItems = items;
    }

    const oldPublicId = existingPackage.imagePublicId;

    const updateData = { ...body };
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.durationText) updateData.durationText = updateData.durationText.trim();
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.displayOrder !== undefined) {
      updateData.displayOrder = Math.max(0, Number(updateData.displayOrder) || 0);
    }

    const updatedPackage = await WeddingPackage.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // If new imagePublicId uploaded and different from old, clean up old Cloudinary asset
    if (
      oldPublicId &&
      body.imagePublicId &&
      body.imagePublicId !== oldPublicId
    ) {
      try {
        await deleteCloudinaryImage(oldPublicId);
      } catch (cldErr) {
        console.error("Failed to delete previous wedding package image from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Wedding package updated successfully",
      package: updatedPackage,
    });
  } catch (error) {
    console.error("Update wedding package error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update wedding package" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid wedding package ID" },
        { status: 400 }
      );
    }

    const pkg = await WeddingPackage.findByIdAndDelete(id);
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: "Wedding package not found" },
        { status: 404 }
      );
    }

    if (pkg.imagePublicId) {
      try {
        await deleteCloudinaryImage(pkg.imagePublicId);
      } catch (cldErr) {
        console.error("Failed to delete removed wedding package image from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Wedding package deleted successfully",
    });
  } catch (error) {
    console.error("Delete wedding package error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete wedding package" },
      { status: 500 }
    );
  }
}
