"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRightIcon, ClockIcon } from "@/components/ui/icons";

export interface ServiceCardData {
  _id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  image?: string;
}

interface ServiceCardProps {
  service: ServiceCardData;
  bookingUrl?: string;
  fallbackIndex?: number;
}

const FALLBACK_SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80",
];

export default function ServiceCard({
  service,
  bookingUrl = "",
  fallbackIndex = 0,
}: ServiceCardProps) {
  const [imageError, setImageError] = useState(false);

  const imageSrc =
    imageError || !service.image
      ? FALLBACK_SERVICE_IMAGES[fallbackIndex % FALLBACK_SERVICE_IMAGES.length] ||
        "/images/placeholder-service.svg"
      : service.image;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1">
      <div>
        {/* Service Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-100">
          <Image
            src={imageSrc}
            alt={service.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Title & Description */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors truncate">
            {service.name}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-stone-500 line-clamp-2 leading-relaxed min-h-[40px]">
            {service.description ||
              "Professional salon treatment tailored to your style and wellness."}
          </p>
        </div>

        {/* Price & Duration Row */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs sm:text-sm">
          <div>
            <span className="text-stone-400">From </span>
            <span className="font-bold text-stone-900">
              LKR {service.price ? service.price.toLocaleString() : "Contact"}
            </span>
          </div>

          {service.duration ? (
            <div className="flex items-center gap-1.5 text-stone-500 font-medium">
              <ClockIcon className="h-4 w-4 text-stone-400" />
              <span>{service.duration} mins</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Book Appointment Button */}
      <div className="mt-5">
        {bookingUrl ? (
          <a
            href={bookingUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#7C3AED] hover:shadow-md active:scale-[0.98]"
          >
            <span>Book Appointment</span>
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Online booking link not yet configured"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-300 py-3 text-xs sm:text-sm font-semibold text-stone-500 cursor-not-allowed"
          >
            <span>Book Appointment</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
