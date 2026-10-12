import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  generateUploadSignature,
  CLOUDINARY_FOLDERS,
  CloudinaryFolder,
} from "@/lib/cloudinary";
import { getCloudinaryConfig } from "@/lib/integrations/config";

const ADMIN_ONLY_FOLDERS: CloudinaryFolder[] = [
  CLOUDINARY_FOLDERS.SERVICES,
  CLOUDINARY_FOLDERS.SALON,
  CLOUDINARY_FOLDERS.GALLERY,
  CLOUDINARY_FOLDERS.BEAUTICIANS,
  CLOUDINARY_FOLDERS.RETAIL_PRODUCTS,
  CLOUDINARY_FOLDERS.PROMOTIONS,
];

const ALLOWED_FOLDERS = Object.values(CLOUDINARY_FOLDERS);

// GET /api/cloudinary/sign - Public/authenticated client config (never exposes apiSecret)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const config = await getCloudinaryConfig();

    return NextResponse.json({
      success: true,
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      configured: config.isConfigured,
    });
  } catch (error) {
    console.error("GET /api/cloudinary/sign error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resolve Cloudinary client configuration" },
      { status: 500 }
    );
  }
}

// POST /api/cloudinary/sign - Generate signed upload parameters for Cloudinary upload widget
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

    // 3. Resolve active Cloudinary configuration (Admin Override -> Env -> Not Configured)
    const config = await getCloudinaryConfig();
    if (!config.isConfigured || !config.apiSecret) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cloudinary is not fully configured. Please configure your Cloudinary credentials in Website Settings or environment.",
        },
        { status: 500 }
      );
    }

    // 4. Ensure timestamp is present
    if (!paramsToSign.timestamp) {
      paramsToSign.timestamp = Math.round(new Date().getTime() / 1000);
    }

    // 5. Generate signature server-side using resolved secret
    const signature = await generateUploadSignature(paramsToSign, config.apiSecret);

    return NextResponse.json({
      success: true,
      signature,
      timestamp: paramsToSign.timestamp,
      apiKey: config.apiKey,
      cloudName: config.cloudName,
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
