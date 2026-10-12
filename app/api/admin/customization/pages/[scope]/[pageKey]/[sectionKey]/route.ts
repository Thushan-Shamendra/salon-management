import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { requireCustomizationAdmin, readCustomizationBody, customizationApiError } from "@/lib/customization-api";
import { getSectionRegistration, isCustomizationScope, customizationPagePath } from "@/lib/customization-registry";
import { isEmptyCustomization, validatePageSectionOverride } from "@/lib/customization-validation";
import PageSectionCustomization from "@/models/PageSectionCustomization";

type Context = { params: Promise<{ scope: string; pageKey: string; sectionKey: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const denied = await requireCustomizationAdmin();
    if (denied) return denied;
    const { scope, pageKey, sectionKey } = await context.params;
    if (!isCustomizationScope(scope) || !getSectionRegistration(scope, pageKey, sectionKey)) return NextResponse.json({ success: false, message: "Unknown customization section" }, { status: 404 });
    const override = validatePageSectionOverride(scope, pageKey, sectionKey, await readCustomizationBody(request));
    const filter = { scope, pageKey, sectionKey };
    await connectDB();
    if (isEmptyCustomization(override)) {
      await PageSectionCustomization.deleteOne(filter);
    } else {
      const unset: Record<string, 1> = {};
      if (!override.content) unset.content = 1;
      if (!override.style) unset.style = 1;
      await PageSectionCustomization.updateOne(filter, { $set: { ...filter, ...override }, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { upsert: true, runValidators: true });
    }
    revalidatePath(customizationPagePath(scope, pageKey));
    return NextResponse.json({ success: true, message: isEmptyCustomization(override) ? "Original section restored" : "Section customization saved", override });
  } catch (error) { return customizationApiError(error, "section save"); }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const denied = await requireCustomizationAdmin();
    if (denied) return denied;
    const { scope, pageKey, sectionKey } = await context.params;
    if (!isCustomizationScope(scope) || !getSectionRegistration(scope, pageKey, sectionKey)) return NextResponse.json({ success: false, message: "Unknown customization section" }, { status: 404 });
    await connectDB();
    await PageSectionCustomization.deleteOne({ scope, pageKey, sectionKey });
    revalidatePath(customizationPagePath(scope, pageKey));
    return NextResponse.json({ success: true, message: "Original section restored", override: {} });
  } catch (error) { return customizationApiError(error, "section reset"); }
}
