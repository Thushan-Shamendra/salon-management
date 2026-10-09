import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import WeddingService from "@/models/WeddingService";

// Admin: list all wedding services
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
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

    const services = await WeddingService.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Admin wedding services error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load wedding services" },
      { status: 500 }
    );
  }
}

// Admin: create a wedding service
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
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

    const body = await request.json();
    const {
      name,
      description,
      price,
      duration,
      image,
      imagePublicId,
      isActive,
      displayOrder,
    } = body;

    if (!name?.trim() || !description?.trim() || price === undefined || !duration) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, description, price, and duration are required",
        },
        { status: 400 }
      );
    }

    if (Number(price) < 0) {
      return NextResponse.json(
        { success: false, message: "Price cannot be negative" },
        { status: 400 }
      );
    }

    if (Number(duration) <= 0) {
      return NextResponse.json(
        { success: false, message: "Duration must be greater than 0" },
        { status: 400 }
      );
    }

    const orderNum = displayOrder !== undefined ? Math.max(0, Number(displayOrder) || 0) : 0;

    const service = await WeddingService.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      duration: Number(duration),
      image: image?.trim() || "",
      imagePublicId: imagePublicId?.trim() || undefined,
      isActive: isActive ?? true,
      displayOrder: orderNum,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Wedding service created successfully",
        service,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create wedding service error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create wedding service" },
      { status: 500 }
    );
  }
}
