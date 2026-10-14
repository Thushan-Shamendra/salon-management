import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWeddingService extends Document {
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  imagePublicId?: string;
  isActive: boolean;
  displayOrder: number;
  audience: "male" | "female" | "unisex";
  createdAt: Date;
  updatedAt: Date;
}

const WeddingServiceSchema = new Schema<IWeddingService>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: "",
      trim: true,
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
    audience: {
      type: String,
      enum: ["male", "female", "unisex"],
      default: "unisex",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Avoid caching stale schema during Next.js hot module reloading in dev
if (
  process.env.NODE_ENV !== "production" &&
  mongoose.models &&
  mongoose.models.WeddingService
) {
  delete mongoose.models.WeddingService;
}

const WeddingService: Model<IWeddingService> =
  mongoose.models.WeddingService ||
  mongoose.model<IWeddingService>("WeddingService", WeddingServiceSchema);

export default WeddingService;
