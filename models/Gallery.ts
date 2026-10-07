import mongoose, { Document, Model, Schema } from "mongoose";
import {
  ICropTarget,
  ICropSettings,
  DEFAULT_CROP_TARGET,
  DEFAULT_CROP_SETTINGS,
  normalizeCropTarget,
  normalizeCropSettings,
} from "../lib/crop";

export type { ICropTarget, ICropSettings };
export {
  DEFAULT_CROP_TARGET,
  DEFAULT_CROP_SETTINGS,
  normalizeCropTarget,
  normalizeCropSettings,
};

export interface IGallery extends Document {
  title: string;
  description?: string;
  category: string;
  image: string;
  imagePublicId: string;
  altText?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  cropSettings?: ICropSettings;
  cropPosition?: ICropTarget;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<IGallery>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    imagePublicId: {
      type: String,
      required: [true, "Image public ID is required"],
      trim: true,
    },
    altText: {
      type: String,
      trim: true,
      maxlength: [160, "Alt text cannot exceed 160 characters"],
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    cropSettings: {
      home: {
        x: { type: Number, default: 50 },
        y: { type: Number, default: 50 },
        zoom: { type: Number, default: 1 },
      },
      gallery: {
        x: { type: Number, default: 50 },
        y: { type: Number, default: 50 },
        zoom: { type: Number, default: 1 },
      },
      featured: {
        x: { type: Number, default: 50 },
        y: { type: Number, default: 50 },
        zoom: { type: Number, default: 1 },
      },
    },
    cropPosition: {
      x: {
        type: Number,
        default: 50,
      },
      y: {
        type: Number,
        default: 50,
      },
      zoom: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for public filtering and ordering
GallerySchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });
GallerySchema.index({ category: 1, isActive: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models && mongoose.models.Gallery) {
  delete mongoose.models.Gallery;
}

const Gallery: Model<IGallery> =
  mongoose.models.Gallery ||
  mongoose.model<IGallery>("Gallery", GallerySchema);

export default Gallery;
