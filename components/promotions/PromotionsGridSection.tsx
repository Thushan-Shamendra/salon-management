"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React, { useState, useMemo } from "react";
import PromotionCard, { PublicPromotion } from "./PromotionCard";

interface PromotionsGridSectionProps {
  initialPromotions: PublicPromotion[];
  whatsappNumber?: string;
  bookingUrl?: string;
  salonName?: string;
}

const PROMO_FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "service_offer", label: "Service Offers" },
  { id: "product_deal", label: "Product Deals" },
  { id: "wedding_offer", label: "Wedding Offers" },
  { id: "branch_offer", label: "Branch Offers" },
  { id: "limited_time", label: "Limited Time" },
];

export default function PromotionsGridSection({
  initialPromotions,
  whatsappNumber,
  bookingUrl,
  salonName,
}: PromotionsGridSectionProps) {
  const custom = useSectionCustomization("promotions-grid");

  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredPromotions = useMemo(() => {
    if (activeTab === "all") return initialPromotions;
    return initialPromotions.filter((p) => p.promoType === activeTab);
  }, [initialPromotions, activeTab]);

  return (
    <section className="bg-[#FAF9FB] py-16 sm:py-20" data-customization-section="promotions-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header (Matches Mockup) */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#03BF62]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#03BF62]" />
            <span data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>Special Deals</>}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
            Current Promotions
          </>}</h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
            Explore our latest salon and beauty offers, including seasonal savings, exclusive packages
            and limited-time deals designed just for you.
          </>}</p>
        </div>

        {/* Filter Pills (Matches Mockup) */}
        <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {PROMO_FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#03BF62] text-white shadow-md shadow-emerald-950/20"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Promotions Grid (3 Columns on Desktop matching Mockup) */}
        <div className="mt-10">
          {initialPromotions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-lg mx-auto">
              <p className="text-base font-semibold text-stone-800">
                There are no active promotions right now. Check back soon for new SALVORA offers.
              </p>
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto">
              <p className="text-sm font-semibold text-stone-800">No active promotions in this category</p>
              <p className="text-xs text-stone-500 mt-1">
                New offers are launched frequently. Check our other special deals or view all promotions.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="mt-4 rounded-xl bg-[#03BF62] px-4 py-2 text-xs font-semibold text-white hover:bg-[#029e51] cursor-pointer"
              >
                View All Promotions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPromotions.map((promo) => (
                <PromotionCard
                  key={promo._id}
                  promotion={promo}
                  whatsappNumber={whatsappNumber}
                  bookingUrl={bookingUrl}
                  salonName={salonName}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
