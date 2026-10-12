"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, ClockIcon, CheckIcon } from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";

export interface HomeWeddingPackageData {
  _id: string;
  name: string;
  description: string;
  image?: string;
  includedItems: string[];
  price: number;
  durationText?: string;
  isFeatured?: boolean;
}

interface WeddingPackagesPreviewProps {
  packages: HomeWeddingPackageData[];
}

function HomeWeddingPackageCard({ pkg }: { pkg: HomeWeddingPackageData }) {
  const [imageError, setImageError] = useState(false);

  const imageSrc =
    imageError || !pkg.image
      ? "/images/placeholder-service.svg"
      : pkg.image;

  const displayedItems = (pkg.includedItems || []).slice(0, 3);
  const remainingCount = (pkg.includedItems || []).length - 3;

  const handleCardClick = () => {
    trackEvent({
      eventType: "WEDDING_VIEW",
      entityType: "wedding-package",
      entityId: pkg._id,
      metadata: {
        source: "home-wedding-package-card",
        label: pkg.name,
      },
    });
  };

  return (
    <div
      className={`group flex flex-col justify-between rounded-2xl bg-white p-5 sm:p-6 transition-all duration-300 ${
        pkg.isFeatured
          ? "border-2 border-[#7C3AED] shadow-xl shadow-purple-500/10 ring-1 ring-[#7C3AED]/20 -translate-y-1"
          : "border border-stone-200/90 shadow-xs hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      <div>
        {/* Package Image with Featured Badge */}
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
                FEATURED
              </span>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="mt-5">
          <Link
            href="/wedding"
            onClick={handleCardClick}
            className="block focus:outline-hidden"
          >
            <h3
              className={`text-xl font-bold tracking-tight truncate ${
                pkg.isFeatured ? "text-[#7C3AED]" : "text-stone-900 group-hover:text-[#7C3AED]"
              } transition-colors`}
            >
              {pkg.name}
            </h3>
          </Link>
          <p className="mt-2 text-xs sm:text-sm text-stone-500 line-clamp-2 leading-relaxed min-h-[40px]">
            {pkg.description}
          </p>
        </div>

        {/* Included Items Preview (Max 3 + remaining count) */}
        {displayedItems.length > 0 && (
          <div className="mt-5 pt-4 border-t border-stone-100">
            <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
              {displayedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] mt-0.5">
                    <CheckIcon className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span className="font-medium text-stone-700 leading-tight">
                    {item}
                  </span>
                </li>
              ))}
              {remainingCount > 0 && (
                <li className="pt-1 text-xs font-semibold text-[#7C3AED] flex items-center gap-1.5">
                  <span>+{remainingCount} more</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Footer: Price, Duration & CTA Button */}
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

        <Link
          href="/wedding"
          onClick={handleCardClick}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
            pkg.isFeatured
              ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-md shadow-purple-600/30"
              : "bg-stone-900 text-white hover:bg-[#7C3AED]"
          }`}
        >
          <span>View Package</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function WeddingPackagesPreview({
  packages,
}: WeddingPackagesPreviewProps) {
  const custom = useSectionCustomization("wedding-packages");

  // If zero packages exist in MongoDB, hide the entire section cleanly
  if (!packages || packages.length === 0) {
    return null;
  }

  // Ensure maximum of 3 packages displayed on Home
  const displayedPackages = packages.slice(0, 3);

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-stone-200/60" data-customization-section="wedding-packages">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#7C3AED]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
                WEDDING PACKAGES
              </>}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
              Find Your Perfect Bridal Package
            </>}</h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
              Explore selected SALVORA wedding packages designed for your special day.
            </>}</p>
          </div>

          <Link
            href="/wedding"
            onClick={() => {
              trackEvent({
                eventType: "WEDDING_VIEW",
                metadata: {
                  source: "home-wedding-packages-view-all",
                },
              });
            }}
            className="self-start md:self-auto shrink-0 group inline-flex items-center gap-2.5 rounded-full border border-purple-200 bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]" data-customization-role="primaryButton"
          >
            <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>View All Wedding Packages</>}</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Responsive Grid: Desktop 3, Tablet 2, Mobile 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {displayedPackages.map((pkg) => (
            <HomeWeddingPackageCard key={pkg._id} pkg={pkg} />
          ))}
        </div>

        {/* View All Wedding Packages Link */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            href="/wedding"
            onClick={() => {
              trackEvent({
                eventType: "WEDDING_VIEW",
                metadata: {
                  source: "home-wedding-packages-view-all",
                },
              });
            }}
            className="group inline-flex items-center gap-2.5 rounded-full border border-purple-200 bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]" data-customization-role="primaryButton"
          >
            <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>View All Wedding Packages</>}</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
