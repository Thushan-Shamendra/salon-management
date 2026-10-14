import mongoose, { Document, Model, Schema } from "mongoose";

export interface IService extends Document {
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  imagePublicId?: string;
  isActive: boolean;
  audience: "male" | "female" | "unisex";
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
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
  mongoose.models.Service
) {
  delete mongoose.models.Service;
}

const Service: Model<IService> =
  mongoose.models.Service ||
  mongoose.model<IService>("Service", ServiceSchema);

export default Service;