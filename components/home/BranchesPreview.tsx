"use client";

import React from "react";
import Link from "next/link";
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  ArrowRightIcon,
  CompassIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";
import { normalizeWhatsAppNumber } from "@/lib/phone";

export interface HomeBranchCardData {
  _id: string;
  name: string;
  slug: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  isMain?: boolean;
  openingHours?: Array<{
    day: string;
    isClosed: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
}

interface BranchesPreviewProps {
  branches: HomeBranchCardData[];
}

function formatTime(t?: string): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export function summarizeOpeningHours(
  hours?: Array<{ day: string; isClosed: boolean; openTime?: string; closeTime?: string }>
): Array<{ label: string; time: string }> | null {
  if (!Array.isArray(hours) || hours.length === 0) return null;

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const sorted = [...hours].sort((a, b) => {
    const idxA = dayOrder.indexOf(a.day);
    const idxB = dayOrder.indexOf(b.day);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return 0;
  });

  const formattedDays = sorted.map((h) => {
    const time = h.isClosed
      ? "Closed"
      : h.openTime && h.closeTime
      ? `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}`
      : "Open";
    return { day: h.day, time };
  });

  const groups: Array<{ startDay: string; endDay: string; count: number; time: string }> = [];
  for (const item of formattedDays) {
    const last = groups[groups.length - 1];
    if (last && last.time === item.time) {
      last.endDay = item.day;
      last.count += 1;
    } else {
      groups.push({ startDay: item.day, endDay: item.day, count: 1, time: item.time });
    }
  }

  if (groups.length <= 3) {
    return groups.map((g) => {
      const label =
        g.count === 1
          ? g.startDay.slice(0, 3)
          : `${g.startDay.slice(0, 3)} – ${g.endDay.slice(0, 3)}`;
      return { label, time: g.time };
    });
  }

  return null;
}

function getBranchMapData(branch: HomeBranchCardData) {
  const { latitude, longitude, googleMapsUrl, address } = branch;
  let embedUrl = "";
  let queryParam = "";

  if (
    latitude !== undefined &&
    longitude !== undefined &&
    latitude !== null &&
    longitude !== null &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude))
  ) {
    embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=15&output=embed`;
    queryParam = `${latitude},${longitude}`;
  } else if (googleMapsUrl && googleMapsUrl.includes("/maps/embed")) {
    embedUrl = googleMapsUrl;
    queryParam = encodeURIComponent(address || branch.name);
  } else {
    const encodedAddress = encodeURIComponent(address || branch.name);
    embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    queryParam = encodedAddress;
  }

  const directionsUrl =
    googleMapsUrl && !googleMapsUrl.includes("/maps/embed")
      ? googleMapsUrl
      : `https://www.google.com/maps/dir/?api=1&destination=${queryParam}`;

  return { embedUrl, directionsUrl };
}

