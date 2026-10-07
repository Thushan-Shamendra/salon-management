"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  SparklesIcon,
  CalendarIcon,
  ImageIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

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
  createdAt?: string;
}

interface GalleryClientProps {
  initialPhotos: GalleryPhotoItem[];
  salonName?: string;
  bookingUrl?: string;
}

export default function GalleryClient({
  initialPhotos,
  salonName = "Lumina Luxury Salon",
  bookingUrl = "",
}: GalleryClientProps) {
  const [photos] = useState<GalleryPhotoItem[]>(initialPhotos);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Extract distinct categories only from active photos that exist
  const categories = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return ["All", ...Array.from(set)];
  }, [photos]);

  // Filter photos based on selected category
  const filteredPhotos = useMemo(() => {
    if (selectedCategory === "All") {
      return photos;
    }
    return photos.filter(
      (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [photos, selectedCategory]);

  // Featured Photo Rule:
  // 1. Prefer isFeatured === true (lowest displayOrder / newest)
  // 2. Else first active gallery photo
  // 3. Else null
  const featuredPhoto = useMemo(() => {
    const featuredList = photos.filter((p) => p.isFeatured);
    if (featuredList.length > 0) {
      return (
        featuredList.sort((a, b) => a.displayOrder - b.displayOrder)[0] ||
        featuredList[0]
      );
    }
    return photos.length > 0 ? photos[0] : null;
  }, [photos]);

  // Lightbox Navigation Handlers
  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = "hidden";
  };

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
    document.body.style.overflow = "";
  }, []);

  const handlePrevImage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (lightboxIndex === null || filteredPhotos.length === 0) return;
      setLightboxIndex((prev) =>
        prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0
      );
    },
    [lightboxIndex, filteredPhotos.length]
  );

  const handleNextImage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (lightboxIndex === null || filteredPhotos.length === 0) return;
      setLightboxIndex((prev) =>
        prev !== null ? (prev + 1) % filteredPhotos.length : 0
      );
    },
    [lightboxIndex, filteredPhotos.length]
  );

  // Keyboard navigation for Lightbox (ESC to close, Arrow keys to navigate)
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseLightbox();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, handleCloseLightbox, handlePrevImage, handleNextImage]);

  // Cleanup overflow style on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const currentLightboxPhoto =
    lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <div className="w-full">
      {/* ============================================================== */}
      {/* SECTION 1 - HERO BANNER                                       */}
      {/* ============================================================== */}
      <section className="relative w-full h-[280px] sm:h-[320px] md:h-[350px] overflow-hidden bg-stone-900 flex items-center justify-center">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1800&q=80"
            alt="Salon beauty craftsmanship gallery hero banner"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/75" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-3">
          {/* Breadcrumb: Home / Gallery */}
          <nav
            aria-label="Breadcrumb"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C5A46D] mb-1"
          >
            <Link
              href="/"
              className="text-stone-300 hover:text-[#C5A46D] transition-colors"
            >
              Home
            </Link>
            <span className="text-stone-500">/</span>
            <span className="text-[#C5A46D] font-semibold">Gallery</span>
          </nav>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-sm">
            Gallery
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 max-w-lg mx-auto font-light leading-relaxed">
            Witness the artistry of our master stylists and the stunning
            transformations created with devotion.
          </p>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 2 - GALLERY INTRODUCTION                              */}
      {/* ============================================================== */}
      <section className="bg-[#FAF7F2] py-16 md:py-24 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: Featured Gallery Image */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative Frame */}
                <div className="overflow-hidden rounded-3xl border border-[#B7925A]/30 bg-white p-3.5 sm:p-4 shadow-xl shadow-stone-200/60 transition hover:shadow-2xl">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100 group">
                    {featuredPhoto ? (
                      <>
                        <Image
                          src={featuredPhoto.image}
                          alt={
                            featuredPhoto.altText ||
                            featuredPhoto.title ||
                            "Featured Salon Work"
                          }
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                          onClick={() => {
                            const idx = filteredPhotos.findIndex(
                              (p) => p._id === featuredPhoto._id
                            );
                            if (idx !== -1) {
                              handleOpenLightbox(idx);
                            } else {
                              handleOpenLightbox(0);
                            }
                          }}
                        />

                        {/* Featured Badge */}
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-[#1C1917]/85 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-[#C5A46D] border border-[#B7925A]/40 shadow-sm">
                          <SparklesIcon className="h-3 w-3 text-[#B7925A]" />
                          <span>Featured Work</span>
                        </div>

                        {/* Title Overlay at Bottom */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-10 text-white">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A46D]">
                            {featuredPhoto.category}
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-bold leading-tight">
                            {featuredPhoto.title}
                          </h3>
                        </div>
                      </>
                    ) : (
                      /* Elegant Placeholder if no photos */
                      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-stone-100">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/30 mb-3 shadow-xs">
                          <ImageIcon className="h-8 w-8 text-[#B7925A]" />
                        </div>
                        <p className="font-serif text-sm font-semibold text-stone-800">
                          {salonName} Gallery
                        </p>
                        <p className="mt-1 text-xs text-stone-500 max-w-xs">
                          Capturing the timeless moments and signature styles of our sanctuary.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Frame Detail */}
                  <div className="mt-3.5 flex items-center justify-between px-2 pt-2 border-t border-stone-200/70 text-xs">
                    <div className="flex items-center gap-2 text-stone-700">
                      <span className="flex h-2 w-2 rounded-full bg-[#B7925A]" />
                      <span className="font-medium">Handcrafted Hair & Beauty Rituals</span>
                    </div>
                    <span className="font-serif text-stone-500 italic">Excellence</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Intro Details */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Small Label */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-4 py-1.5 shadow-xs">
                <SparklesIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B7925A]">
                  {salonName.toUpperCase()} GALLERY
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#1C1917] leading-[1.2]">
                Our Work & <br />
                <span className="italic font-light text-[#B7925A]">
                  Beauty Gallery
                </span>
              </h2>

              {/* Description */}
              <p className="text-base sm:text-lg leading-relaxed text-[#78716C] max-w-xl mx-auto lg:mx-0">
                Explore a collection of our salon transformations, professional
                styling, beauty treatments, bridal looks, hair care, nail
                designs and memorable client experiences.
              </p>

              {/* Values / Accents */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0">
                <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-xs">
                  <p className="font-serif text-lg font-bold text-stone-900">
                    {photos.length}+
                  </p>
                  <p className="text-[11px] text-stone-500 uppercase tracking-wider mt-0.5">
                    Portfolio Looks
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-xs">
                  <p className="font-serif text-lg font-bold text-stone-900">
                    {categories.length > 1 ? categories.length - 1 : 1}
                  </p>
                  <p className="text-[11px] text-stone-500 uppercase tracking-wider mt-0.5">
                    Specialties
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-xs">
                  <p className="font-serif text-lg font-bold text-[#B7925A]">
                    100%
                  </p>
                  <p className="text-[11px] text-stone-500 uppercase tracking-wider mt-0.5">
                    Real Clients
                  </p>
                </div>
              </div>

              {/* Direct Anchor to Gallery Grid */}
              <div className="pt-2 flex justify-center lg:justify-start">
                <a
                  href="#gallery-grid"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold text-stone-800 hover:border-[#B7925A] hover:text-[#B7925A] transition shadow-xs"
                >
                  <span>View All Gallery Photos</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 3 & 4 - CATEGORIES & GALLERY GRID                     */}
      {/* ============================================================== */}
      <section id="gallery-grid" className="py-16 md:py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Section Header & Category Filters */}
          <div className="space-y-6 text-center">
            <div className="space-y-2 max-w-2xl mx-auto">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1C1917]">
                Curated Portfolio
              </h2>
              <p className="text-xs sm:text-sm text-[#78716C]">
                Filter by treatment or styling discipline to explore our latest works.
              </p>
            </div>

            {/* Filter Buttons */}
            {categories.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count =
                    cat === "All"
                      ? photos.length
                      : photos.filter(
                          (p) => p.category.toLowerCase() === cat.toLowerCase()
                        ).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] ${
                        isSelected
                          ? "bg-[#1C1917] text-white shadow-md border border-[#B7925A]/40"
                          : "bg-white text-stone-700 border border-stone-200/80 hover:border-[#B7925A] hover:text-[#B7925A]"
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isSelected
                            ? "bg-[#B7925A] text-stone-950"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gallery Grid */}
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo._id}
                  onClick={() => handleOpenLightbox(index)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-xl hover:border-[#B7925A]/50 transition-all duration-300"
                >
                  {/* Aspect Ratio 4:3 (~230-260px height) */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    <Image
                      src={photo.image}
                      alt={photo.altText || photo.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                    />

                    {/* Desktop Hover Overlay: Slightly darken + Show Title & Category */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                      <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#C5A46D] mb-1">
                        {photo.category}
                      </span>
                      <h4 className="font-serif text-base sm:text-lg font-bold leading-tight drop-shadow-xs">
                        {photo.title}
                      </h4>
                      {photo.description && (
                        <p className="mt-1 text-xs text-stone-300 line-clamp-2 font-light">
                          {photo.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#C5A46D]">
                        <span>Click to view photo</span>
                        <ArrowRightIcon className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Featured Star / Badge on Card if featured */}
                    {photo.isFeatured && (
                      <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-xs p-1.5 text-[#B7925A] shadow-xs border border-[#B7925A]/30">
                        <SparklesIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Minimal Bar (Visible on mobile/when not hovered) */}
                  <div className="p-3.5 flex items-center justify-between border-t border-stone-100 bg-white">
                    <div className="truncate">
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {photo.title}
                      </p>
                      <p className="text-[11px] text-stone-500 capitalize">
                        {photo.category}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#B7925A] shrink-0 ml-2">
                      View
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/30 mb-4">
                <ImageIcon className="h-7 w-7 text-[#B7925A]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {photos.length === 0
                  ? "Our gallery is being updated."
                  : "No photos found in this category."}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-500 leading-relaxed">
                {photos.length === 0
                  ? "Please check back soon to discover our latest transformations."
                  : "Try selecting another category or view all portfolio images."}
              </p>
              {photos.length > 0 && selectedCategory !== "All" && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-xs font-medium text-white hover:bg-stone-800 transition"
                  >
                    <span>View All Photos</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 5 - CALL TO ACTION (CTA)                              */}
      {/* ============================================================== */}
      <section className="bg-stone-900 text-stone-200 py-16 md:py-20 border-t border-[#B7925A]/25 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div
          className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-72 w-96 rounded-full bg-[#B7925A]/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/40 bg-stone-800/80 px-4 py-1.5">
            <SparklesIcon className="h-4 w-4 text-[#C5A46D]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A46D]">
              Bespoke Beauty Appointments
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Love What You See?
          </h2>

          <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto font-light leading-relaxed">
            Book your salon experience and let our professionals create a look
            made just for you.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#B7925A] px-8 py-3.5 text-sm font-semibold text-stone-950 transition-all hover:bg-[#C5A46D] hover:shadow-lg hover:shadow-[#B7925A]/25 active:scale-95"
              >
                <CalendarIcon className="h-4 w-4 text-stone-950" />
                <span>Book Appointment</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Online booking link not yet configured"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#B7925A]/60 px-8 py-3.5 text-sm font-semibold text-stone-950/60 cursor-not-allowed"
              >
                <CalendarIcon className="h-4 w-4 text-stone-950/50" />
                <span>Book Appointment</span>
              </button>
            )}

            <Link
              href="/services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-stone-700 bg-stone-800/70 px-7 py-3.5 text-sm font-medium text-stone-200 transition-all hover:border-[#B7925A] hover:text-[#C5A46D]"
            >
              <span>Explore Treatments & Prices</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 6 - IMAGE LIGHTBOX / MODAL                            */}
      {/* ============================================================== */}
      {lightboxIndex !== null && currentLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={currentLightboxPhoto.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-8 animate-fadeIn"
          onClick={handleCloseLightbox}
        >
          {/* Top Bar with Counter and Close Button */}
          <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-8 flex items-center justify-between text-white z-20 pointer-events-none">
            <span className="rounded-full bg-stone-900/80 px-3.5 py-1 text-xs font-medium text-stone-300 border border-stone-700/80 pointer-events-auto">
              Photo {lightboxIndex + 1} of {filteredPhotos.length}
            </span>

            <button
              type="button"
              onClick={handleCloseLightbox}
              aria-label="Close photo preview"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/90 text-stone-200 hover:text-white hover:bg-stone-800 transition pointer-events-auto border border-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B7925A]"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Previous Button */}
          {filteredPhotos.length > 1 && (
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous photo"
              className="absolute left-3 sm:left-6 z-20 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-stone-900/80 text-white hover:bg-[#B7925A] hover:text-stone-950 transition-all border border-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B7925A]"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}

          {/* Next Button */}
          {filteredPhotos.length > 1 && (
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next photo"
              className="absolute right-3 sm:right-6 z-20 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-stone-900/80 text-white hover:bg-[#B7925A] hover:text-stone-950 transition-all border border-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B7925A]"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          )}

          {/* Modal Content Box (Stop propagation so clicking inside doesn't close) */}
          <div
            className="relative flex flex-col items-center max-w-4xl max-h-[90vh] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Container */}
            <div className="relative max-h-[70vh] sm:max-h-[75vh] w-auto overflow-hidden rounded-xl bg-black/40 shadow-2xl border border-stone-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentLightboxPhoto.image}
                alt={
                  currentLightboxPhoto.altText ||
                  currentLightboxPhoto.title ||
                  "Salon work preview"
                }
                className="max-h-[70vh] sm:max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Photo Info Card Below */}
            <div className="mt-4 w-full rounded-xl bg-stone-900/90 backdrop-blur-md p-4 text-center sm:text-left border border-stone-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="rounded-full bg-[#B7925A]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#C5A46D] border border-[#B7925A]/30">
                    {currentLightboxPhoto.category}
                  </span>
                  {currentLightboxPhoto.isFeatured && (
                    <span className="text-[11px] text-amber-300 font-medium">
                      ★ Featured
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold">
                  {currentLightboxPhoto.title}
                </h3>
                {currentLightboxPhoto.description && (
                  <p className="text-xs sm:text-sm text-stone-300 font-light max-w-2xl">
                    {currentLightboxPhoto.description}
                  </p>
                )}
              </div>

              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  onClick={handleCloseLightbox}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#B7925A] px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-[#C5A46D] transition shrink-0"
                >
                  <span>Book This Look</span>
                  <CalendarIcon className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
