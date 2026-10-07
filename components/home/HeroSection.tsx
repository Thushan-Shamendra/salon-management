import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarIcon,
  SparklesIcon,
  ScissorsIcon,
  StarIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

interface HeroSectionProps {
  bookingUrl?: string;
}

export default function HeroSection({ bookingUrl = "" }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] py-16 md:py-24 lg:py-28">
      {/* Subtle Background Glow Accents */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#B7925A]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#EFE8DE] blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Text & Call to Actions */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Small Subtitle Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-[#FAF7F2] px-4 py-1.5 shadow-xs">
              <SparklesIcon className="h-4 w-4 text-[#B7925A]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A]">
                Beauty • Style • Confidence
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#1C1917] leading-[1.15]">
              Look Beautiful. <br />
              <span className="italic font-light text-[#B7925A]">
                Feel Confident.
              </span>
            </h1>

            {/* Short Introduction */}
            <p className="mx-auto lg:mx-0 max-w-xl text-base sm:text-lg leading-relaxed text-[#78716C]">
              Experience professional beauty and hair care services designed to
              help you look and feel your best. From trendsetting hair designs to
              luxurious rejuvenation, discover your ultimate sanctuary.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {/* Primary: Book Appointment */}
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1C1917] px-8 py-3.5 text-sm font-medium text-white shadow-md shadow-stone-900/10 transition-all hover:bg-stone-800 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] border border-[#B7925A]/40"
                >
                  <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
                  <span>Book Appointment</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Online booking link not yet configured"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1C1917]/60 px-8 py-3.5 text-sm font-medium text-white/60 cursor-not-allowed border border-[#B7925A]/20"
                >
                  <CalendarIcon className="h-4 w-4 text-[#C5A46D]/50" />
                  <span>Book Appointment</span>
                </button>
              )}

              {/* Secondary: Explore Services */}
              <Link
                href="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/80 px-8 py-3.5 text-sm font-medium text-[#1C1917] shadow-xs backdrop-blur-xs transition-all hover:border-[#B7925A] hover:bg-white hover:text-[#B7925A] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A]"
              >
                <span>Explore Services</span>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="font-serif text-2xl font-bold text-[#1C1917]">4.9★</p>
                <p className="text-xs text-[#78716C] mt-0.5">350+ Verified Reviews</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-[#1C1917]">100%</p>
                <p className="text-xs text-[#78716C] mt-0.5">Cruelty-Free Products</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-[#1C1917]">8+ Yrs</p>
                <p className="text-xs text-[#78716C] mt-0.5">Master Artistry</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Salon Image Area */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Outer decorative ring */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#B7925A]/20 via-transparent to-[#B7925A]/10 blur-sm" />

              {/* Main Image Showcase Card */}
              <div className="relative overflow-hidden rounded-3xl border border-[#B7925A]/30 bg-white shadow-xl shadow-stone-900/5">
                {/* 
                  Structured Salon Hero Image:
                  Currently loads high-quality vector illustration /images/hero-salon.svg.
                  Can easily be replaced with a real salon photography file (e.g. /images/hero-salon.jpg)
                */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                  <Image
                    src="/images/hero-salon.svg"
                    alt="Lumina Salon luxury styling studio interior with warm lighting and comfortable styling chairs"
                    width={800}
                    height={600}
                    priority
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Inset Badge on Image */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <ScissorsIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
                      <span>Artisanal Salon Experience</span>
                    </div>
                    <span className="text-stone-300 hidden sm:inline-block">Colombo 07</span>
                  </div>
                </div>
              </div>

              {/* Floating Testimonial Pill */}
              <div className="absolute -bottom-6 -left-4 sm:left-4 rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-lg shadow-stone-900/10 flex items-center gap-3 backdrop-blur-sm max-w-xs animate-fadeIn">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/30 shrink-0">
                  <StarIcon className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-1 text-[#B7925A]">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-3 w-3" />
                    ))}
                  </div>
                  <p className="font-semibold text-[#1C1917] mt-0.5">Top-Rated Experience</p>
                  <p className="text-[11px] text-[#78716C]">&quot;Best hair transformation in town&quot;</p>
                </div>
              </div>

              {/* Floating Certified Badge */}
              <div className="absolute -top-4 -right-2 sm:right-4 rounded-full border border-[#B7925A]/30 bg-white/95 px-3.5 py-1.5 shadow-md flex items-center gap-2 text-xs font-medium text-stone-800">
                <ShieldCheckIcon className="h-4 w-4 text-[#B7925A]" />
                <span>Certified Master Stylists</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
