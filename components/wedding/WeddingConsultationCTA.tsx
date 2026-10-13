"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import React from "react";
import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";

interface WeddingConsultationCTAProps {
  bookingUrl?: string;
}

export default function WeddingConsultationCTA({
  bookingUrl = "",
}: WeddingConsultationCTAProps) {
  const custom = useSectionCustomization("consultation-cta");

  return (
    <section className="relative overflow-hidden bg-[#0C0A14] text-white py-20 sm:py-24 lg:py-28" data-customization-section="consultation-cta">
      {/* Background Banner with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={custom.image("/images/wedding-consultation-cta.png")}
          alt="Wedding Consultation"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-70 sm:opacity-85" data-customization-role="backgroundImage" unoptimized={Boolean(custom.style.backgroundImage?.url)}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A14]/95 via-[#0C0A14]/75 to-[#0C0A14]/35" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl space-y-5 text-left">
          {/* Label / Pill with Signature Dot */}
          <div className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#03BF62]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#03BF62]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
              LET&apos;S PLAN YOUR PERFECT LOOK
            </>}</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
            Book Your Wedding Beauty Consultation
          </>}</h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-stone-200 leading-relaxed font-normal max-w-xl" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
            Schedule a personalized consultation with our bridal experts and let
            us bring your dream look to life.
          </>}</p>

          {/* Button */}
          <div className="pt-3">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                onClick={() => {
                  trackEvent({
                    eventType: "BOOKING_CLICK",
                    page: "/wedding",
                    metadata: {
                      source: "wedding-consultation",
                    },
                  });
                }}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#03BF62] px-9 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-600/40 transition-all hover:bg-[#029e51] hover:shadow-emerald-600/60 hover:gap-3 active:scale-[0.98]" data-customization-role="primaryButton"
              >
                <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>Book Consultation</>}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Online booking link not yet configured"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#03BF62]/60 px-9 py-4 text-sm font-semibold text-white/80 cursor-not-allowed shadow-none" data-customization-role="primaryButton"
              >
                <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>Book Consultation</>}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
