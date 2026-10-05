import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBeautician extends Document {
  name: string;
  jobTitle: string;
  bio?: string;
  specialties: string[];
  experienceYears?: number;
  image: string;
  imagePublicId: string;
  instagram?: string;
  facebook?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BeauticianSchema = new Schema<IBeautician>(
  {
    name: {
      type: String,
      required: [true, "Beautician name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    specialties: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },
    experienceYears: {
      type: Number,
      min: [0, "Experience years cannot be negative"],
      max: [60, "Experience years cannot exceed 60"],
      default: 0,
    },
    image: {
      type: String,
      required: [true, "Profile image is required"],
      trim: true,
    },
    imagePublicId: {
      type: String,
      required: [true, "Image public ID is required"],
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

// Compound index for public team listing
BeauticianSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });

const Beautician: Model<IBeautician> =
  mongoose.models.Beautician ||
  mongoose.model<IBeautician>("Beautician", BeauticianSchema);

export default Beautician;
