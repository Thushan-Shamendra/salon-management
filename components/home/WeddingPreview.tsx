"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, SparklesIcon } from "@/components/ui/icons";

export default function WeddingPreview() {
  const custom = useSectionCustomization("wedding-beauty");

  return (
    <section className="relative overflow-hidden bg-[#F9FAF8] py-14 sm:py-16 border-y border-stone-200/80" data-customization-section="wedding-beauty">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Bridal Image */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-emerald-50 shadow-md group">
              <Image
                src="/images/wedding-hero.jpg"
                alt="Bridal Beauty at Salvora"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                  Bridal Elegance
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Promotional Content */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#03BF62]/15 text-[#03BF62]">
                <SparklesIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#03BF62]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
                SPECIAL OCCASIONS
              </>}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
              Wedding Beauty
            </>}</h2>

            <p className="text-base sm:text-lg font-medium text-stone-800" data-customization-role="subheading">{custom.has("subheading") ? custom.text("subheading", "") : <>
              Your special day deserves a look made just for you.
            </>}</p>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
              Explore bridal makeup, hair styling, nail care, and complete
              wedding packages curated to make you look and feel your most radiant.
            </>}</p>

            <div className="pt-2">
              <Link
                href="/wedding"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#03BF62] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#03BF62]/25 transition-all hover:bg-[#029e51] hover:shadow-[#03BF62]/40 hover:gap-3 active:scale-[0.98]" data-customization-role="primaryButton"
              >
                <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>Explore Wedding Services</>}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
