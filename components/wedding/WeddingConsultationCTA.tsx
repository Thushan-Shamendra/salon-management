import React from "react";
import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/icons";

interface WeddingConsultationCTAProps {
  bookingUrl?: string;
}

export default function WeddingConsultationCTA({
  bookingUrl = "",
}: WeddingConsultationCTAProps) {
  return (
    <section className="relative overflow-hidden bg-[#0C0A14] text-white py-20 sm:py-24 lg:py-28">
      {/* Background Banner with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/wedding-consultation-cta.png"
          alt="Wedding Consultation"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-70 sm:opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A14]/95 via-[#0C0A14]/75 to-[#0C0A14]/35" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl space-y-5 text-left">
          {/* Label / Pill with Signature Dot */}
          <div className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C4B5FD]">
              LET&apos;S PLAN YOUR PERFECT LOOK
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Book Your Wedding Beauty Consultation
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-stone-200 leading-relaxed font-normal max-w-xl">
            Schedule a personalized consultation with our bridal experts and let
            us bring your dream look to life.
          </p>

          {/* Button */}
          <div className="pt-3">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-9 py-4 text-sm font-semibold text-white shadow-xl shadow-purple-600/40 transition-all hover:bg-[#6D28D9] hover:shadow-purple-600/60 hover:gap-3 active:scale-[0.98]"
              >
                <span>Book Consultation</span>
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Online booking link not yet configured"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED]/60 px-9 py-4 text-sm font-semibold text-white/80 cursor-not-allowed shadow-none"
              >
                <span>Book Consultation</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
