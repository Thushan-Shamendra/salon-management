import React from "react";
import Link from "next/link";
import {
  CalendarIcon,
  SparklesIcon,
  CheckIcon,
} from "@/components/ui/icons";

interface BookingCTAProps {
  bookingUrl?: string;
}

export default function BookingCTA({ bookingUrl = "" }: BookingCTAProps) {
  const perks = [
    "Instant Confirmation",
    "No Pre-payment Required",
    "Flexible Rescheduling",
  ];

  return (
    <section className="relative overflow-hidden bg-[#1C1917] py-20 text-white">
      {/* Decorative Gold Radial Glows */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[450px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B7925A]/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative text-center">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/40 bg-stone-900/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A46D] mb-6 backdrop-blur-xs">
          <SparklesIcon className="h-4 w-4" />
          <span>Transform Your Experience</span>
        </div>

        {/* Heading */}
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white leading-tight max-w-3xl mx-auto">
          Ready for Your Next Look?
        </h2>

        {/* Body Text */}
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-stone-300 leading-relaxed font-light">
          Book your salon appointment online in just a few simple steps. Select
          your desired service, choose your preferred time, and let our expert
          stylists craft your signature glow.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {bookingUrl ? (
            <a
              href={bookingUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#B7925A] px-9 py-4 text-sm font-semibold text-stone-950 shadow-lg shadow-[#B7925A]/25 transition-all duration-300 hover:bg-[#C5A46D] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A46D]"
            >
              <CalendarIcon className="h-4 w-4 text-stone-950" />
              <span>Book Appointment</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Online booking link not yet configured"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#B7925A]/60 px-9 py-4 text-sm font-semibold text-stone-950/60 cursor-not-allowed shadow-none"
            >
              <CalendarIcon className="h-4 w-4 text-stone-950/50" />
              <span>Book Appointment</span>
            </button>
          )}

          <Link
            href="/services"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-stone-600 bg-stone-800/60 px-8 py-4 text-sm font-medium text-stone-200 transition-all hover:border-[#B7925A] hover:text-[#C5A46D] hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A]"
          >
            <span>Explore All Services</span>
          </Link>
        </div>

        {/* Perks Checklist */}
        <div className="mt-10 pt-8 border-t border-stone-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-stone-400">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B7925A]/20 text-[#C5A46D]">
                <CheckIcon className="h-3 w-3" />
              </span>
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
