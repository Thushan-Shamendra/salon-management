"use client";

import React, { useState } from "react";
import {
  CldUploadWidget,
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetError,
} from "next-cloudinary";
import { CloudinaryFolder } from "@/lib/cloudinary-constants";
import {
  UploadCloudIcon,
  CameraIcon,
  TrashIcon,
  EditIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface ImageUploadProps {
  value?: string;
  publicId?: string;
  onChange: (result: UploadResult) => void;
  onRemove?: () => void;
  folder: CloudinaryFolder;
  label?: string;
  description?: string;
  circular?: boolean;
  disabled?: boolean;
  className?: string;
  // Multiple mode support
  multiple?: boolean;
  maxFiles?: number;
  onMultipleChange?: (results: UploadResult[]) => void;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  folder,
  label = "Upload Image",
  description = "Supports JPG, JPEG, PNG, WEBP up to 5MB",
  circular = false,
  disabled = false,
  className = "",
  multiple = false,
  maxFiles = 5,
  onMultipleChange,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const currentUrl = value || "";
  const hasImage = Boolean(
    currentUrl && currentUrl.trim().length > 0 && failedUrl !== currentUrl
  );

  const handleSuccess = (results: CloudinaryUploadWidgetResults) => {
    setIsUploading(false);
    setErrorMessage(null);

    if (
      results.info &&
      typeof results.info === "object" &&
      "secure_url" in results.info
    ) {
      const info = results.info as { secure_url: string; public_id: string };
      const uploadedResult: UploadResult = {
        url: info.secure_url,
        publicId: info.public_id,
      };

      setFailedUrl(null);
      onChange(uploadedResult);

      if (multiple && onMultipleChange) {
        onMultipleChange([uploadedResult]);
      }
    }
  };

  const handleError = (error: CloudinaryUploadWidgetError) => {
    setIsUploading(false);
    console.error("Cloudinary Upload Error:", error);
    if (typeof error === "string") {
      setErrorMessage(error);
    } else if (error && typeof error === "object") {
      const msg = error.statusText || error.status;
      if (msg && msg.toLowerCase().includes("signature")) {
        setErrorMessage(
          "Cloudinary signature mismatch: Please verify that NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local belong to the same active Cloudinary account."
        );
      } else if (msg) {
        setErrorMessage(`Upload failed: ${msg}`);
      } else {
        setErrorMessage(
          "Failed to upload image. Please check your Cloudinary credentials and network connection."
        );
      }
    } else {
      setErrorMessage("Failed to upload image. Please verify file format and size.");
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFailedUrl(null);
    setErrorMessage(null);
    if (onRemove) {
      onRemove();
    }
  };

  const isPlaceholderConfig =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME === "demo" ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY === "123456789012345";

  return (
    <div className={`w-full space-y-2.5 ${className}`}>
      {/* Label and Helper Text */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700">
            {label}
          </label>
          {hasImage && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <CheckCircleIcon className="h-3 w-3" />
              Image Uploaded
            </span>
          )}
        </div>
      )}

      {/* Cloudinary Credentials Placeholder Alert */}
      {isPlaceholderConfig && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-800">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Cloudinary Credentials Required</p>
            <p className="mt-0.5 text-amber-800">
              Your <code>.env.local</code> currently has placeholder values (<code>demo</code>). To upload images, please update <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code>, <code>NEXT_PUBLIC_CLOUDINARY_API_KEY</code>, and <code>CLOUDINARY_API_SECRET</code> with your credentials from the Cloudinary console.
            </p>
          </div>
        </div>
      )}

      {/* Cloudinary Upload Widget Provider */}
      <CldUploadWidget
        signatureEndpoint="/api/cloudinary/sign"
        options={{
          folder,
          maxFiles: multiple ? maxFiles : 1,
          multiple,
          maxFileSize: 5242880, // 5MB
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          sources: ["local", "url", "camera"],
          resourceType: "image",
          showAdvancedOptions: false,
          theme: "minimal",
        }}
        onSuccess={handleSuccess}
        onError={handleError}
        onOpen={() => {
          setIsUploading(true);
          setErrorMessage(null);
        }}
        onClose={() => setIsUploading(false)}
      >
        {({ open, isLoading: widgetLoading }) => {
          const isButtonDisabled = disabled || isUploading || widgetLoading;

          /* ============================================================== */
          /* CIRCULAR MODE (For Customer Profile / Stylist Avatars)        */
          /* ============================================================== */
          if (circular) {
            return (
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Circular Preview Container */}
                <div className="relative group h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-full border-2 border-[#B7925A]/50 bg-[#FAF7F2] p-0.5 shadow-sm overflow-hidden">
                  {hasImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentUrl}
                        alt="Profile preview"
                        onError={() => setFailedUrl(currentUrl)}
                        className="h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => open()}
                        disabled={isButtonDisabled}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                        title="Change Photo"
                      >
                        <CameraIcon className="h-5 w-5 mb-0.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          Change
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-stone-100 text-stone-400">
                      <CameraIcon className="h-8 w-8 text-stone-400" />
                    </div>
                  )}
                </div>

                {/* Circular Mode Controls */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => open()}
                      disabled={isButtonDisabled}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-xs transition hover:bg-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 disabled:opacity-50"
                    >
                      <CameraIcon className="h-4 w-4" />
                      <span>{hasImage ? "Replace Photo" : "Upload Profile Photo"}</span>
                    </button>

                    {hasImage && (
                      <button
                        type="button"
                        onClick={handleRemove}
                        disabled={disabled}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none disabled:opacity-50"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#78716C]">{description}</p>
                </div>
              </div>
            );
          }

          /* ============================================================== */
          /* RECTANGULAR MODE (For Services / Catalog / Community)          */
          /* ============================================================== */
          return (
            <div className="space-y-3">
              {hasImage ? (
                /* Preview State with Replace & Delete buttons */
                <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-[#FAF7F2] p-3 shadow-xs transition hover:border-[#7C3AED]/60">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative h-32 w-full sm:w-44 sm:h-28 shrink-0 overflow-hidden rounded-xl border border-stone-200/80 bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentUrl}
                        alt="Uploaded preview"
                        onError={() => setFailedUrl(currentUrl)}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Ready
                        </span>
                        <span className="text-[11px] text-stone-500 truncate max-w-[200px]">
                          {currentUrl.split("/").pop()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => open()}
                          disabled={isButtonDisabled}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:border-[#7C3AED] hover:text-[#7C3AED] disabled:opacity-50 transition"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                          <span>Replace Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemove}
                          disabled={disabled}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-xs hover:bg-red-50 disabled:opacity-50 transition"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Upload Dropzone Button */
                <button
                  type="button"
                  onClick={() => open()}
                  disabled={isButtonDisabled}
                  className="group relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-[#FAF7F2]/50 p-6 sm:p-8 text-center transition hover:border-[#7C3AED] hover:bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-stone-200 transition group-hover:scale-110 group-hover:border-[#7C3AED]/50">
                    <UploadCloudIcon className="h-6 w-6 text-stone-500 group-hover:text-[#7C3AED] transition" />
                  </div>

                  <p className="mt-3 text-xs sm:text-sm font-semibold text-stone-800 group-hover:text-[#7C3AED] transition">
                    {widgetLoading
                      ? "Loading Uploader..."
                      : isUploading
                      ? "Uploading Image..."
                      : "Click to upload image"}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-500">{description}</p>
                </button>
              )}
            </div>
          );
        }}
      </CldUploadWidget>

      {/* Error Notification */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
