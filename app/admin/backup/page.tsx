"use client";

import React, { useState, useRef } from "react";
import {
  DatabaseIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  UploadCloudIcon,
  CheckIcon,
} from "@/components/ui/icons";
import {
  MAX_BACKUP_SIZE_BYTES,
  RESTORE_CONFIRMATION_PHRASE,
  COLLECTION_DISPLAY_NAMES,
  MANAGED_COLLECTION_KEYS,
} from "@/lib/backup/constants";
import {
  ValidationResult,
  RestoreMode,
  RestoreResult,
  BackupPayload,
} from "@/lib/backup/types";
import { useSectionCustomization } from "@/components/customization/CustomizationProvider";

export default function AdminBackupPage() {
  const customization = useSectionCustomization("page");
  // Export state
  const [downloading, setDownloading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Restore state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupPayload | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Restore options
  const [restoreMode, setRestoreMode] = useState<RestoreMode>("merge");
  const [mergeConfirmed, setMergeConfirmed] = useState(false);
  const [replaceConfirmationText, setReplaceConfirmationText] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 1. EXPORT HANDLER
  // -------------------------------------------------------------
  const handleDownloadBackup = async () => {
    try {
      setDownloading(true);
      setExportError(null);

      const res = await fetch("/api/admin/backup/export");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to download backup");
      }

      // Extract filename from header or use fallback
      const disposition = res.headers.get("content-disposition");
      let filename = "salvora-backup.json";
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      console.error("Backup export error:", err);
      setExportError((err as Error)?.message || "Failed to download backup");
    } finally {
      setDownloading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. FILE SELECTION & CLIENT SIZE VALIDATION
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError(null);
    setValidationResult(null);
    setParsedBackup(null);
    setRestoreResult(null);
    setRestoreError(null);
    setMergeConfirmed(false);
    setReplaceConfirmationText("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.endsWith(".json")) {
      setValidationError("Please select a valid .json file.");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_BACKUP_SIZE_BYTES) {
      setValidationError("This backup file is too large (maximum allowed size is 4 MB).");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // -------------------------------------------------------------
  // 3. VALIDATION HANDLER
  // -------------------------------------------------------------
  const handleValidateFile = async () => {
    if (!selectedFile) return;

    try {
      setValidating(true);
      setValidationError(null);
      setValidationResult(null);
      setRestoreResult(null);
      setRestoreError(null);

      const fileText = await selectedFile.text();
      let jsonPayload: unknown;
      try {
        jsonPayload = JSON.parse(fileText);
      } catch {
        throw new Error("File content is not valid JSON.");
      }

      const res = await fetch("/api/admin/backup/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: fileText,
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        const errorMessages = data.errors?.join(". ") || data.message || "Backup validation failed.";
        setValidationError(errorMessages);
        setValidationResult(data);
      } else {
        setValidationResult(data);
        setParsedBackup(jsonPayload as BackupPayload);
      }
    } catch (err: unknown) {
      console.error("Backup validation error:", err);
      setValidationError((err as Error)?.message || "Failed to validate backup file.");
    } finally {
      setValidating(false);
    }
  };

  // -------------------------------------------------------------
  // 4. RESTORE HANDLER
  // -------------------------------------------------------------
  const handleExecuteRestore = async () => {
    if (!parsedBackup || !validationResult?.valid) return;

    try {
      setRestoring(true);
      setRestoreError(null);
      setRestoreResult(null);

      const confirmation = restoreMode === "replace" ? replaceConfirmationText : mergeConfirmed;

      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup: parsedBackup,
          mode: restoreMode,
          confirmation,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to execute restore.");
      }

      setRestoreResult(data);
    } catch (err: unknown) {
      console.error("Backup restore error:", err);
      setRestoreError((err as Error)?.message || "Failed to execute restore.");
    } finally {
      setRestoring(false);
    }
  };

  const isRestoreButtonDisabled =
    restoring ||
    !validationResult?.valid ||
    (restoreMode === "merge" && !mergeConfirmed) ||
    (restoreMode === "replace" && replaceConfirmationText !== RESTORE_CONFIRMATION_PHRASE);

  return (
    <div className="space-y-8 animate-fadeIn pb-16 max-w-5xl">
      {/* ========================================================== */}
      {/* 1. HEADER                                                  */}
      {/* ========================================================== */}
      <div className="border-b border-stone-200/80 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs">
            <DatabaseIcon className="h-5 w-5" />
          </div>
          <h1 data-customization-role="heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            {customization.text("heading", "Backup & Restore")}
          </h1>
        </div>
        <p data-customization-role="description" data-customization-admin-body className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
          {customization.text("description", "Protect SALVORA website content by downloading backups and safely restoring previous data.")}
        </p>
      </div>

      {/* ========================================================== */}
      {/* 2. SECTION 1: CREATE WEBSITE BACKUP                        */}
      {/* ========================================================== */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <h2 data-customization-role="sectionHeading" className="text-lg font-bold text-stone-900">Create Website Backup</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Download a copy of SALVORA website content and configuration.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={downloading}
            data-customization-role="primaryButton"
            data-customization-admin-primary="true"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#6D28D9] transition-all disabled:opacity-60 cursor-pointer shrink-0"
          >
            <UploadCloudIcon className={`h-4 w-4 rotate-180 ${downloading ? "animate-bounce" : ""}`} />
            <span>{downloading ? "Creating Backup..." : customization.text("primaryButtonText", "Download Backup")}</span>
          </button>
        </div>

        {exportError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Content Details: What's included / excluded */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs">
            <p className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              Included in Backup:
            </p>
            <ul className="space-y-1 text-emerald-800 font-medium list-disc list-inside">
              <li>Branches & Opening Hours</li>
              <li>Services & Bridal Packages</li>
              <li>Beauticians & Branch Assignments</li>
              <li>Gallery Images & Crop Settings</li>
              <li>Product Brands & Associations</li>
              <li>Wedding Vendors & Directory</li>
              <li>Website Settings & Google Review Config</li>
            </ul>
          </div>

          <div className="rounded-xl border border-stone-200/90 bg-stone-50 p-4 text-xs">
            <p className="font-bold text-stone-800 mb-2 flex items-center gap-1.5">
              <ShieldCheckIcon className="h-4 w-4 text-stone-600" />
              Strictly Excluded for Security:
            </p>
            <ul className="space-y-1 text-stone-600 list-disc list-inside">
              <li>Admin passwords & accounts (never exported)</li>
              <li>First-party analytics & event history (preserved intact)</li>
              <li>Temporary AI insight caches</li>
              <li>Environment secrets (API keys, SMTP, MongoDB URI)</li>
              <li>Binary image files (stored safely in Cloudinary)</li>
            </ul>
          </div>
        </div>

        {/* Cloudinary Warning */}
        <div className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50/60 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p>
            <strong>Image Storage Notice:</strong> Backup files preserve image URLs and Cloudinary asset references. They do not contain copies of the actual binary image files.
          </p>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. SECTION 2: RESTORE WEBSITE BACKUP                        */}
      {/* ========================================================== */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
        <div className="border-b border-stone-100 pb-4">
          <h2 data-customization-role="sectionHeading" className="text-lg font-bold text-stone-900">Restore Website Backup</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Select a verified SALVORA backup JSON file to inspect and restore website content.
          </p>
        </div>

        {/* Step 1: File Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            1. Select Backup File (.json)
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="text-xs text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
            />
            {selectedFile && (
              <button
                type="button"
                onClick={handleValidateFile}
                disabled={validating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-all disabled:opacity-60 cursor-pointer"
              >
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                <span>{validating ? "Validating..." : "Validate Backup"}</span>
              </button>
            )}
          </div>

          {selectedFile && (
            <p className="text-[11px] text-stone-500">
              Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}

          {validationError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Validation Error:</p>
                <p className="mt-0.5 leading-relaxed">{validationError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Restore Preview (Rendered on Successful Validation) */}
        {validationResult?.valid && validationResult.backup && validationResult.counts && (
          <div className="space-y-5 rounded-xl border border-purple-100 bg-purple-50/20 p-5 animate-fadeIn">
            <div className="flex items-center gap-2 pb-3 border-b border-purple-100">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-stone-900">
                2. Backup Verified &amp; Ready for Review
              </h3>
            </div>

            {/* Metadata pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-white p-3 border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">Created At</span>
                <span className="font-semibold text-stone-800 mt-0.5 block">
                  {new Date(validationResult.backup.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Colombo" })}
                </span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">Version</span>
                <span className="font-semibold text-stone-800 mt-0.5 block">
                  Version {validationResult.backup.backupVersion} ({validationResult.backup.app})
                </span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">Backup ID</span>
                <span className="font-mono text-[11px] text-stone-600 mt-0.5 block truncate" title={validationResult.backup.backupId}>
                  {validationResult.backup.backupId}
                </span>
              </div>
            </div>

            {/* Content Counts Table */}
            <div>
              <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Content Counts in this Backup:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {MANAGED_COLLECTION_KEYS.map((key) => (
                  <div
                    key={key}
                    className="rounded-xl bg-white p-2.5 border border-stone-200/80 text-center shadow-2xs"
                  >
                    <span className="text-[11px] text-stone-500 font-medium block truncate">
                      {COLLECTION_DISPLAY_NAMES[key]}
                    </span>
                    <span className="text-base font-extrabold text-[#7C3AED] mt-0.5 block">
                      {validationResult.counts?.[key] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings if any */}
            {validationResult.warnings && validationResult.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircleIcon className="h-3.5 w-3.5 text-amber-600" />
                  Backup Warnings:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {validationResult.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step 3: Choose Restore Mode */}
            <div className="space-y-3 pt-3 border-t border-purple-100">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                3. Choose Restore Mode
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mode 1: Merge */}
                <div
                  onClick={() => setRestoreMode("merge")}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                    restoreMode === "merge"
                      ? "border-[#7C3AED] bg-purple-50/50 shadow-xs ring-1 ring-[#7C3AED]"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      Merge Backup
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-extrabold">
                        Recommended
                      </span>
                    </span>
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === "merge"}
                      onChange={() => setRestoreMode("merge")}
                      className="accent-[#7C3AED]"
                    />
                  </div>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    Restore records from the backup while keeping website records that are not included in the backup. Updates matching IDs and inserts missing ones.
                  </p>
                </div>

                {/* Mode 2: Replace */}
                <div
                  onClick={() => setRestoreMode("replace")}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                    restoreMode === "replace"
                      ? "border-red-500 bg-red-50/40 shadow-xs ring-1 ring-red-500"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                      Replace Managed Content
                      <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-extrabold">
                        Destructive
                      </span>
                    </span>
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === "replace"}
                      onChange={() => setRestoreMode("replace")}
                      className="accent-red-600"
                    />
                  </div>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    Replace supported website content with the contents of this backup. Existing records in supported collections will be cleared and replaced with backup data.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Explicit Confirmation */}
            <div className="space-y-3 pt-3 border-t border-purple-100">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                4. Confirmation
              </label>

              {restoreMode === "merge" ? (
                <div className="rounded-xl bg-white p-3.5 border border-stone-200">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-700">
                    <input
                      type="checkbox"
                      checked={mergeConfirmed}
                      onChange={(e) => setMergeConfirmed(e.target.checked)}
                      className="mt-0.5 accent-[#7C3AED] h-4 w-4 rounded"
                    />
                    <span className="font-medium">
                      I understand this will update existing records with matching IDs and insert missing ones. Unrelated current website content will remain intact.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="rounded-xl bg-red-50/70 p-4 border border-red-200 space-y-2.5">
                  <p className="text-xs text-red-900 font-semibold leading-relaxed">
                    ⚠️ This will replace current SALVORA website content in the supported collections. Admin accounts, analytics, and environment secrets will not be changed.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-red-800 mb-1">
                      Type <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-red-300 font-extrabold">{RESTORE_CONFIRMATION_PHRASE}</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={replaceConfirmationText}
                      onChange={(e) => setReplaceConfirmationText(e.target.value)}
                      placeholder={RESTORE_CONFIRMATION_PHRASE}
                      className="w-full sm:max-w-md rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Analytics preservation guarantee note */}
              <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                First-party website analytics, admin accounts, and passwords will not be modified or deleted.
              </p>

              {/* Step 5: Execute Restore Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={isRestoreButtonDisabled}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    restoreMode === "replace"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#7C3AED] hover:bg-[#6D28D9]"
                  }`}
                >
                  <DatabaseIcon className="h-4 w-4" />
                  <span>
                    {restoring
                      ? "Restoring Content..."
                      : restoreMode === "replace"
                      ? "Replace Managed Content"
                      : "Restore (Merge) Website Content"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restore Error Display */}
        {restoreError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Restore Failed:</p>
              <p className="mt-0.5 leading-relaxed">{restoreError}</p>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* 4. RESTORE SUCCESS RESULT REPORT                           */}
        {/* ========================================================== */}
        {restoreResult?.success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 sm:p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-950">
                  Restore Completed Successfully
                </h3>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-extrabold uppercase">
                Mode: {restoreResult.mode}
              </span>
            </div>

            <p className="text-xs text-emerald-900 leading-relaxed">
              {restoreResult.message}
            </p>

            {/* Stats per collection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2">
              {MANAGED_COLLECTION_KEYS.map((key) => {
                const stat = restoreResult.collections[key];
                if (!stat) return null;
                return (
                  <div
                    key={key}
                    className="rounded-xl bg-white p-2.5 border border-emerald-200 text-xs shadow-2xs"
                  >
                    <p className="font-bold text-stone-800 truncate">
                      {COLLECTION_DISPLAY_NAMES[key]}
                    </p>
                    <div className="mt-1 space-y-0.5 text-[11px] text-stone-600">
                      {restoreResult.mode === "replace" ? (
                        <p>Restored: <strong className="text-emerald-700">{stat.inserted || stat.restored || 0}</strong></p>
                      ) : (
                        <>
                          <p>Inserted: <strong className="text-emerald-700">{stat.inserted}</strong></p>
                          <p>Updated: <strong className="text-blue-700">{stat.updated}</strong></p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* System Preservations */}
            <div className="pt-3 border-t border-emerald-200 text-xs text-emerald-900 flex flex-wrap gap-4 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                Admin Accounts Preserved
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                Historical Analytics Preserved
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                AI Insight Cache Cleared (Fresh Analysis Ready)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
