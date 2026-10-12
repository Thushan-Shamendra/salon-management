import mongoose, { Document, Model, Schema } from "mongoose";
import {
  PROMOTION_TYPES,
  PromotionType,
  PROMOTION_TYPE_LABELS,
  DISCOUNT_TYPES,
  DiscountType,
  CTA_TYPES,
  CtaType,
} from "@/lib/promotion-constants";

export {
  PROMOTION_TYPES,
  type PromotionType,
  PROMOTION_TYPE_LABELS,
  DISCOUNT_TYPES,
  type DiscountType,
  CTA_TYPES,
  type CtaType,
};

export interface IPromotion extends Document {
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  promoType: PromotionType;
  badgeText: string;
  image: string;
  imagePublicId: string;
  discountType: DiscountType;
  discountValue?: number | null;
  originalPrice?: number | null;
  promotionalPrice?: number | null;
  validDaysText?: string;
  startDate: Date;
  endDate: Date;
  terms: string[];
  relatedServiceId?: mongoose.Types.ObjectId | null;
  relatedProductId?: mongoose.Types.ObjectId | null;
  relatedWeddingPackageId?: mongoose.Types.ObjectId | null;
  branchIds: mongoose.Types.ObjectId[];
  ctaType: CtaType;
  ctaCustomLabel?: string;
  ctaCustomUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    title: {
      type: String,
      required: [true, "Promotion title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Subtitle cannot exceed 200 characters"],
      default: "",
    },
    description: {
      type: String,
      required: [true, "Promotion description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    promoType: {
      type: String,
      required: [true, "Promotion type is required"],
      enum: {
        values: PROMOTION_TYPES,
        message: "{VALUE} is not a valid promotion type",
      },
      index: true,
    },
    badgeText: {
      type: String,
      required: [true, "Badge text is required"],
      trim: true,
      maxlength: [40, "Badge text cannot exceed 40 characters"],
      default: "Special Offer",
    },
    image: {
      type: String,
      required: [true, "Promotion banner image is required"],
      trim: true,
    },
    imagePublicId: {
      type: String,
      required: [true, "Image public ID is required"],
      trim: true,
    },
    discountType: {
      type: String,
      enum: DISCOUNT_TYPES,
      default: "percentage",
    },
    discountValue: {
      type: Number,
      min: 0,
      default: null,
    },
    originalPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    promotionalPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    validDaysText: {
      type: String,
      trim: true,
      maxlength: [80, "Validity text cannot exceed 80 characters"],
      default: "",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      index: true,
    },
    terms: {
      type: [String],
      default: [],
    },
    relatedServiceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
    relatedProductId: {
      type: Schema.Types.ObjectId,
      ref: "RetailProduct",
      default: null,
    },
    relatedWeddingPackageId: {
      type: Schema.Types.ObjectId,
      ref: "WeddingPackage",
      default: null,
    },
    branchIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Branch",
        },
      ],
      default: [],
    },
    ctaType: {
      type: String,
      enum: CTA_TYPES,
      default: "whatsapp",
    },
    ctaCustomLabel: {
      type: String,
      trim: true,
      maxlength: [50, "CTA label cannot exceed 50 characters"],
      default: "",
    },
    ctaCustomUrl: {
      type: String,
      trim: true,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for active and unexpired promotions
PromotionSchema.index({
  isActive: 1,
  startDate: 1,
  endDate: 1,
  displayOrder: 1,
});

// Avoid caching stale schema during Next.js hot module reloading
if (
  process.env.NODE_ENV !== "production" &&
  mongoose.models &&
  mongoose.models.Promotion
) {
  delete mongoose.models.Promotion;
}

const Promotion: Model<IPromotion> =
  mongoose.models.Promotion ||
  mongoose.model<IPromotion>("Promotion", PromotionSchema);

export default Promotion;
