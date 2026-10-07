"use client";

import React, { useState, useEffect } from "react";
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
} from "@/components/ui/icons";

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

interface SalonSettingsData {
  salonName?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: OpeningHour[];
}

export default function ContactPreview() {
  const [settings, setSettings] = useState<SalonSettingsData>({
    phone: "+94 76 123 4567",
    email: "info@invora.lk",
    address: "123 Beauty Street, Colombo 07, Sri Lanka",
    openingHours: [
      { day: "Monday", open: "10:00", close: "20:00", isClosed: false },
      { day: "Saturday", open: "10:00", close: "20:00", isClosed: false },
      { day: "Sunday", open: "10:00", close: "16:00", isClosed: false },
    ],
  });

  useEffect(() => {
    let isMounted = true;

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && data?.settings) {
          setSettings((prev) => ({
            ...prev,
            salonName: data.settings.salonName || prev.salonName,
            phone: data.settings.phone || prev.phone,
            email: data.settings.email || prev.email,
            address: data.settings.address || prev.address,
            openingHours:
              data.settings.openingHours?.length > 0
                ? data.settings.openingHours
                : prev.openingHours,
          }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24 border-t border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
            ✦ Get In Touch
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Contact Us
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-500">
            Conveniently situated with dedicated guest styling consultations and service.
          </p>
        </div>

        {/* Spacious 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Column 1: Contact Details & Opening Hours */}
          <div className="lg:col-span-6 space-y-6">
            {/* Visit Our Salon */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                <MapPinIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Visit Our Salon</h3>
                <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                  {settings.address || "123 Beauty Street, Colombo 07, Sri Lanka"}
                </p>
              </div>
            </div>

            {/* Call Us */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                <PhoneIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Call Us</h3>
                <a
                  href={`tel:${settings.phone?.replace(/\s+/g, "")}`}
                  className="text-sm text-stone-600 hover:text-[#7C3AED] transition-colors mt-1 block font-medium"
                >
                  {settings.phone || "+94 76 123 4567"}
                </a>
              </div>
            </div>

            {/* Email Us */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                <MailIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Email Us</h3>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-sm text-stone-600 hover:text-[#7C3AED] transition-colors mt-1 block font-medium"
                >
                  {settings.email || "info@invora.lk"}
                </a>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Opening Hours</h3>
                <div className="text-sm text-stone-600 mt-1 space-y-1 leading-relaxed">
                  <p>Mon – Sat: 10:00 AM – 8:00 PM</p>
                  <p>Sunday: 10:00 AM – 4:00 PM</p>
                </div>
              </div>
            </div>

            {/* Action Buttons: Call Us & Get Directions */}
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <a
                href={`tel:${settings.phone?.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#7C3AED] transition-colors"
              >
                <PhoneIcon className="h-4 w-4" />
                <span>Call Us</span>
              </a>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  settings.address || "Colombo 07, Sri Lanka"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-stone-700 shadow-xs hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
              >
                <MapPinIcon className="h-4 w-4" />
                <span>Get Directions</span>
              </a>
            </div>
          </div>

          {/* Column 2: Prominent Interactive Location Map */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-md">
              <iframe
                title="Invora Salon Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.798511757682!2d79.86064787593258!3d6.914643793084883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2596e1a473fb5%3A0x6b9d6286fa64d78e!2sColombo%2007%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full grayscale-[15%] contrast-[105%]"
              />
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur-xs">
                Invora • Colombo 07
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
