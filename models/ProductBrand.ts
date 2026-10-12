import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductBrand extends Document {
  name: string;
  logo: string;
  logoPublicId: string;
  description?: string;
  websiteUrl?: string;
  branchIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductBrandSchema = new Schema<IProductBrand>(
  {
    name: {
      type: String,
      required: [true, "Brand or product name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    logo: {
      type: String,
      required: [true, "Logo image is required"],
      trim: true,
    },
    logoPublicId: {
      type: String,
      required: [true, "Logo public ID is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    websiteUrl: {
      type: String,
      trim: true,
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

// Compound index for public ordering
ProductBrandSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });

// Avoid caching stale schema during Next.js hot module reloading
if (
  process.env.NODE_ENV !== "production" &&
  mongoose.models &&
  mongoose.models.ProductBrand
) {
  delete mongoose.models.ProductBrand;
}

const ProductBrand: Model<IProductBrand> =
  mongoose.models.ProductBrand ||
  mongoose.model<IProductBrand>("ProductBrand", ProductBrandSchema);

export default ProductBrand;
