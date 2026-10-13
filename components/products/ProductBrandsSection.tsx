"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React from "react";
import { ExternalLinkIcon } from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";

export interface ProductBrandData {
  _id: string;
  name: string;
  logo: string;
  description?: string;
  websiteUrl?: string;
  branchIds?: Array<{ _id: string; name: string }>;
}

interface ProductBrandsSectionProps {
  products: ProductBrandData[];
}

export default function ProductBrandsSection({ products }: ProductBrandsSectionProps) {
  const custom = useSectionCustomization("product-brands");

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="bg-stone-50/60 py-16 sm:py-20 lg:py-24 border-b border-stone-100" data-customization-section="product-brands">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-2 justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-[#03BF62]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#03BF62]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
              PRODUCTS WE USE
            </>}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
            Premium Brands for Exceptional Care
          </>}</h2>
          <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
            We only work with world-class, salon-grade product lines carefully selected to guarantee radiant, healthy, and long-lasting results.
          </>}</p>
        </div>

        {/* Responsive Logo Grid: Mobile 2, Tablet 3-4, Desktop 4-6 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 items-stretch">
          {products.map((brand) => {
            const cardContent = (
              <div className="group relative flex flex-col items-center justify-between h-full rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs transition-all duration-300 hover:border-[#03BF62]/40 hover:shadow-md hover:-translate-y-0.5">
                {/* Logo Frame */}
                <div className="relative h-20 w-full flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-16 max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Brand Name */}
                <div className="w-full text-center mt-3 pt-2.5 border-t border-stone-100">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs font-bold text-stone-800 group-hover:text-[#03BF62] transition-colors truncate">
                      {brand.name}
                    </p>
                    {brand.websiteUrl && (
                      <ExternalLinkIcon className="h-3 w-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                  {brand.description ? (
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {brand.description}
                    </p>
                  ) : null}
                </div>
              </div>
            );

            if (brand.websiteUrl) {
              return (
                <a
                  key={brand._id}
                  href={brand.websiteUrl}
                  onClick={() => {
                    trackEvent({
                      eventType: "PRODUCT_CLICK",
                      entityId: brand._id,
                      entityType: "product-brand",
                      metadata: {
                        source: "products-we-use",
                        label: brand.name,
                      },
                    });
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full focus:outline-none focus:ring-2 focus:ring-[#03BF62]/20 rounded-2xl"
                  title={`Visit ${brand.name}`}
                >
                  {cardContent}
                </a>
              );
            }

            return (
              <div key={brand._id} className="h-full">
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
