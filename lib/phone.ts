/**
 * Phone and WhatsApp normalization utilities for SALVORA
 */

/**
 * Normalizes a phone number to standard international digits-only format for WhatsApp (wa.me).
 * Handles Sri Lankan numbers (07XXXXXXXX -> 947XXXXXXXX) and international formats.
 * Returns empty string if invalid or absent.
 */
export function normalizeWhatsAppNumber(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";
  let cleaned = raw.replace(/[^0-9]/g, "").trim();
  if (!cleaned) return "";

  // If local Sri Lankan format (10 digits starting with 0, e.g. 0771234567 or 0112345678)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "94" + cleaned.slice(1);
  }

  // Must be a valid phone number length (between 7 and 15 digits according to ITU-T E.164)
  return /^\d{7,15}$/.test(cleaned) ? cleaned : "";
}
