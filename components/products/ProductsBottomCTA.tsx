"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";
import { useBranchContext } from "@/components/context/BranchContext";
import { normalizeWhatsAppNumber } from "@/lib/phone";

interface ProductsBottomCTAProps {
  whatsappNumber?: string;
  salonName?: string;
}

export default function ProductsBottomCTA({
  whatsappNumber = "",
  salonName = "Salvora",
}: ProductsBottomCTAProps) {
  const custom = useSectionCustomization("bottom-cta");

  const router = useRouter();
  const { selectedBranchWhatsapp } = useBranchContext();

  const handleEnquire = () => {
    trackEvent({
      eventType: "WHATSAPP_CLICK",
      metadata: {
        source: "products-bottom-cta",
        label: "Product Routine Consultation",
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
      `Hello ${salonName}! I would like to get personalized product advice and routine recommendations for my hair and skin.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative overflow-hidden bg-[#0A0812] text-white py-20 sm:py-24 border-t border-white/10" data-customization-section="bottom-cta">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0">
        <Image
          src={custom.image("/images/products-bottom-cta.png")}
          alt={`${salonName} Personalized Product Routine Consultation`}
          fill
          sizes="100vw"
          className="object-cover object-right sm:object-right opacity-80 sm:opacity-90" data-customization-role="backgroundImage" unoptimized={Boolean(custom.style.backgroundImage?.url)}
        />
        {/* Controlled gradient overlay for crisp text readability while showcasing the product routine atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0812] via-[#0A0812]/85 to-[#0A0812]/20 sm:via-[#0A0812]/75 sm:to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#03BF62]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#03BF62]" />
            <span data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>Beauty Essentials</>}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
            Find the Right Product <br />
            for{" "}</>}
            <span className="bg-gradient-to-r from-[#03BF62] to-[#21C81E] bg-clip-text text-transparent" data-customization-role="highlight">{custom.has("highlightedText") ? custom.text("highlightedText", "") : <>
              Your Routine
            </>}</span>
          </h2>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
            Get personalized product recommendations from our professional {salonName} team
            and discover what works best for you.
          </>}</p>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleEnquire}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#03BF62] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 hover:bg-[#029e51] transition-all cursor-pointer active:scale-[0.98]" data-customization-role="primaryButton"
            >
              <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>Enquire Now</>}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
