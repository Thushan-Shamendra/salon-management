import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { getGlobalCustomization, GLOBAL_CUSTOMIZATION_ID } from "@/lib/customization";
import { requireCustomizationAdmin, readCustomizationBody, customizationApiError } from "@/lib/customization-api";
import { CustomizationValidationError, isPlainCustomizationObject, isEmptyCustomization, validateGlobalOverride } from "@/lib/customization-validation";
import { getGlobalRegistration } from "@/lib/customization-registry";
import GlobalCustomization from "@/models/GlobalCustomization";

export async function GET() {
  try {
    const denied = await requireCustomizationAdmin();
    if (denied) return denied;
    return NextResponse.json({ success: true, customization: await getGlobalCustomization() });
  } catch (error) { return customizationApiError(error, "global read"); }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireCustomizationAdmin();
    if (denied) return denied;
    const body = await readCustomizationBody(request);
    if (!isPlainCustomizationObject(body) || Object.keys(body).some((key) => key !== "group" && key !== "override") || typeof body.group !== "string") throw new CustomizationValidationError("Expected a global group and override");
    const group = getGlobalRegistration(body.group);
    if (!group) throw new CustomizationValidationError("Unknown global customization group");
    const override = validateGlobalOverride(group.key, body.override);
    await connectDB();
    if (isEmptyCustomization(override)) {
      await GlobalCustomization.updateOne({ _id: GLOBAL_CUSTOMIZATION_ID }, { $unset: { [`overrides.${group.key}`]: 1 } });
    } else {
      await GlobalCustomization.updateOne({ _id: GLOBAL_CUSTOMIZATION_ID }, { $set: { [`overrides.${group.key}`]: override } }, { upsert: true, runValidators: true });
    }
    revalidatePath(group.scope === "admin" ? "/admin" : "/", "layout");
    return NextResponse.json({ success: true, message: isEmptyCustomization(override) ? "Original design restored" : "Global design saved", group: group.key, override });
  } catch (error) { return customizationApiError(error, "global save"); }
}
