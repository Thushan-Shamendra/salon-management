import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAiConfigAsync } from "@/lib/ai/provider";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const config = await getAiConfigAsync();
    return NextResponse.json({
      success: true,
      ...config,
    });
  } catch (error) {
    console.error("GET /api/admin/ai/status error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve AI configuration status" },
      { status: 500 }
    );
  }
}
