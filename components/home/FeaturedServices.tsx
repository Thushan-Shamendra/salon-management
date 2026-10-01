"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ServiceItem } from "@/types/service";
import {
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  ScissorsIcon,
  CalendarIcon,
} from "@/components/ui/icons";

export default function FeaturedServices() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  const fetchServices = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch("/api/services")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load services (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success && Array.isArray(data.services)) {
          const activeServices = data.services
            .filter((s: ServiceItem) => s.isActive !== false)
            .slice(0, 6);
          setServices(activeServices);
        } else {
          setServices([]);
        }
      })
      .catch((err: unknown) => {
        console.error("Error fetching featured services:", err);
        setError("Unable to load salon services at the moment.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
          const activeServices = data.services
            .filter((s: ServiceItem) => s.isActive !== false)
            .slice(0, 6);
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
  }, []);

  const handleImageError = (serviceId: string) => {
    setFailedImageIds((prev) => ({ ...prev, [serviceId]: true }));
  };

  return (
    <section className="bg-[#FAF7F2] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#B7925A] mb-2">
              <SparklesIcon className="h-4 w-4" />
              <span>Signature Treatments</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] tracking-tight">
              Featured Salon Services
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#78716C] leading-relaxed">
              Explore our most requested beauty and styling treatments, tailored
              with precision to enhance your natural grace.
            </p>
          </div>

          <Link
            href="/services"
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-2.5 text-sm font-medium text-stone-900 transition-all hover:border-[#B7925A] hover:text-[#B7925A] hover:shadow-xs group self-start md:self-auto"
          >
            <span>View All Services</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((skeleton) => (
              <div
                key={skeleton}
                className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm animate-pulse"
              >
                <div className="aspect-[16/10] w-full rounded-xl bg-stone-200" />
                <div className="mt-5 space-y-3 px-2">
                  <div className="h-5 w-3/4 rounded bg-stone-200" />
                  <div className="h-3 w-full rounded bg-stone-100" />
                  <div className="h-3 w-5/6 rounded bg-stone-100" />
                  <div className="pt-4 flex items-center justify-between">
                    <div className="h-6 w-24 rounded bg-stone-200" />
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
          <div className="rounded-2xl border border-stone-300/80 bg-white p-10 text-center shadow-sm max-w-xl mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-[#B7925A]">
              <ScissorsIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-medium text-stone-900">
              Services Temporarily Unavailable
            </h3>
            <p className="mt-2 text-sm text-[#78716C]">{error}</p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fetchServices()}
                className="w-full sm:w-auto rounded-full bg-[#1C1917] px-6 py-2.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/services"
                className="w-full sm:w-auto rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-medium text-stone-800 hover:border-[#B7925A]"
              >
                Go to Services Page
              </Link>
            </div>
          </div>
        )}

        {/* 3. Empty State */}
        {!loading && !error && services.length === 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm max-w-lg mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/30">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-xl font-normal text-stone-900">
              No Services Currently Available
            </h3>
            <p className="mt-2 text-sm text-[#78716C]">
              We are currently updating our seasonal treatment menu. Please check
              back soon or get in touch for custom bookings.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#1C1917] px-6 py-2.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors"
              >
                <span>Contact Our Concierge</span>
              </Link>
            </div>
          </div>
        )}

        {/* 4. Dynamic Featured Services Grid */}
        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const hasValidImage =
                service.image &&
                service.image.trim().length > 0 &&
                !failedImageIds[service._id];

              return (
                <div
                  key={service._id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#B7925A]/60 hover:shadow-lg hover:shadow-stone-900/5 hover:-translate-y-1"
                >
                  <div>
                    {/* Service Image with Graceful Missing Image Fallback */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-100">
                      {hasValidImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={service.image}
                          alt={service.name}
                          onError={() => handleImageError(service._id)}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="relative flex h-full w-full items-center justify-center bg-stone-900 text-stone-400">
                          <Image
                            src="/images/placeholder-service.svg"
                            alt={service.name}
                            width={500}
                            height={350}
                            className="h-full w-full object-cover opacity-80"
                          />
                        </div>
                      )}

                      {/* Duration Tag overlay */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-[#FAF7F2] backdrop-blur-xs border border-white/10">
                        <ClockIcon className="h-3 w-3 text-[#C5A46D]" />
                        <span>{service.duration} mins</span>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="mt-5 px-1">
                      <h3 className="font-serif text-lg font-semibold text-stone-900 group-hover:text-[#B7925A] transition-colors">
                        {service.name}
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm text-[#78716C] leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Book Now Action */}
                  <div className="mt-6 pt-4 border-t border-stone-100 px-1">
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-xs text-[#78716C]">Investment</span>
                      <span className="font-serif text-lg font-bold text-stone-900">
                        LKR {service.price.toLocaleString()}
                      </span>
                    </div>

                    <Link
                      href={`/appointments?service=${service._id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] py-2.5 text-xs sm:text-sm font-medium text-white transition-all hover:bg-stone-800 hover:shadow-xs active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] border border-[#B7925A]/30"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
                      <span>Book Now</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="mt-10 text-center md:hidden">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-7 py-3 text-sm font-medium text-stone-900 hover:border-[#B7925A]"
          >
            <span>View All Services</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
