"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CalendarIcon } from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";
import { PromotionType, CtaType } from "@/lib/promotion-constants";
import { useBranchContext } from "@/components/context/BranchContext";
import { normalizeWhatsAppNumber } from "@/lib/phone";

export interface PublicPromotion {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  promoType: PromotionType;
  badgeText: string;
  image: string;
  originalPrice?: number;
  promotionalPrice?: number;
  validDaysText?: string;
  startDate: string;
  endDate: string;
  ctaType?: CtaType;
  ctaCustomLabel?: string;
  ctaCustomUrl?: string;
  isFeatured?: boolean;
  branchWhatsapp?: string;
}

interface PromotionCardProps {
  promotion: PublicPromotion;
  whatsappNumber?: string;
  bookingUrl?: string;
  salonName?: string;
}

export default function PromotionCard({
  promotion,
  whatsappNumber = "",
  bookingUrl,
  salonName = "Salvora",
}: PromotionCardProps) {
  const router = useRouter();
  const { selectedBranchWhatsapp } = useBranchContext();

  const getValidityDisplay = () => {
    if (promotion.validDaysText) return promotion.validDaysText;
    const end = new Date(promotion.endDate);
    if (!isNaN(end.getTime())) {
      return `Valid until ${end.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}`;
    }
    return "Limited Time";
  };

  const getCtaLabel = () => {
    if (promotion.ctaCustomLabel) return promotion.ctaCustomLabel;
    switch (promotion.promoType) {
      case "product_deal":
        return "Shop Now";
      case "wedding_offer":
        return "View Package";
      case "branch_offer":
        return "Explore";
      case "service_offer":
      case "limited_time":
      default:
        return "Book Offer";
    }
  };

  const handleCtaClick = () => {
    trackEvent({
      eventType: "PROMOTION_CLICK",
      entityType: "Promotion",
      entityId: promotion._id,
      metadata: {
        label: promotion.title,
        category: promotion.promoType,
        source: "promotion-card",
      },
    });

    const ctaType = promotion.ctaType || "whatsapp";

    if (ctaType === "booking" && bookingUrl) {
      window.open(bookingUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (ctaType === "service_link") {
      router.push("/services");
      return;
    }

    if (ctaType === "product_link") {
      router.push("/products");
      return;
    }

    if (ctaType === "wedding_link") {
      router.push("/wedding");
      return;
    }

    if (ctaType === "external_link" && promotion.ctaCustomUrl) {
      window.open(promotion.ctaCustomUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Default to WhatsApp enquiry:
    // 1. selected/relevant branch.whatsappNumber
    // 2. active Main Branch.whatsappNumber
    // 3. first active branch.whatsappNumber
    // 4. if no WhatsApp number exists -> /contact
    const cleanPhone =
      normalizeWhatsAppNumber(selectedBranchWhatsapp) ||
      normalizeWhatsAppNumber(promotion.branchWhatsapp) ||
      normalizeWhatsAppNumber(whatsappNumber);

    if (!cleanPhone) {
      router.push("/contact");
      return;
    }

    const priceText = promotion.promotionalPrice
      ? ` (Now LKR ${promotion.promotionalPrice.toLocaleString()})`
      : "";
    const msg = encodeURIComponent(
      `Hello ${salonName}! I would like to redeem the special promotion: "${promotion.title}" [${promotion.badgeText}]${priceText}. Please let me know how I can book this offer.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs hover:shadow-lg transition-all duration-200">
      <div>
        {/* Banner with Floating Badge on Top-Left (Matches Mockup) */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={promotion.image}
            alt={promotion.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Floating Pill Badge (Top-Left) */}
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-[#03BF62] px-3 py-1 text-xs font-bold text-white shadow-md shadow-[#03BF62]/25">
              {promotion.badgeText}
            </span>
          </div>
        </div>

        {/* Promotion Details */}
        <div className="mt-4 space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug line-clamp-1 group-hover:text-[#03BF62] transition-colors">
            {promotion.title}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed min-h-[2rem]">
            {promotion.description}
          </p>

          {/* Validity Row with Calendar Icon (Matches Mockup) */}
          <div className="pt-2 flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <CalendarIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            <span>{getValidityDisplay()}</span>
          </div>

          {/* Pricing Row (Matches Mockup: Now LKR X,XXX / LKR Y,YYY) */}
          {(promotion.promotionalPrice || promotion.originalPrice) && (
            <div className="pt-1 flex items-baseline gap-2">
              {promotion.promotionalPrice && (
                <span className="text-sm sm:text-base font-extrabold text-stone-900">
                  <span className="text-xs font-semibold text-stone-500 mr-1">Now</span>
                  LKR {promotion.promotionalPrice.toLocaleString()}
                </span>
              )}
              {promotion.originalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  LKR {promotion.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic CTA Button (Matches Mockup) */}
      <div className="mt-4 pt-1">
        <button
          type="button"
          onClick={handleCtaClick}
          className="w-full rounded-xl py-2.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 bg-[#ECEBEF] text-stone-800 hover:bg-[#03BF62] hover:text-white transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
          aria-label={`Claim offer: ${promotion.title}`}
        >
          <span>{getCtaLabel()}</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
