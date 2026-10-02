import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  generateUploadSignature,
  CLOUDINARY_FOLDERS,
  CloudinaryFolder,
} from "@/lib/cloudinary";

const ADMIN_ONLY_FOLDERS: CloudinaryFolder[] = [
  CLOUDINARY_FOLDERS.SERVICES,
  CLOUDINARY_FOLDERS.SALON,
];

const ALLOWED_FOLDERS = Object.values(CLOUDINARY_FOLDERS);

export async function POST(request: Request) {
  try {
    // 1. Authentication required
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to upload images" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Account is inactive" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const paramsToSign = body.paramsToSign || body;

    if (!paramsToSign || typeof paramsToSign !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid parameters to sign" },
        { status: 400 }
      );
    }

    const requestedFolder = paramsToSign.folder as CloudinaryFolder | undefined;

    // 2. Validate folder structure - folder must be specified and in allowed list
    if (!requestedFolder || !ALLOWED_FOLDERS.includes(requestedFolder)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid or missing upload folder destination. Allowed destinations: ${ALLOWED_FOLDERS.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Check admin privileges for administrative folders
    if (ADMIN_ONLY_FOLDERS.includes(requestedFolder) && user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin role required to upload images to this destination",
        },
        { status: 403 }
      );
    }

    // 3. Ensure timestamp is present
    if (!paramsToSign.timestamp) {
      paramsToSign.timestamp = Math.round(new Date().getTime() / 1000);
    }

    // 4. Generate signature server-side
    const signature = generateUploadSignature(paramsToSign);

    return NextResponse.json({
      success: true,
      signature,
      timestamp: paramsToSign.timestamp,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder: requestedFolder,
    });
  } catch (error) {
    console.error("Cloudinary signing error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate image upload signature",
      },
      { status: 500 }
    );
  }
}
