import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WeddingHero from "@/components/wedding/WeddingHero";
import WeddingServicesSection from "@/components/wedding/WeddingServicesSection";
import WeddingPackagesSection from "@/components/wedding/WeddingPackagesSection";
import WhyChooseWedding from "@/components/wedding/WhyChooseWedding";
import WeddingConsultationCTA from "@/components/wedding/WeddingConsultationCTA";
import { connectDB } from "@/lib/mongodb";
import WeddingService from "@/models/WeddingService";
import WeddingPackage from "@/models/WeddingPackage";
import SalonSettings from "@/models/SalonSettings";
import { WeddingServiceCardData } from "@/components/wedding/WeddingServiceCard";
import { WeddingPackageCardData } from "@/components/wedding/WeddingPackageCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wedding Beauty Services | salvora",
  description:
    "Bridal makeup, hair styling, nail care, facials, and complete wedding packages designed to make you look and feel your best for your special day.",
};

export default async function WeddingPage() {
  let services: WeddingServiceCardData[] = [];
  let packages: WeddingPackageCardData[] = [];
  let bookingUrl = "";

  try {
    await connectDB();

    const [servicesDoc, packagesDoc, settings] = await Promise.all([
      WeddingService.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      WeddingPackage.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      SalonSettings.findOne().lean(),
    ]);

    if (servicesDoc) {
      services = servicesDoc.map((s) => ({
        _id: s._id.toString(),
        name: s.name,
        description: s.description || "",
        price: s.price || 0,
        duration: s.duration || 0,
        image: s.image || "",
      }));
    }

    if (packagesDoc) {
      packages = packagesDoc.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description || "",
        image: p.image || "",
        includedItems: p.includedItems || [],
        price: p.price || 0,
        durationText: p.durationText || "",
        isFeatured: Boolean(p.isFeatured),
      }));
    }

    if (settings?.externalSystem?.bookingUrl) {
      bookingUrl = settings.externalSystem.bookingUrl;
    }
  } catch (error) {
    console.error("Failed to load wedding page data:", error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Wedding Hero */}
        <WeddingHero bookingUrl={bookingUrl} />

        {/* 3. Single Wedding Services (real MongoDB records, cleanly hidden if empty) */}
        <WeddingServicesSection services={services} bookingUrl={bookingUrl} />

        {/* 4. Wedding Packages (real MongoDB records, cleanly hidden if empty) */}
        <WeddingPackagesSection packages={packages} bookingUrl={bookingUrl} />

        {/* 5. Why Choose Our Wedding Services */}
        <WhyChooseWedding />

        {/* 6. Wedding Consultation CTA */}
        <WeddingConsultationCTA bookingUrl={bookingUrl} />
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}
