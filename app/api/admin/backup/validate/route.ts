import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validateBackup } from "@/lib/backup/validateBackup";
import { MAX_BACKUP_SIZE_BYTES } from "@/lib/backup/constants";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    // Check Content-Length header if present
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BACKUP_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "This backup file is too large (maximum size is 4 MB)." },
        { status: 413 }
      );
    }

    const rawText = await request.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_BACKUP_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "This backup file is too large (maximum size is 4 MB)." },
        { status: 413 }
      );
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON file. Please select a valid SALVORA backup file." },
        { status: 400 }
      );
    }

    // If request passed a wrapper object like { backup: ... }, extract backup
    const targetPayload =
      parsedPayload &&
      typeof parsedPayload === "object" &&
      "backup" in (parsedPayload as Record<string, unknown>)
        ? (parsedPayload as Record<string, unknown>).backup
        : parsedPayload;

    const validationResult = validateBackup(targetPayload);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          ...validationResult,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...validationResult,
    });
  } catch (error) {
    console.error("POST /api/admin/backup/validate error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during backup validation" },
      { status: 500 }
    );
  }
}
