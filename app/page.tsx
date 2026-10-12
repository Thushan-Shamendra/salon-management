import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import AboutPreview from "@/components/home/AboutPreview";
import FeaturedServices from "@/components/home/FeaturedServices";
import WeddingPreview from "@/components/home/WeddingPreview";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import BeauticiansPreview from "@/components/home/BeauticiansPreview";
import GalleryPreview from "@/components/home/GalleryPreview";
import ReviewPreview from "@/components/home/ReviewPreview";
import BookingCTA from "@/components/home/BookingCTA";
import ContactPreview from "@/components/home/ContactPreview";
import Footer from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import SalonSettings, { IOpeningHour } from "@/models/SalonSettings";
import Branch from "@/models/Branch";
import Service from "@/models/Service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let bookingUrl = "";
  let serviceCount = 0;
  let initialSettings = undefined;

  try {
    await connectDB();
    const [settings, branchDoc, count] = await Promise.all([
      SalonSettings.findOne().lean(),
      Branch.findOne({ isActive: true })
        .sort({ isMain: -1, displayOrder: 1, createdAt: 1 })
        .lean(),
      Service.countDocuments({ isActive: { $ne: false } }),
    ]);

    if (settings && settings.externalSystem?.bookingUrl) {
      bookingUrl = settings.externalSystem.bookingUrl;
    }

    if (branchDoc) {
      initialSettings = {
        salonName: settings?.salonName || branchDoc.name || undefined,
        phone: branchDoc.phone || undefined,
        email: branchDoc.email || settings?.email || undefined,
        address: branchDoc.address || undefined,
        businessUrl:
          branchDoc.googleMapsUrl ||
          branchDoc.googleReviewUrl ||
          settings?.googleReviews?.businessUrl ||
          undefined,
        openingHours: Array.isArray(branchDoc.openingHours)
          ? branchDoc.openingHours.map((h) => ({
              day: String(h.day),
              open: String(h.openTime || "09:00"),
              close: String(h.closeTime || "19:00"),
              isClosed: Boolean(h.isClosed),
            }))
          : undefined,
      };
    } else if (settings) {
      initialSettings = {
        salonName: settings.salonName || undefined,
        phone: settings.phone || undefined,
        email: settings.email || undefined,
        address: settings.address || undefined,
        businessUrl: settings.googleReviews?.businessUrl || undefined,
        openingHours: Array.isArray(settings.openingHours)
          ? settings.openingHours.map((h: IOpeningHour) => ({
              day: String(h.day),
              open: String(h.open),
              close: String(h.close),
              isClosed: Boolean(h.isClosed),
            }))
          : undefined,
      };
    }
    serviceCount = count;
  } catch {
    // Graceful fallback
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-200 selection:text-purple-950">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero */}
        <HeroSection bookingUrl={bookingUrl} serviceCount={serviceCount} />

        {/* 3. About preview */}
        <AboutPreview />

        {/* 4. Featured Services */}
        <FeaturedServices bookingUrl={bookingUrl} />

        {/* 5. Wedding Beauty Promotional Section */}
        <WeddingPreview />

        {/* 6. Why Choose Salvora */}
        <WhyChooseUs />

        {/* 6. Meet Our Beauty Experts */}
        <BeauticiansPreview />

        {/* 7. Gallery preview */}
        <GalleryPreview />

        {/* 8. Google Reviews preview */}
        <ReviewPreview />

        {/* 9. Booking CTA */}
        <BookingCTA bookingUrl={bookingUrl} />

        {/* 10. Contact / opening hours preview */}
        <ContactPreview initialSettings={initialSettings} />
      </main>

      {/* 11. Footer */}
      <Footer />
    </div>
  );
}
