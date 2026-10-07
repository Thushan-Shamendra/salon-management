"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  InstagramIcon,
  FacebookIcon,
  UserIcon,
} from "@/components/ui/icons";

interface BeauticianItem {
  _id: string;
  name: string;
  jobTitle: string;
  bio?: string;
  specialties: string[];
  experienceYears?: number;
  image?: string;
  instagram?: string;
  facebook?: string;
}

const FALLBACK_BEAUTICIAN_PHOTO =
  "https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?auto=format&fit=crop&w=800&q=80";

export default function BeauticiansPreview() {
  const [beauticians, setBeauticians] = useState<BeauticianItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    fetch("/api/beauticians")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && Array.isArray(data.beauticians)) {
          // Real active beauticians only from MongoDB (up to 4)
          setBeauticians(data.beauticians.slice(0, 4));
        } else {
          setBeauticians([]);
        }
      })
      .catch(() => {
        if (isMounted) setBeauticians([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleImageError = (id: string) => {
    setFailedImageIds((prev) => ({ ...prev, [id]: true }));
  };

  // Adaptive layout based on beautician count
  const getLayoutConfig = (count: number) => {
    if (count === 1) {
      return {
        containerClass: "w-full max-w-[340px] sm:max-w-[360px] mx-auto",
        sectionPadding: "py-12 sm:py-16",
        cardPadding: "p-6 sm:p-7",
        imageAspect: "aspect-[4/5]",
        nameClass: "text-xl font-bold text-stone-900",
        titleClass: "text-sm font-semibold text-stone-600",
      };
    }
    if (count === 2) {
      return {
        containerClass: "max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8",
        sectionPadding: "py-14 sm:py-18",
        cardPadding: "p-5",
        imageAspect: "aspect-[4/5]",
        nameClass: "text-lg font-bold text-stone-900",
        titleClass: "text-xs font-semibold text-stone-500",
      };
    }
    if (count === 3) {
      return {
        containerClass: "grid grid-cols-1 md:grid-cols-3 gap-8",
        sectionPadding: "py-16 sm:py-20",
        cardPadding: "p-5",
        imageAspect: "aspect-[4/5]",
        nameClass: "text-lg font-bold text-stone-900",
        titleClass: "text-xs font-semibold text-stone-500",
      };
    }
    return {
      containerClass: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
      sectionPadding: "py-16 sm:py-20 lg:py-24",
      cardPadding: "p-4",
      imageAspect: "aspect-[4/5]",
      nameClass: "text-lg font-bold text-stone-900",
      titleClass: "text-xs font-semibold text-stone-500",
    };
  };

  const layout = getLayoutConfig(beauticians.length || 1);

  return (
    <section className={`bg-white border-t border-stone-200/60 ${layout.sectionPadding}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              ✦ Our Team
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
              Meet Our Beauty Experts
            </h2>
          </div>

          <Link
            href="/about"
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-6 py-2.5 text-xs font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
          >
            <span>View Our Team</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto">
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-xs animate-pulse">
              <div className="aspect-[4/5] w-full rounded-2xl bg-stone-200" />
              <div className="mt-4 space-y-2">
                <div className="h-5 w-2/3 rounded bg-stone-200" />
                <div className="h-3.5 w-1/2 rounded bg-stone-100" />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && beauticians.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED] mb-3">
              <UserIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-stone-800">
              Our stylists are getting ready!
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Beautician profiles will appear here shortly.
            </p>
          </div>
        )}

        {/* Adaptive Beauticians Grid */}
        {!loading && beauticians.length > 0 && (
          <div className={layout.containerClass}>
            {beauticians.map((person) => {
              const imageSrc =
                failedImageIds[person._id] || !person.image
                  ? FALLBACK_BEAUTICIAN_PHOTO
                  : person.image;

              return (
                <div
                  key={person._id}
                  className={`group flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white ${layout.cardPadding} shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-xl hover:-translate-y-1`}
                >
                  <div>
                    {/* Portrait Photo */}
                    <div className={`relative ${layout.imageAspect} w-full overflow-hidden rounded-2xl bg-stone-100`}>
                      <Image
                        src={imageSrc}
                        alt={person.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => handleImageError(person._id)}
                      />
                    </div>

                    {/* Details */}
                    <div className="mt-4">
                      <h3 className={`${layout.nameClass} group-hover:text-[#7C3AED] transition-colors truncate`}>
                        {person.name}
                      </h3>
                      <p className={`${layout.titleClass} capitalize mt-0.5`}>
                        {person.jobTitle || "Beauty Specialist"}
                      </p>

                      {/* Specialties & Experience Row */}
                      <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
                        <span className="truncate pr-2 font-medium">
                          {person.experienceYears
                            ? `${person.experienceYears}+ Years Exp.`
                            : person.specialties?.length
                            ? person.specialties[0]
                            : "Senior Stylist"}
                        </span>

                        {/* Social Links */}
                        {(person.instagram || person.facebook) ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {person.instagram ? (
                              <a
                                href={person.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${person.name} Instagram`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                              >
                                <InstagramIcon className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                            {person.facebook ? (
                              <a
                                href={person.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${person.name} Facebook`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                              >
                                <FacebookIcon className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
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
