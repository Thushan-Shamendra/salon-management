import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactHero from "@/components/contact/ContactHero";
import ContactInfoCards from "@/components/contact/ContactInfoCards";
import ContactFormAndMap from "@/components/contact/ContactFormAndMap";
import ContactFaq from "@/components/contact/ContactFaq";
import BookingCTA from "@/components/home/BookingCTA";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us | salvora",
  description:
    "Get in touch with salvora for inquiries, guidance, and beauty appointments.",
};

interface ContactSettingsData {
  salonName: string;
  phone: string;
  email: string;
  address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openingHours: any[];
  bookingUrl: string;
  businessUrl: string;
}

async function getContactSettings(): Promise<ContactSettingsData> {
  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();

    return {
      salonName: settings?.salonName || "Invora Salon",
      phone: settings?.phone || "",
      email: settings?.email || "",
      address: settings?.address || "",
      openingHours: Array.isArray(settings?.openingHours)
        ? settings.openingHours.map((h) => ({
            day: h.day,
            open: h.open,
            close: h.close,
            isClosed: Boolean(h.isClosed),
          }))
        : [],
      bookingUrl: settings?.externalSystem?.bookingUrl || "",
      businessUrl: settings?.googleReviews?.businessUrl || "",
    };
  } catch (error) {
    console.error("Failed to load contact settings:", error);
    return {
      salonName: "Invora Salon",
      phone: "",
      email: "",
      address: "",
      openingHours: [],
      bookingUrl: "",
      businessUrl: "",
    };
  }
}

export default async function ContactPage() {
  const { salonName, phone, email, address, openingHours, bookingUrl, businessUrl } =
    await getContactSettings();

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Contact Hero */}
        <ContactHero />

        {/* 3. Contact Information Cards */}
        <ContactInfoCards
          phone={phone}
          email={email}
          address={address}
          openingHours={openingHours}
        />

        {/* 4. Contact Form + Map */}
        <ContactFormAndMap
          salonName={salonName}
          address={address}
          email={email}
          phone={phone}
          businessUrl={businessUrl}
        />

        {/* 5. Quick Information / FAQ */}
        <ContactFaq address={address} />

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
  );
}
