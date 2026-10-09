import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WeddingService from "@/models/WeddingService";

// Public: get active wedding services
export async function GET() {
  try {
    await connectDB();

    const services = await WeddingService.find({
      isActive: true,
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("-imagePublicId -__v")
      .lean();

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Public wedding services error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load wedding services" },
      { status: 500 }
    );
  }
}
