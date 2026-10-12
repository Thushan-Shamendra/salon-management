import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Promotion from "@/models/Promotion";
import Branch from "@/models/Branch";
import Service from "@/models/Service";
import RetailProduct from "@/models/RetailProduct";
import WeddingPackage from "@/models/WeddingPackage";

// GET /api/promotions - Public active and unexpired promotions
export async function GET(request: Request) {
  try {
    await connectDB();
    // Ensure related schemas are registered for populate
    void Branch;
    void Service;
    void RetailProduct;
    void WeddingPackage;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const branch = searchParams.get("branch");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search")?.trim();

    const now = new Date();

    const query: Record<string, unknown> = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (type && type !== "all") {
      query.promoType = type;
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    if (branch && branch !== "all") {
      let branchDoc = null;
      if (mongoose.Types.ObjectId.isValid(branch)) {
        branchDoc = await Branch.findById(branch).lean();
      } else {
        branchDoc = await Branch.findOne({ slug: branch }).lean();
      }

      if (branchDoc) {
        query.$or = [
          { branchIds: branchDoc._id },
          { branchIds: { $size: 0 } },
          { branchIds: { $exists: false } },
        ];
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { badgeText: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const promotions = await Promotion.find(query)
      .populate("branchIds", "_id name slug")
      .populate("relatedServiceId", "_id name price duration")
      .populate("relatedProductId", "_id name price salePrice image")
      .populate("relatedWeddingPackageId", "_id name price durationText")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      promotions,
      count: promotions.length,
    });
  } catch (error) {
    console.error("GET /api/promotions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}
