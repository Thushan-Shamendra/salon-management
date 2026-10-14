"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import ServiceCard, { ServiceCardData } from "@/components/ui/ServiceCard";
import { ScissorsIcon, ArrowRightIcon } from "@/components/ui/icons";

interface ServicesGridProps {
  services: ServiceCardData[];
  bookingUrl?: string;
}

export default function ServicesGrid({
  services,
  bookingUrl = "",
}: ServicesGridProps) {
  const [selectedAudience, setSelectedAudience] = useState<"all" | "female" | "male">("all");

  const filteredServices = useMemo(() => {
    if (selectedAudience === "all") return services;
    if (selectedAudience === "female") {
      return services.filter(
        (s) => s.audience === "female" || s.audience === "unisex" || !s.audience
      );
    }
    if (selectedAudience === "male") {
      return services.filter(
        (s) => s.audience === "male" || s.audience === "unisex" || !s.audience
      );
    }
    return services;
  }, [services, selectedAudience]);

  // Adaptive grid layout based on the number of real active services
  const getGridClass = (count: number) => {
    if (count === 1) return "max-w-md mx-auto";
    if (count === 2) return "max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8";
    if (count === 3) return "grid grid-cols-1 md:grid-cols-3 gap-8";
    if (count === 4) return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6";
    return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8";
  };

  return (
    <section className="bg-white pb-20 sm:pb-24 lg:pb-28" data-customization-section="services-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Audience Selector Tabs */}
        {services.length > 0 && (
          <div className="flex justify-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-stone-100 border border-stone-200/80 shadow-2xs">
              {[
                { id: "all", label: "All" },
                { id: "female", label: "Women" },
                { id: "male", label: "Men" },
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
        )}

        {/* Empty State */}
        {services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03BF62]/10 text-[#03BF62] mb-4">
              <ScissorsIcon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Services Updating Soon
            </h3>
            <p className="mt-2 text-sm text-stone-500 leading-relaxed">
              Our services are currently being updated. Please check back soon or get in touch with us directly.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#03BF62] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#029e51] active:scale-[0.98]"
            >
              <span>Contact Salvora</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center max-w-md mx-auto shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-4">
              <ScissorsIcon className="h-7 w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              No services are currently available in this category.
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
              Try selecting another audience filter to browse our full range of salon treatments.
            </p>
            <button
              type="button"
              onClick={() => setSelectedAudience("all")}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#03BF62] active:scale-[0.98] cursor-pointer"
            >
              <span>View All Services</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          /* Adaptive Services Grid */
          <div className={getGridClass(filteredServices.length)}>
            {filteredServices.map((service, index) => (
              <ServiceCard
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
