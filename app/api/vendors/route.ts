import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import Branch from "@/models/Branch";

// GET /api/vendors - Public vendors list with optional category & branch filtering
export async function GET(request: Request) {
  try {
    await connectDB();
    void Branch; // Ensure Branch model registered in Mongoose

    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");
    const branchParam = searchParams.get("branch");

    // Base query: active vendors only
    const query: Record<string, unknown> = {
      isActive: true,
    };

    // 1. Optional Category Filter
    if (categoryParam && categoryParam.trim() && categoryParam.toLowerCase() !== "all") {
      query.category = { $regex: new RegExp(`^${categoryParam.trim()}$`, "i") };
    }

    // 2. Optional Branch Filter
    if (branchParam && branchParam.trim() && branchParam.toLowerCase() !== "all") {
      const trimmedBranch = branchParam.trim();
      let targetBranchId: mongoose.Types.ObjectId | null = null;

      if (mongoose.Types.ObjectId.isValid(trimmedBranch)) {
        targetBranchId = new mongoose.Types.ObjectId(trimmedBranch);
      } else {
        const foundBranch = await Branch.findOne({
          slug: trimmedBranch.toLowerCase(),
        })
          .select("_id")
          .lean();
        if (foundBranch) {
          targetBranchId = foundBranch._id as mongoose.Types.ObjectId;
        }
      }

      if (targetBranchId) {
        // Vendors explicitly assigned to this branch OR general/unassigned vendors (available for all branches)
        query.$or = [
          { branchIds: targetBranchId },
          { branchIds: { $size: 0 } },
          { branchIds: null },
          { branchIds: { $exists: false } },
        ];
      }
    }

    // Safe public projection, sorted: featured first, then displayOrder asc, then name asc
    const vendors = await Vendor.find(query)
      .select(
        "_id name category description image logo phone whatsapp email website instagram facebook branchIds isFeatured displayOrder"
      )
      .populate("branchIds", "_id name slug")
      .sort({ isFeatured: -1, displayOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      vendors,
      total: vendors.length,
    });
  } catch (error) {
    console.error("GET /api/vendors error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load vendors" },
      { status: 500 }
    );
  }
}
