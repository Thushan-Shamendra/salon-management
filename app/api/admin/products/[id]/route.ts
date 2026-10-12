import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ProductBrand from "@/models/ProductBrand";
import Branch from "@/models/Branch";
import { deleteCloudinaryImage, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/admin/products/[id]
export async function GET(request: Request, context: RouteContext) {
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
    void Branch;
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await ProductBrand.findById(id)
      .populate("branchIds", "_id name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load product" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/[id]
export async function PATCH(request: Request, context: RouteContext) {
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
    void Branch;
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const existingProduct = await ProductBrand.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const trimmedName = String(body.name).trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, message: "Name cannot be empty" },
          { status: 400 }
        );
      }
      if (trimmedName.length > 100) {
        return NextResponse.json(
          { success: false, message: "Name cannot exceed 100 characters" },
          { status: 400 }
        );
      }

      if (trimmedName.toLowerCase() !== existingProduct.name.toLowerCase()) {
        const duplicate = await ProductBrand.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });
        if (duplicate) {
          return NextResponse.json(
            { success: false, message: "Another product with this name already exists" },
            { status: 400 }
          );
        }
      }
      updateData.name = trimmedName;
    }

    if (body.description !== undefined) {
      if (typeof body.description === "string" && body.description.trim().length > 500) {
        return NextResponse.json(
          { success: false, message: "Description cannot exceed 500 characters" },
          { status: 400 }
        );
      }
      updateData.description = typeof body.description === "string" ? body.description.trim() : "";
    }

    if (body.websiteUrl !== undefined) {
      const trimmedUrl = String(body.websiteUrl).trim();
      if (trimmedUrl && !isValidUrl(trimmedUrl)) {
        return NextResponse.json(
          { success: false, message: "Website URL must be a valid http or https link" },
          { status: 400 }
        );
      }
      updateData.websiteUrl = trimmedUrl;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.displayOrder !== undefined) {
      const ord = Number(body.displayOrder);
      updateData.displayOrder = isNaN(ord) ? 0 : ord;
    }

    if (body.branchIds !== undefined) {
      const validBranchIds: mongoose.Types.ObjectId[] = [];
      if (Array.isArray(body.branchIds)) {
        for (const bId of body.branchIds) {
          if (bId && typeof bId === "string" && mongoose.Types.ObjectId.isValid(bId)) {
            const branchDoc = await Branch.findById(bId);
            if (branchDoc) {
              validBranchIds.push(new mongoose.Types.ObjectId(bId));
            }
          }
        }
      }
      updateData.branchIds = validBranchIds;
    }

    // Handle Logo Replacement
    const oldPublicId = existingProduct.logoPublicId;
    let isLogoReplaced = false;

    if (body.logo !== undefined || body.logoPublicId !== undefined) {
      if (!body.logo || typeof body.logo !== "string" || !body.logo.trim()) {
        return NextResponse.json(
          { success: false, message: "Valid logo URL is required" },
          { status: 400 }
        );
      }
      if (!body.logoPublicId || typeof body.logoPublicId !== "string" || !body.logoPublicId.trim()) {
        return NextResponse.json(
          { success: false, message: "Valid logo public ID is required" },
          { status: 400 }
        );
      }

      const trimmedPublicId = body.logoPublicId.trim();
      if (!trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.PRODUCTS)) {
        return NextResponse.json(
          {
            success: false,
            message: `Logo image must belong to ${CLOUDINARY_FOLDERS.PRODUCTS}`,
          },
          { status: 400 }
        );
      }

      updateData.logo = body.logo.trim();
      updateData.logoPublicId = trimmedPublicId;

      if (oldPublicId && trimmedPublicId !== oldPublicId) {
        isLogoReplaced = true;
      }
    }

    // 1. Update in DB first
    const updatedProduct = await ProductBrand.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("branchIds", "_id name slug");

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // 2. Delete old Cloudinary image if replaced
    if (isLogoReplaced && oldPublicId) {
      if (oldPublicId.startsWith(CLOUDINARY_FOLDERS.PRODUCTS)) {
        try {
          await deleteCloudinaryImage(oldPublicId);
        } catch (cldErr) {
          console.error("Failed to delete previous product logo from Cloudinary:", cldErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Product brand updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("PATCH /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product brand" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(request: Request, context: RouteContext) {
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
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await ProductBrand.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const logoPublicId = product.logoPublicId;

    // 1. Delete from MongoDB first
    await ProductBrand.findByIdAndDelete(id);

    // 2. Delete from Cloudinary
    if (logoPublicId && logoPublicId.startsWith(CLOUDINARY_FOLDERS.PRODUCTS)) {
      try {
        await deleteCloudinaryImage(logoPublicId);
      } catch (cldErr) {
        console.error("Failed to delete product logo from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Product brand deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product brand" },
      { status: 500 }
    );
  }
}
