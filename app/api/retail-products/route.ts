import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RetailProduct from "@/models/RetailProduct";
import Branch from "@/models/Branch";

// GET /api/retail-products - Public products query
export async function GET(request: Request) {
  try {
    await connectDB();
    void Branch; // Ensure Branch model is registered for populate

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const branch = searchParams.get("branch");
    const featured = searchParams.get("featured");
    const mostPopular = searchParams.get("mostPopular");
    const fastMoving = searchParams.get("fastMoving");
    const discount = searchParams.get("discount");
    const search = searchParams.get("search")?.trim();

    const query: Record<string, unknown> = {
      isActive: true,
    };

    if (category && category !== "all") {
      query.category = category;
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    if (mostPopular === "true") {
      query.isMostPopular = true;
    }

    if (fastMoving === "true") {
      query.isFastMoving = true;
    }

    if (discount === "true") {
      query.isDiscountProduct = true;
    }

    if (branch && branch !== "all") {
      // Find branch by slug or ID
      let branchDoc = null;
      if (mongoose.Types.ObjectId.isValid(branch)) {
        branchDoc = await Branch.findById(branch).lean();
      } else {
        branchDoc = await Branch.findOne({ slug: branch }).lean();
      }

      if (branchDoc) {
        // Products assigned specifically to this branch OR products with empty branchIds (available at all branches)
        query.$or = [
          { branchIds: branchDoc._id },
          { branchIds: { $size: 0 } },
          { branchIds: { $exists: false } },
        ];
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await RetailProduct.find(query)
      .populate("branchIds", "_id name slug")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("GET /api/retail-products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch retail products" },
      { status: 500 }
    );
  }
}
