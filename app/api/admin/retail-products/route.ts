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
import SalonSettings, { normalizeProductFeatureSections } from "@/models/SalonSettings";
import Branch from "@/models/Branch";

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

// GET /api/admin/retail-products - ADMIN: list all products with counts & stats
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const stockStatus = searchParams.get("stockStatus");
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const feature = searchParams.get("feature");
    const search = searchParams.get("search")?.trim();

    const query: Record<string, unknown> = {};

    if (category && category !== "all") {
      query.category = category;
    }

    if (stockStatus && stockStatus !== "all") {
      query.stockStatus = stockStatus;
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "hidden") {
      query.isActive = false;
    }

    if (feature === "most_popular" || feature === "mostPopular") {
      query.isMostPopular = true;
    } else if (feature === "fast_moving" || feature === "fastMoving") {
      query.isFastMoving = true;
    } else if (feature === "discount") {
      query.isDiscountProduct = true;
    } else if (feature === "featured") {
      query.isFeatured = true;
    }

    if (branchId && branchId !== "all") {
      if (mongoose.Types.ObjectId.isValid(branchId)) {
        query.branchIds = new mongoose.Types.ObjectId(branchId);
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [
      products,
      totalCount,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      featuredCount,
      mostPopularCount,
      fastMovingCount,
      discountCount,
      activeCount,
      hiddenCount,
      settingsDoc,
    ] = await Promise.all([
      RetailProduct.find(query)
        .populate("branchIds", "_id name slug")
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      RetailProduct.countDocuments(),
      RetailProduct.countDocuments({ stockStatus: "in_stock" }),
      RetailProduct.countDocuments({ stockStatus: "low_stock" }),
      RetailProduct.countDocuments({ stockStatus: "out_of_stock" }),
      RetailProduct.countDocuments({ isFeatured: true }),
      RetailProduct.countDocuments({ isMostPopular: true }),
      RetailProduct.countDocuments({ isFastMoving: true }),
      RetailProduct.countDocuments({ isDiscountProduct: true }),
      RetailProduct.countDocuments({ isActive: true }),
      RetailProduct.countDocuments({ isActive: false }),
      SalonSettings.findOne().select("productFeatureSections").lean(),
    ]);

    return NextResponse.json({
      success: true,
      products,
      productFeatureSections: normalizeProductFeatureSections(
        settingsDoc?.productFeatureSections
      ),
      stats: {
        total: totalCount,
        active: activeCount,
        hidden: hiddenCount,
        inStock: inStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        featured: featuredCount,
        mostPopular: mostPopularCount,
        fastMoving: fastMovingCount,
        discount: discountCount,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/retail-products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch retail products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/retail-products - ADMIN: create a new retail product
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

    await connectDB();
    const body = await request.json();

    const {
      name,
      category,
      brand,
      image,
      imagePublicId,
      description,
      shortDescription,
      price,
      salePrice,
      stockStatus,
      size,
      sku,
      branchIds,
      isFeatured,
      isMostPopular,
      isFastMoving,
      isDiscountProduct,
      isActive,
      displayOrder,
    } = body;

    // Validations
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Product name is required" },
        { status: 400 }
      );
    }

    if (!category || !RETAIL_PRODUCT_CATEGORIES.includes(category as RetailProductCategory)) {
      return NextResponse.json(
        { success: false, message: "Valid category is required" },
        { status: 400 }
      );
    }

    if (!image || typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { success: false, message: "Product image is required" },
        { status: 400 }
      );
    }

    if (!imagePublicId || typeof imagePublicId !== "string" || !imagePublicId.trim()) {
      return NextResponse.json(
        { success: false, message: "Product image public ID is required" },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Price must be a positive number" },
        { status: 400 }
      );
    }

    let parsedSalePrice: number | null = null;
    if (salePrice !== undefined && salePrice !== null && salePrice !== "") {
      const num = parseFloat(salePrice);
      if (!isNaN(num) && num >= 0) {
        parsedSalePrice = num;
      }
    }

    if (Boolean(isDiscountProduct)) {
      if (
        parsedSalePrice === null ||
        isNaN(parsedSalePrice) ||
        parsedSalePrice < 0 ||
        parsedSalePrice >= parsedPrice
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

    const validatedStockStatus: StockStatus =
      stockStatus && STOCK_STATUSES.includes(stockStatus as StockStatus)
        ? (stockStatus as StockStatus)
        : "in_stock";

    // Validate branchIds if provided
    let cleanBranchIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(branchIds) && branchIds.length > 0) {
      cleanBranchIds = branchIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    const slug = await generateUniqueSlug(name.trim());

    const newProduct = await RetailProduct.create({
      name: name.trim(),
      slug,
      category,
      brand: (brand && typeof brand === "string") ? brand.trim() : "Salvora",
      image: image.trim(),
      imagePublicId: imagePublicId.trim(),
      description: description ? description.trim() : "",
      shortDescription: shortDescription ? shortDescription.trim() : "",
      price: parsedPrice,
      salePrice: parsedSalePrice,
      stockStatus: validatedStockStatus,
      size: size ? size.trim() : "",
      sku: sku ? sku.trim() : "",
      branchIds: cleanBranchIds,
      isFeatured: Boolean(isFeatured),
      isMostPopular: Boolean(isMostPopular),
      isFastMoving: Boolean(isFastMoving),
      isDiscountProduct: Boolean(isDiscountProduct),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
    });

    try {
      revalidatePath("/products");
    } catch {
      // Ignore in non-Next contexts
    }

    const populated = await RetailProduct.findById(
      (newProduct as unknown as { _id: mongoose.Types.ObjectId })._id
    )
      .populate("branchIds", "_id name slug")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/retail-products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create retail product" },
      { status: 500 }
    );
  }
}
