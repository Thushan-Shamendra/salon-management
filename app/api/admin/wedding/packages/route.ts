import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import WeddingPackage from "@/models/WeddingPackage";

// Admin: list all wedding packages
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

    const packages = await WeddingPackage.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error("Admin wedding packages error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load wedding packages" },
      { status: 500 }
    );
  }
}

// Admin: create a wedding package
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
      image,
      imagePublicId,
      includedItems,
      price,
      durationText,
      isFeatured,
      isActive,
      displayOrder,
    } = body;

    if (!name?.trim() || !description?.trim() || price === undefined || !durationText?.trim()) {
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

    const items = Array.isArray(includedItems)
      ? includedItems.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one included service/item is required",
        },
        { status: 400 }
      );
    }

    const orderNum = displayOrder !== undefined ? Math.max(0, Number(displayOrder) || 0) : 0;

    const newPackage = await WeddingPackage.create({
      name: name.trim(),
      description: description.trim(),
      image: image?.trim() || "",
      imagePublicId: imagePublicId?.trim() || undefined,
      includedItems: items,
      price: Number(price),
      durationText: durationText.trim(),
      isFeatured: Boolean(isFeatured),
      isActive: isActive ?? true,
      displayOrder: orderNum,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Wedding package created successfully",
        package: newPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create wedding package error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create wedding package" },
      { status: 500 }
    );
  }
}
