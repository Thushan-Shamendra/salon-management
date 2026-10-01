import { NextResponse } from "next/server";
import { getSalonSettings } from "@/lib/salon-settings";

export async function GET() {
  const settings = await getSalonSettings();
  return NextResponse.json({ success: true, settings });
}