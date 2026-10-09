import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, SparklesIcon, HeartIcon } from "@/components/ui/icons";

export default function AboutPreview() {
  return (
    <section className="relative overflow-hidden bg-[#FAF8F5] py-16 sm:py-20 lg:py-24">
      {/* Subtle Decorative Botanical Accent */}
      <div
        className="pointer-events-none absolute right-0 top-8 w-60 h-80 opacity-25 text-purple-200 hidden xl:block"
        aria-hidden="true"
      >
        <svg viewBox="0 0 200 300" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M180,20 C140,80 120,160 150,260" />
          <path d="M140,70 C100,50 80,80 135,100" />
          <path d="M125,120 C70,110 60,150 125,160" />
          <path d="M135,180 C80,190 90,230 145,220" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Salon Interior Photo */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[16/11] w-full overflow-hidden rounded-3xl bg-stone-200 shadow-md shadow-stone-900/5 group">
              <Image
                src="/images/about-salon.jpg"
                alt="Salon modern interior and styling stations"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Right Column: Balanced About Content */}
          <div className="lg:col-span-6 space-y-5">
            {/* Tag: About Invora */}
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                ✦ About Invora
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
              Where Beauty<br />
              Meets Confidence
            </h2>

            {/* Introduction Paragraph */}
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
              At Invora, we believe beauty is more than a look — it&apos;s a feeling.
              Our professional team is dedicated to bringing out your natural beauty
              with personalized care and modern techniques.
            </p>

            {/* Feature Highlights for perfect vertical balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED]">
                  <SparklesIcon className="h-3.5 w-3.5" />
                </div>
                <span>Individualized Care</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED]">
                  <HeartIcon className="h-3.5 w-3.5" />
                </div>
                <span>Relaxing Sanctuary</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-all hover:bg-[#6D28D9] hover:shadow-purple-500/35 hover:gap-3 active:scale-[0.98]"
              >
                <span>Discover Our Story</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
