"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "@/components/ui/icons";

export interface CropTarget {
  x: number;
  y: number;
  zoom: number;
}

export interface CropSettings {
  home: CropTarget;
  gallery: CropTarget;
  featured: CropTarget;
}

export interface GalleryPhotoItem {
  _id: string;
  title: string;
  description?: string;
  category: string;
  image: string;
  imagePublicId?: string;
  altText?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  cropSettings?: CropSettings;
  cropPosition?: CropTarget;
}

interface GalleryLightboxProps {
  photo: GalleryPhotoItem | null;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function GalleryLightbox({
  photo,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
}: GalleryLightboxProps) {
  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "ArrowRight") {
        onNext();
      }
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (!photo) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [photo, handleKeyDown]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gallery image preview"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md p-4 sm:p-6 transition-all duration-300"
      onClick={onClose}
    >
      {/* Top Bar: Counter & Close Button */}
      <div
        className="flex items-center justify-between z-10 w-full max-w-7xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-medium text-stone-200 backdrop-blur-md border border-white/10">
          <span>
            Photo {currentIndex + 1} of {totalCount}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close lightbox"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-105"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Main Image Area with Prev/Next Controls */}
      <div
        className="relative flex-1 flex items-center justify-center my-4 w-full max-w-7xl mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {totalCount > 1 && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-4 z-20 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-[#7C3AED] hover:border-[#7C3AED] transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
        )}

        {/* Large Centered Image */}
        <div className="relative max-h-[70vh] sm:max-h-[76vh] w-full h-full flex items-center justify-center">
          <Image
            src={photo.image}
            alt={photo.altText || photo.title || "Invora Salon Gallery Transformation"}
            fill
            sizes="(max-width: 1024px) 100vw, 85vw"
            className="object-contain"
            priority
          />
        </div>

        {/* Next Button */}
        {totalCount > 1 && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next photo"
            className="absolute right-2 sm:right-4 z-20 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-[#7C3AED] hover:border-[#7C3AED] transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Bar: Title, Category & Description */}
      <div
        className="w-full max-w-3xl mx-auto text-center z-10 space-y-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#C4B5FD] bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-3 py-0.5 rounded-full">
          {photo.category}
        </span>
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {photo.title}
        </h2>
        {photo.description && (
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto line-clamp-2">
            {photo.description}
          </p>
        )}
      </div>
    </div>
  );
}
