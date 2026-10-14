import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import WeddingService from "@/models/WeddingService";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    if (body.audience !== undefined) {
      if (!["male", "female", "unisex"].includes(body.audience)) {
        return NextResponse.json(
          { success: false, message: "Invalid audience. Must be male, female, or unisex" },
          { status: 400 }
        );
      }
    }

    const oldPublicId = existingService.imagePublicId;

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.duration !== undefined) updateData.duration = Number(body.duration);
    if (body.image !== undefined) updateData.image = body.image.trim();
    if (body.imagePublicId !== undefined) updateData.imagePublicId = body.imagePublicId.trim();
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.displayOrder !== undefined) {
      updateData.displayOrder = Math.max(0, Number(body.displayOrder) || 0);
    }
    if (body.audience !== undefined) {
      updateData.audience = body.audience;
    }

    const updatedService = await WeddingService.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, returnDocument: "after", runValidators: true }
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
