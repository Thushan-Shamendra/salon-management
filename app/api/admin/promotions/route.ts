import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Promotion, {
  PROMOTION_TYPES,
  DISCOUNT_TYPES,
  CTA_TYPES,
  PromotionType,
  DiscountType,
  CtaType,
} from "@/models/Promotion";
import Branch from "@/models/Branch";
import Service from "@/models/Service";
import RetailProduct from "@/models/RetailProduct";
import WeddingPackage from "@/models/WeddingPackage";
import { parseColomboStartDate, parseColomboEndDate } from "@/lib/colombo-timezone";

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

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(title) || "promotion";
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await Promotion.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

// GET /api/admin/promotions - List all promotions with admin stats
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
    // Ensure related schemas are registered for populate
    void Branch;
    void Service;
    void RetailProduct;
    void WeddingPackage;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const search = searchParams.get("search")?.trim();

    const query: Record<string, unknown> = {};
    const now = new Date();

    if (type && type !== "all") {
      query.promoType = type;
    }

    if (branchId && branchId !== "all") {
      if (mongoose.Types.ObjectId.isValid(branchId)) {
        query.branchIds = new mongoose.Types.ObjectId(branchId);
      }
    }

    if (status === "active") {
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === "upcoming") {
      query.isActive = true;
      query.startDate = { $gt: now };
    } else if (status === "expired") {
      query.endDate = { $lt: now };
    } else if (status === "hidden") {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { badgeText: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [
      promotions,
      totalCount,
      activeNowCount,
      upcomingCount,
      expiredCount,
      featuredCount,
    ] = await Promise.all([
      Promotion.find(query)
        .populate("branchIds", "_id name slug")
        .populate("relatedServiceId", "_id name price")
        .populate("relatedProductId", "_id name price image")
        .populate("relatedWeddingPackageId", "_id name price")
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      Promotion.countDocuments(),
      Promotion.countDocuments({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),
      Promotion.countDocuments({
        isActive: true,
        startDate: { $gt: now },
      }),
      Promotion.countDocuments({
        endDate: { $lt: now },
      }),
      Promotion.countDocuments({ isFeatured: true }),
    ]);

    return NextResponse.json({
      success: true,
      promotions,
      stats: {
        total: totalCount,
        active: activeNowCount,
        upcoming: upcomingCount,
        expired: expiredCount,
        featured: featuredCount,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/promotions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

// POST /api/admin/promotions - Create a new promotion
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
      title,
      subtitle,
      description,
      promoType,
      badgeText,
      image,
      imagePublicId,
      discountType,
      discountValue,
      originalPrice,
      promotionalPrice,
      validDaysText,
      startDate,
      endDate,
      terms,
      relatedServiceId,
      relatedProductId,
      relatedWeddingPackageId,
      branchIds,
      ctaType,
      ctaCustomLabel,
      ctaCustomUrl,
      isFeatured,
      isActive,
      displayOrder,
    } = body;

    // Validations
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Promotion title is required" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { success: false, message: "Promotion description is required" },
        { status: 400 }
      );
    }

    if (!promoType || !PROMOTION_TYPES.includes(promoType as PromotionType)) {
      return NextResponse.json(
        { success: false, message: "Valid promotion type is required" },
        { status: 400 }
      );
    }

    if (!badgeText || typeof badgeText !== "string" || !badgeText.trim()) {
      return NextResponse.json(
        { success: false, message: "Badge text is required" },
        { status: 400 }
      );
    }

    if (!image || typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { success: false, message: "Promotion image is required" },
        { status: 400 }
      );
    }

    if (!imagePublicId || typeof imagePublicId !== "string" || !imagePublicId.trim()) {
      return NextResponse.json(
        { success: false, message: "Image public ID is required" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const parsedStart = parseColomboStartDate(startDate);
    const parsedEnd = parseColomboEndDate(endDate);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (parsedEnd < parsedStart) {
      return NextResponse.json(
        { success: false, message: "End date must be on or after start date" },
        { status: 400 }
      );
    }

    // Clean terms array
    let cleanTerms: string[] = [];
    if (Array.isArray(terms)) {
      cleanTerms = terms
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean);
    }

    // Clean branch IDs
    let cleanBranchIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(branchIds)) {
      cleanBranchIds = branchIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    const slug = await generateUniqueSlug(title.trim());

    const newPromotion = await Promotion.create({
      title: title.trim(),
      slug,
      subtitle: subtitle ? subtitle.trim() : "",
      description: description.trim(),
      promoType,
      badgeText: badgeText.trim(),
      image: image.trim(),
      imagePublicId: imagePublicId.trim(),
      discountType: DISCOUNT_TYPES.includes(discountType as DiscountType)
        ? discountType
        : "percentage",
      discountValue:
        discountValue !== undefined && discountValue !== null && discountValue !== ""
          ? Number(discountValue)
          : null,
      originalPrice:
        originalPrice !== undefined && originalPrice !== null && originalPrice !== ""
          ? Number(originalPrice)
          : null,
      promotionalPrice:
        promotionalPrice !== undefined && promotionalPrice !== null && promotionalPrice !== ""
          ? Number(promotionalPrice)
          : null,
      validDaysText: validDaysText ? validDaysText.trim() : "",
      startDate: parsedStart,
      endDate: parsedEnd,
      terms: cleanTerms,
      relatedServiceId: mongoose.Types.ObjectId.isValid(relatedServiceId)
        ? new mongoose.Types.ObjectId(relatedServiceId)
        : null,
      relatedProductId: mongoose.Types.ObjectId.isValid(relatedProductId)
        ? new mongoose.Types.ObjectId(relatedProductId)
        : null,
      relatedWeddingPackageId: mongoose.Types.ObjectId.isValid(relatedWeddingPackageId)
        ? new mongoose.Types.ObjectId(relatedWeddingPackageId)
        : null,
      branchIds: cleanBranchIds,
      ctaType: CTA_TYPES.includes(ctaType as CtaType) ? ctaType : "whatsapp",
      ctaCustomLabel: ctaCustomLabel ? ctaCustomLabel.trim() : "",
      ctaCustomUrl: ctaCustomUrl ? ctaCustomUrl.trim() : "",
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
    });

    const populated = await Promotion.findById(
      (newPromotion as unknown as { _id: mongoose.Types.ObjectId })._id
    )
      .populate("branchIds", "_id name slug")
      .populate("relatedServiceId", "_id name price")
      .populate("relatedProductId", "_id name price image")
      .populate("relatedWeddingPackageId", "_id name price")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Promotion created successfully",
        promotion: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/promotions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create promotion" },
      { status: 500 }
    );
  }
}
