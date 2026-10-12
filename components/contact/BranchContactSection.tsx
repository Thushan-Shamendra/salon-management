"use client";

import React, { useState, useEffect, useMemo } from "react";
import QuickCall from "@/components/QuickCall";
import { useBranchContext } from "@/components/context/BranchContext";
import { trackEvent } from "@/lib/analytics-client";
import {
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
  MailIcon,
  ClockIcon,
  ExternalLinkIcon,
  CompassIcon,
} from "@/components/ui/icons";

export interface BranchData {
  _id: string;
  name: string;
  slug?: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  openingHours?: Array<{
    day: string;
    isClosed: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
  displayOrder?: number;
  isMain?: boolean;
}

export interface FallbackSettingsData {
  salonName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  openingHours?: Array<{
    day: string;
    open?: string;
    close?: string;
    isClosed?: boolean;
  }>;
  businessUrl?: string;
}

interface BranchContactSectionProps {
  initialBranches?: BranchData[];
  fallbackSettings?: FallbackSettingsData;
}

function normalizeWhatsAppNumber(raw?: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[\s+\-()]/g, "").trim();
  return /^\d{7,15}$/.test(cleaned) ? cleaned : "";
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

export default function BranchContactSection({
  initialBranches = [],
  fallbackSettings,
}: BranchContactSectionProps) {
  const [branches, setBranches] = useState<BranchData[]>(initialBranches);
  const [loading, setLoading] = useState(initialBranches.length === 0 && !fallbackSettings);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialBranches.find((b) => b.isMain)?._id || initialBranches[0]?._id || ""
  );

  const {
    selectedBranchId: contextBranchId,
    setSelectedBranchId: setContextBranchId,
    setSelectedBranchWhatsapp,
  } = useBranchContext();

  const handleSelectBranch = (id: string) => {
    setSelectedBranchId(id);
    setContextBranchId(id);
  };

