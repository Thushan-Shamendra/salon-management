import crypto from "crypto";
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

import { BACKUP_APP_NAME, BACKUP_VERSION, MANAGED_COLLECTION_KEYS } from "./constants";
import { BackupPayload, BackupData, BackupCounts } from "./types";
import { sanitizeDocument } from "./sanitize";
import { calculateDataChecksum } from "./checksum";

/**
 * Generates dynamic filename according to format: salvora-backup-YYYY-MM-DD-HHmm.json
 */
export function generateBackupFilename(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `salvora-backup-${year}-${month}-${day}-${hours}${minutes}.json`;
}

/**
 * Exports current SALVORA website managed content into a structured,
 * sanitized, checksummed JSON backup payload.
 */
export async function exportBackup(): Promise<BackupPayload> {
  await connectDB();

  // 1. Fetch all managed content collections concurrently
  const [
    branchesRaw,
    servicesRaw,
    beauticiansRaw,
    galleryRaw,
    productsRaw,
    vendorsRaw,
    weddingServicesRaw,
    weddingPackagesRaw,
    settingsRaw,
  ] = await Promise.all([
    Branch.find().sort({ displayOrder: 1, name: 1 }).lean(),
    Service.find().sort({ name: 1 }).lean(),
    Beautician.find().sort({ displayOrder: 1, name: 1 }).lean(),
    Gallery.find().sort({ displayOrder: 1, createdAt: -1 }).lean(),
    ProductBrand.find().sort({ displayOrder: 1, name: 1 }).lean(),
    Vendor.find().sort({ displayOrder: 1, name: 1 }).lean(),
    WeddingService.find().sort({ displayOrder: 1, name: 1 }).lean(),
    WeddingPackage.find().sort({ displayOrder: 1, name: 1 }).lean(),
    SalonSettings.find().lean(),
  ]);

  // 2. Sanitize and whitelist all records
  const data: BackupData = {
    branches: branchesRaw.map((b) => sanitizeDocument("branches", b)),
    services: servicesRaw.map((s) => sanitizeDocument("services", s)),
    beauticians: beauticiansRaw.map((b) => sanitizeDocument("beauticians", b)),
    gallery: galleryRaw.map((g) => sanitizeDocument("gallery", g)),
    products: productsRaw.map((p) => sanitizeDocument("products", p)),
    vendors: vendorsRaw.map((v) => sanitizeDocument("vendors", v)),
    weddingServices: weddingServicesRaw.map((w) => sanitizeDocument("weddingServices", w)),
    weddingPackages: weddingPackagesRaw.map((w) => sanitizeDocument("weddingPackages", w)),
    settings: settingsRaw.map((s) => sanitizeDocument("settings", s)),
  };

  // 3. Compile accurate counts
  const counts: BackupCounts = {
    branches: data.branches.length,
    services: data.services.length,
    beauticians: data.beauticians.length,
    gallery: data.gallery.length,
    products: data.products.length,
    vendors: data.vendors.length,
    weddingServices: data.weddingServices.length,
    weddingPackages: data.weddingPackages.length,
    settings: data.settings.length,
  };

  // Verify all managed collection keys are accounted for
  for (const key of MANAGED_COLLECTION_KEYS) {
    if (!data[key]) {
      data[key] = [];
      counts[key] = 0;
    }
  }

  // 4. Calculate integrity checksum over canonical normalized data
  const dataChecksum = calculateDataChecksum(data);

  return {
    app: BACKUP_APP_NAME,
    backupVersion: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    backupId: crypto.randomUUID(),
    counts,
    dataChecksum,
    data,
  };
}
