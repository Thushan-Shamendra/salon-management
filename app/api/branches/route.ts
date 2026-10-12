import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Branch from "@/models/Branch";

// GET /api/branches - Public access to active branches
export async function GET() {
  try {
    await connectDB();

    const branches = await Branch.find({ isActive: true })
      .select({
        _id: 1,
        name: 1,
        slug: 1,
        phone: 1,
        whatsappNumber: 1,
        email: 1,
        address: 1,
        latitude: 1,
        longitude: 1,
        googleMapsUrl: 1,
        googlePlaceId: 1,
        googleReviewUrl: 1,
        reviewsEnabled: 1,
        openingHours: 1,
        displayOrder: 1,
      })
      .sort({
        displayOrder: 1,
        createdAt: 1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error("Public branches GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load branches" },
      { status: 500 }
    );
  }
}
