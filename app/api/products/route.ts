import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ProductBrand from "@/models/ProductBrand";
import Branch from "@/models/Branch";

// GET /api/products - Public access to active product brands
export async function GET(request: Request) {
  try {
    await connectDB();
    void Branch;

    const { searchParams } = new URL(request.url);
    const branchParam = searchParams.get("branch");

    const query: Record<string, unknown> = { isActive: true };

    if (branchParam && mongoose.Types.ObjectId.isValid(branchParam)) {
      const branchObjectId = new mongoose.Types.ObjectId(branchParam);
      // Products associated with this branch OR available at all branches (empty branchIds array)
      query.$or = [
        { branchIds: branchObjectId },
        { branchIds: { $size: 0 } },
      ];
    }

    const products = await ProductBrand.find(query)
      .populate("branchIds", "_id name slug")
      .select("_id name logo description websiteUrl branchIds displayOrder createdAt")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Public products API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product brands",
      },
      { status: 500 }
    );
  }
}
