import React from "react";
import WeddingPackageCard, {
  WeddingPackageCardData,
} from "./WeddingPackageCard";

interface WeddingPackagesSectionProps {
  packages: WeddingPackageCardData[];
  bookingUrl?: string;
}

export default function WeddingPackagesSection({
  packages,
  bookingUrl = "",
}: WeddingPackagesSectionProps) {
  // If zero packages created by admin, hide cleanly as per requirements
  if (!packages || packages.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-[#FAF7FE] border-b border-purple-100/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              SPECIAL OFFERS
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Wedding Packages
          </h2>

          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            Our carefully curated wedding packages offer a complete beauty
            experience for you and your loved ones.
          </p>
        </div>

        {/* Responsive Grid: Desktop 3, Tablet 2, Mobile 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {packages.map((pkg, index) => (
            <WeddingPackageCard
              key={pkg._id}
              pkg={pkg}
              bookingUrl={bookingUrl}
              fallbackIndex={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
