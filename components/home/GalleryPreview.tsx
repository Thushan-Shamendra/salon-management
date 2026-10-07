"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/ui/icons";

interface GalleryItem {
  _id: string;
  title: string;
  category?: string;
  image: string;
  altText?: string;
}

export default function GalleryPreview() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && Array.isArray(data.gallery) && data.gallery.length > 0) {
          // Use real active gallery photos ONLY from MongoDB
          setItems(data.gallery.slice(0, 5));
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-t border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              ✦ Our Gallery
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
              Our Latest Looks
            </h2>
          </div>

          <Link
            href="/gallery"
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-6 py-2.5 text-xs font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
          >
            <span>View Gallery</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="aspect-[4/3] rounded-3xl bg-stone-200" />
            <div className="aspect-[4/3] rounded-3xl bg-stone-200" />
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto">
            <p className="text-sm font-medium text-stone-800">
              Gallery is currently being updated.
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Visit our full gallery page to see our portfolio.
            </p>
            <Link
              href="/gallery"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white"
            >
              Explore Gallery
            </Link>
          </div>
        )}

        {/* Adaptive Real Gallery Layout */}
        {!loading && items.length > 0 && (
          <>
            {/* 1 Photo: Centered Feature */}
            {items.length === 1 && (
              <div className="max-w-2xl mx-auto">
                <div className="relative group overflow-hidden rounded-3xl bg-stone-100 shadow-md aspect-[16/10]">
                  <Image
                    src={items[0].image}
                    alt={items[0].title || "Invora Salon look"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#C4B5FD]">
                        {items[0].category || "Salon Portfolio"}
                      </p>
                      <h3 className="text-xl font-bold tracking-tight mt-0.5">
                        {items[0].title}
                      </h3>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white">
                      <ExternalLinkIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2 Photos: Balanced 2-Column Side-by-Side */}
            {items.length === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="relative group overflow-hidden rounded-3xl bg-stone-100 shadow-sm aspect-[4/3] transition-all hover:shadow-lg"
                  >
                    <Image
                      src={item.image}
                      alt={item.title || "Invora Salon look"}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[#C4B5FD]">
                          {item.category || "Salon Portfolio"}
                        </p>
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight mt-0.5">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-transform group-hover:scale-110 group-hover:bg-[#7C3AED]">
                        <ExternalLinkIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3 or 4 Photos: Balanced Multi-Column */}
            {(items.length === 3 || items.length === 4) && (
              <div
                className={`grid grid-cols-1 gap-6 ${
                  items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"
                }`}
              >
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="relative group overflow-hidden rounded-2xl bg-stone-100 shadow-sm aspect-[4/3] transition-all hover:shadow-lg"
                  >
                    <Image
                      src={item.image}
                      alt={item.title || "Invora Salon look"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#C4B5FD]">
                        {item.category || "Style"}
                      </p>
                      <h3 className="text-sm font-bold truncate">{item.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5+ Photos: Full Mosaic with 1 Large Feature + 4 Supporting */}
            {items.length >= 5 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 1 Large Feature Card on Left */}
                <div className="lg:col-span-5 relative group overflow-hidden rounded-3xl bg-stone-100 shadow-sm aspect-[4/5] min-h-[380px]">
                  <Image
                    src={items[0].image}
                    alt={items[0].title || "Invora Salon style"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#C4B5FD]">
                        {items[0].category || "Featured Style"}
                      </p>
                      <h3 className="text-xl font-bold tracking-tight mt-0.5">
                        {items[0].title}
                      </h3>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-transform group-hover:scale-110 group-hover:bg-[#7C3AED]">
                      <ExternalLinkIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* 4 Supporting Photos on Right */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-6">
                  {items.slice(1, 5).map((item) => (
                    <div
                      key={item._id}
                      className="relative group overflow-hidden rounded-2xl bg-stone-100 shadow-2xs aspect-[4/3] transition-all hover:shadow-md"
                    >
                      <Image
                        src={item.image}
                        alt={item.title || "Invora Salon look"}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs font-semibold truncate">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
