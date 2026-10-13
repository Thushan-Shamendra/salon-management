import { PageCustomization } from "@/components/customization/PageCustomization";
import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactHero from "@/components/contact/ContactHero";
import BranchContactSection, {
  BranchData,
  FallbackSettingsData,
} from "@/components/contact/BranchContactSection";
import BranchOpeningHours from "@/components/contact/BranchOpeningHours";
import ContactFormAndMap from "@/components/contact/ContactFormAndMap";
import ContactFaq from "@/components/contact/ContactFaq";
import BookingCTA from "@/components/home/BookingCTA";
import { connectDB } from "@/lib/mongodb";
import Branch from "@/models/Branch";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us | SALVORA",
  description:
    "Get in touch with SALVORA salon locations for inquiries, guidance, and beauty appointments.",
};

async function getContactData(): Promise<{
  branches: BranchData[];
  fallbackSettings: FallbackSettingsData;
  bookingUrl: string;
}> {
  try {
    await connectDB();

    const [branchDocs, settingsDoc] = await Promise.all([
      Branch.find({ isActive: true })
        .sort({ isMain: -1, displayOrder: 1, createdAt: 1 })
        .lean(),
      SalonSettings.findOne().lean(),
    ]);

    const branches: BranchData[] = Array.isArray(branchDocs)
      ? branchDocs.map((b) => ({
          _id: String(b._id),
          name: b.name || "",
          slug: b.slug || "",
          phone: b.phone || "",
          whatsappNumber: b.whatsappNumber || "",
          email: b.email || "",
          address: b.address || "",
          latitude: typeof b.latitude === "number" ? b.latitude : undefined,
          longitude: typeof b.longitude === "number" ? b.longitude : undefined,
          googleMapsUrl: b.googleMapsUrl || "",
          openingHours: Array.isArray(b.openingHours)
            ? b.openingHours.map((h) => ({
                day: String(h.day),
                isClosed: Boolean(h.isClosed),
                openTime: h.openTime || "",
                closeTime: h.closeTime || "",
              }))
            : [],
          displayOrder: typeof b.displayOrder === "number" ? b.displayOrder : 0,
          isMain: Boolean(b.isMain),
        }))
      : [];

    const fallbackSettings: FallbackSettingsData = {
      salonName: settingsDoc?.salonName || "SALVORA Luxury Salon",
      phone: settingsDoc?.phone || "",
      whatsapp: settingsDoc?.whatsapp || settingsDoc?.phone || "",
      email: settingsDoc?.email || "",
      address: settingsDoc?.address || "",
      openingHours: Array.isArray(settingsDoc?.openingHours)
        ? settingsDoc.openingHours.map((h) => ({
            day: String(h.day),
            open: h.open || "",
            close: h.close || "",
            isClosed: Boolean(h.isClosed),
          }))
        : [],
      businessUrl: settingsDoc?.googleReviews?.businessUrl || "",
    };

    return {
      branches,
      fallbackSettings,
      bookingUrl: settingsDoc?.externalSystem?.bookingUrl || "",
    };
  } catch (error) {
    console.error("Failed to load contact data:", error);
    return {
      branches: [],
      fallbackSettings: {
        salonName: "SALVORA Luxury Salon",
        phone: "",
        email: "",
        address: "",
        openingHours: [],
      },
      bookingUrl: "",
    };
  }
}

export default async function ContactPage() {
  const { branches, fallbackSettings, bookingUrl } = await getContactData();

  // If branches exist, pick the first branch for auxiliary address/email props
  const primaryAddress =
    branches[0]?.address || fallbackSettings.address || "Colombo, Sri Lanka";
  const primaryEmail =
    branches[0]?.email || fallbackSettings.email || "info@salvora.lk";
  const primaryPhone =
    branches[0]?.phone || fallbackSettings.phone || "";

  return (
    <PageCustomization scope="public" pageKey="contact">
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-[#03BF62]/30 selection:text-stone-900">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Contact Hero */}
        <ContactHero />

        {/* 3. Branch-Wise Location Selector & Details (Tabs, Quick Call, WhatsApp, Google Map) */}
        <BranchContactSection
          initialBranches={branches}
          fallbackSettings={fallbackSettings}
        />

        {/* 4. Separate Branch-Wise Opening Hours Schedule */}
        <BranchOpeningHours
          branches={branches}
          fallbackSettings={fallbackSettings}
        />

        {/* 5. Inquiry / Message Form */}
        <ContactFormAndMap
          salonName={fallbackSettings.salonName}
          address={primaryAddress}
          email={primaryEmail}
          phone={primaryPhone}
          businessUrl={fallbackSettings.businessUrl}
        />

        {/* 5. Quick Information / FAQ */}
        <ContactFaq address={primaryAddress} />

        {/* 6. Booking CTA */}
        <BookingCTA
          tag="✦ READY FOR YOUR VISIT"
          heading="Book Your Next Appointment"
          description="Choose your preferred service and continue to our salon booking system."
          bookingUrl={bookingUrl}
        />
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
    </PageCustomization>
  );
}
