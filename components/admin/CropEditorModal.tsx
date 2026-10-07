"use client";

import React, { useState } from "react";
import ImageCropAdjuster, {
  CropSettings,
} from "@/components/admin/ImageCropAdjuster";
import { normalizeCropSettings } from "@/lib/crop";
import { XIcon, CropIcon } from "@/components/ui/icons";

interface CropEditorModalProps {
  isOpen: boolean;
  photo: {
    _id: string;
    title: string;
    category?: string;
    image: string;
    isFeatured?: boolean;
    cropSettings?: CropSettings;
    cropPosition?: { x: number; y: number; zoom: number };
  } | null;
  onClose: () => void;
  onSave: (photoId: string, cropSettings: CropSettings) => Promise<boolean>;
  showNotification?: (type: "success" | "error", message: string) => void;
}

export default function CropEditorModal({
  isOpen,
  photo,
  onClose,
  onSave,
  showNotification,
}: CropEditorModalProps) {
  if (!isOpen || !photo) return null;

  return (
    <CropModalDialog
      key={photo._id}
      photo={photo}
      onClose={onClose}
      onSave={onSave}
      showNotification={showNotification}
    />
  );
}

function CropModalDialog({
  photo,
  onClose,
  onSave,
  showNotification,
}: {
  photo: NonNullable<CropEditorModalProps["photo"]>;
  onClose: () => void;
  onSave: (photoId: string, cropSettings: CropSettings) => Promise<boolean>;
  showNotification?: (type: "success" | "error", message: string) => void;
}) {
  const [currentSettings, setCurrentSettings] = useState<CropSettings>(() =>
    normalizeCropSettings(photo)
  );
  const [activeTab, setActiveTab] = useState<"home" | "gallery" | "featured">(() =>
    photo.isFeatured ? "featured" : "gallery"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleResetCurrentTab = () => {
    setCurrentSettings((prev) => ({
      ...prev,
      [activeTab]: { x: 50, y: 50, zoom: 1 },
    }));
  };

  const handleSaveCrop = async () => {
    try {
      setIsSaving(true);
      const success = await onSave(photo._id, currentSettings);
      if (success) {
        onClose();
      }
    } catch {
      showNotification?.("error", "Failed to save image crop settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={() => !isSaving && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl flex flex-col my-auto max-h-[95vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#7C3AED]">
              <CropIcon className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="crop-modal-title"
                className="text-base font-bold text-stone-900 tracking-tight"
              >
                Adjust Image Crop
              </h2>
              <p className="text-xs text-stone-500 truncate max-w-xs sm:max-w-md">
                {photo.title} •{" "}
                <span className="text-purple-700 font-semibold">
                  {photo.category || "Gallery"}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer disabled:opacity-50"
            aria-label="Close crop modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Interactive Crop Adjuster */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <ImageCropAdjuster
            imageUrl={photo.image}
            cropSettings={currentSettings}
            onChange={setCurrentSettings}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            category={photo.category}
            title={photo.title}
          />
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-stone-100 bg-stone-50/70 shrink-0 gap-3">
          <button
            type="button"
            onClick={handleResetCurrentTab}
            disabled={isSaving}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer disabled:opacity-50"
            title="Reset active preview tab to center 1.0x"
          >
            Reset
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#6D28D9] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{isSaving ? "Saving Crop..." : "Save Crop"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
