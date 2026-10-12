import "server-only";
import { cache } from "react";
import { connectDB } from "./mongodb";
import GlobalCustomization from "@/models/GlobalCustomization";
import PageSectionCustomization from "@/models/PageSectionCustomization";
import { globalGroups, getPageRegistration } from "./customization-registry";
import { isPlainCustomizationObject, isEmptyCustomization, validateGlobalOverride, validatePageSectionOverride } from "./customization-validation";
import type { CustomizationScope, GlobalOverrides, PageOverrides, SectionOverride } from "./customization-types";

export const GLOBAL_CUSTOMIZATION_ID = "website";

/** One read per render request; no cross-request data cache can keep a saved override stale. */
export const getGlobalCustomization = cache(async (): Promise<GlobalOverrides> => {
  try {
    await connectDB();
    const document = await GlobalCustomization.findById(GLOBAL_CUSTOMIZATION_ID).select("overrides -_id").lean();
    const raw = document?.overrides;
    if (!isPlainCustomizationObject(raw)) return {};
    const result: GlobalOverrides = {};
    for (const group of globalGroups) {
      if (raw[group.key] === undefined) continue;
      try {
        const override = validateGlobalOverride(group.key, raw[group.key]);
        if (!isEmptyCustomization(override)) result[group.key] = override;
      } catch { /* A tampered group must never emit unchecked text, URLs or CSS. */ }
    }
    return result;
  } catch (error) {
    console.error("Unable to load global customization; using original design:", error);
    return {};
  }
});

/** Fetch every section for a page together, then allowlist every field before rendering. */
export const getPageCustomizations = cache(async (scope: CustomizationScope, pageKey: string): Promise<PageOverrides> => {
  if (!getPageRegistration(scope, pageKey)) return {};
  try {
    await connectDB();
    const documents = await PageSectionCustomization.find({ scope, pageKey }).select("sectionKey content style -_id").lean();
    const result: PageOverrides = {};
    for (const document of documents) {
      try {
        const raw: SectionOverride = {};
        if (document.content !== undefined) raw.content = document.content;
        if (document.style !== undefined) raw.style = document.style;
        const override = validatePageSectionOverride(scope, pageKey, document.sectionKey, raw);
        if (!isEmptyCustomization(override)) result[document.sectionKey] = override;
      } catch { /* Invalid or no longer registered sections resolve to their source defaults. */ }
    }
    return result;
  } catch (error) {
    console.error(`Unable to load customization for ${scope}/${pageKey}; using original design:`, error);
    return {};
  }
});

export async function getSectionCustomization(scope: CustomizationScope, pageKey: string, sectionKey: string): Promise<SectionOverride> {
  return (await getPageCustomizations(scope, pageKey))[sectionKey] ?? {};
}

/** Merge sparse structured values without mutating defaults or copying prototype keys. */
export function mergeCustomization<T extends object>(defaults: T, ...overrides: (Partial<T> | undefined | null)[]): T {
  const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const override of overrides) {
    if (!isPlainCustomizationObject(override)) continue;
    for (const [key, value] of Object.entries(override)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype" || value === undefined || value === null) continue;
      const previous = result[key];
      result[key] = isPlainCustomizationObject(previous) && isPlainCustomizationObject(value)
        ? mergeCustomization(previous, value)
        : value;
    }
  }
  return result as T;
}
