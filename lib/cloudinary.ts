import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_FOLDERS,
  CloudinaryFolder,
} from "./cloudinary-constants";
import { getCloudinaryConfig } from "@/lib/integrations/config";

export { CLOUDINARY_FOLDERS };
export type { CloudinaryFolder };

/**
 * Configure and return the Cloudinary Node SDK instance using the centralized resolver.
 * Supports Admin Overrides with graceful fallback to environment variables.
 */
export async function getCloudinary() {
  const config = await getCloudinaryConfig();

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error(
      "Missing Cloudinary configuration. Please configure Cloudinary in Settings or via environment variables."
    );
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return cloudinary;
}

/**
 * Generates a signed upload signature for given parameters using the resolved apiSecret.
 */
export async function generateUploadSignature(
  paramsToSign: Record<string, unknown>,
  explicitSecret?: string
): Promise<string> {
  const apiSecret = explicitSecret || (await getCloudinaryConfig()).apiSecret;
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
  const cld = await getCloudinary();
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
