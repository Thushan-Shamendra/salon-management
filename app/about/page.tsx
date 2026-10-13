import { PageCustomization } from "@/components/customization/PageCustomization";
import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import OurValues from "@/components/about/OurValues";
import SalonExperience from "@/components/about/SalonExperience";
import MeetBeauticians, { BeauticianData, BranchData } from "@/components/about/MeetBeauticians";
import ProductBrandsSection, { ProductBrandData } from "@/components/products/ProductBrandsSection";
import BookingCTA from "@/components/home/BookingCTA";
import { connectDB } from "@/lib/mongodb";
import Beautician from "@/models/Beautician";
import Branch from "@/models/Branch";
import ProductBrand from "@/models/ProductBrand";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us | SALVORA",
  description:
    "Learn about SALVORA, our story, values, modern space, and our dedicated beauty experts across Sri Lanka.",
};

async function getAboutData(): Promise<{
  beauticians: BeauticianData[];
  branches: BranchData[];
  products: ProductBrandData[];
  bookingUrl: string;
}> {
  try {
    await connectDB();
    void Branch;

    const [rawBeauticians, rawBranches, rawProducts, settings] = await Promise.all([
      Beautician.find({ isActive: true })
        .populate("branchId", "_id name slug")
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      Branch.find({ isActive: true })
        .select("_id name slug")
        .sort({ displayOrder: 1, createdAt: 1 })
        .lean(),
      ProductBrand.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      SalonSettings.findOne().lean(),
    ]);

    const branches: BranchData[] = rawBranches.map((br) => ({
      _id: br._id.toString(),
      name: br.name,
      slug: br.slug,
    }));

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
      branchId: b.branchId
        ? {
            _id: ((b.branchId as { _id?: unknown })._id || b.branchId).toString(),
            name: (b.branchId as { name?: string }).name || "",
            slug: (b.branchId as { slug?: string }).slug || "",
          }
        : null,
    }));

    const products: ProductBrandData[] = rawProducts.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      logo: p.logo,
      description: p.description || "",
      websiteUrl: p.websiteUrl || "",
    }));

    const bookingUrl = settings?.externalSystem?.bookingUrl || "";

    return { beauticians, branches, products, bookingUrl };
  } catch (error) {
    console.error("Failed to load About page data:", error);
    return { beauticians: [], branches: [], products: [], bookingUrl: "" };
  }
}

export default async function AboutPage() {
  const { beauticians, branches, products, bookingUrl } = await getAboutData();

  return (
    <PageCustomization scope="public" pageKey="about">
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-[#03BF62]/30 selection:text-stone-900">
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
        <MeetBeauticians beauticians={beauticians} branches={branches} />

        {/* 7. Products We Use */}
        <ProductBrandsSection products={products} />

        {/* 8. Booking CTA */}
        <BookingCTA
          tag="✦ READY FOR A CHANGE"
          heading="Let's Bring Out Your Best Look"
          description="Book your appointment and experience professional care at SALVORA."
          bookingUrl={bookingUrl}
        />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
    </PageCustomization>
  );
}
