import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import OurValues from "@/components/about/OurValues";
import SalonExperience from "@/components/about/SalonExperience";
import MeetBeauticians, { BeauticianData } from "@/components/about/MeetBeauticians";
import BookingCTA from "@/components/home/BookingCTA";
import { connectDB } from "@/lib/mongodb";
import Beautician from "@/models/Beautician";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us | INVORA Salon",
  description:
    "Learn about Invora Salon, our story, values, modern space, and our dedicated beauty experts in Colombo.",
};

async function getAboutData(): Promise<{
  beauticians: BeauticianData[];
  bookingUrl: string;
}> {
  try {
    await connectDB();
    const [rawBeauticians, settings] = await Promise.all([
      Beautician.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      SalonSettings.findOne().lean(),
    ]);

    const beauticians: BeauticianData[] = rawBeauticians.map((b) => ({
      _id: b._id.toString(),
      name: b.name,
      jobTitle: b.jobTitle,
      bio: b.bio || "",
      specialties: b.specialties || [],
      experienceYears: b.experienceYears || 0,
      image: b.image || "",
      instagram: b.instagram || "",
      facebook: b.facebook || "",
      isFeatured: b.isFeatured ?? false,
    }));

    const bookingUrl = settings?.externalSystem?.bookingUrl || "";

    return { beauticians, bookingUrl };
  } catch (error) {
    console.error("Failed to load About page data:", error);
    return { beauticians: [], bookingUrl: "" };
  }
}

export default async function AboutPage() {
  const { beauticians, bookingUrl } = await getAboutData();

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. About Hero */}
        <AboutHero />

        {/* 3. Our Story */}
        <OurStory />

        {/* 4. Our Values */}
        <OurValues />

        {/* 5. Salon Experience */}
        <SalonExperience />

        {/* 6. Meet Our Beauticians */}
        <MeetBeauticians beauticians={beauticians} />

        {/* 7. Booking CTA */}
        <BookingCTA
          tag="✦ READY FOR A CHANGE"
          heading="Let's Bring Out Your Best Look"
          description="Book your appointment and experience professional care at Invora."
          bookingUrl={bookingUrl}
        />
      </main>

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
