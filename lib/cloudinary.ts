import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_FOLDERS,
  CloudinaryFolder,
} from "./cloudinary-constants";

export { CLOUDINARY_FOLDERS };
export type { CloudinaryFolder };

/**
 * Configure and return the Cloudinary Node SDK instance.
 * Fails clearly if any of the required server environment variables are missing.
 */
export function getCloudinary() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary environment configuration. Please ensure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

/**
 * Generates a signed upload signature for given parameters.
 */
export function generateUploadSignature(paramsToSign: Record<string, unknown>): string {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error("CLOUDINARY_API_SECRET is not configured.");
  }

  // Cloudinary expects params as Record<string, any>
  return cloudinary.utils.api_sign_request(
    paramsToSign as Record<string, string | number | boolean>,
    apiSecret
  );
}

/**
 * Safely delete an image from Cloudinary by its public ID.
 */
export async function deleteCloudinaryImage(publicId: string): Promise<{ result: string }> {
  const cld = getCloudinary();
  return cld.uploader.destroy(publicId);
}

/**
 * Check if an image URL is hosted on Cloudinary.
 */
export function isCloudinaryUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return url.includes("res.cloudinary.com");
}

export { cloudinary };
