import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Service from "@/models/Service";

// Public: get active services
export async function GET() {
  try {
    await connectDB();

    const services = await Service.find({
      isActive: true,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load services",
      },
      { status: 500 }
    );
  }
}

// Admin: create service
export async function POST(request: Request) {
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

    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
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
      isActive,
    } = body;

    if (!name || !description || price === undefined || !duration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, description, price and duration are required",
        },
        { status: 400 }
      );
    }

    if (Number(price) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Price cannot be negative",
        },
        { status: 400 }
      );
    }

    if (Number(duration) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Duration must be greater than 0",
        },
        { status: 400 }
      );
    }

    const service = await Service.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      duration: Number(duration),
      image: image?.trim() || "",
      isActive: isActive ?? true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Service created successfully",
        service,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create service error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create service",
      },
      { status: 500 }
    );
  }
}