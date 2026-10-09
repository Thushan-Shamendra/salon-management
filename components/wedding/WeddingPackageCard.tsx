"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRightIcon, ClockIcon, CheckIcon } from "@/components/ui/icons";

export interface WeddingPackageCardData {
  _id: string;
  name: string;
  description: string;
  image?: string;
  includedItems: string[];
  price: number;
  durationText: string;
  isFeatured?: boolean;
}

interface WeddingPackageCardProps {
  pkg: WeddingPackageCardData;
  bookingUrl?: string;
  fallbackIndex?: number;
}

const FALLBACK_WEDDING_PACKAGE_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
];

export default function WeddingPackageCard({
  pkg,
  bookingUrl = "",
  fallbackIndex = 0,
}: WeddingPackageCardProps) {
  const [imageError, setImageError] = useState(false);

  const imageSrc =
    imageError || !pkg.image
      ? FALLBACK_WEDDING_PACKAGE_IMAGES[
          fallbackIndex % FALLBACK_WEDDING_PACKAGE_IMAGES.length
        ] || "/images/placeholder-service.svg"
      : pkg.image;

  return (
    <div
      className={`group flex flex-col justify-between rounded-2xl bg-white p-5 sm:p-6 transition-all duration-300 ${
        pkg.isFeatured
          ? "border-2 border-[#7C3AED] shadow-xl shadow-purple-500/10 ring-1 ring-[#7C3AED]/20 -translate-y-1"
          : "border border-stone-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      <div>
        {/* Package Image with Most Popular Badge */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-100">
          <Image
            src={imageSrc}
            alt={pkg.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />

          {pkg.isFeatured && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center rounded-full bg-[#7C3AED] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md shadow-purple-900/30">
                MOST POPULAR
              </span>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="mt-5">
          <h3
            className={`text-xl font-bold tracking-tight truncate ${
              pkg.isFeatured ? "text-[#7C3AED]" : "text-stone-900 group-hover:text-[#7C3AED]"
            } transition-colors`}
          >
            {pkg.name}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-stone-500 line-clamp-2 leading-relaxed min-h-[40px]">
            {pkg.description}
          </p>
        </div>

        {/* Included Services List */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
            {pkg.includedItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] mt-0.5">
                  <CheckIcon className="h-3 w-3 stroke-[3]" />
                </span>
                <span className="font-medium text-stone-700 leading-tight">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer: Price, Duration & CTA */}
      <div className="mt-6 pt-4 border-t border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-stone-900">
              LKR {pkg.price ? pkg.price.toLocaleString() : "Contact"}
            </span>
          </div>

          {pkg.durationText && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500 font-medium">
              <ClockIcon className="h-4 w-4 text-stone-400" />
              <span>{pkg.durationText}</span>
            </div>
          )}
        </div>

        {bookingUrl ? (
          <a
            href={bookingUrl}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
              pkg.isFeatured
                ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-md shadow-purple-600/30"
                : "bg-stone-900 text-white hover:bg-[#7C3AED]"
            }`}
          >
            <span>Choose Package</span>
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Online booking link not yet configured"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-300 py-3 text-xs sm:text-sm font-semibold text-stone-500 cursor-not-allowed"
          >
            <span>Choose Package</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
