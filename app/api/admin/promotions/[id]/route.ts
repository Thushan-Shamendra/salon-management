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
import { deleteCloudinaryImage, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";
import { parseColomboStartDate, parseColomboEndDate } from "@/lib/colombo-timezone";

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

// GET /api/admin/promotions/[id]
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
    void Service;
    void RetailProduct;
    void WeddingPackage;
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid promotion ID" },
        { status: 400 }
      );
    }

    const promo = await Promotion.findById(id)
      .populate("branchIds", "_id name slug")
      .populate("relatedServiceId", "_id name price")
      .populate("relatedProductId", "_id name price image")
      .populate("relatedWeddingPackageId", "_id name price")
      .lean();

    if (!promo) {
      return NextResponse.json(
        { success: false, message: "Promotion not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, promotion: promo });
  } catch (error) {
    console.error("GET /api/admin/promotions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch promotion" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/promotions/[id]
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
        { success: false, message: "Invalid promotion ID" },
        { status: 400 }
      );
    }

    const promo = await Promotion.findById(id);
    if (!promo) {
      return NextResponse.json(
        { success: false, message: "Promotion not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (body.title !== undefined) {
      const trimmedTitle = body.title.trim();
      if (!trimmedTitle) {
        return NextResponse.json(
          { success: false, message: "Promotion title cannot be empty" },
          { status: 400 }
        );
      }
      if (trimmedTitle !== promo.title) {
        promo.title = trimmedTitle;
        promo.slug = await generateUniqueSlug(trimmedTitle, id);
      }
    }

    if (body.subtitle !== undefined) {
      promo.subtitle = body.subtitle ? body.subtitle.trim() : "";
    }

    if (body.description !== undefined) {
      const trimmedDesc = body.description.trim();
      if (!trimmedDesc) {
        return NextResponse.json(
          { success: false, message: "Promotion description cannot be empty" },
          { status: 400 }
        );
      }
      promo.description = trimmedDesc;
    }

    if (body.promoType !== undefined) {
      if (!PROMOTION_TYPES.includes(body.promoType as PromotionType)) {
        return NextResponse.json(
          { success: false, message: "Invalid promotion type" },
          { status: 400 }
        );
      }
      promo.promoType = body.promoType;
    }

    if (body.badgeText !== undefined) {
      promo.badgeText = body.badgeText.trim() || "Special Offer";
    }

    if (body.discountType !== undefined) {
      if (DISCOUNT_TYPES.includes(body.discountType as DiscountType)) {
        promo.discountType = body.discountType;
      }
    }

    if (body.discountValue !== undefined) {
      promo.discountValue =
        body.discountValue !== null && body.discountValue !== ""
          ? Number(body.discountValue)
          : undefined;
    }

    if (body.originalPrice !== undefined) {
      promo.originalPrice =
        body.originalPrice !== null && body.originalPrice !== ""
          ? Number(body.originalPrice)
          : undefined;
    }

    if (body.promotionalPrice !== undefined) {
      promo.promotionalPrice =
        body.promotionalPrice !== null && body.promotionalPrice !== ""
          ? Number(body.promotionalPrice)
          : undefined;
    }

    if (body.validDaysText !== undefined) {
      promo.validDaysText = body.validDaysText ? body.validDaysText.trim() : "";
    }

    if (body.startDate !== undefined) {
      const d = parseColomboStartDate(body.startDate);
      if (!isNaN(d.getTime())) promo.startDate = d;
    }

    if (body.endDate !== undefined) {
      const d = parseColomboEndDate(body.endDate);
      if (!isNaN(d.getTime())) promo.endDate = d;
    }

    if (promo.endDate < promo.startDate) {
      return NextResponse.json(
        { success: false, message: "End date must be on or after start date" },
        { status: 400 }
      );
    }

    if (body.terms !== undefined) {
      if (Array.isArray(body.terms)) {
        promo.terms = body.terms
          .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
          .filter(Boolean);
      }
    }

    if (body.relatedServiceId !== undefined) {
      promo.relatedServiceId = mongoose.Types.ObjectId.isValid(body.relatedServiceId)
        ? new mongoose.Types.ObjectId(body.relatedServiceId)
        : undefined;
    }

    if (body.relatedProductId !== undefined) {
      promo.relatedProductId = mongoose.Types.ObjectId.isValid(body.relatedProductId)
        ? new mongoose.Types.ObjectId(body.relatedProductId)
        : undefined;
    }

    if (body.relatedWeddingPackageId !== undefined) {
      promo.relatedWeddingPackageId = mongoose.Types.ObjectId.isValid(body.relatedWeddingPackageId)
        ? new mongoose.Types.ObjectId(body.relatedWeddingPackageId)
        : undefined;
    }

    if (body.branchIds !== undefined) {
      if (Array.isArray(body.branchIds)) {
        promo.branchIds = body.branchIds
          .filter((bId: string) => mongoose.Types.ObjectId.isValid(bId))
          .map((bId: string) => new mongoose.Types.ObjectId(bId));
      }
    }

    if (body.ctaType !== undefined) {
      if (CTA_TYPES.includes(body.ctaType as CtaType)) {
        promo.ctaType = body.ctaType;
      }
    }

    if (body.ctaCustomLabel !== undefined) {
      promo.ctaCustomLabel = body.ctaCustomLabel ? body.ctaCustomLabel.trim() : "";
    }

    if (body.ctaCustomUrl !== undefined) {
      promo.ctaCustomUrl = body.ctaCustomUrl ? body.ctaCustomUrl.trim() : "";
    }

    // Image replacement handling
    if (body.image && body.imagePublicId && body.imagePublicId !== promo.imagePublicId) {
      const oldPublicId = promo.imagePublicId;
      promo.image = body.image.trim();
      promo.imagePublicId = body.imagePublicId.trim();

      if (oldPublicId && oldPublicId.startsWith(CLOUDINARY_FOLDERS.PROMOTIONS)) {
        deleteCloudinaryImage(oldPublicId).catch((err) =>
          console.warn("Non-fatal: Old promotion image removal failed:", err)
        );
      }
    }

    if (body.isFeatured !== undefined) {
      promo.isFeatured = Boolean(body.isFeatured);
    }

    if (body.isActive !== undefined) {
      promo.isActive = Boolean(body.isActive);
    }

    if (body.displayOrder !== undefined) {
      promo.displayOrder = typeof body.displayOrder === "number" ? body.displayOrder : 0;
    }

    await promo.save();

    const populated = await Promotion.findById(promo._id)
      .populate("branchIds", "_id name slug")
      .populate("relatedServiceId", "_id name price")
      .populate("relatedProductId", "_id name price image")
      .populate("relatedWeddingPackageId", "_id name price")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Promotion updated successfully",
      promotion: populated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/promotions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update promotion" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/promotions/[id]
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
        { success: false, message: "Invalid promotion ID" },
        { status: 400 }
      );
    }

    const promo = await Promotion.findById(id);
    if (!promo) {
      return NextResponse.json(
        { success: false, message: "Promotion not found" },
        { status: 404 }
      );
    }

    // Cloudinary cleanup
    if (promo.imagePublicId && promo.imagePublicId.startsWith(CLOUDINARY_FOLDERS.PROMOTIONS)) {
      deleteCloudinaryImage(promo.imagePublicId).catch((err) =>
        console.warn("Non-fatal: Failed to delete promotion image:", err)
      );
    }

    await Promotion.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Promotion "${promo.title}" deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/promotions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete promotion" },
      { status: 500 }
    );
  }
}
