import { NextResponse } from "next/server";
import { getPageCustomizations } from "@/lib/customization";
import { requireCustomizationAdmin, customizationApiError } from "@/lib/customization-api";
import { getPageRegistration, isCustomizationScope } from "@/lib/customization-registry";

export async function GET(_request: Request, context: { params: Promise<{ scope: string; pageKey: string }> }) {
  try {
    const denied = await requireCustomizationAdmin();
    if (denied) return denied;
    const { scope, pageKey } = await context.params;
    if (!isCustomizationScope(scope) || !getPageRegistration(scope, pageKey)) return NextResponse.json({ success: false, message: "Unknown customization page" }, { status: 404 });
    return NextResponse.json({ success: true, sections: await getPageCustomizations(scope, pageKey) });
  } catch (error) { return customizationApiError(error, "page read"); }
}
