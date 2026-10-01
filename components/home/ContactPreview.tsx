import React from "react";
import Link from "next/link";
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  WhatsAppIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

export default function ContactPreview() {
  return (
    <section className="bg-white py-16 md:py-24 border-b border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#B7925A] mb-2">
            <ClockIcon className="h-4 w-4" />
            <span>Visit Our Sanctuary</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] tracking-tight">
            Location & Opening Hours
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#78716C] leading-relaxed">
            Conveniently situated in central Colombo with private valet parking
            and dedicated guest concierge assistance.
          </p>
        </div>

        {/* 3 Information Cards Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Card 1: Direct Contact */}
          <div className="rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-7 transition-all hover:border-[#B7925A]/40 hover:bg-white hover:shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#B7925A] border border-[#B7925A]/20 shadow-xs mb-6">
              <PhoneIcon className="h-5 w-5" />
            </div>

            <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
              Contact Details
            </h3>
            <p className="mt-1 text-xs text-[#78716C]">
              Reach our concierge for inquiries and personalized styling consultations.
            </p>

            <div className="mt-6 space-y-4 text-sm text-[#292524]">
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-4 w-4 text-[#B7925A] shrink-0 mt-1" />
                <span className="leading-snug">
                  124 Flower Road, Colombo 07, Sri Lanka
                </span>
              </div>

              <div className="flex items-center gap-3">
                <PhoneIcon className="h-4 w-4 text-[#B7925A] shrink-0" />
                <a
                  href="tel:+94112345678"
                  className="hover:text-[#B7925A] transition-colors"
                >
                  +94 11 234 5678
                </a>
              </div>

              <div className="flex items-center gap-3">
                <WhatsAppIcon className="h-4 w-4 text-[#B7925A] shrink-0" />
                <a
                  href="https://wa.me/94771234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B7925A] transition-colors"
                >
                  +94 77 123 4567 (WhatsApp)
                </a>
              </div>

              <div className="flex items-center gap-3">
                <MailIcon className="h-4 w-4 text-[#B7925A] shrink-0" />
                <a
                  href="mailto:hello@luminasalon.lk"
                  className="hover:text-[#B7925A] transition-colors truncate"
                >
                  hello@luminasalon.lk
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Opening Hours */}
          <div className="rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-7 transition-all hover:border-[#B7925A]/40 hover:bg-white hover:shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#B7925A] border border-[#B7925A]/20 shadow-xs mb-6">
              <ClockIcon className="h-5 w-5" />
            </div>

            <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
              Hours of Service
            </h3>
            <p className="mt-1 text-xs text-[#78716C]">
              We welcome walk-ins subject to availability; advance booking recommended.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-200/60">
                <span className="text-stone-700">Monday – Friday</span>
                <span className="font-medium text-stone-900">9:00 AM – 7:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-200/60">
                <span className="text-stone-700">Saturday</span>
                <span className="font-medium text-stone-900">9:00 AM – 8:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-200/60">
                <span className="text-stone-700">Sunday</span>
                <span className="font-medium text-stone-900">10:00 AM – 5:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-xs text-[#B7925A] font-medium pt-1">
                <span>Public Holidays</span>
                <span>Special Hours / On Request</span>
              </div>
            </div>
          </div>

          {/* Card 3: Map Preview & Directions */}
          <div className="rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-7 flex flex-col justify-between transition-all hover:border-[#B7925A]/40 hover:bg-white hover:shadow-sm">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#B7925A] border border-[#B7925A]/20 shadow-xs mb-6">
                <MapPinIcon className="h-5 w-5" />
              </div>

              <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                Interactive Location
              </h3>
              <p className="mt-1 text-xs text-[#78716C]">
                Central Colombo address with dedicated guest parking.
              </p>

              {/* Map Illustration Placeholder Container */}
              <div className="mt-6 relative h-28 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 flex items-center justify-center">
                <div className="text-center p-3">
                  <div className="flex justify-center text-[#B7925A] mb-1">
                    <MapPinIcon className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-medium text-stone-800">
                    Flower Road • Colombo 07
                  </p>
                  <p className="text-[10px] text-stone-500">
                    Live Google Map integration connects with Website Settings
                  </p>
                </div>
              </div>
            </div>

            {/* Directions Placeholder Button */}
            <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center gap-3">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white py-2.5 text-xs font-medium text-stone-800 hover:border-[#B7925A] hover:text-[#B7925A] transition-colors shadow-2xs"
              >
                <span>Get Directions</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Note indicating future settings integration & Contact Us CTA */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-[#FAF7F2] p-5 border border-stone-200/80">
          <p className="text-xs text-[#78716C] text-center sm:text-left">
            Have questions about bridal packages, group bookings, or custom treatments?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#1C1917] px-6 py-2.5 text-xs sm:text-sm font-medium text-white transition-all hover:bg-stone-800 hover:gap-3 shrink-0"
          >
            <span>Contact Us</span>
            <ArrowRightIcon className="h-4 w-4 text-[#C5A46D]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
