import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import RetailProduct, {
  RETAIL_PRODUCT_CATEGORIES,
  STOCK_STATUSES,
  RetailProductCategory,
  StockStatus,
} from "@/models/RetailProduct";
import Branch from "@/models/Branch";
import { deleteCloudinaryImage, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name) || "product";
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await RetailProduct.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

// GET /api/admin/retail-products/[id]
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

    const product = await RetailProduct.findById(id)
      .populate("branchIds", "_id name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("GET /api/admin/retail-products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/retail-products/[id]
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
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await RetailProduct.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // If name is updating and changed, generate updated slug
    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, message: "Product name cannot be empty" },
          { status: 400 }
        );
      }
      if (trimmedName !== product.name) {
        product.name = trimmedName;
        product.slug = await generateUniqueSlug(trimmedName, id);
      }
    }

    if (body.category !== undefined) {
      if (!RETAIL_PRODUCT_CATEGORIES.includes(body.category as RetailProductCategory)) {
        return NextResponse.json(
          { success: false, message: "Invalid category" },
          { status: 400 }
        );
      }
      product.category = body.category;
    }

    if (body.brand !== undefined) {
      product.brand = body.brand ? body.brand.trim() : "Salvora";
    }

    if (body.description !== undefined) {
      product.description = body.description ? body.description.trim() : "";
    }

    if (body.shortDescription !== undefined) {
      product.shortDescription = body.shortDescription ? body.shortDescription.trim() : "";
    }

    if (body.price !== undefined) {
      const parsedPrice = parseFloat(body.price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { success: false, message: "Price must be a positive number" },
          { status: 400 }
        );
      }
      product.price = parsedPrice;
    }

    if (body.salePrice !== undefined) {
      if (body.salePrice === null || body.salePrice === "") {
        product.salePrice = null;
      } else {
        const num = parseFloat(body.salePrice);
        if (!isNaN(num) && num >= 0) {
          product.salePrice = num;
        } else {
          product.salePrice = null;
        }
      }
    }

    if (body.stockStatus !== undefined) {
      if (STOCK_STATUSES.includes(body.stockStatus as StockStatus)) {
        product.stockStatus = body.stockStatus;
      }
    }

    if (body.size !== undefined) {
      product.size = body.size ? body.size.trim() : "";
    }

    if (body.sku !== undefined) {
      product.sku = body.sku ? body.sku.trim() : "";
    }

    if (body.branchIds !== undefined) {
      if (Array.isArray(body.branchIds)) {
        product.branchIds = body.branchIds
          .filter((bId: string) => mongoose.Types.ObjectId.isValid(bId))
          .map((bId: string) => new mongoose.Types.ObjectId(bId));
      }
    }

    if (body.isFeatured !== undefined) {
      product.isFeatured = Boolean(body.isFeatured);
    }

    if (body.isMostPopular !== undefined) {
      product.isMostPopular = Boolean(body.isMostPopular);
    }

    if (body.isFastMoving !== undefined) {
      product.isFastMoving = Boolean(body.isFastMoving);
    }

    if (body.isDiscountProduct !== undefined) {
      product.isDiscountProduct = Boolean(body.isDiscountProduct);
    }

    if (product.isDiscountProduct) {
      if (
        product.salePrice === undefined ||
        product.salePrice === null ||
        isNaN(product.salePrice) ||
        product.salePrice < 0 ||
        product.salePrice >= product.price
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Add a valid sale price before marking this as a Discount Product.",
          },
          { status: 400 }
        );
      }
    }

    // Image change handling - delete old image from Cloudinary if replacing
    if (body.image && body.imagePublicId && body.imagePublicId !== product.imagePublicId) {
      const oldPublicId = product.imagePublicId;
      product.image = body.image.trim();
      product.imagePublicId = body.imagePublicId.trim();

      if (oldPublicId && oldPublicId.startsWith(CLOUDINARY_FOLDERS.RETAIL_PRODUCTS)) {
        deleteCloudinaryImage(oldPublicId).catch((err) =>
          console.warn("Non-fatal: Old product image removal failed:", err)
        );
      }
    }

    if (body.isActive !== undefined) {
      product.isActive = Boolean(body.isActive);
    }

    if (body.audience !== undefined && body.audience !== null && body.audience !== "") {
      if (!["male", "female", "unisex"].includes(body.audience)) {
        return NextResponse.json(
          { success: false, message: "Invalid audience. Must be male, female, or unisex" },
          { status: 400 }
        );
      }
      product.audience = body.audience;
    }

    if (body.displayOrder !== undefined) {
      product.displayOrder = typeof body.displayOrder === "number" ? body.displayOrder : 0;
    }

    await product.save();

    try {
      revalidatePath("/products");
    } catch {
      // Ignore in non-Next contexts
    }

    const populated = await RetailProduct.findById(product._id)
      .populate("branchIds", "_id name slug")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: populated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/retail-products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update retail product" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/retail-products/[id]
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

    const product = await RetailProduct.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Attempt to delete image from Cloudinary
    if (product.imagePublicId && product.imagePublicId.startsWith(CLOUDINARY_FOLDERS.RETAIL_PRODUCTS)) {
      deleteCloudinaryImage(product.imagePublicId).catch((err) =>
        console.warn("Non-fatal: Failed to delete product image from Cloudinary:", err)
      );
    }

    await RetailProduct.findByIdAndDelete(id);

    try {
      revalidatePath("/products");
    } catch {
      // Ignore in non-Next contexts
    }

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/retail-products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete retail product" },
      { status: 500 }
    );
  }
}
