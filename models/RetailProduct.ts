import mongoose, { Document, Model, Schema } from "mongoose";
import {
  RETAIL_PRODUCT_CATEGORIES,
  RetailProductCategory,
  RETAIL_CATEGORY_LABELS,
  STOCK_STATUSES,
  StockStatus,
} from "@/lib/retail-product-constants";

export {
  RETAIL_PRODUCT_CATEGORIES,
  type RetailProductCategory,
  RETAIL_CATEGORY_LABELS,
  STOCK_STATUSES,
  type StockStatus,
};

export interface IRetailProduct extends Document {
  name: string;
  slug: string;
  category: RetailProductCategory;
  brand?: string;
  image: string;
  imagePublicId: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number | null;
  stockStatus: StockStatus;
  size?: string;
  sku?: string;
  branchIds: mongoose.Types.ObjectId[];
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const RetailProductSchema = new Schema<IRetailProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: {
        values: RETAIL_PRODUCT_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [80, "Brand cannot exceed 80 characters"],
      default: "Salvora",
    },
    image: {
      type: String,
      required: [true, "Product image is required"],
      trim: true,
    },
    imagePublicId: {
      type: String,
      required: [true, "Product image public ID is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [250, "Short description cannot exceed 250 characters"],
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    salePrice: {
      type: Number,
      min: [0, "Sale price cannot be negative"],
      default: null,
    },
    stockStatus: {
      type: String,
      enum: STOCK_STATUSES,
      default: "in_stock",
      index: true,
    },
    size: {
      type: String,
      trim: true,
      maxlength: [50, "Size cannot exceed 50 characters"],
      default: "",
    },
    sku: {
      type: String,
      trim: true,
      maxlength: [50, "SKU cannot exceed 50 characters"],
      default: "",
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

// Compound indexes for public queries
RetailProductSchema.index({ isActive: 1, category: 1, displayOrder: 1, createdAt: -1 });
RetailProductSchema.index({ isActive: 1, isFeatured: 1, displayOrder: 1 });

// Avoid caching stale schema during Next.js hot module reloading in dev
if (
  process.env.NODE_ENV !== "production" &&
  mongoose.models &&
  mongoose.models.RetailProduct
) {
  delete mongoose.models.RetailProduct;
}

const RetailProduct: Model<IRetailProduct> =
  mongoose.models.RetailProduct ||
  mongoose.model<IRetailProduct>("RetailProduct", RetailProductSchema);

export default RetailProduct;
