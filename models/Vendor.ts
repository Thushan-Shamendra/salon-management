import mongoose, { Schema, Document, Model } from "mongoose";
import { VENDOR_CATEGORIES, VendorCategory } from "@/lib/vendor-constants";

export { VENDOR_CATEGORIES, type VendorCategory };

export interface IVendor extends Document {
  name: string;
  category: VendorCategory;
  description?: string;

  image: string;
  imagePublicId?: string;

  logo?: string;
  logoPublicId?: string;

  phone?: string;
  whatsapp?: string;
  email?: string;

  website?: string;
  instagram?: string;
  facebook?: string;

  branchIds?: mongoose.Types.ObjectId[];

  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: VENDOR_CATEGORIES,
        message: "{VALUE} is not a supported vendor category",
      },
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: String,
      required: [true, "Vendor image is required"],
      trim: true,
    },

    imagePublicId: {
      type: String,
      trim: true,
      default: "",
    },

    logo: {
      type: String,
      trim: true,
      default: "",
    },

    logoPublicId: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    whatsapp: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    website: {
      type: String,
      trim: true,
      default: "",
    },

    instagram: {
      type: String,
      trim: true,
      default: "",
    },

    facebook: {
      type: String,
      trim: true,
      default: "",
    },

    branchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as Record<string, unknown>).Vendor;
}

const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema);

export default Vendor;
