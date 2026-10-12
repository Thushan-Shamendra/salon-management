import mongoose, { Schema, type Model } from "mongoose";
import type { CustomizationScope, SectionOverride } from "@/lib/customization-types";

export interface IPageSectionCustomization extends SectionOverride {
  scope: CustomizationScope;
  pageKey: string;
  sectionKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageSectionCustomizationSchema = new Schema<IPageSectionCustomization>({
  scope: { type: String, enum: ["public", "admin"], required: true },
  pageKey: { type: String, required: true, match: /^[a-z0-9-]+$/ },
  sectionKey: { type: String, required: true, match: /^[a-z0-9-]+$/ },
  content: { type: Schema.Types.Mixed },
  style: { type: Schema.Types.Mixed },
}, { timestamps: true, minimize: true, strict: true });

PageSectionCustomizationSchema.index({ scope: 1, pageKey: 1, sectionKey: 1 }, { unique: true });

const PageSectionCustomization: Model<IPageSectionCustomization> = mongoose.models.PageSectionCustomization || mongoose.model<IPageSectionCustomization>("PageSectionCustomization", PageSectionCustomizationSchema);
export default PageSectionCustomization;
