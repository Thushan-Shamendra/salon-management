import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Beautician from "@/models/Beautician";

// GET /api/beauticians - Public access to active beautician profiles
export async function GET() {
  try {
    await connectDB();

    const beauticians = await Beautician.find({ isActive: true })
      .select(
        "_id name jobTitle bio specialties experienceYears image isFeatured displayOrder instagram facebook createdAt"
      )
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      beauticians,
    });
  } catch (error) {
    console.error("Public beauticians API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load beautician profiles",
      },
      { status: 500 }
    );
  }
}
