import mongoose, { Model } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Branch from "@/models/Branch";
import Service from "@/models/Service";
import Beautician from "@/models/Beautician";
import Gallery from "@/models/Gallery";
import ProductBrand from "@/models/ProductBrand";
import Vendor from "@/models/Vendor";
import WeddingService from "@/models/WeddingService";
import WeddingPackage from "@/models/WeddingPackage";
import SalonSettings from "@/models/SalonSettings";
import AiInsightCache from "@/models/AiInsightCache";

import {
  RESTORE_CONFIRMATION_PHRASE,
  RESTORE_DEPENDENCY_ORDER,
  ManagedCollectionKey,
} from "./constants";
import {
  BackupPayload,
  RestoreMode,
  RestoreResult,
  CollectionRestoreStats,
} from "./types";
import { validateBackup } from "./validateBackup";
import { sanitizeDocument } from "./sanitize";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODEL_MAP: Record<ManagedCollectionKey, Model<any>> = {
  branches: Branch,
  services: Service,
  beauticians: Beautician,
  gallery: Gallery,
  products: ProductBrand,
  vendors: Vendor,
  weddingServices: WeddingService,
  weddingPackages: WeddingPackage,
  settings: SalonSettings,
};

/**
 * Safely restores supported SALVORA website content from a validated backup payload.
 * Runs atomically within a MongoDB transaction when supported.
 */
export async function restoreBackup(
  payload: BackupPayload,
  mode: RestoreMode,
  confirmation: string | boolean
): Promise<RestoreResult> {
  await connectDB();

  // 1. Full validation re-check
  const validation = validateBackup(payload);
  if (!validation.valid) {
    const errorMsg = validation.errors?.join(", ") || "Backup payload failed validation.";
    throw new Error(errorMsg);
  }

  // 2. Validate restore mode
  if (mode !== "merge" && mode !== "replace") {
    throw new Error(`Invalid restore mode: '${mode}'. Supported modes are 'merge' and 'replace'.`);
  }

  // 3. Validate confirmation
  if (mode === "replace") {
    if (typeof confirmation !== "string" || confirmation.trim() !== RESTORE_CONFIRMATION_PHRASE) {
      throw new Error(`Replace mode requires exact confirmation phrase: '${RESTORE_CONFIRMATION_PHRASE}'.`);
    }
  } else {
    // Merge mode confirmation
    if (confirmation !== true && confirmation !== "true") {
      throw new Error("Merge mode requires explicit confirmation.");
    }
  }

  // Initialize stats per collection
  const collectionsStats: Record<ManagedCollectionKey, CollectionRestoreStats> = {
    branches: { inserted: 0, updated: 0 },
    services: { inserted: 0, updated: 0 },
    beauticians: { inserted: 0, updated: 0 },
    gallery: { inserted: 0, updated: 0 },
    products: { inserted: 0, updated: 0 },
    vendors: { inserted: 0, updated: 0 },
    weddingServices: { inserted: 0, updated: 0 },
    weddingPackages: { inserted: 0, updated: 0 },
    settings: { inserted: 0, updated: 0 },
  };

  // Determine if MongoDB deployment supports replica set transactions
  const session = await mongoose.startSession();
  let supportsTransactions = true;

  try {
    // Attempt transaction
    await session.withTransaction(async () => {
      await executeRestoreOperations(payload, mode, collectionsStats, session);
    });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "";
    const isStandaloneError =
      message.includes("Transaction numbers are only allowed on a replica set member or mongos") ||
      message.includes("Transactions are not supported on standalone servers") ||
      message.includes("replica set");

    if (isStandaloneError) {
      supportsTransactions = false;
    } else {
      // Real transaction failure or abort
      throw err;
    }
  } finally {
    await session.endSession();
  }

  // If transactions are not supported on the current MongoDB server:
  if (!supportsTransactions) {
    if (mode === "replace") {
      // Destructive replace is strictly barred without atomic transaction support
      throw new Error(
        "MongoDB replica-set transactions are required for destructive replace restore, but this database instance is a standalone server. Aborting for safety."
      );
    }

    // For merge mode on local standalone, run non-transactionally
    await executeRestoreOperations(payload, mode, collectionsStats, null);
  }

  // 4. After successful restore, clear temporary AiInsightCache so stale insights are purged
  try {
    await AiInsightCache.deleteMany({});
  } catch (cacheErr) {
    console.warn("Failed to clear AiInsightCache after restore:", cacheErr);
  }

  return {
    success: true,
    mode,
    collections: collectionsStats,
    preserved: {
      users: true,
      analytics: true,
    },
    aiCacheCleared: true,
    message: mode === "replace"
      ? "Managed website content replaced successfully from backup."
      : "Website content merged successfully from backup.",
  };
}

/**
 * Executes the database operations in strict dependency order (parents before children).
 */
async function executeRestoreOperations(
  payload: BackupPayload,
  mode: RestoreMode,
  stats: Record<ManagedCollectionKey, CollectionRestoreStats>,
  session: mongoose.ClientSession | null
) {
  const sessionOpt = session ? { session } : {};

  if (mode === "replace") {
    // 1. In REPLACE mode: Clear ONLY the supported managed content collections
    // strictly NEVER touch User, AnalyticsEvent, or environment
    for (const collectionKey of RESTORE_DEPENDENCY_ORDER) {
      const Model = MODEL_MAP[collectionKey];
      await Model.deleteMany({}, sessionOpt);
    }

    // 2. Insert records preserving IDs in dependency order
    for (const collectionKey of RESTORE_DEPENDENCY_ORDER) {
      const items = payload.data[collectionKey] || [];
      const Model = MODEL_MAP[collectionKey];

      if (items.length > 0) {
        const sanitizedItems = items.map((item) => {
          const sanitized = sanitizeDocument(collectionKey, item);
          return {
            ...sanitized,
            _id: new mongoose.Types.ObjectId(String(sanitized._id)),
          };
        });

        await Model.insertMany(sanitizedItems, sessionOpt);
        stats[collectionKey].inserted = sanitizedItems.length;
        stats[collectionKey].restored = sanitizedItems.length;
      }
    }
  } else {
    // MERGE mode: preserve original _id, update if exists, insert if missing
    for (const collectionKey of RESTORE_DEPENDENCY_ORDER) {
      const items = payload.data[collectionKey] || [];
      const Model = MODEL_MAP[collectionKey];

      for (const item of items) {
        const sanitized = sanitizeDocument(collectionKey, item);
        const docId = new mongoose.Types.ObjectId(String(sanitized._id));
        const updateFields = { ...sanitized };
        delete updateFields._id;

        const existing = await Model.findById(docId, null, sessionOpt);

        if (existing) {
          await Model.updateOne({ _id: docId }, { $set: updateFields }, sessionOpt);
          stats[collectionKey].updated++;
        } else {
          await Model.create([{ ...updateFields, _id: docId }], sessionOpt);
          stats[collectionKey].inserted++;
        }
      }
    }
  }
}
