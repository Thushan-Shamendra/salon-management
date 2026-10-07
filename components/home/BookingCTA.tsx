import React from "react";
import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/icons";

interface BookingCTAProps {
  bookingUrl?: string;
  tag?: string;
  heading?: string;
  description?: string;
}

export default function BookingCTA({
  bookingUrl = "",
  tag = "✦ Book Your Visit",
  heading = "Ready for Your Next Look?",
  description = "Let our professional team bring out the best version of you.",
}: BookingCTAProps) {
  return (
    <section className="relative overflow-hidden bg-[#0C0A14] text-white py-20 sm:py-24 lg:py-28">
      {/* Background Salon Image - Enhanced Visibility */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/cta-salon.jpg"
          alt="Invora Salon appointment styling"
          fill
          className="object-cover object-center opacity-80 sm:opacity-90"
        />
        {/* Balanced overlay: deep protective tint on text side, transparent on image side */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A14]/95 via-[#0C0A14]/75 to-[#0C0A14]/35" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl space-y-5 text-left">
          {/* Tag */}
          <div className="inline-flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C4B5FD]">
              {tag}
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {heading}
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-stone-200 leading-relaxed font-normal max-w-xl">
            {description}
          </p>

          {/* Action Button */}
          <div className="pt-3">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-9 py-4 text-sm font-semibold text-white shadow-xl shadow-purple-600/40 transition-all hover:bg-[#6D28D9] hover:shadow-purple-600/60 hover:gap-3 active:scale-[0.98]"
              >
                <span>Book Appointment</span>
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Online booking link not yet configured"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED]/60 px-9 py-4 text-sm font-semibold text-white/80 cursor-not-allowed shadow-none"
              >
                <span>Book Appointment</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
