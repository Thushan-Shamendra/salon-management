import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, StarIcon, SparklesIcon } from "@/components/ui/icons";

interface HeroSectionProps {
  bookingUrl?: string;
  serviceCount?: number;
  googleRating?: number | null;
}

export default function HeroSection({
  bookingUrl = "",
  serviceCount = 0,
  googleRating = null,
}: HeroSectionProps) {
  const hasRealStats = (serviceCount && serviceCount > 0) || (googleRating && googleRating > 0);

  return (
    <section className="relative overflow-hidden bg-[#0C0A14] text-white py-16 sm:py-20 lg:py-24">
      {/* Background Salon Image - Bright & Clearly Visible */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-salon.jpg"
          alt="Invora Salon professional styling and beauty care"
          fill
          priority
          className="object-cover object-right-top opacity-90 sm:opacity-95 lg:opacity-100"
        />
        {/* Controlled Gradient Overlay: strong text contrast on left, bright salon image on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A14] via-[#0C0A14]/75 lg:via-[#0C0A14]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A14]/90 via-transparent to-transparent/20" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl space-y-6">
          {/* Label: Professional Beauty & Wellness */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-950/50 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#C4B5FD] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            <span>Professional Beauty & Wellness</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            Beauty<br />
            Redefined<br />
            <span className="text-[#8B5CF6]">For You</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-200 leading-relaxed max-w-xl font-normal drop-shadow-sm">
            Experience professional care, modern treatments and a relaxing salon
            environment at Invora.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-[#6D28D9] hover:shadow-purple-600/50 hover:gap-3 active:scale-[0.98]"
              >
                <span>Book Appointment</span>
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Online booking link not yet configured"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED]/60 px-8 py-3.5 text-sm font-semibold text-white/80 cursor-not-allowed shadow-none"
              >
                <span>Book Appointment</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}

            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50 active:scale-[0.98]"
            >
              <span>View Services</span>
            </Link>
          </div>

          {/* Real Trust Information Only (No Fake Data) */}
          <div className="pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-6">
            {hasRealStats ? (
              <div className="flex items-center gap-8 sm:gap-10">
                {serviceCount > 0 && (
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {serviceCount}+
                    </p>
                    <p className="text-xs text-stone-300 mt-0.5">Beauty Services</p>
                  </div>
                )}

                {googleRating && googleRating > 0 && (
                  <>
                    <div className="h-8 w-px bg-white/15" />
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-1">
                        <span>{googleRating.toFixed(1)}</span>
                        <StarIcon className="h-5 w-5 text-amber-400 fill-amber-400" />
                      </p>
                      <p className="text-xs text-stone-300 mt-0.5">Google Rating</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-stone-300">
                <SparklesIcon className="h-4 w-4 text-[#C4B5FD]" />
                <span>Personalized Consultations • Modern Salon Care</span>
              </div>
            )}

            {/* Subtle Scroll Down Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-stone-400 text-xs tracking-wider uppercase opacity-85">
              <div className="h-7 w-4 rounded-full border border-stone-400/60 p-0.5 flex justify-center">
                <div className="h-2 w-1 rounded-full bg-purple-400 animate-bounce" />
              </div>
              <span>Scroll Down</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
