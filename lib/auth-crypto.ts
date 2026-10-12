import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * Uses Node.js crypto.randomInt (never Math.random).
 */
export function generateSecureOtp(): string {
  // Generates integer in [100000, 999999]
  const otpNumber = crypto.randomInt(100000, 1000000);
  return otpNumber.toString();
}

/**
 * Hashes an OTP using HMAC-SHA256 with JWT_SECRET (or default salt).
 * Plaintext OTP is never stored in MongoDB.
 */
export function hashOtp(otp: string): string {
  const secret = process.env.JWT_SECRET || "salvora-secure-otp-salt";
  return crypto.createHmac("sha256", secret).update(otp.trim()).digest("hex");
}

/**
 * Generates a high-entropy random password reset token (64 hex characters)
 * and returns both the raw token (to send to the client) and its SHA-256 hash (to store in MongoDB).
 */
export function generatePasswordResetToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Computes SHA-256 hash of a raw reset token for database comparison.
 */
export function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}
