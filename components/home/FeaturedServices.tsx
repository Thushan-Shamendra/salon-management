"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ServiceItem } from "@/types/service";
import { ArrowRightIcon, ScissorsIcon, ClockIcon } from "@/components/ui/icons";

interface FeaturedServicesProps {
  bookingUrl?: string;
}

const FALLBACK_SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80",
];

export default function FeaturedServices({ bookingUrl: propBookingUrl }: FeaturedServicesProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [fetchedBookingUrl, setFetchedBookingUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  const [reloadKey, setReloadKey] = useState<number>(0);

  const bookingUrl = propBookingUrl || fetchedBookingUrl;

  const retryFetch = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (propBookingUrl) return;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.settings?.externalSystem?.bookingUrl) {
          setFetchedBookingUrl(data.settings.externalSystem.bookingUrl);
        }
      })
      .catch(() => {});
  }, [propBookingUrl]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/services")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load services (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && Array.isArray(data.services)) {
          // Real active services only from MongoDB (up to 4)
          const activeServices = data.services
            .filter((s: ServiceItem) => s.isActive !== false)
            .slice(0, 4);
          setServices(activeServices);
        } else {
          setServices([]);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error("Error fetching featured services:", err);
        setError("Unable to load salon services at the moment.");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleImageError = (serviceId: string) => {
    setFailedImageIds((prev) => ({ ...prev, [serviceId]: true }));
  };

  // Adaptive layout based on service count
  const getGridClass = (count: number) => {
    if (count === 1) return "max-w-md mx-auto";
    if (count === 2) return "max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8";
    if (count === 3) return "grid grid-cols-1 md:grid-cols-3 gap-8";
    return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6";
  };

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24 border-t border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              ✦ Our Services
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
              Treatments Designed Around You
            </h2>
          </div>

          <Link
            href="/services"
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-6 py-2.5 text-xs font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
          >
            <span>View All Services</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((skeleton) => (
              <div
                key={skeleton}
                className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs animate-pulse"
              >
                <div className="aspect-[16/11] w-full rounded-xl bg-stone-200" />
                <div className="mt-5 space-y-3">
                  <div className="h-5 w-3/4 rounded bg-stone-200" />
                  <div className="h-3.5 w-full rounded bg-stone-100" />
                  <div className="h-3.5 w-5/6 rounded bg-stone-100" />
                  <div className="pt-2 flex justify-between">
                    <div className="h-5 w-24 rounded bg-stone-200" />
                    <div className="h-4 w-16 rounded bg-stone-100" />
                  </div>
                  <div className="h-10 w-full rounded-xl bg-stone-200 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-xs max-w-xl mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED]">
              <ScissorsIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-stone-900">
              Services Temporarily Unavailable
            </h3>
            <p className="mt-1 text-xs text-stone-500">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={retryFetch}
                className="rounded-full bg-[#7C3AED] px-5 py-2 text-xs font-medium text-white hover:bg-[#6D28D9] transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/services"
                className="rounded-full border border-stone-200 bg-white px-5 py-2 text-xs font-medium text-stone-700 hover:border-[#7C3AED]"
              >
                Browse Services
              </Link>
            </div>
          </div>
        )}

        {/* 3. Empty State */}
        {!loading && !error && services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-lg mx-auto">
            <p className="text-sm text-stone-600">
              No services currently listed. Please check back soon or visit our full catalog.
            </p>
            <Link
              href="/services"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-5 py-2 text-xs font-medium text-white"
            >
              Explore Services
            </Link>
          </div>
        )}

        {/* 4. Adaptive Active Services Grid */}
        {!loading && !error && services.length > 0 && (
          <div className={getGridClass(services.length)}>
            {services.map((service, index) => {
              const imageSrc =
                failedImageIds[service._id] || !service.image
                  ? FALLBACK_SERVICE_IMAGES[index % FALLBACK_SERVICE_IMAGES.length]
                  : service.image;

              return (
                <div
                  key={service._id}
                  className="group flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div>
                    {/* Prominent Service Image */}
                    <div className="relative aspect-[16/11] w-full overflow-hidden rounded-xl bg-stone-100">
                      <Image
                        src={imageSrc}
                        alt={service.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => handleImageError(service._id)}
                      />
                    </div>

                    {/* Service Name & Description */}
                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors truncate">
                        {service.name}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-stone-500 line-clamp-2 leading-relaxed min-h-[36px]">
                        {service.description || "Professional salon treatment tailored to your style and wellness."}
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
                      {service.duration && (
                        <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                          <ClockIcon className="h-4 w-4 text-stone-400" />
                          <span>{service.duration} mins</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prominent Book Appointment CTA */}
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
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-300 py-3 text-xs sm:text-sm font-semibold text-stone-500 cursor-not-allowed"
                      >
                        <span>Book Appointment</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
