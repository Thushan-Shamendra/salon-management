import { PageCustomization } from "@/components/customization/PageCustomization";
import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Promotion from "@/models/Promotion";
import SalonSettings, { normalizePageVisibility } from "@/models/SalonSettings";
import Branch from "@/models/Branch";
import PromotionsHero from "@/components/promotions/PromotionsHero";
import PromotionsGridSection from "@/components/promotions/PromotionsGridSection";
import WhyLoveOurOffers from "@/components/promotions/WhyLoveOurOffers";
import PromotionsBottomCTA from "@/components/promotions/PromotionsBottomCTA";
import { PublicPromotion } from "@/components/promotions/PromotionCard";

import { normalizeWhatsAppNumber } from "@/lib/phone";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promotions Crafted For You | SALVORA Salon Offers & Deals",
  description:
    "Explore our latest seasonal beauty offers, discounts, bridal bonuses, and exclusive package savings at Salvora. Book limited-time salon promotions today.",
  openGraph: {
    title: "Promotions Crafted For You | SALVORA Offers",
    description:
      "Special beauty offers, seasonal savings, and exclusive salon deals designed for you.",
    type: "website",
  },
};

export default async function PromotionsPage() {
  let promotions: PublicPromotion[] = [];
  let salonName = "Salvora";
  let whatsappNumber = "";
  let bookingUrl = "";
  let isVisible = true;

  try {
    await connectDB();
    const now = new Date();
    const [dbPromotions, branches, totalBranchCount, settings] = await Promise.all([
      Promotion.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .populate("branchIds", "_id name whatsappNumber")
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      Branch.find({ isActive: true })
        .sort({ isMain: -1, displayOrder: 1, createdAt: 1 })
        .lean(),
      Branch.countDocuments(),
      SalonSettings.findOne().lean(),
    ]);

    if (settings) {
      isVisible = normalizePageVisibility(settings.pageVisibility).promotions;
      if (settings.salonName) salonName = settings.salonName;
      if (settings.externalSystem?.bookingUrl) {
        bookingUrl = settings.externalSystem.bookingUrl;
      }
    }

    // Branch is the SINGLE SOURCE OF TRUTH for WhatsApp:
    // 1. active Main Branch.whatsappNumber
    // 2. first active branch.whatsappNumber
    // 3. Legacy SalonSettings fallback ONLY if Branch collection is completely empty
    const mainBranch = branches.find((b) => b.isMain);
    const mainBranchWhatsapp = normalizeWhatsAppNumber(mainBranch?.whatsappNumber);

    const firstActiveBranch = branches.find((b) => normalizeWhatsAppNumber(b.whatsappNumber));
    const firstActiveWhatsapp = normalizeWhatsAppNumber(firstActiveBranch?.whatsappNumber);

    if (mainBranchWhatsapp) {
      whatsappNumber = mainBranchWhatsapp;
    } else if (firstActiveWhatsapp) {
      whatsappNumber = firstActiveWhatsapp;
    } else if (totalBranchCount === 0 && settings?.whatsapp) {
      whatsappNumber = normalizeWhatsAppNumber(settings.whatsapp);
    } else {
      whatsappNumber = "";
    }

    if (Array.isArray(dbPromotions) && dbPromotions.length > 0) {
      promotions = dbPromotions.map((p) => {
        let promoBranchWhatsapp = "";
        if (Array.isArray(p.branchIds) && p.branchIds.length > 0) {
          const relevantBranch = p.branchIds.find(
            (b: unknown) =>
              b &&
              typeof b === "object" &&
              "whatsappNumber" in b &&
              normalizeWhatsAppNumber((b as { whatsappNumber?: string }).whatsappNumber)
          ) as { whatsappNumber?: string } | undefined;

          if (relevantBranch?.whatsappNumber) {
            promoBranchWhatsapp = normalizeWhatsAppNumber(relevantBranch.whatsappNumber);
          }
        }

        return {
          _id: p._id.toString(),
          title: p.title,
          slug: p.slug,
          subtitle: p.subtitle,
          description: p.description,
          promoType: p.promoType,
          badgeText: p.badgeText,
          image: p.image,
          originalPrice: p.originalPrice ?? undefined,
          promotionalPrice: p.promotionalPrice ?? undefined,
          validDaysText: p.validDaysText,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          ctaType: p.ctaType,
          ctaCustomLabel: p.ctaCustomLabel,
          ctaCustomUrl: p.ctaCustomUrl,
          isFeatured: Boolean(p.isFeatured),
          branchWhatsapp: promoBranchWhatsapp || undefined,
        };
      });
    }
  } catch (err) {
    console.error("Error loading promotions page data:", err);
    promotions = [];
  }

  if (!isVisible) {
    notFound();
  }

  return (
    <PageCustomization scope="public" pageKey="promotions">
    <div className="min-h-screen flex flex-col bg-[#FAF9FB] text-stone-900">
      <Navbar />
      <main className="flex-1">
        <PromotionsHero salonName={salonName} />
        <PromotionsGridSection
          initialPromotions={promotions}
          whatsappNumber={whatsappNumber}
          bookingUrl={bookingUrl}
          salonName={salonName}
        />
        <WhyLoveOurOffers salonName={salonName} />
        <PromotionsBottomCTA
          whatsappNumber={whatsappNumber}
          salonName={salonName}
        />
      </main>
      <Footer />
    </div>
    </PageCustomization>
  );
}
