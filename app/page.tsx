import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import AboutPreview from "@/components/home/AboutPreview";
import FeaturedServices from "@/components/home/FeaturedServices";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import CommunityPreview from "@/components/home/CommunityPreview";
import ReviewPreview from "@/components/home/ReviewPreview";
import ContactPreview from "@/components/home/ContactPreview";
import BookingCTA from "@/components/home/BookingCTA";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917] selection:bg-[#B7925A]/20 selection:text-stone-900">
      {/* 1. Responsive Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Short About / Introduction Section */}
        <AboutPreview />

        {/* 4. Featured Services Section (Dynamic API integration) */}
        <FeaturedServices />

        {/* 5. Why Choose Us Section */}
        <WhyChooseUs />

        {/* 6. Community Preview Section */}
        <CommunityPreview />

        {/* 7. Reviews / Testimonial Section */}
        <ReviewPreview />

        {/* 8. Contact / Opening Hours Preview */}
        <ContactPreview />

        {/* 9. Booking Call-To-Action Section */}
        <BookingCTA />
      </main>

      {/* 10. Professional Footer */}
      <Footer />
    </div>
  );
}
