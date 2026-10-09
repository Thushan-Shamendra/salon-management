import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ReviewsHero from "@/components/reviews/ReviewsHero";
import GoogleReviewsGrid from "@/components/reviews/GoogleReviewsGrid";
import TrustSection from "@/components/reviews/TrustSection";
import BookingCTA from "@/components/home/BookingCTA";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client Reviews | salvora",
  description:
    "Read real Google client reviews and feedback from guests who have experienced salon services at salvora.",
};

async function getBookingUrl(): Promise<string> {
  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();
    return settings?.externalSystem?.bookingUrl || "";
  } catch (error) {
    console.error("Failed to load booking URL for Reviews page:", error);
    return "";
  }
}

export default async function ReviewsPage() {
  const bookingUrl = await getBookingUrl();

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Reviews Hero */}
        <ReviewsHero />

        {/* 3. Google Rating Summary & 4. Google Reviews Grid */}
        <GoogleReviewsGrid />

        {/* 5. Trust / Customer Experience Section */}
        <TrustSection />

        {/* 6. Booking CTA */}
        <BookingCTA
          tag="✦ READY FOR YOUR VISIT"
          heading="Experience Invora for Yourself"
          description="Choose your preferred service and continue to our salon booking system."
          bookingUrl={bookingUrl}
        />
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}
