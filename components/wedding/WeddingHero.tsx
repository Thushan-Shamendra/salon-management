import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

interface WeddingHeroProps {
  bookingUrl?: string;
}

export default function WeddingHero({ bookingUrl = "" }: WeddingHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0C0A14] text-white py-16 sm:py-20 lg:py-24">
      {/* Background Bridal Styling Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/wedding-hero.jpg"
          alt="Invora Salon Bridal & Wedding Beauty Services"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right-top sm:object-center opacity-70 sm:opacity-85"
        />
        {/* Controlled gradient overlay for crisp text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A14] via-[#0C0A14]/90 to-[#0C0A14]/35" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl space-y-4 text-left">
          {/* Label / Pill with Signature Dot */}
          <div className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C4B5FD]">
              FOR YOUR MOST SPECIAL DAY
            </span>
          </div>

          {/* Heading with Brand Purple Gradient */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Wedding Beauty{" "}
            <span className="block bg-gradient-to-r from-[#C4B5FD] via-[#A78BFA] to-[#8B5CF6] bg-clip-text text-transparent">
              Services
            </span>
          </h1>

          {/* Short Description */}
          <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-normal max-w-xl">
            Bridal makeup, hair styling, nail care, facials, and complete
            wedding packages designed to make you look and feel your best for
            your special day.
          </p>

          {/* CTA Button */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-7 py-3 text-sm font-semibold text-white shadow-md shadow-purple-900/30 transition-all hover:bg-[#6D28D9] hover:gap-3 active:scale-[0.98]"
              >
                <span>Book Your Bridal Consultation</span>
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Online booking link not yet configured"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED]/50 px-7 py-3 text-sm font-semibold text-white/80 cursor-not-allowed"
              >
                <span>Book Your Bridal Consultation</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="pt-2 flex items-center gap-2 text-xs font-medium">
            <Link
              href="/"
              className="text-stone-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#C4B5FD] font-semibold">Wedding</span>
          </nav>
        </div>
      </div>
    </section>
  );
}
