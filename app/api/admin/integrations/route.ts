import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getIntegrationsSafeStatus } from "@/lib/integrations/config";

// GET /api/admin/integrations - Fetch safe status of all integrations (strictly NO secrets)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const integrations = await getIntegrationsSafeStatus();

    return NextResponse.json({
      success: true,
      integrations,
    });
  } catch (error) {
    console.error("GET /api/admin/integrations error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve integration configuration status" },
      { status: 500 }
    );
  }
}
