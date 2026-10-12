import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/analytics/summary";

// GET /api/admin/analytics/summary - Comprehensive website analytics for admin
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") || "30d";

    const summary = await getAnalyticsSummary(rangeParam);

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error("GET /api/admin/analytics/summary error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load analytics summary" },
      { status: 500 }
    );
  }
}
