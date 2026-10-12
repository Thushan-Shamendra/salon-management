export const BACKUP_APP_NAME = "SALVORA";
export const BACKUP_VERSION = 1;

export const MAX_BACKUP_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export const RESTORE_CONFIRMATION_PHRASE = "RESTORE SALVORA BACKUP";

export const MANAGED_COLLECTION_KEYS = [
  "branches",
  "services",
  "beauticians",
  "gallery",
  "products",
  "vendors",
  "weddingServices",
  "weddingPackages",
  "settings",
] as const;

export type ManagedCollectionKey = (typeof MANAGED_COLLECTION_KEYS)[number];

export const RESTORE_DEPENDENCY_ORDER: ManagedCollectionKey[] = [
  "branches",
  "services",
  "beauticians",
  "gallery",
  "products",
  "vendors",
  "weddingServices",
  "weddingPackages",
  "settings",
];

export const COLLECTION_DISPLAY_NAMES: Record<ManagedCollectionKey, string> = {
  branches: "Branches",
  services: "Services",
  beauticians: "Beauticians",
  gallery: "Gallery",
  products: "Products",
  vendors: "Vendors",
  weddingServices: "Wedding Services",
  weddingPackages: "Wedding Packages",
  settings: "Website Settings",
};
