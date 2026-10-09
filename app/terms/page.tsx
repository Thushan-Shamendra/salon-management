import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & Conditions | SALVORA",
  description:
    "Read the terms and conditions for using the SALVORA salon website and services.",
};

async function getSalonContact() {
  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();
    return {
      salonName: settings?.salonName || "SALVORA",
      email: settings?.email || "info@salvora.lk",
      phone: settings?.phone || "+94 11 234 5678",
      address: settings?.address || "Salon Diyora, Welivita, New Kandy Rd, Malabe",
    };
  } catch {
    return {
      salonName: "SALVORA",
      email: "info@salvora.lk",
      phone: "+94 11 234 5678",
      address: "Salon Diyora, Welivita, New Kandy Rd, Malabe",
    };
  }
}

export default async function TermsPage() {
  const contact = await getSalonContact();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Main Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0C0A14] text-white py-14 sm:py-16 lg:py-20 border-b border-white/10">
        {/* Ambient subtle glow for luxury aesthetic */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(124,58,237,0.22),rgba(255,255,255,0))]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-3.5 text-left">
            {/* Small Label */}
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C4B5FD]">
                LEGAL
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Terms & Conditions
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-normal max-w-2xl">
              Please read these terms carefully before using the SALVORA website and its services.
            </p>

            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="pt-2 flex items-center gap-2 text-xs font-medium">
              <Link
                href="/"
                className="text-stone-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <span className="text-stone-600">/</span>
              <span className="text-[#C4B5FD] font-semibold">Terms & Conditions</span>
            </nav>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <article className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-10 lg:p-12 shadow-xs space-y-9">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-5 text-xs text-stone-500">
              <span className="font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                Website Policy
              </span>
              <span className="font-medium text-stone-500">
                Last Updated: October 2026
              </span>
            </div>

            {/* 1. Introduction */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  1
                </span>
                <span>Introduction</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                These Terms & Conditions apply to all visitors and users of the SALVORA website. By visiting, browsing, or accessing any part of this website, you acknowledge that you have read, understood, and agreed to be bound by these terms. If you do not agree with any part of these Terms & Conditions, please discontinue using the website.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 2. Use of the Website */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  2
                </span>
                <span>Use of the Website</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                You agree to use the SALVORA website solely for lawful purposes and in accordance with these Terms. You must not misuse, damage, disable, overburden, impair, or interfere with the proper working of the website or its underlying networks and servers. Any attempt to gain unauthorized access to any accounts, computer systems, or networks connected to the SALVORA website is strictly prohibited.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 3. Salon Services */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  3
                </span>
                <span>Salon Services</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                Descriptions of salon services, estimated durations, pricing, and availability displayed on this website are provided for informational guidance. While we strive to maintain accurate information, service offerings, prices, and treatment availability may be updated or modified at any time without prior notice. Final service availability and pricing may be confirmed directly by SALVORA.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 4. Appointments & External Booking System */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  4
                </span>
                <span>Appointments & External Booking System</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                SALVORA does not manage appointments directly on this website. Customer login, client registration, and appointment booking buttons redirect users to an external Salon Management System. Any appointments, reservations, client profiles, or interactions created through that external system may be subject to its own independent terms, conditions, and operational policies.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 5. Wedding Services & Packages */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  5
                </span>
                <span>Wedding Services & Packages</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                Wedding beauty services and bridal package details shown on this website may vary depending on individual consultations, stylist availability, selected beauty treatments, and customer requirements. Package inclusions, schedules, and pricing may be updated by SALVORA based on customized arrangements.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 6. Cancellations & Rescheduling */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  6
                </span>
                <span>Cancellations & Rescheduling</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                Appointment cancellations, rescheduling requests, deposit requirements, and refund conditions are not defined directly on this informational website. All cancellation, rescheduling, deposit, and refund policies will be provided directly by SALVORA or through the connected external booking system at the time of scheduling.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 7. Website Content */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  7
                </span>
                <span>Website Content</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                All text, branding, graphics, logos, images, iconography, page layouts, and digital materials on the SALVORA website are the property of SALVORA or used under authorized license. Website content may not be copied, reproduced, republished, distributed, or commercially reused without prior written permission from SALVORA, except for third-party content governed by its own respective license.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 8. Images & Service Representation */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  8
                </span>
                <span>Images & Service Representation</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                Photographs and imagery displayed on this website are used to represent our salon services, hairstyles, aesthetics, and bridal styling work. Actual treatment results may vary from person to person depending on individual hair type, hair condition, skin type, treatment selection, and other personal factors.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 9. Third-Party Links */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  9
                </span>
                <span>Third-Party Links</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                For client convenience, the SALVORA website may include links to external services and third-party websites, including:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-stone-600 pl-2">
                <li>External Salon Management / Booking System</li>
                <li>Google Maps for navigation and branch directions</li>
                <li>Google Reviews</li>
                <li>Social media platforms (Facebook, Instagram, TikTok, YouTube)</li>
                <li>WhatsApp messaging</li>
                <li>Other third-party resources and websites</li>
              </ul>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed pt-1">
                SALVORA does not own or control these external platforms and is not responsible for the content, privacy practices, terms, or availability of third-party services.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 10. Google Reviews */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  10
                </span>
                <span>Google Reviews</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                Where Google Reviews or client feedback ratings are displayed on this website, they are sourced from Google and represent the authentic opinions, experiences, and statements of their respective individual authors. SALVORA does not alter or modify the original meaning of those reviews.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 11. Limitation of Liability */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  11
                </span>
                <span>Limitation of Liability</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                SALVORA makes reasonable efforts to keep website information accurate, up to date, and available. However, we cannot guarantee uninterrupted access, continuous availability, or complete accuracy of all published information at all times. To the fullest extent permitted by applicable law, SALVORA shall not be held liable for any damages or losses arising from your access to, use of, or inability to access or use this website.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 12. Privacy */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  12
                </span>
                <span>Privacy</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                Your use of this website may also be subject to our{" "}
                <Link
                  href="/privacy"
                  className="text-[#7C3AED] font-semibold underline underline-offset-2 hover:text-[#6D28D9] transition-colors"
                >
                  Privacy Policy
                </Link>
                . Please review the Privacy Policy to understand how data and user inquiries are handled.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 13. Changes to These Terms */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  13
                </span>
                <span>Changes to These Terms</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                SALVORA may update or revise these Terms & Conditions from time to time to reflect modifications in our salon services, operational practices, technologies, or applicable policies. Any updates take effect immediately upon being posted on this page. Your continued use of the website following any posted modifications indicates your acceptance of the updated terms.
              </p>
            </section>

            <hr className="border-stone-100" />

            {/* 14. Contact */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                  14
                </span>
                <span>Contact Us</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                If you have any questions, clarifications, or inquiries regarding these Terms & Conditions, please contact SALVORA using the information below:
              </p>

              {/* Dynamic Contact Information Card */}
              <div className="rounded-xl border border-stone-200 bg-[#FAF8F5]/80 p-5 sm:p-6 space-y-3.5 text-sm mt-3">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-4 w-4 text-[#7C3AED] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-stone-900">{contact.salonName}</p>
                    <p className="text-stone-600 text-xs sm:text-sm mt-0.5">{contact.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-stone-700">
                  <PhoneIcon className="h-4 w-4 text-[#7C3AED] shrink-0" />
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    className="text-stone-700 hover:text-[#7C3AED] transition-colors font-medium text-xs sm:text-sm"
                  >
                    {contact.phone}
                  </a>
                </div>

                <div className="flex items-center gap-3 text-stone-700">
                  <MailIcon className="h-4 w-4 text-[#7C3AED] shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-stone-700 hover:text-[#7C3AED] transition-colors font-medium text-xs sm:text-sm"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            </section>

            <hr className="border-stone-100" />

            {/* 15. Last Updated */}
            <section className="space-y-2 pt-1 text-center sm:text-left">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                15. Last Updated
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">
                Last Updated: October 2026
              </p>
            </section>
          </article>
        </div>
      </main>

      {/* Main Footer */}
      <Footer />
    </div>
  );
}
