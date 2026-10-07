"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { SearchIcon, ImageIcon, ArrowRightIcon } from "@/components/ui/icons";
import GalleryLightbox, { GalleryPhotoItem } from "@/components/gallery/GalleryLightbox";
import BookingCTA from "@/components/home/BookingCTA";

interface GalleryViewProps {
  photos: GalleryPhotoItem[];
  bookingUrl?: string;
}

export default function GalleryView({ photos, bookingUrl = "" }: GalleryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Extract real distinct categories from active MongoDB photos
  const categories = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return ["All", ...Array.from(set)];
  }, [photos]);

  // Filter photos by selected category
  const filteredPhotos = useMemo(() => {
    if (selectedCategory === "All") return photos;
    return photos.filter(
      (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [photos, selectedCategory]);

  // Open Lightbox
  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
  };

  const handlePrevImage = () => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0
    );
  };

  const handleNextImage = () => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % filteredPhotos.length : 0
    );
  };

  const currentPhoto =
    lightboxIndex !== null && filteredPhotos[lightboxIndex]
      ? filteredPhotos[lightboxIndex]
      : null;

  return (
    <>
      {/* ============================================================== */}
      {/* SECTION 3 - GALLERY INTRODUCTION                                */}
      {/* ============================================================== */}
      <section className="bg-white pt-16 pb-6 sm:pt-20 sm:pb-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Label */}
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              OUR WORK
            </span>
          </div>

          {/* Heading */}
          <h2 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            A Glimpse Into Our Salon
          </h2>

          {/* Description */}
          <p className="mt-3 text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Discover moments from our salon — hair transformations, treatments, styling
            and more. Each photo reflects the care, skill and attention behind every client experience.
          </p>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 4 - CATEGORY FILTERS                                   */}
      {/* ============================================================== */}
      {categories.length > 1 && (
        <section className="bg-white pb-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "bg-[#7C3AED] text-white shadow-md shadow-purple-600/30 ring-2 ring-[#7C3AED]/20"
                        : "bg-white text-stone-600 border border-stone-200 hover:border-purple-300 hover:text-[#7C3AED]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SECTION 5 - MAIN GALLERY GRID (ADAPTIVE REAL-DATA LAYOUT)       */}
      {/* ============================================================== */}
      <section className="bg-white pb-20 sm:pb-24 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Empty State */}
          {filteredPhotos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] mb-4">
                <ImageIcon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                {photos.length === 0
                  ? "Our gallery is being updated"
                  : `No photos found in "${selectedCategory}"`}
              </h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                {photos.length === 0
                  ? "Please check back soon to explore our latest transformations and salon moments."
                  : "Try selecting a different category to view more salon works."}
              </p>
              {photos.length > 0 && selectedCategory !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6D28D9]"
                >
                  <span>View All Photos</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            /* Adaptive Real-Data Layouts */
            <>
              {/* 1 Photo: Centered Large Feature */}
              {filteredPhotos.length === 1 && (
                <div className="max-w-2xl mx-auto">
                  {renderGalleryCard(filteredPhotos[0], 0, "aspect-[16/10] sm:aspect-[16/9]")}
                </div>
              )}

              {/* 2 Photos: Balanced 2-Column Side-by-Side (Matches Current DB State) */}
              {filteredPhotos.length === 2 && (
                <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                  {filteredPhotos.map((photo, idx) =>
                    renderGalleryCard(photo, idx, "aspect-[4/3]")
                  )}
                </div>
              )}

              {/* 3 Photos: Balanced 3-Column Grid */}
              {filteredPhotos.length === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredPhotos.map((photo, idx) =>
                    renderGalleryCard(photo, idx, "aspect-[4/3]")
                  )}
                </div>
              )}

              {/* 4 Photos: Balanced 2x2 Grid */}
              {filteredPhotos.length === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                  {filteredPhotos.map((photo, idx) =>
                    renderGalleryCard(photo, idx, "aspect-[4/3]")
                  )}
                </div>
              )}

              {/* 5+ Photos: Editorial Mosaic Style (Matches Mockup) */}
              {filteredPhotos.length >= 5 && (() => {
                // Find featured photo or default to first
                const featuredIdx = filteredPhotos.findIndex((p) => p.isFeatured);
                const primaryIdx = featuredIdx !== -1 ? featuredIdx : 0;
                const primary = filteredPhotos[primaryIdx];
                const rest = filteredPhotos.filter((_, i) => i !== primaryIdx);
                const rightFour = rest.slice(0, 4);
                const extraPhotos = rest.slice(4);

                return (
                  <div className="space-y-6">
                    {/* Top Mosaic Block: 1 Large Left + 4 Right */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Left: Large Featured Photo */}
                      <div className="lg:col-span-5">
                        {renderGalleryCard(
                          primary,
                          primaryIdx,
                          "aspect-[4/5] min-h-[380px] h-full"
                        )}
                      </div>

                      {/* Right: 4 Supporting Photos in 2x2 */}
                      <div className="lg:col-span-7 grid grid-cols-2 gap-6">
                        {rightFour.map((photo) => {
                          const originalIdx = filteredPhotos.findIndex(
                            (p) => p._id === photo._id
                          );
                          return renderGalleryCard(photo, originalIdx, "aspect-[4/3]");
                        })}
                      </div>
                    </div>

                    {/* Additional Photos Below in 3-Column Grid */}
                    {extraPhotos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                        {extraPhotos.map((photo) => {
                          const originalIdx = filteredPhotos.findIndex(
                            (p) => p._id === photo._id
                          );
                          return renderGalleryCard(photo, originalIdx, "aspect-[4/3]");
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 6 - IMAGE LIGHTBOX                                     */}
      {/* ============================================================== */}
      <GalleryLightbox
        photo={currentPhoto}
        currentIndex={lightboxIndex ?? 0}
        totalCount={filteredPhotos.length}
        onClose={handleCloseLightbox}
        onPrev={handlePrevImage}
        onNext={handleNextImage}
      />

      {/* ============================================================== */}
      {/* SECTION 7 - BOOKING CTA                                        */}
      {/* ============================================================== */}
      <BookingCTA
        tag="✦ READY FOR A CHANGE"
        heading="Let's Create Your Next Look"
        description="Book your appointment and experience professional care at Invora."
        bookingUrl={bookingUrl}
      />
    </>
  );

  // Helper to render an interactive gallery card
  function renderGalleryCard(
    photo: GalleryPhotoItem,
    index: number,
    aspectClass: string
  ) {
    return (
      <div
        key={photo._id}
        onClick={() => handleOpenLightbox(index)}
        className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-stone-100 shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${aspectClass}`}
      >
        {/* Gallery Image */}
        <Image
          src={photo.image}
          alt={photo.altText || photo.title || "Invora Salon Gallery Transformation"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

        {/* Card Content Bar */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 flex items-end justify-between text-white z-10">
          <div className="max-w-[80%] pr-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C4B5FD]">
              {photo.category}
            </p>
            <h3 className="text-sm sm:text-base font-bold tracking-tight mt-0.5 truncate text-white">
              {photo.title}
            </h3>
          </div>

          {/* Search / Zoom View Icon Badge */}
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-xs transition-all duration-300 group-hover:bg-[#7C3AED] group-hover:scale-110">
            <SearchIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }
}
