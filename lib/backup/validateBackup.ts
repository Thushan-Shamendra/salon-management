import { BACKUP_APP_NAME, BACKUP_VERSION, MANAGED_COLLECTION_KEYS, ManagedCollectionKey } from "./constants";
import { BackupPayload, ValidationResult, BackupCounts } from "./types";
import { hasDangerousKeys, isValidObjectId } from "./sanitize";
import { verifyDataChecksum } from "./checksum";
import { VENDOR_CATEGORIES } from "@/lib/vendor-constants";

/**
 * Validates an untrusted backup payload without writing anything to the database.
 * Returns valid status, preview counts, any warnings, and errors.
 */
export function validateBackup(payload: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Basic type and structure check
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      valid: false,
      warnings: [],
      errors: ["Invalid backup payload format. Expected a JSON object."],
    };
  }

  // 2. Reject prototype pollution and MongoDB operator keys ($gt, __proto__, etc.)
  if (hasDangerousKeys(payload)) {
    return {
      valid: false,
      warnings: [],
      errors: ["Dangerous or unauthorized properties detected in backup file (prototype pollution or MongoDB operators)."],
    };
  }

  const p = payload as Partial<BackupPayload>;

  // 3. Application identifier check
  if (p.app !== BACKUP_APP_NAME) {
    errors.push(`Invalid backup application identifier. Expected '${BACKUP_APP_NAME}', received '${p.app || "unknown"}'.`);
  }

  // 4. Version check
  if (p.backupVersion !== BACKUP_VERSION) {
    errors.push(`Unsupported backup version: ${p.backupVersion}. Current supported version is ${BACKUP_VERSION}.`);
  }

  // 5. Timestamp and ID checks
  if (!p.createdAt || isNaN(Date.parse(p.createdAt))) {
    errors.push("Invalid or missing backup creation timestamp (createdAt).");
  }

  if (!p.backupId || typeof p.backupId !== "string" || p.backupId.trim().length === 0) {
    errors.push("Invalid or missing backup identifier (backupId).");
  }

  // 6. Data payload structure check
  if (!p.data || typeof p.data !== "object" || Array.isArray(p.data)) {
    errors.push("Missing or invalid backup data section.");
    return { valid: false, warnings, errors };
  }

  // Ensure no forbidden/sensitive sections are embedded
  const forbiddenSections = ["users", "user", "admin", "accounts", "analytics", "analyticsevents", "aiCache", "aiinsightcaches"];
  for (const forbidden of forbiddenSections) {
    if (forbidden in p.data) {
      errors.push(`Forbidden data section '${forbidden}' detected in backup file.`);
    }
  }

  // 7. Checksum integrity verification
  if (!p.dataChecksum || typeof p.dataChecksum !== "string") {
    errors.push("Missing backup dataChecksum.");
  } else {
    const isChecksumValid = verifyDataChecksum(p.data, p.dataChecksum);
    if (!isChecksumValid) {
      errors.push("Backup integrity check failed. The file may have been modified or corrupted.");
    }
  }

  if (errors.length > 0) {
    return { valid: false, warnings, errors };
  }

  // 8. Validate individual managed collections
  const counts: BackupCounts = {
    branches: 0,
    services: 0,
    beauticians: 0,
    gallery: 0,
    products: 0,
    vendors: 0,
    weddingServices: 0,
    weddingPackages: 0,
    settings: 0,
  };

  const branchIdsInBackup = new Set<string>();

  // Collect branch IDs first for referential validation
  if (Array.isArray(p.data.branches)) {
    for (const b of p.data.branches) {
      if (b && typeof b === "object" && typeof (b as Record<string, unknown>)._id === "string") {
        branchIdsInBackup.add(String((b as Record<string, unknown>)._id));
      }
    }
  }

  for (const collectionKey of MANAGED_COLLECTION_KEYS) {
    const items = p.data[collectionKey];

    if (!items) {
      warnings.push(`Section '${collectionKey}' is missing from data; treating as empty.`);
      continue;
    }

    if (!Array.isArray(items)) {
      errors.push(`Data section '${collectionKey}' must be an array.`);
      continue;
    }

    counts[collectionKey] = items.length;

    // Check for duplicate _id within the collection
    const seenIds = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        errors.push(`Item at index ${i} in '${collectionKey}' must be a valid object.`);
        continue;
      }

      const rec = item as Record<string, unknown>;

      // Check _id
      if (!rec._id || !isValidObjectId(rec._id)) {
        errors.push(`Item at index ${i} in '${collectionKey}' has an invalid or missing MongoDB _id: '${rec._id}'.`);
        continue;
      }

      const idStr = String(rec._id);
      if (seenIds.has(idStr)) {
        errors.push(`Duplicate ID '${idStr}' detected in '${collectionKey}'.`);
      } else {
        seenIds.add(idStr);
      }

      // Validate collection-specific fields
      validateItemFields(collectionKey, rec, i, branchIdsInBackup, errors, warnings);
    }
  }

  // Add standard Cloudinary informational warning
  warnings.push("Backup preserves image URLs and Cloudinary asset references. It does not contain copies of the actual binary image files.");

  return {
    valid: errors.length === 0,
    backup: {
      app: p.app || BACKUP_APP_NAME,
      backupVersion: p.backupVersion || BACKUP_VERSION,
      createdAt: p.createdAt || new Date().toISOString(),
      backupId: p.backupId || "",
    },
    counts,
    warnings,
    errors: errors.length > 0 ? errors : undefined,
  };
}

