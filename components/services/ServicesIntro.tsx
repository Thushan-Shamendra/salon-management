"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import React from "react";

export default function ServicesIntro() {
  const custom = useSectionCustomization("intro");

  return (
    <section className="bg-white pt-16 pb-8 sm:pt-20 sm:pb-10" data-customization-section="intro">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Label */}
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
            WHAT WE OFFER
          </>}</span>
        </div>

        {/* Heading */}
        <h2 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
          Find the Right Treatment for You
        </>}</h2>

        {/* Description */}
        <p className="mt-3 text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
          From hair care and styling to beauty treatments, our services are designed to bring out
          the best version of you with professional care and modern techniques.
        </>}</p>
      </div>
    </section>
  );
}
