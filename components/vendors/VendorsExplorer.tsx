"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React, { useState, useMemo } from "react";
import { VENDOR_CATEGORIES } from "@/lib/vendor-constants";
import { trackEvent } from "@/lib/analytics-client";
import {
  PhoneIcon,
  WhatsAppIcon,
  ExternalLinkIcon,
  InstagramIcon,
  MapPinIcon,
  StarIcon,
  StoreIcon,
} from "@/components/ui/icons";

export interface PublicBranchInfo {
  _id: string;
  name: string;
  slug: string;
}

export interface PublicVendorItem {
  _id: string;
  name: string;
  category: string;
  description?: string;
  image: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  branchIds?: PublicBranchInfo[];
  isFeatured: boolean;
  displayOrder: number;
}

interface VendorsExplorerProps {
  initialVendors: PublicVendorItem[];
  branches: PublicBranchInfo[];
}

function formatWhatsAppLink(phoneStr: string, vendorName: string): string {
  let cleaned = phoneStr.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "94" + cleaned.slice(1);
  }
  const msg = encodeURIComponent(
    `Hello ${vendorName}, I found your business through the SALVORA website and would like more information.`
  );
  return `https://wa.me/${cleaned}?text=${msg}`;
}

export default function VendorsExplorer({
  initialVendors,
  branches,
}: VendorsExplorerProps) {
  const custom = useSectionCustomization("vendors-grid");

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  // Filtering
  const filteredVendors = useMemo(() => {
    return initialVendors.filter((vendor) => {
      // Category filter
      if (
        selectedCategory !== "All" &&
        vendor.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      // Branch filter
      if (selectedBranchId !== "all") {
        // If vendor has specific branches assigned, must match selected branch
        if (vendor.branchIds && vendor.branchIds.length > 0) {
          const matchesBranch = vendor.branchIds.some(
            (b) => b._id === selectedBranchId
          );
          if (!matchesBranch) return false;
        }
        // If unassigned / general, vendor is available across all branches
      }

      return true;
    });
  }, [initialVendors, selectedCategory, selectedBranchId]);

  // Featured vendors (within filtered results)
  const featuredVendors = useMemo(() => {
    return filteredVendors.filter((v) => v.isFeatured);
  }, [filteredVendors]);

  // Regular vendors (or all vendors if featured section is separate)
  const nonFeaturedVendors = useMemo(() => {
    return filteredVendors.filter((v) => !v.isFeatured);
  }, [filteredVendors]);

  const categories = ["All", ...VENDOR_CATEGORIES];

  const renderVendorCard = (vendor: PublicVendorItem, isHighlight = false) => {
    const isAssigned = vendor.branchIds && vendor.branchIds.length > 0;
    const hasAnyAction =
      Boolean(vendor.phone) ||
      Boolean(vendor.whatsapp) ||
      Boolean(vendor.website) ||
      Boolean(vendor.instagram);

    return (
      <div
        key={vendor._id}
        className={`group flex flex-col justify-between rounded-2xl border bg-white p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 ${
          isHighlight
            ? "border-[#03BF62]/30 shadow-md hover:shadow-xl hover:border-[#03BF62]"
            : "border-stone-200/90 shadow-xs hover:shadow-lg hover:border-[#03BF62]/40"
        }`}
      >
        <div>
          {/* Card Image */}
          <div className="relative h-48 sm:h-52 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200/60 mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vendor.image}
              alt={vendor.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
            />

            {/* Logo Badge Overlay */}
            {vendor.logo && (
              <div className="absolute bottom-3 left-3 h-11 w-11 rounded-xl bg-white/95 p-1.5 shadow-md border border-stone-200/80 backdrop-blur-xs flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vendor.logo}
                  alt={`${vendor.name} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-stone-900/85 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                {vendor.category}
              </span>
              {vendor.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-stone-950 shadow-xs">
                  <StarIcon className="h-3 w-3 fill-stone-950 text-stone-950" />
                  <span>Featured</span>
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5">
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#03BF62] transition-colors line-clamp-1">
              {vendor.name}
            </h3>

            {vendor.description && (
              <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed">
                {vendor.description}
              </p>
            )}

            {/* Branch Availability */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <MapPinIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              {isAssigned ? (
                vendor.branchIds!.map((b) => (
                  <span
                    key={b._id}
                    className="rounded-full bg-[#03BF62]/10 border border-[#03BF62]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#03BF62]"
                  >
                    {b.name}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-stone-500 font-medium">
                  Available across all salon locations
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        {hasAnyAction && (
          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-2">
            {/* Quick Call */}
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone.trim()}`}
                onClick={() => {
                  trackEvent({
                    eventType: "VENDOR_CLICK",
                    entityId: vendor._id,
                    entityType: "vendor",
                    page: "/vendors",
                    metadata: {
                      source: "call",
                      label: vendor.name,
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 hover:border-[#03BF62]/40 transition-colors cursor-pointer"
                aria-label={`Call ${vendor.name}`}
              >
                <PhoneIcon className="h-3.5 w-3.5 text-[#03BF62]" />
                <span>Call</span>
              </a>
            )}

            {/* WhatsApp */}
            {vendor.whatsapp && (
              <a
                href={formatWhatsAppLink(vendor.whatsapp, vendor.name)}
                onClick={() => {
                  trackEvent({
                    eventType: "VENDOR_CLICK",
                    entityId: vendor._id,
                    entityType: "vendor",
                    page: "/vendors",
                    metadata: {
                      source: "whatsapp",
                      label: vendor.name,
                    },
                  });
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer"
                aria-label={`Chat with ${vendor.name} on WhatsApp`}
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Website */}
            {vendor.website && (
              <a
                href={vendor.website}
                onClick={() => {
                  trackEvent({
                    eventType: "VENDOR_CLICK",
                    entityId: vendor._id,
                    entityType: "vendor",
                    page: "/vendors",
                    metadata: {
                      source: "website",
                      label: vendor.name,
                    },
                  });
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 hover:border-[#03BF62] hover:text-[#03BF62] transition-colors cursor-pointer"
                aria-label={`Visit ${vendor.name} website`}
              >
                <span>Website</span>
                <ExternalLinkIcon className="h-3 w-3 text-stone-400" />
              </a>
            )}

            {/* Instagram */}
            {vendor.instagram && (
              <a
                href={vendor.instagram}
                onClick={() => {
                  trackEvent({
                    eventType: "VENDOR_CLICK",
                    entityId: vendor._id,
                    entityType: "vendor",
                    page: "/vendors",
                    metadata: {
                      source: "instagram",
                      label: vendor.name,
                    },
                  });
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50/40 px-3.5 py-2 text-xs font-semibold text-pink-700 shadow-2xs hover:bg-pink-100 transition-colors cursor-pointer"
                aria-label={`View ${vendor.name} on Instagram`}
              >
                <InstagramIcon className="h-3.5 w-3.5 text-pink-600" />
                <span>Instagram</span>
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20" data-customization-section="vendors-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ============================================================== */}
        {/* FILTERS TOOLBAR                                                */}
        {/* ============================================================== */}
        <div className="space-y-6">
          {/* 1. Category Filter Pills */}
          <div className="flex flex-col items-center space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#03BF62]">
              BROWSE BY SPECIALTY
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#03BF62] text-white shadow-md shadow-emerald-950/20 scale-102"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Branch Filter Pills (if multiple active branches) */}
          {branches.length > 1 && (
            <div className="flex flex-col items-center space-y-2.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">
                FILTER BY SALVORA LOCATION
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBranchId("all")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selectedBranchId === "all"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  <span>All Locations</span>
                </button>

                {branches.map((b) => {
                  const isSelected = selectedBranchId === b._id;
                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => setSelectedBranchId(b._id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-stone-900 text-white shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <MapPinIcon className="h-3 w-3 text-stone-400" />
                      <span>{b.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* EMPTY STATE                                                    */}
        {/* ============================================================== */}
        {filteredVendors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center max-w-lg mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03BF62]/10 text-[#03BF62] mb-4">
              <StoreIcon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              No Partners Found
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
              No vendors are currently listed under {selectedCategory}
              {selectedBranchId !== "all" ? " for this location" : ""}. Check back soon as we continuously partner with leading wedding and event providers!
            </p>
            {(selectedCategory !== "All" || selectedBranchId !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedBranchId("all");
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#03BF62] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#029e51] transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-16">
            {/* ============================================================== */}
            {/* FEATURED PARTNERS SECTION                                      */}
            {/* ============================================================== */}
            {featuredVendors.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600">
                    <StarIcon className="h-4 w-4 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#03BF62]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
                      PREMIER HIGHLIGHTS
                    </>}</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
                      Featured Partners
                    </>}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {featuredVendors.map((vendor) => renderVendorCard(vendor, true))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ALL / REMAINING VENDORS GRID                                   */}
            {/* ============================================================== */}
            {nonFeaturedVendors.length > 0 && (
              <div className="space-y-6">
                {featuredVendors.length > 0 && (
                  <div className="pt-4 border-t border-stone-200/60">
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900" data-customization-role="subheading">{custom.has("subheading") ? custom.text("subheading", "") : <>
                      All Trusted Service Providers
                    </>}</h2>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {nonFeaturedVendors.map((vendor) => renderVendorCard(vendor, false))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VENDOR DISCLAIMER NOTE                                         */}
        {/* ============================================================== */}
        <div className="pt-8 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Vendor information is provided for convenience. Availability, pricing, and service terms should be confirmed directly with each vendor.
          </p>
        </div>
      </div>
    </section>
  );
}
