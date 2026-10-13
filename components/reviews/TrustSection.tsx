"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import React from "react";
import {
  AwardIcon,
  HeartIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

export default function TrustSection() {
  const custom = useSectionCustomization("trust");

  const trustPoints = [
    {
      title: "Professional Care",
      description:
        "Skilled and experienced beauticians dedicated to your beauty and confidence.",
      icon: AwardIcon,
    },
    {
      title: "Personalized Service",
      description:
        "Treatments tailored to your unique hair, skin and beauty needs.",
      icon: HeartIcon,
    },
    {
      title: "Experienced Beauticians",
      description:
        "A passionate team with expertise and attention to every detail.",
      icon: UsersIcon,
    },
    {
      title: "Comfortable Environment",
      description:
        "A clean, modern and relaxing space designed for your comfort.",
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <section className="bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-b border-stone-200/60" data-customization-section="trust">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#03BF62]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#03BF62]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
              WHY CLIENTS CHOOSE US
            </>}</span>
          </div>
          <h2 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
            Care You Can Feel
          </>}</h2>
          <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
            Our clients trust us for our professional care, personalized service and
            relaxing experience.
          </>}</p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-7 min-h-[220px] shadow-xs transition-all duration-300 hover:border-[#03BF62]/40 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  {/* Icon Badge */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#03BF62]/10 text-[#03BF62] border border-[#03BF62]/20 shadow-2xs mb-5 transition-colors duration-300 group-hover:bg-[#03BF62] group-hover:text-white group-hover:border-[#03BF62]">
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#03BF62] transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2.5 text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
