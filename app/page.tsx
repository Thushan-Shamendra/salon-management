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
import SalonSettings from "@/models/SalonSettings";
import Service from "@/models/Service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let bookingUrl = "";
  let serviceCount = 0;

  try {
    await connectDB();
    const [settings, count] = await Promise.all([
      SalonSettings.findOne().lean(),
      Service.countDocuments({ isActive: { $ne: false } }),
    ]);
    if (settings?.externalSystem?.bookingUrl) {
      bookingUrl = settings.externalSystem.bookingUrl;
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

        {/* 6. Why Choose Invora */}
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
        <ContactPreview />
      </main>

      {/* 11. Footer */}
      <Footer />
    </div>
  );
}
