import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WeddingService from "@/models/WeddingService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public: get active wedding services
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const audience = searchParams.get("audience");

    const query: Record<string, unknown> = {
      isActive: true,
    };

    if (audience && audience !== "all") {
      if (audience === "male") {
        query.$or = [
          { audience: { $in: ["male", "unisex"] } },
          { audience: { $in: [null, ""] } },
          { audience: { $exists: false } },
        ];
      } else if (audience === "female") {
        query.$or = [
          { audience: { $in: ["female", "unisex"] } },
          { audience: { $in: [null, ""] } },
          { audience: { $exists: false } },
        ];
      }
    }

    const services = await WeddingService.find(query)
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
