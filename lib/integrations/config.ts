import { connectDB } from "@/lib/mongodb";
import IntegrationSettings, { IIntegrationSettings } from "@/models/IntegrationSettings";
import { safeDecryptSecret } from "./secrets";

export interface ResolvedCloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  hasAdminOverride: boolean;
  source: "admin" | "environment" | "none";
  isConfigured: boolean;
}

export interface ResolvedGooglePlacesConfig {
  apiKey: string;
  hasAdminOverride: boolean;
  source: "admin" | "environment" | "none";
  isConfigured: boolean;
}

export interface ResolvedAiConfig {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  hasAdminOverride: boolean;
  source: "admin" | "environment" | "none";
  isConfigured: boolean;
}

export interface SafeIntegrationsStatus {
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecretConfigured: boolean;
    hasAdminOverride: boolean;
    source: "admin" | "environment" | "none";
    isConfigured: boolean;
  };
  googlePlaces: {
    apiKeyConfigured: boolean;
    hasAdminOverride: boolean;
    source: "admin" | "environment" | "none";
    isConfigured: boolean;
  };
  ai: {
    provider: string;
    model: string;
    baseUrl: string;
    apiKeyConfigured: boolean;
    hasAdminOverride: boolean;
    source: "admin" | "environment" | "none";
    isConfigured: boolean;
  };
}

/**
 * Helper to fetch the singleton IntegrationSettings document.
 */
async function getIntegrationSettingsDocument(): Promise<IIntegrationSettings | null> {
  try {
    await connectDB();
    return await IntegrationSettings.findOne().lean();
  } catch (error) {
    console.error("Error loading IntegrationSettings from database:", error);
    return null;
  }
}

/**
 * Central resolver for Cloudinary configuration.
 * Fallback: Admin Override -> Environment Default -> Not Configured
 */
export async function getCloudinaryConfig(): Promise<ResolvedCloudinaryConfig> {
  const doc = await getIntegrationSettingsDocument();
  const dbCloudinary = doc?.cloudinary;

  const hasDbSecret = Boolean(dbCloudinary?.encryptedApiSecret);
  const decryptedDbSecret = hasDbSecret
    ? safeDecryptSecret(dbCloudinary?.encryptedApiSecret)
    : null;

  const hasAdminOverride = Boolean(
    dbCloudinary?.cloudName || dbCloudinary?.apiKey || hasDbSecret
  );

  const cloudName =
    dbCloudinary?.cloudName?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    "";

  const apiKey =
    dbCloudinary?.apiKey?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY?.trim() ||
    process.env.CLOUDINARY_API_KEY?.trim() ||
    "";

  const apiSecret =
    decryptedDbSecret ||
    process.env.CLOUDINARY_API_SECRET?.trim() ||
    "";

  let source: "admin" | "environment" | "none" = "none";
  if (hasAdminOverride) {
    source = "admin";
  } else if (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    process.env.CLOUDINARY_API_SECRET
  ) {
    source = "environment";
  }

  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  return {
    cloudName,
    apiKey,
    apiSecret,
    hasAdminOverride,
    source,
    isConfigured,
  };
}

/**
 * Central resolver for Google Places API Key.
 * Fallback: Admin Override -> Environment Default -> Not Configured
 */
export async function getGooglePlacesConfig(): Promise<ResolvedGooglePlacesConfig> {
  const doc = await getIntegrationSettingsDocument();
  const dbGoogle = doc?.googlePlaces;

  const hasDbSecret = Boolean(dbGoogle?.encryptedApiKey);
  const decryptedDbSecret = hasDbSecret
    ? safeDecryptSecret(dbGoogle?.encryptedApiKey)
    : null;

  const hasAdminOverride = Boolean(hasDbSecret);

  const apiKey =
    decryptedDbSecret ||
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    "";

  let source: "admin" | "environment" | "none" = "none";
  if (hasAdminOverride) {
    source = "admin";
  } else if (process.env.GOOGLE_PLACES_API_KEY?.trim()) {
    source = "environment";
  }

  const isConfigured = Boolean(apiKey);

  return {
    apiKey,
    hasAdminOverride,
    source,
    isConfigured,
  };
}

/**
 * Central resolver for AI Provider configuration.
 * Fallback: Admin Override -> Environment Default -> Not Configured
 */
export async function getAiConfig(): Promise<ResolvedAiConfig> {
  const doc = await getIntegrationSettingsDocument();
  const dbAi = doc?.ai;

  const hasDbSecret = Boolean(dbAi?.encryptedApiKey);
  const decryptedDbSecret = hasDbSecret
    ? safeDecryptSecret(dbAi?.encryptedApiKey)
    : null;

  const hasAdminOverride = Boolean(
    hasDbSecret ||
    dbAi?.model ||
    dbAi?.baseUrl ||
    (dbAi?.provider && dbAi?.provider !== "openai")
  );

  const provider =
    dbAi?.provider?.trim() ||
    process.env.AI_PROVIDER?.trim() ||
    "openai";

  const model =
    dbAi?.model?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";

  const baseUrl =
    dbAi?.baseUrl?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    "https://api.openai.com/v1";

  const apiKey =
    decryptedDbSecret ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";

  let source: "admin" | "environment" | "none" = "none";
  if (hasAdminOverride) {
    source = "admin";
  } else if (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.AI_PROVIDER?.trim() ||
    process.env.OPENAI_MODEL?.trim()
  ) {
    source = "environment";
  }

  const isConfigured = Boolean(apiKey);

  return {
    provider,
    model,
    baseUrl,
    apiKey,
    hasAdminOverride,
    source,
    isConfigured,
  };
}

/**
 * Safe status summary for all integrations.
 * Strictly guarantees ZERO plaintext or encrypted secrets are returned.
 */
export async function getIntegrationsSafeStatus(): Promise<SafeIntegrationsStatus> {
  const [cld, google, ai] = await Promise.all([
    getCloudinaryConfig(),
    getGooglePlacesConfig(),
    getAiConfig(),
  ]);

  return {
    cloudinary: {
      cloudName: cld.cloudName,
      apiKey: cld.apiKey,
      apiSecretConfigured: Boolean(cld.apiSecret),
      hasAdminOverride: cld.hasAdminOverride,
      source: cld.source,
      isConfigured: cld.isConfigured,
    },
    googlePlaces: {
      apiKeyConfigured: Boolean(google.apiKey),
      hasAdminOverride: google.hasAdminOverride,
      source: google.source,
      isConfigured: google.isConfigured,
    },
    ai: {
      provider: ai.provider,
      model: ai.model,
      baseUrl: ai.baseUrl,
      apiKeyConfigured: Boolean(ai.apiKey),
      hasAdminOverride: ai.hasAdminOverride,
      source: ai.source,
      isConfigured: ai.isConfigured,
    },
  };
}
