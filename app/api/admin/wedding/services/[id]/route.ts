import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import WeddingService from "@/models/WeddingService";
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
        { success: false, message: "Invalid wedding service ID" },
        { status: 400 }
      );
    }

    const service = await WeddingService.findById(id);
    if (!service) {
      return NextResponse.json(
        { success: false, message: "Wedding service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get wedding service error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load wedding service" },
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
        { success: false, message: "Invalid wedding service ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const existingService = await WeddingService.findById(id);
    if (!existingService) {
      return NextResponse.json(
        { success: false, message: "Wedding service not found" },
        { status: 404 }
      );
    }

    // Validation if provided
    if (body.price !== undefined && Number(body.price) < 0) {
      return NextResponse.json(
        { success: false, message: "Price cannot be negative" },
        { status: 400 }
      );
    }
    if (body.duration !== undefined && Number(body.duration) <= 0) {
      return NextResponse.json(
        { success: false, message: "Duration must be greater than 0" },
        { status: 400 }
      );
    }
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Service name cannot be empty" },
        { status: 400 }
      );
    }
    if (body.description !== undefined && !body.description.trim()) {
      return NextResponse.json(
        { success: false, message: "Service description cannot be empty" },
        { status: 400 }
      );
    }

    const oldPublicId = existingService.imagePublicId;

    const updateData = { ...body };
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.duration !== undefined) updateData.duration = Number(updateData.duration);
    if (updateData.displayOrder !== undefined) {
      updateData.displayOrder = Math.max(0, Number(updateData.displayOrder) || 0);
    }

    const updatedService = await WeddingService.findByIdAndUpdate(
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
        console.error("Failed to delete previous wedding service image from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Wedding service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Update wedding service error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update wedding service" },
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
        { success: false, message: "Invalid wedding service ID" },
        { status: 400 }
      );
    }

    const service = await WeddingService.findByIdAndDelete(id);
    if (!service) {
      return NextResponse.json(
        { success: false, message: "Wedding service not found" },
        { status: 404 }
      );
    }

    if (service.imagePublicId) {
      try {
        await deleteCloudinaryImage(service.imagePublicId);
      } catch (cldErr) {
        console.error("Failed to delete removed wedding service image from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Wedding service deleted successfully",
    });
  } catch (error) {
    console.error("Delete wedding service error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete wedding service" },
      { status: 500 }
    );
  }
}
