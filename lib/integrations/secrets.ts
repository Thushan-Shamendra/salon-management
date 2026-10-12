import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard 12-byte IV for AES-GCM

/**
 * Derives a deterministic 32-byte Buffer key for AES-256-GCM.
 * Prioritizes INTEGRATION_ENCRYPTION_KEY, with a fallback to JWT_SECRET in dev.
 */
function getMasterKey(): Buffer {
  const masterKeyString =
    process.env.INTEGRATION_ENCRYPTION_KEY?.trim() ||
    process.env.JWT_SECRET?.trim();

  if (!masterKeyString) {
    throw new Error(
      "Encryption key not configured. Please set INTEGRATION_ENCRYPTION_KEY (or JWT_SECRET) in your environment."
    );
  }

  // Derive a 32-byte key using SHA-256 to ensure exact key length
  return crypto.createHash("sha256").update(masterKeyString).digest();
}

/**
 * Encrypt a secret string using AES-256-GCM.
 * Output format: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptSecret(plaintext: string): string {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("Secret must be a non-empty string");
  }

  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext}`;
}

/**
 * Decrypt an AES-256-GCM encrypted payload.
 * Throws if auth tag verification fails or format is invalid.
 */
export function decryptSecret(payload: string): string {
  if (typeof payload !== "string" || payload.length === 0) {
    throw new Error("Payload must be a non-empty string");
  }

  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = getMasterKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Safe decryption wrapper that catches errors and returns null
 * instead of throwing if the key has changed or payload is malformed.
 */
export function safeDecryptSecret(payload?: string | null): string | null {
  if (!payload || typeof payload !== "string") {
    return null;
  }

  try {
    return decryptSecret(payload);
  } catch (error) {
    console.error("Failed to decrypt integration secret:", error instanceof Error ? error.message : "Decryption error");
    return null;
  }
}
