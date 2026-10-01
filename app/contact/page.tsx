import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactForm from "./ContactForm";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { formatSalonTime, getSalonSettings } from "@/lib/salon-settings";

export const metadata = {
  title: "Contact Us | Lumina Salon Colombo",
  description: "Get in touch with Lumina Salon for appointments, inquiries, and bridal consultation.",
};

export default async function ContactPage() {
  const settings = await getSalonSettings();
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3">
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>Concierge & Inquiries</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
              Get in Touch with {settings.salonName}
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-[#78716C] leading-relaxed">
              Have questions about our treatments, styling experts, or bridal packages? We would love to welcome you to our Colombo 07 sanctuary.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Contact Details & Hours (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Salon Details Card */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="font-serif text-xl font-normal text-stone-900 mb-6">
                  Salon Information
                </h2>

                <div className="space-y-5 text-xs sm:text-sm">
                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25">
                      <MapPinIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
                        Location
                      </h3>
                      <p className="text-stone-600 mt-1 leading-relaxed">
                        {settings.address}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25">
                      <PhoneIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
                        Telephone
                      </h3>
                      <p className="text-stone-600 mt-1">
                        <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="hover:text-[#B7925A] transition-colors">
                          {settings.phone}
                        </a>
                        <br />
                        <a href={`tel:${settings.phoneSecondary.replace(/[^+\d]/g, "")}`} className="hover:text-[#B7925A] transition-colors">
                          {settings.phoneSecondary}
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25">
                      <MailIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
                        Email Concierge
                      </h3>
                      <p className="text-stone-600 mt-1">
                        <a
                          href={`mailto:${settings.email}`}
                          className="hover:text-[#B7925A] transition-colors"
                        >
                          {settings.email}
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25">
                      <ClockIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
                        Opening Hours
                      </h3>
                      <div className="mt-1 space-y-1 text-stone-600">{settings.openingHours.map((hour) => <p key={hour.day}>{hour.day}: {hour.isClosed ? "Closed" : `${formatSalonTime(hour.open)} – ${formatSalonTime(hour.close)}`}</p>)}</div>
                      <p className="hidden text-stone-600 mt-1 leading-relaxed">
                        Monday – Saturday: 9:00 AM – 7:00 PM<br />
                        Sunday: 10:00 AM – 5:00 PM<br />
                        <span className="text-[11px] text-stone-400">Poya & Public Holidays by appointment</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instant WhatsApp Link */}
                <div className="mt-8 pt-6 border-t border-stone-100">
                  <a
                    href={settings.socialMedia.whatsapp || `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#20bd5a] transition-colors shadow-xs"
                  >
                    <span>Chat on WhatsApp ({settings.whatsapp})</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Inquiries Contact Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-sm">
                <h2 className="font-serif text-xl font-normal text-stone-900 mb-2">
                  Send Us an Inquiry
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mb-6">
                  Fill in your details below and our concierge desk will respond within 4 business hours.
                </p>

                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
