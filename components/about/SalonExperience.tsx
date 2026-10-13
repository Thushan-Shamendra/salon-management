"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function SalonExperience() {
  const custom = useSectionCustomization("salon-experience");

  return (
    <section id="experience" className="bg-white py-16 sm:py-20 lg:py-24 border-b border-stone-100" data-customization-section="salon-experience">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Salon Experience & Treatment Products Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-stone-100 shadow-md group">
              <Image
                src="/images/salon-experience.jpg"
                alt="Salvora Salon modern treatment products and serene space"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5" />
            </div>
          </div>

          {/* Right Column: Experience Description */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Small Label */}
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#03BF62]" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#03BF62]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
                  OUR SALON
                </>}</span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
                A Modern Space <br className="hidden sm:inline" />
                Designed for You
              </>}</h2>
            </div>

            {/* Description */}
            <p className="text-base text-stone-600 leading-relaxed font-normal" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
              Our salon is designed to give you a comfortable and relaxing experience.
              With modern equipment, a clean environment, and a friendly team, Salvora
              is the perfect place to take time for yourself and feel your best.
            </>}</p>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#03BF62] px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-[#029e51] hover:gap-3 active:scale-[0.98]" data-customization-role="primaryButton"
              >
                <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>Visit Our Salon</>}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
