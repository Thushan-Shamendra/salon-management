import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { CustomizationValidationError } from "./customization-validation";

export async function requireCustomizationAdmin(): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
  if (user.role !== "admin" || !user.isActive) return NextResponse.json({ success: false, message: "Active admin role required" }, { status: 403 });
  return null;
}

export async function readCustomizationBody(request: Request): Promise<unknown> {
  const body = await request.text();
  if (body.length > 16000) throw new CustomizationValidationError("Customization payload is too large");
  try { return JSON.parse(body); } catch { throw new CustomizationValidationError("Request body must be valid JSON"); }
}

export function customizationApiError(error: unknown, operation: string) {
  if (error instanceof CustomizationValidationError) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  console.error(`Customization ${operation} failed:`, error);
  return NextResponse.json({ success: false, message: "Unable to update or load customization" }, { status: 500 });
}
