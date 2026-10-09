import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ServicesHero from "@/components/services/ServicesHero";
import ServicesIntro from "@/components/services/ServicesIntro";
import ServicesGrid from "@/components/services/ServicesGrid";
import WhyChooseUs, { FeatureItem } from "@/components/home/WhyChooseUs";
import BookingCTA from "@/components/home/BookingCTA";
import {
  ScissorsIcon,
  HeartIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import SalonSettings from "@/models/SalonSettings";
import { ServiceCardData } from "@/components/ui/ServiceCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Our Services | salvora",
  description:
    "Explore professional salon treatments created to help you look and feel your best at salvora.",
};

async function getServices(): Promise<ServiceCardData[]> {
  try {
    await connectDB();
    const services = await Service.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return services.map((s) => ({
      _id: s._id.toString(),
      name: s.name,
      description: s.description || "",
      price: s.price || 0,
      duration: s.duration || 0,
      image: s.image || "",
    }));
  } catch (error) {
    console.error("Failed to load services for public page:", error);
    return [];
  }
}

export default async function ServicesPage() {
  await connectDB();
  const [services, settings] = await Promise.all([
    getServices(),
    SalonSettings.findOne().lean(),
  ]);

  const bookingUrl = settings?.externalSystem?.bookingUrl || "";

  const serviceBenefits: FeatureItem[] = [
    {
      title: "Professional Beauticians",
      description:
        "Skilled and experienced professionals dedicated to your beauty and confidence.",
      icon: ScissorsIcon,
    },
    {
      title: "Personalized Treatments",
      description:
        "Treatments tailored to your unique hair, skin and beauty needs.",
      icon: HeartIcon,
    },
    {
      title: "Quality Products",
      description:
        "High quality and trusted products for skin and lasting results.",
      icon: SparklesIcon,
    },
    {
      title: "Comfortable Salon Experience",
      description:
        "A clean, modern and relaxing environment designed for your comfort.",
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Services Hero */}
        <ServicesHero />

        {/* 3. Services Introduction */}
        <ServicesIntro />

        {/* 4. Adaptive Services Grid */}
        <ServicesGrid services={services} bookingUrl={bookingUrl} />

        {/* 5. Why Choose Invora / Service Benefits */}
        <WhyChooseUs
          tag="✦ WHY CHOOSE INVORA"
          heading="Why Choose Invora?"
          features={serviceBenefits}
        />

        {/* 6. Booking CTA */}
        <BookingCTA
          bookingUrl={bookingUrl}
          tag="✦ READY TO BOOK"
          heading="Ready to Book Your Treatment?"
          description="Choose your preferred service and continue to our salon booking system."
        />
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}