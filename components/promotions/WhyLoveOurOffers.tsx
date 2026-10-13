"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import React from "react";
import {
  GiftIcon,
  HeartIcon,
  StarIcon,
  CalendarIcon,
} from "@/components/ui/icons";

interface WhyLoveOurOffersProps {
  salonName?: string;
}

export default function WhyLoveOurOffers({ salonName = "Salvora" }: WhyLoveOurOffersProps) {
  const custom = useSectionCustomization("why-offers");

  const highlights = [
    {
      icon: GiftIcon,
      title: "Real Savings",
      description: "Enjoy exclusive discounts and special deals on your favorite services and products.",
    },
    {
      icon: HeartIcon,
      title: "Professional Care",
      description: `All offers include our expert ${salonName} beauticians and premium quality treatments.`,
    },
    {
      icon: StarIcon,
      title: "Seasonal Specials",
      description: "New offers and limited-time deals throughout the year for every occasion.",
    },
    {
      icon: CalendarIcon,
      title: "Easy Booking",
      description: "Quick and simple booking process to redeem your favorite offers.",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 border-t border-stone-100" data-customization-section="why-offers">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#03BF62]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#03BF62]" />
            <span data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>Why Choose {salonName}</>}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
            Why Customers Love Our Offers
          </>}</h2>
        </div>

        {/* 4 Cards (Matches Mockup) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-2xs hover:shadow-md hover:border-[#03BF62]/30 transition-all duration-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#03BF62]/10 text-[#03BF62] border border-[#03BF62]/20 group-hover:bg-[#03BF62] group-hover:text-white transition-colors duration-200">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-base font-bold text-stone-900 tracking-tight">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
