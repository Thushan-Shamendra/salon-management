import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { restoreBackup } from "@/lib/backup/restoreBackup";
import { MAX_BACKUP_SIZE_BYTES } from "@/lib/backup/constants";
import { RestoreRequest } from "@/lib/backup/types";

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

    let body: Partial<RestoreRequest>;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON format in restore request." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || !body.backup) {
      return NextResponse.json(
        { success: false, message: "Missing backup payload in restore request." },
        { status: 400 }
      );
    }

    const mode = body.mode || "merge";
    const confirmation = body.confirmation;

    const result = await restoreBackup(body.backup, mode, confirmation as string | boolean);

    return NextResponse.json(result);
  } catch (error) {
    const message = (error as Error)?.message || "Failed to restore backup.";
    console.error("POST /api/admin/backup/restore error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
}
