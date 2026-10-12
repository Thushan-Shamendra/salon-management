import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ProductBrand from "@/models/ProductBrand";
import Branch from "@/models/Branch";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/admin/products - ADMIN ONLY: list all product brands with statistics
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    void Branch; // Ensure branch schema registered for populate

    const [products, totalProducts, activeProducts, hiddenProducts] =
      await Promise.all([
        ProductBrand.find()
          .populate("branchIds", "_id name slug")
          .sort({ displayOrder: 1, createdAt: -1 })
          .lean(),
        ProductBrand.countDocuments(),
        ProductBrand.countDocuments({ isActive: true }),
        ProductBrand.countDocuments({ isActive: false }),
      ]);

    return NextResponse.json({
      success: true,
      products,
      stats: {
        totalProducts,
        activeProducts,
        hiddenProducts,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - ADMIN ONLY: create product brand
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      logo,
      logoPublicId,
      description,
      websiteUrl,
      branchIds,
      isActive,
      displayOrder,
    } = body;

    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Product/brand name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json(
        { success: false, message: "Name cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    // Validate logo and logoPublicId
    if (!logo || typeof logo !== "string" || !logo.trim()) {
      return NextResponse.json(
        { success: false, message: "Brand logo image is required" },
        { status: 400 }
      );
    }

    if (!logoPublicId || typeof logoPublicId !== "string" || !logoPublicId.trim()) {
      return NextResponse.json(
        { success: false, message: "Logo public ID is required" },
        { status: 400 }
      );
    }

    const trimmedPublicId = logoPublicId.trim();
    if (!trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.PRODUCTS)) {
      return NextResponse.json(
        {
          success: false,
          message: `Logo image must be uploaded to ${CLOUDINARY_FOLDERS.PRODUCTS}`,
        },
        { status: 400 }
      );
    }

    // Validate websiteUrl if provided
    if (websiteUrl && typeof websiteUrl === "string" && websiteUrl.trim()) {
      if (!isValidUrl(websiteUrl.trim())) {
        return NextResponse.json(
          {
            success: false,
            message: "Website URL must be a valid http or https web link",
          },
          { status: 400 }
        );
      }
    }

    // Validate description (optional)
    if (description && typeof description === "string" && description.trim().length > 500) {
      return NextResponse.json(
        { success: false, message: "Description cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    await connectDB();
    void Branch;

    // Check duplicate name
    const existing = await ProductBrand.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A product brand with this name already exists" },
        { status: 400 }
      );
    }

    // Validate branchIds if provided
    const validBranchObjectIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(branchIds) && branchIds.length > 0) {
      for (const bId of branchIds) {
        if (!bId || typeof bId !== "string" || !mongoose.Types.ObjectId.isValid(bId)) {
          continue;
        }
        const branchDoc = await Branch.findById(bId);
        if (branchDoc) {
          validBranchObjectIds.push(new mongoose.Types.ObjectId(bId));
        }
      }
    }

    // Parse displayOrder
    let parsedOrder = 0;
    if (displayOrder !== undefined && displayOrder !== null && displayOrder !== "") {
      const ord = Number(displayOrder);
      if (!isNaN(ord)) parsedOrder = ord;
    }

    const product = await ProductBrand.create({
      name: trimmedName,
      logo: logo.trim(),
      logoPublicId: trimmedPublicId,
      description: typeof description === "string" ? description.trim() : "",
      websiteUrl: typeof websiteUrl === "string" ? websiteUrl.trim() : "",
      branchIds: validBranchObjectIds,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      displayOrder: parsedOrder,
    });

    const populated = await ProductBrand.findById(product._id)
      .populate("branchIds", "_id name slug")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Product brand created successfully",
        product: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create product brand" },
      { status: 500 }
    );
  }
}
