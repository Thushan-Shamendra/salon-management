import crypto from "crypto";

/**
 * Deterministically serialize any JavaScript value so that object key order
 * does not affect the generated SHA-256 hash.
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return "null";
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return JSON.stringify(obj.toISOString());
  }

  // Handle primitives
  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalJsonStringify(item)).join(",") + "]";
  }

  // Handle Objects
  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();

  return (
    "{" +
    sortedKeys
      .map((key) => {
        const val = record[key];
        // Omit undefined values consistently
        if (val === undefined) {
          return null;
        }
        return JSON.stringify(key) + ":" + canonicalJsonStringify(val);
      })
      .filter((part): part is string => part !== null)
      .join(",") +
    "}"
  );
}

/**
 * Calculate SHA-256 checksum over the canonical JSON representation of backup data
 */
export function calculateDataChecksum(data: unknown): string {
  const canonical = canonicalJsonStringify(data);
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

/**
 * Verify if provided checksum matches calculated checksum
 */
export function verifyDataChecksum(data: unknown, expectedChecksum: string): boolean {
  if (!expectedChecksum || typeof expectedChecksum !== "string") {
    return false;
  }
  const calculated = calculateDataChecksum(data);
  return calculated.toLowerCase() === expectedChecksum.trim().toLowerCase();
}
