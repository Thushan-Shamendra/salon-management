import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ScissorsIcon,
  SparklesIcon,
  HeartIcon,
  CheckIcon,
  AwardIcon,
  CalendarIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "About Us | Lumina Salon Colombo",
  description: "Learn about Lumina Salon, our artisanal beauty philosophy, master stylists, and luxury sanctuary.",
};

export default function AboutPage() {
  const pillars = [
    {
      title: "Artisanal Precision",
      description:
        "Every haircut, color glaze, and facial therapy is personalized with artistic precision according to your unique facial geometry and skin profile.",
      icon: ScissorsIcon,
    },
    {
      title: "Clean & Ethical Formulas",
      description:
        "We are dedicated to sustainable beauty, exclusively using certified cruelty-free, ammonia-free, and dermatologically tested hair & skin treatments.",
      icon: SparklesIcon,
    },
    {
      title: "Tranquil Luxury Oasis",
      description:
        "Designed to shield you from urban commotion, our salon features private suites, gentle ambient lighting, and bespoke hospitality.",
      icon: HeartIcon,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      <Navbar />

      <main className="flex-1 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Story Banner */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3">
              <AwardIcon className="h-3.5 w-3.5" />
              <span>Our Heritage & Vision</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-stone-900 tracking-tight leading-tight">
              Crafting Timeless Beauty in the Heart of Colombo
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#78716C] leading-relaxed">
              Founded in 2018, Lumina Salon was created with a clear aspiration: to blend refined European aesthetic standards with the warmth of Sri Lankan hospitality.
            </p>
          </div>

          {/* Core Values Pillars */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mb-16">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-stone-200/90 bg-white p-7 shadow-sm transition-all hover:border-[#B7925A]/50 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25 mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-stone-900 mb-2">
                    {pillar.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Commitment Card */}
          <div className="rounded-3xl border border-[#B7925A]/30 bg-white p-8 sm:p-12 shadow-sm text-center max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 mb-4">
              Our Promise to Every Guest
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] max-w-2xl mx-auto leading-relaxed mb-8">
              We never compromise on sanitation, genuine active ingredients, or continuous professional stylist education. You will always leave looking beautiful and feeling confident.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600 mb-8">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                100% Verified Stylist Certification
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                Hospital-Grade Hygiene Standards
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                Cruelty-Free International Products
              </span>
            </div>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30"
            >
              <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
              <span>Explore Our Salon Services</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
