import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WeddingPackage from "@/models/WeddingPackage";

// Public: get active wedding packages
export async function GET() {
  try {
    await connectDB();

    const packages = await WeddingPackage.find({
      isActive: true,
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("-imagePublicId -__v")
      .lean();

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error("Public wedding packages error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load wedding packages" },
      { status: 500 }
    );
  }
}