function HomeBranchCard({ branch }: { branch: HomeBranchCardData }) {
  const { embedUrl, directionsUrl } = getBranchMapData(branch);
  const hoursSummary = summarizeOpeningHours(branch.openingHours);

  // WhatsApp link
  const rawNumber = branch.whatsappNumber || branch.phone;
  const cleanedWa = normalizeWhatsAppNumber(rawNumber);
  const whatsappLink = cleanedWa
    ? `https://wa.me/${cleanedWa}?text=${encodeURIComponent(
        `Hello SALVORA, I would like to get in touch with your ${branch.name}.`
      )}`
    : null;

  return (
    <div
      className={`group h-full flex flex-col justify-between rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden ${
        branch.isMain ? "ring-2 ring-[#7C3AED]/30" : ""
      }`}
    >
      <div>
        {/* TOP: Google Map */}
        <div className="relative w-full h-[180px] sm:h-[190px] overflow-hidden bg-stone-100 border-b border-stone-100">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`Map of ${branch.name}`}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-50 text-xs">
              <MapPinIcon className="h-6 w-6 mb-1 text-stone-300" />
              <span>Map preview unavailable</span>
            </div>
          )}
        </div>

        {/* BOTTOM: Branch Details */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Branch Title & Main Badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug group-hover:text-[#7C3AED] transition-colors line-clamp-1">
              {branch.name}
            </h3>
            {branch.isMain && (
              <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7C3AED] border border-purple-200">
                MAIN BRANCH
              </span>
            )}
          </div>

          {/* Address */}
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-600">
            <MapPinIcon className="h-4 w-4 shrink-0 text-[#7C3AED] mt-0.5" />
            <span className="leading-relaxed line-clamp-2">{branch.address}</span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-700">
            <PhoneIcon className="h-4 w-4 shrink-0 text-[#7C3AED]" />
            <a
              href={`tel:${branch.phone}`}
              className="hover:text-[#7C3AED] transition-colors font-medium truncate"
              onClick={() => {
                trackEvent({
                  eventType: "CALL_CLICK",
                  entityType: "branch",
                  entityId: branch._id,
                  metadata: { source: "home-branch-card", label: branch.name },
                });
              }}
            >
              {branch.phone}
            </a>
          </div>

          {/* Email (if available) */}
          {branch.email && (
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-600">
              <MailIcon className="h-4 w-4 shrink-0 text-[#7C3AED]" />
              <a
                href={`mailto:${branch.email}`}
                className="hover:text-[#7C3AED] transition-colors truncate"
              >
                {branch.email}
              </a>
            </div>
          )}

          {/* Opening Hours Summary */}
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-600 pt-1">
            <ClockIcon className="h-4 w-4 shrink-0 text-[#7C3AED] mt-0.5" />
            <div className="space-y-0.5">
              {hoursSummary && hoursSummary.length > 0 ? (
                hoursSummary.map((h, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="font-semibold text-stone-800">{h.label}:</span>
                    <span>{h.time}</span>
                  </div>
                ))
              ) : (
                <Link
                  href="/contact"
                  className="text-xs font-semibold text-[#7C3AED] hover:underline"
                >
                  View Opening Hours
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Call Us | Get Directions | Optional WhatsApp */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2">
        <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
          <a
            href={`tel:${branch.phone}`}
            onClick={() => {
              trackEvent({
                eventType: "CALL_CLICK",
                entityType: "branch",
                entityId: branch._id,
                metadata: { source: "home-branch-card", label: branch.name },
              });
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white py-2 px-3 text-xs sm:text-sm font-semibold text-stone-800 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors shadow-2xs"
          >
            <PhoneIcon className="h-3.5 w-3.5" />
            <span>Call Us</span>
          </a>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent({
                eventType: "MAP_CLICK",
                entityType: "branch",
                entityId: branch._id,
                metadata: { source: "home-branch-card", label: branch.name },
              });
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#7C3AED] py-2 px-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors shadow-2xs shadow-purple-950/15"
          >
            <CompassIcon className="h-3.5 w-3.5" />
            <span>Directions</span>
          </a>

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat with ${branch.name} on WhatsApp`}
              onClick={() => {
                trackEvent({
                  eventType: "WHATSAPP_CLICK",
                  entityType: "branch",
                  entityId: branch._id,
                  metadata: { source: "home-branch-card", label: branch.name },
                });
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#20BD5A] transition-colors shadow-2xs"
            >
              <WhatsAppIcon className="h-4.5 w-4.5 fill-current" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BranchesPreview({ branches }: BranchesPreviewProps) {
  // Empty State: 0 active branches
  if (!branches || branches.length === 0) {
    return (
      <section className="bg-white py-14 sm:py-20 border-t border-stone-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#7C3AED]">
              VISIT SALVORA
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Contact Us
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl mx-auto">
            Find the SALVORA branch nearest to you and get in touch with our team.
          </p>

          <div className="mt-8 p-8 rounded-2xl bg-[#FAF8F5] border border-stone-200 max-w-md mx-auto">
            <p className="text-sm text-stone-600 mb-4">
              Branch information is currently unavailable.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors"
            >
              <span>Contact Us</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Maximum 3 branches displayed on Home
  const displayedBranches = branches.slice(0, 3);

  return (
    <section className="bg-white py-14 sm:py-20 border-t border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#7C3AED]">
                VISIT SALVORA
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
              Contact Us
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
              Find the SALVORA branch nearest to you and get in touch with our team.
            </p>
          </div>

          <Link
            href="/contact"
            className="self-start md:self-auto shrink-0 group inline-flex items-center gap-2.5 rounded-full border border-purple-200 bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
          >
            <span>View All Branches</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Responsive Grid: Centered for 1, 2, or 3 cards (Desktop 3, Tablet 2, Mobile 1) */}
        <div
          className={`mx-auto ${
            displayedBranches.length === 1
              ? "max-w-md"
              : displayedBranches.length === 2
              ? "max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 justify-center"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-center"
          } items-stretch`}
        >
          {displayedBranches.map((branch, index) => {
            const isThirdCardInThree = displayedBranches.length === 3 && index === 2;
            return (
              <div
                key={branch._id}
                className={
                  isThirdCardInThree
                    ? "md:col-span-2 md:max-w-md md:mx-auto md:w-full lg:col-span-1 lg:max-w-none"
                    : "w-full"
                }
              >
                <HomeBranchCard branch={branch} />
              </div>
            );
          })}
        </div>

        {/* Bottom Link: View All Branches */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2.5 rounded-full border border-purple-200 bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
          >
            <span>View All Branches</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
