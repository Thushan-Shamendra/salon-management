import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/svg+xml", ".svg"],
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin role required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("logo");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Please select a logo image" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) {
      return NextResponse.json({ success: false, message: "Logo must be JPG, PNG, WEBP, or SVG" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: "Logo image must be 5 MB or smaller" }, { status: 400 });
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    const fileName = `salon-logo-${randomUUID()}${extension}`;
    await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ success: true, url: `/uploads/${fileName}` });
  } catch (error) {
    console.error("POST /api/admin/settings/logo error:", error);
    return NextResponse.json({ success: false, message: "Failed to upload logo" }, { status: 500 });
  }
}
