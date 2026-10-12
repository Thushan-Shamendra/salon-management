import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportBackup, generateBackupFilename } from "@/lib/backup/exportBackup";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const backupPayload = await exportBackup();
    const filename = generateBackupFilename();
    const jsonString = JSON.stringify(backupPayload, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/backup/export error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate website backup" },
      { status: 500 }
    );
  }
}
