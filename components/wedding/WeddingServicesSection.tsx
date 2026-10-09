import React from "react";
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
  // If no services in the database, hide section cleanly as per requirements
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-stone-50/50 border-b border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              OUR SERVICES
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Single Wedding Services
          </h2>

          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            Choose from our range of individual wedding services, curated to help
            you look and feel your best.
          </p>
        </div>

        {/* Responsive Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <WeddingServiceCard
              key={service._id}
              service={service}
              bookingUrl={bookingUrl}
              fallbackIndex={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
