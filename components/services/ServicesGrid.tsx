import React from "react";
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
  // Adaptive grid layout based on the number of real active services
  const getGridClass = (count: number) => {
    if (count === 1) return "max-w-md mx-auto";
    if (count === 2) return "max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8";
    if (count === 3) return "grid grid-cols-1 md:grid-cols-3 gap-8";
    if (count === 4) return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6";
    return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8";
  };

  return (
    <section className="bg-white pb-20 sm:pb-24 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Empty State */}
        {services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] mb-4">
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
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6D28D9] active:scale-[0.98]"
            >
              <span>Contact Invora</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          /* Adaptive Services Grid */
          <div className={getGridClass(services.length)}>
            {services.map((service, index) => (
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
