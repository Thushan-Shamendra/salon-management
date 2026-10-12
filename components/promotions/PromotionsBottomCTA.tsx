"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";
import { useBranchContext } from "@/components/context/BranchContext";
import { normalizeWhatsAppNumber } from "@/lib/phone";

interface PromotionsBottomCTAProps {
  whatsappNumber?: string;
  salonName?: string;
}

export default function PromotionsBottomCTA({
  whatsappNumber = "",
  salonName = "Salvora",
}: PromotionsBottomCTAProps) {
  const custom = useSectionCustomization("bottom-cta");

  const router = useRouter();
  const { selectedBranchWhatsapp } = useBranchContext();

  const handleContact = () => {
    trackEvent({
      eventType: "WHATSAPP_CLICK",
      metadata: {
        source: "promotions-bottom-cta",
        label: "Promotions General Enquiry",
      },
    });

    const cleanPhone =
      normalizeWhatsAppNumber(selectedBranchWhatsapp) ||
      normalizeWhatsAppNumber(whatsappNumber);

    if (!cleanPhone) {
      router.push("/contact");
      return;
    }

    const msg = encodeURIComponent(
      `Hello ${salonName}! I saw your special promotions on the website and would like to know more about current deals and availability.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative overflow-hidden bg-[#0A0812] text-white py-20 sm:py-24 border-t border-white/10" data-customization-section="bottom-cta">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0">
        <Image
          src={custom.image("/images/promotions-bottom-cta.png")}
          alt={`${salonName} Exclusive Salon Deals`}
          fill
          sizes="100vw"
          className="object-cover object-right sm:object-right opacity-80 sm:opacity-90" data-customization-role="backgroundImage" unoptimized={Boolean(custom.style.backgroundImage?.url)}
        />
        {/* Controlled gradient overlay for crisp text readability while showing the warm spa ambiance */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0812] via-[#0A0812]/85 to-[#0A0812]/20 sm:via-[#0A0812]/75 sm:to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#A78BFA]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A78BFA]" />
            <span data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>Limited Time</>}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
            Don&apos;t Miss Your <br />
            Next{" "}</>}
            <span className="bg-gradient-to-r from-[#A78BFA] to-[#C4B5FD] bg-clip-text text-transparent" data-customization-role="highlight">{custom.has("highlightedText") ? custom.text("highlightedText", "") : <>
              Beauty Deal
            </>}</span>
          </h2>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
            Book your preferred offer or contact our {salonName} team to find the best
            promotion for your needs.
          </>}</p>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleContact}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/40 hover:from-[#6D28D9] hover:to-[#5B21B6] transition-all cursor-pointer active:scale-[0.98]" data-customization-role="primaryButton"
            >
              <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>See All Offers</>}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
