import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "customer" | "admin";
  isActive: boolean;
  mustChangePassword: boolean;
  profileImage?: string;
  profileImagePublicId?: string;

  // Password Reset fields (Group 3)
  passwordResetOtpHash?: string;
  passwordResetOtpExpiresAt?: Date;
  passwordResetOtpAttempts?: number;
  passwordResetVerified?: boolean;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: Date;
  passwordResetRequestedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    profileImagePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    // Password Reset fields (Group 3)
    passwordResetOtpHash: {
      type: String,
      default: undefined,
    },
    passwordResetOtpExpiresAt: {
      type: Date,
      default: undefined,
    },
    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
    },
    passwordResetVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetTokenHash: {
      type: String,
      default: undefined,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
      default: undefined,
    },
    passwordResetRequestedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as Record<string, unknown>).User;
}

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;