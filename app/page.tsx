import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import AboutPreview from "@/components/home/AboutPreview";
import FeaturedServices from "@/components/home/FeaturedServices";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ReviewPreview from "@/components/home/ReviewPreview";
import ContactPreview from "@/components/home/ContactPreview";
import BookingCTA from "@/components/home/BookingCTA";
import Footer from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let bookingUrl = "";

  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();
    if (settings?.externalSystem?.bookingUrl) {
      bookingUrl = settings.externalSystem.bookingUrl;
    }
  } catch {
    // Graceful fallback
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917] selection:bg-[#B7925A]/20 selection:text-stone-900">
      {/* 1. Responsive Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection bookingUrl={bookingUrl} />

        {/* 3. Short About / Introduction Section */}
        <AboutPreview />

        {/* 4. Featured Services Section (Dynamic API integration) */}
        <FeaturedServices bookingUrl={bookingUrl} />

        {/* 5. Why Choose Us Section */}
        <WhyChooseUs />

        {/* 6. Reviews / Testimonial Section */}
        <ReviewPreview />

        {/* 7. Contact / Opening Hours Preview */}
        <ContactPreview />

        {/* 8. Booking Call-To-Action Section */}
        <BookingCTA bookingUrl={bookingUrl} />
      </main>

      {/* 9. Professional Footer */}
      <Footer />
    </div>
  );
}