  // If no initial branches were provided, fetch them from /api/branches
  useEffect(() => {
    if (initialBranches.length > 0) return;

    let isMounted = true;
    async function fetchBranches() {
      try {
        const res = await fetch("/api/branches");
        const data = await res.json();
        if (isMounted && res.ok && data.success && Array.isArray(data.branches) && data.branches.length > 0) {
          setBranches(data.branches);
          const chosen = data.branches.find((b: BranchData) => b.isMain) || data.branches[0];
          setSelectedBranchId(chosen._id);
          setContextBranchId(chosen._id);
        }
      } catch {
        // Handled via fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchBranches();
    return () => {
      isMounted = false;
    };
  }, [initialBranches.length, setContextBranchId]);

  // Selected branch or fallback
  const hasBranches = branches.length > 0;
  const effectiveBranchId = contextBranchId || selectedBranchId;
  const selectedBranch = useMemo(() => {
    if (!hasBranches) return null;
    return branches.find((b) => b._id === effectiveBranchId) || branches[0];
  }, [branches, effectiveBranchId, hasBranches]);

  // Sync WhatsApp number to BranchContext for floating button
  useEffect(() => {
    if (selectedBranch) {
      setSelectedBranchWhatsapp(selectedBranch.whatsappNumber || selectedBranch.phone);
    } else if (fallbackSettings) {
      setSelectedBranchWhatsapp(fallbackSettings.whatsapp || fallbackSettings.phone);
    }
  }, [selectedBranch, fallbackSettings, setSelectedBranchWhatsapp]);

  // Compute map embed URL and external links based on map priority:
  // 1. latitude + longitude
  // 2. googleMapsUrl
  // 3. encoded branch address
  const mapData = useMemo(() => {
    if (selectedBranch) {
      const { latitude, longitude, googleMapsUrl, address } = selectedBranch;

      let embedUrl = "";
      let queryParam = "";

      if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
        embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=15&output=embed`;
        queryParam = `${latitude},${longitude}`;
      } else if (googleMapsUrl && googleMapsUrl.includes("/maps/embed")) {
        embedUrl = googleMapsUrl;
        queryParam = encodeURIComponent(address);
      } else {
        const encodedAddress = encodeURIComponent(address);
        embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        queryParam = encodedAddress;
      }

      const searchUrl =
        googleMapsUrl && !googleMapsUrl.includes("/maps/embed")
          ? googleMapsUrl
          : `https://www.google.com/maps/search/?api=1&query=${queryParam}`;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${queryParam}`;

      return { embedUrl, searchUrl, directionsUrl, address };
    }

    // Fallback mode using fallbackSettings
    if (fallbackSettings) {
      const address = fallbackSettings.address || "Colombo, Sri Lanka";
      const isEmbed = Boolean(fallbackSettings.businessUrl?.includes("/maps/embed"));
      const encodedAddress = encodeURIComponent(address);

      const embedUrl = isEmbed
        ? fallbackSettings.businessUrl!
        : `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      const searchUrl =
        fallbackSettings.businessUrl && !isEmbed
          ? fallbackSettings.businessUrl
          : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

      return { embedUrl, searchUrl, directionsUrl, address };
    }

    return null;
  }, [selectedBranch, fallbackSettings]);

  // WhatsApp click link for currently active location
  const whatsappLink = useMemo(() => {
    const rawNumber = selectedBranch
      ? selectedBranch.whatsappNumber || selectedBranch.phone
      : fallbackSettings?.whatsapp || fallbackSettings?.phone;

    const cleaned = normalizeWhatsAppNumber(rawNumber);
    if (!cleaned) return null;

    const msg = encodeURIComponent(
      "Hello SALVORA, I would like to know more about your salon services."
    );
    return `https://wa.me/${cleaned}?text=${msg}`;
  }, [selectedBranch, fallbackSettings]);

  // Render Skeleton when initially loading
  if (loading) {
    return (
      <section className="bg-white py-12 sm:py-16 border-b border-stone-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="flex gap-3 justify-center">
              <div className="h-10 w-28 bg-stone-200 rounded-full" />
              <div className="h-10 w-28 bg-stone-200 rounded-full" />
              <div className="h-10 w-28 bg-stone-200 rounded-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6 h-96 bg-stone-100 rounded-3xl" />
              <div className="lg:col-span-6 h-96 bg-stone-100 rounded-3xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Active view information
  const branchName = selectedBranch
    ? `SALVORA ${selectedBranch.name}`
    : fallbackSettings?.salonName || "SALVORA Salon";

  const branchPhone = selectedBranch ? selectedBranch.phone : fallbackSettings?.phone || "";
  const branchEmail = selectedBranch ? selectedBranch.email : fallbackSettings?.email || "";
  const branchAddress = selectedBranch ? selectedBranch.address : fallbackSettings?.address || "";

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20 border-b border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================== */}
        {/* BRANCH SELECTOR TABS (WHEN BRANCH RECORDS EXIST)           */}
        {/* ========================================================== */}
        {hasBranches && (
          <div className="mb-10 sm:mb-12">
            <div className="text-center mb-5">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
                SELECT A LOCATION
              </span>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Choose a salon location to view branch-specific contact information and directions.
              </p>
            </div>

            {/* Horizontal Scrollable Tabs on Mobile */}
            <div className="flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto pb-2 px-1 no-scrollbar">
              {branches.map((b) => {
                const isSelected = b._id === selectedBranch?._id;
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => handleSelectBranch(b._id)}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-[#7C3AED] text-white shadow-md shadow-purple-600/30 scale-102"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900 border border-stone-200/60"
                    }`}
                  >
                    <MapPinIcon
                      className={`h-4 w-4 ${
                        isSelected ? "text-white" : "text-[#7C3AED]"
                      }`}
                    />
                    <span>{b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fallback Notice if no branches configured yet */}
        {!hasBranches && (
          <div className="mb-8 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-center text-xs text-stone-600 max-w-2xl mx-auto">
            <span className="font-semibold text-stone-800">
              Welcome to SALVORA Salon
            </span>{" "}
            — Displaying our primary salon studio location and contact information.
          </div>
        )}

        {/* ========================================================== */}
        {/* BRANCH INFORMATION (LEFT) & GOOGLE MAP (RIGHT)             */}
        {/* ========================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* ================= LEFT SIDE: BRANCH DETAILS ============= */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-[#FAF8F5] p-6 sm:p-8 lg:p-10 shadow-xs">
            <div className="space-y-6">
              {/* Branch Title & Pill */}
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
                    BRANCH DETAILS
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                  {branchName}
                </h2>
              </div>

              {/* Contact Details List */}
              <div className="space-y-4 pt-2">
                {/* Physical Address */}
                {branchAddress && (
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#7C3AED] border border-stone-200/80 shadow-2xs mt-0.5">
                      <MapPinIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Address
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-stone-800 mt-0.5 leading-relaxed">
                        {branchAddress}
                      </p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {branchPhone && (
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-700 border border-stone-200/80 shadow-2xs mt-0.5">
                      <PhoneIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Telephone
                      </p>
                      <a
                        href={`tel:${branchPhone.replace(/[^\d+]/g, "")}`}
                        className="text-xs sm:text-sm font-semibold text-stone-900 hover:text-[#7C3AED] transition-colors mt-0.5 inline-block"
                      >
                        {branchPhone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {branchEmail && (
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-700 border border-stone-200/80 shadow-2xs mt-0.5">
                      <MailIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Email Address
                      </p>
                      <a
                        href={`mailto:${branchEmail}`}
                        className="text-xs sm:text-sm font-semibold text-stone-900 hover:text-[#7C3AED] transition-colors mt-0.5 inline-block"
                      >
                        {branchEmail}
                      </a>
                    </div>
                  </div>
                )}

                {/* Opening Hours Schedule */}
                <div className="flex items-start gap-3.5 pt-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-700 border border-stone-200/80 shadow-2xs mt-0.5">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Opening Hours
                    </p>

                    {/* Schedule Grid */}
                    {selectedBranch?.openingHours && selectedBranch.openingHours.length > 0 ? (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        {selectedBranch.openingHours.map((h) => (
                          <div
                            key={h.day}
                            className={`flex items-center justify-between px-2.5 py-1 rounded-lg ${
                              h.isClosed ? "bg-stone-200/50 text-stone-500" : "bg-white/80 text-stone-800"
                            }`}
                          >
                            <span className="font-semibold text-[11px]">{h.day}</span>
                            <span className="text-[11px]">
                              {h.isClosed
                                ? "Closed"
                                : `${formatTime(h.openTime)} - ${formatTime(h.closeTime)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : fallbackSettings?.openingHours && fallbackSettings.openingHours.length > 0 ? (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        {fallbackSettings.openingHours.map((h) => (
                          <div
                            key={h.day}
                            className={`flex items-center justify-between px-2.5 py-1 rounded-lg ${
                              h.isClosed ? "bg-stone-200/50 text-stone-500" : "bg-white/80 text-stone-800"
                            }`}
                          >
                            <span className="font-semibold text-[11px]">{h.day}</span>
                            <span className="text-[11px]">
                              {h.isClosed
                                ? "Closed"
                                : `${formatTime(h.open)} - ${formatTime(h.close)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-600 mt-1">
                        Mon – Sat: 09:00 AM – 07:00 PM | Sun: 10:00 AM – 05:00 PM
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS ROW (CALL | WHATSAPP | MAP) */}
            <div className="mt-8 pt-6 border-t border-stone-200/80 flex flex-wrap items-center gap-3">
              {/* 1. Quick Call Button */}
              {branchPhone && (
                <QuickCall
                  phone={branchPhone}
                  label="Quick Call"
                  variant="primary"
                  ariaLabel={`Call ${branchName} at ${branchPhone}`}
                  branchId={selectedBranch?._id}
                  source="contact-page"
                  page="/contact"
                />
              )}

              {/* 2. WhatsApp Button */}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  onClick={() => {
                    trackEvent({
                      eventType: "WHATSAPP_CLICK",
                      branchId: selectedBranch?._id || undefined,
                      page: "/contact",
                      metadata: {
                        source: "contact-page",
                      },
                    });
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with ${branchName} on WhatsApp`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-emerald-700/20 hover:bg-[#20BD5A] transition-all active:scale-[0.98]"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0 fill-current" />
                  <span>WhatsApp</span>
                </a>
              )}

              {/* 3. Get Directions / Map Button */}
              {mapData?.directionsUrl && (
                <a
                  href={mapData.directionsUrl}
                  onClick={() => {
                    trackEvent({
                      eventType: "MAP_CLICK",
                      branchId: selectedBranch?._id || undefined,
                      page: "/contact",
                      metadata: {
                        source: "contact-page",
                        label: "Get Directions",
                      },
                    });
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-800 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all active:scale-[0.98]"
                >
                  <CompassIcon className="h-4 w-4 shrink-0" />
                  <span>Get Directions</span>
                </a>
              )}
            </div>
          </div>

          {/* ================= RIGHT SIDE: GOOGLE MAP PREVIEW ========= */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm bg-stone-100 flex flex-col">
              {/* Responsive Iframe Embed */}
              {mapData?.embedUrl ? (
                <iframe
                  key={mapData.embedUrl}
                  title={`${branchName} Location Map`}
                  src={mapData.embedUrl}
                  className="w-full h-full flex-1 border-0 min-h-[380px]"
                  loading="lazy"
                  allowFullScreen
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center text-stone-400">
                  <p>Map view unavailable</p>
                </div>
              )}

              {/* Floating Map Footer Bar */}
              {mapData && (
                <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <MapPinIcon className="h-5 w-5 text-[#7C3AED] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                        {branchName}
                      </h4>
                      <p className="text-xs text-stone-500 line-clamp-1">
                        {mapData.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={mapData.searchUrl}
                      onClick={() => {
                        trackEvent({
                          eventType: "MAP_CLICK",
                          branchId: selectedBranch?._id || undefined,
                          page: "/contact",
                          metadata: {
                            source: "contact-map-preview",
                            label: "Open Map",
                          },
                        });
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-[#7C3AED] transition-all"
                    >
                      <span>Open Map</span>
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>

                    <a
                      href={mapData.directionsUrl}
                      onClick={() => {
                        trackEvent({
                          eventType: "MAP_CLICK",
                          branchId: selectedBranch?._id || undefined,
                          page: "/contact",
                          metadata: {
                            source: "contact-map-preview",
                            label: "Directions",
                          },
                        });
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all"
                    >
                      <span>Directions</span>
                      <CompassIcon className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
