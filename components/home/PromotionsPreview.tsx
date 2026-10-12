"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import PromotionCard, { PublicPromotion } from "@/components/promotions/PromotionCard";

interface PromotionsPreviewProps {
  promotions: PublicPromotion[];
  whatsappNumber?: string;
  bookingUrl?: string;
  salonName?: string;
}

export default function PromotionsPreview({
  promotions,
  whatsappNumber = "",
  bookingUrl = "",
  salonName = "Salvora",
}: PromotionsPreviewProps) {
  const custom = useSectionCustomization("promotions-preview");

  // If zero promotions in database, hide cleanly
  if (!promotions || promotions.length === 0) {
    return null;
  }

  // Ensure maximum of 3 promotions displayed on Home
  const displayedPromotions = promotions.slice(0, 3);

  return (
    <section className="bg-white py-14 sm:py-20 border-b border-stone-200/60" data-customization-section="promotions-preview">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#7C3AED]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
                SPECIAL OFFERS
              </>}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
              Latest Promotions
            </>}</h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
              Explore current beauty offers, product deals and wedding specials from SALVORA.
            </>}</p>
          </div>

          <Link
            href="/promotions"
            className="self-start md:self-auto shrink-0 group inline-flex items-center gap-2.5 rounded-full border border-purple-200 bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]" data-customization-role="primaryButton"
          >
            <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>View All Promotions</>}</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Responsive Grid: Desktop 3, Tablet 2, Mobile 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {displayedPromotions.map((promotion) => (
            <PromotionCard
              key={promotion._id}
              promotion={promotion}
              whatsappNumber={whatsappNumber}
              bookingUrl={bookingUrl}
              salonName={salonName}
            />
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/promotions"
            className="group inline-flex items-center gap-2.5 rounded-full border border-purple-200 bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]" data-customization-role="primaryButton"
          >
            <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>View All Promotions</>}</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
