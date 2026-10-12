import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBranchOpeningHour {
  day: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface IBranch extends Document {
  name: string;
  slug: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  openingHours: IBranchOpeningHour[];
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BranchOpeningHourSchema = new Schema<IBranchOpeningHour>(
  {
    day: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
    openTime: { type: String, default: "09:00" },
    closeTime: { type: String, default: "19:00" },
  },
  { _id: false }
);

const BranchSchema = new Schema<IBranch>(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Branch slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    googleMapsUrl: {
      type: String,
      trim: true,
      default: "",
    },
    openingHours: {
      type: [BranchOpeningHourSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Branch: Model<IBranch> =
  mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);

export default Branch;