function validateItemFields(
  collection: ManagedCollectionKey,
  rec: Record<string, unknown>,
  index: number,
  branchIdsInBackup: Set<string>,
  errors: string[],
  warnings: string[]
): void {
  switch (collection) {
    case "branches": {
      if (typeof rec.name !== "string" || !rec.name.trim()) {
        errors.push(`Branch at index ${index} requires a non-empty 'name'.`);
      }
      if (typeof rec.slug !== "string" || !rec.slug.trim()) {
        errors.push(`Branch at index ${index} requires a non-empty 'slug'.`);
      }
      if (typeof rec.phone !== "string" || !rec.phone.trim()) {
        errors.push(`Branch at index ${index} requires a non-empty 'phone'.`);
      }
      if (typeof rec.address !== "string" || !rec.address.trim()) {
        errors.push(`Branch at index ${index} requires a non-empty 'address'.`);
      }
      break;
    }

    case "services": {
      if (typeof rec.name !== "string" || !rec.name.trim()) {
        errors.push(`Service at index ${index} requires a non-empty 'name'.`);
      }
      if (typeof rec.description !== "string" || !rec.description.trim()) {
        errors.push(`Service at index ${index} requires a non-empty 'description'.`);
      }
      if (typeof rec.price !== "number" || rec.price < 0) {
        errors.push(`Service at index ${index} requires a valid positive number for 'price'.`);
      }
      if (typeof rec.duration !== "number" || rec.duration < 1) {
        errors.push(`Service at index ${index} requires a valid positive number (>= 1) for 'duration'.`);
      }
      break;
    }

    case "beauticians": {
      if (typeof rec.name !== "string" || !rec.name.trim()) {
        errors.push(`Beautician at index ${index} requires a non-empty 'name'.`);
      }
      if (typeof rec.jobTitle !== "string" || !rec.jobTitle.trim()) {
        errors.push(`Beautician at index ${index} requires a non-empty 'jobTitle'.`);
      }
      if (rec.branchId !== undefined && rec.branchId !== null && rec.branchId !== "") {
        if (!isValidObjectId(rec.branchId)) {
          errors.push(`Beautician '${rec.name || index}' has an invalid branchId format: '${rec.branchId}'.`);
        } else if (!branchIdsInBackup.has(String(rec.branchId))) {
          warnings.push(`Beautician '${rec.name || index}' references branchId '${rec.branchId}' which is not present in this backup.`);
        }
      }
      break;
    }

    case "gallery": {
      if (typeof rec.title !== "string" || !rec.title.trim()) {
        errors.push(`Gallery item at index ${index} requires a non-empty 'title'.`);
      }
      if (typeof rec.category !== "string" || !rec.category.trim()) {
        errors.push(`Gallery item at index ${index} requires a non-empty 'category'.`);
      }
      if (typeof rec.image !== "string" || !rec.image.trim()) {
        errors.push(`Gallery item at index ${index} requires a non-empty 'image' URL.`);
      }
      break;
    }

    case "products": {
      if (typeof rec.name !== "string" || !rec.name.trim()) {
        errors.push(`Product brand at index ${index} requires a non-empty 'name'.`);
      }
      if (rec.branchIds !== undefined && Array.isArray(rec.branchIds)) {
        for (const bId of rec.branchIds) {
          if (!isValidObjectId(bId)) {
            errors.push(`Product brand '${rec.name || index}' contains invalid branchId: '${bId}'.`);
          } else if (!branchIdsInBackup.has(String(bId))) {
            warnings.push(`Product brand '${rec.name || index}' references branchId '${bId}' not in backup.`);
          }
        }
      }
      break;
    }

    case "vendors": {
      if (typeof rec.name !== "string" || !rec.name.trim()) {
        errors.push(`Vendor at index ${index} requires a non-empty 'name'.`);
      }
      if (typeof rec.category !== "string" || !VENDOR_CATEGORIES.includes(rec.category as (typeof VENDOR_CATEGORIES)[number])) {
        errors.push(`Vendor at index ${index} has an unsupported category: '${rec.category}'.`);
      }
      if (rec.branchIds !== undefined && Array.isArray(rec.branchIds)) {
        for (const bId of rec.branchIds) {
          if (!isValidObjectId(bId)) {
            errors.push(`Vendor '${rec.name || index}' contains invalid branchId: '${bId}'.`);
          } else if (!branchIdsInBackup.has(String(bId))) {
            warnings.push(`Vendor '${rec.name || index}' references branchId '${bId}' not in backup.`);
          }
        }
      }
      break;
    }

    case "weddingServices": {
      if (typeof rec.name !== "string" || !rec.name.trim()) {
        errors.push(`Wedding service at index ${index} requires a non-empty 'name'.`);
      }
      if (typeof rec.description !== "string" || !rec.description.trim()) {
        errors.push(`Wedding service at index ${index} requires a non-empty 'description'.`);
      }
      if (typeof rec.price !== "number" || rec.price < 0) {
        errors.push(`Wedding service at index ${index} requires a valid 'price' >= 0.`);
      }
      break;
    }

    case "weddingPackages": {
      if (typeof rec.name !== "string" || !rec.name.trim()) {
        errors.push(`Wedding package at index ${index} requires a non-empty 'name'.`);
      }
      if (typeof rec.description !== "string" || !rec.description.trim()) {
        errors.push(`Wedding package at index ${index} requires a non-empty 'description'.`);
      }
      if (!Array.isArray(rec.includedItems)) {
        errors.push(`Wedding package at index ${index} requires an array of 'includedItems'.`);
      }
      if (typeof rec.price !== "number" || rec.price < 0) {
        errors.push(`Wedding package at index ${index} requires a valid 'price' >= 0.`);
      }
      break;
    }

    case "settings": {
      if (typeof rec.salonName !== "string" || !rec.salonName.trim()) {
        errors.push(`Website settings document at index ${index} requires a non-empty 'salonName'.`);
      }
      break;
    }
  }
}
