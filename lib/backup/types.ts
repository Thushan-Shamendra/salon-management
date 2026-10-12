import { ManagedCollectionKey } from "./constants";

export type BackupCounts = Record<ManagedCollectionKey, number>;

export type BackupData = {
  [K in ManagedCollectionKey]: Record<string, unknown>[];
};

export interface BackupPayload {
  app: string;
  backupVersion: number;
  createdAt: string;
  backupId: string;
  counts: BackupCounts;
  dataChecksum: string;
  data: BackupData;
}

export interface ValidationResult {
  valid: boolean;
  backup?: {
    app: string;
    backupVersion: number;
    createdAt: string;
    backupId: string;
  };
  counts?: BackupCounts;
  warnings: string[];
  errors?: string[];
}

export type RestoreMode = "merge" | "replace";

export interface RestoreRequest {
  backup: BackupPayload;
  mode: RestoreMode;
  confirmation: string | boolean;
}

export interface CollectionRestoreStats {
  inserted: number;
  updated: number;
  restored?: number;
}

export interface RestoreResult {
  success: boolean;
  mode: RestoreMode;
  collections: Record<ManagedCollectionKey, CollectionRestoreStats>;
  preserved: {
    users: boolean;
    analytics: boolean;
  };
  aiCacheCleared: boolean;
  message?: string;
}
