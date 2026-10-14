"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import React, { useState, useMemo } from "react";
import WeddingServiceCard, {
  WeddingServiceCardData,
} from "./WeddingServiceCard";

interface WeddingServicesSectionProps {
  services: WeddingServiceCardData[];
  bookingUrl?: string;
}

export default function WeddingServicesSection({
  services,
  bookingUrl = "",
}: WeddingServicesSectionProps) {
  const custom = useSectionCustomization("wedding-services");
  const [selectedAudience, setSelectedAudience] = useState<"all" | "female" | "male">("all");

  const filteredServices = useMemo(() => {
    if (selectedAudience === "all") return services;
    if (selectedAudience === "female") {
      // Bride: female + unisex
      return services.filter(
        (s) => s.audience === "female" || s.audience === "unisex" || !s.audience
      );
    }
    if (selectedAudience === "male") {
      // Groom: male + unisex
      return services.filter(
        (s) => s.audience === "male" || s.audience === "unisex" || !s.audience
      );
    }
    return services;
  }, [services, selectedAudience]);

  // If no services in the database, hide section cleanly as per requirements
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-stone-50/50 border-b border-stone-200/60" data-customization-section="wedding-services">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#03BF62]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#03BF62]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
              OUR SERVICES
            </>}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
            Single Wedding Services
          </>}</h2>

          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
            Choose from our range of individual wedding services, curated to help
            you look and feel your best.
          </>}</p>
        </div>

        {/* Wedding Services Audience Selector */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-stone-100 border border-stone-200/80 shadow-2xs">
            {[
              { id: "all", label: "All" },
              { id: "female", label: "Bride" },
              { id: "male", label: "Groom" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedAudience(tab.id as "all" | "female" | "male")}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedAudience === tab.id
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Grid or Empty State */}
        {filteredServices.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto shadow-2xs">
            <p className="text-base font-semibold text-stone-800">
              No wedding services are currently available for this selection.
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Please check back soon or choose another selection.
            </p>
            <button
              type="button"
              onClick={() => setSelectedAudience("all")}
              className="mt-4 rounded-xl bg-[#03BF62] px-4 py-2 text-xs font-semibold text-white hover:bg-[#029e51] cursor-pointer"
            >
              View All Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredServices.map((service, index) => (
              <WeddingServiceCard
                key={service._id}
                service={service}
                bookingUrl={bookingUrl}
                fallbackIndex={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
