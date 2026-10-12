import mongoose from "mongoose";
import { ManagedCollectionKey } from "./constants";

/**
 * Checks recursively if an object contains any dangerous prototype pollution
 * or MongoDB operator keys ($gt, $where, __proto__, constructor, etc.)
 */
export function hasDangerousKeys(data: unknown): boolean {
  if (data === null || typeof data !== "object") {
    return false;
  }

  if (Array.isArray(data)) {
    return data.some(hasDangerousKeys);
  }

  const record = data as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (
      key === "__proto__" ||
      key === "constructor" ||
      key === "prototype" ||
      key.startsWith("$")
    ) {
      return true;
    }

    if (hasDangerousKeys(record[key])) {
      return true;
    }
  }

  return false;
}

export function isValidObjectId(id: unknown): boolean {
  if (typeof id !== "string") {
    return false;
  }
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Field whitelists for each managed collection.
 * Any key not present in these lists will be filtered out during sanitization.
 */
export const FIELD_WHITELISTS: Record<ManagedCollectionKey, string[]> = {
  branches: [
    "_id",
    "name",
    "slug",
    "phone",
    "whatsappNumber",
    "email",
    "address",
    "latitude",
    "longitude",
    "googleMapsUrl",
    "googlePlaceId",
    "googleReviewUrl",
    "reviewsEnabled",
    "openingHours",
    "isActive",
    "displayOrder",
    "isMain",
    "createdAt",
    "updatedAt",
  ],
  services: [
    "_id",
    "name",
    "description",
    "price",
    "duration",
    "image",
    "imagePublicId",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  beauticians: [
    "_id",
    "name",
    "jobTitle",
    "bio",
    "specialties",
    "experienceYears",
    "image",
    "imagePublicId",
    "instagram",
    "facebook",
    "branchId",
    "isActive",
    "isFeatured",
    "displayOrder",
    "createdAt",
    "updatedAt",
  ],
  gallery: [
    "_id",
    "title",
    "description",
    "category",
    "image",
    "imagePublicId",
    "altText",
    "isActive",
    "isFeatured",
    "displayOrder",
    "cropSettings",
    "cropPosition",
    "createdAt",
    "updatedAt",
  ],
  products: [
    "_id",
    "name",
    "logo",
    "logoPublicId",
    "description",
    "websiteUrl",
    "branchIds",
    "isActive",
    "displayOrder",
    "createdAt",
    "updatedAt",
  ],
  vendors: [
    "_id",
    "name",
    "category",
    "description",
    "image",
    "imagePublicId",
    "logo",
    "logoPublicId",
    "phone",
    "whatsapp",
    "email",
    "website",
    "instagram",
    "facebook",
    "branchIds",
    "isFeatured",
    "isActive",
    "displayOrder",
    "createdAt",
    "updatedAt",
  ],
  weddingServices: [
    "_id",
    "name",
    "description",
    "price",
    "duration",
    "image",
    "imagePublicId",
    "isActive",
    "displayOrder",
    "createdAt",
    "updatedAt",
  ],
  weddingPackages: [
    "_id",
    "name",
    "description",
    "image",
    "imagePublicId",
    "includedItems",
    "price",
    "durationText",
    "isFeatured",
    "isActive",
    "displayOrder",
    "createdAt",
    "updatedAt",
  ],
  settings: [
    "_id",
    "salonName",
    "logo",
    "logoPublicId",
    "footerLogo",
    "footerLogoPublicId",
    "aboutDescription",
    "phone",
    "phoneSecondary",
    "whatsapp",
    "email",
    "address",
    "branches",
    "openingHours",
    "socialMedia",
    "googleReviews",
    "externalSystem",
    "createdAt",
    "updatedAt",
  ],
};

/**
 * Filter an imported record to keep ONLY explicitly whitelisted fields.
 * Converts MongoDB ObjectId instances to hex strings and Dates to ISO strings.
 */
export function sanitizeDocument(
  collection: ManagedCollectionKey,
  doc: unknown
): Record<string, unknown> {
  const allowed = FIELD_WHITELISTS[collection] || [];
  const sanitized: Record<string, unknown> = {};

  if (!doc || typeof doc !== "object") {
    return sanitized;
  }

  const record = doc as Record<string, unknown>;

  for (const field of allowed) {
    if (record[field] !== undefined) {
      const val = record[field];

      // Handle _id
      if (field === "_id") {
        sanitized._id = String(val);
      } else if (val instanceof Date) {
        sanitized[field] = val.toISOString();
      } else if (val && typeof val === "object" && "_bsontype" in val) {
        // Mongoose ObjectId or BSON type
        sanitized[field] = String(val);
      } else if (Array.isArray(val)) {
        // Clone array safely
        sanitized[field] = val.map((item) => {
          if (item && typeof item === "object" && "_bsontype" in item) {
            return String(item);
          }
          if (item instanceof Date) {
            return item.toISOString();
          }
          if (typeof item === "object" && item !== null) {
            return JSON.parse(JSON.stringify(item));
          }
          return item;
        });
      } else if (typeof val === "object" && val !== null) {
        // Deep clone clean object
        sanitized[field] = JSON.parse(JSON.stringify(val));
      } else {
        sanitized[field] = val;
      }
    }
  }

  return sanitized;
}
