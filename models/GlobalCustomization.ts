import mongoose, { Schema, type Model } from "mongoose";
import type { GlobalOverrides } from "@/lib/customization-types";

export interface IGlobalCustomization {
  _id: string;
  overrides?: GlobalOverrides;
  createdAt: Date;
  updatedAt: Date;
}

// No defaults are copied into storage. The fixed _id enforces one override document.
const GlobalCustomizationSchema = new Schema<IGlobalCustomization>({
  _id: { type: String, required: true },
  overrides: { type: Schema.Types.Mixed },
}, { timestamps: true, minimize: true, strict: true });

const GlobalCustomization: Model<IGlobalCustomization> = mongoose.models.GlobalCustomization || mongoose.model<IGlobalCustomization>("GlobalCustomization", GlobalCustomizationSchema);
export default GlobalCustomization;
