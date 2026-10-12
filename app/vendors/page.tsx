import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BookingCTA from "@/components/home/BookingCTA";
import VendorsExplorer, {
  PublicVendorItem,
  PublicBranchInfo,
} from "@/components/vendors/VendorsExplorer";
import { connectDB } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import Branch from "@/models/Branch";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trusted Vendors & Wedding Partners | SALVORA",
  description:
    "Explore service providers featured by SALVORA. Discover trusted wedding cars, venues, photographers, florists, and event specialists.",
};

async function getVendorsData(): Promise<{
  vendors: PublicVendorItem[];
  branches: PublicBranchInfo[];
  bookingUrl: string;
}> {
  try {
    await connectDB();

    const [rawVendors, rawBranches, settings] = await Promise.all([
      Vendor.find({ isActive: true })
        .populate("branchIds", "_id name slug")
        .sort({ isFeatured: -1, displayOrder: 1, name: 1 })
        .lean(),
      Branch.find({ isActive: true })
        .select("_id name slug")
        .sort({ displayOrder: 1, name: 1 })
        .lean(),
      SalonSettings.findOne().lean(),
    ]);

    const vendors: PublicVendorItem[] = rawVendors.map((v) => ({
      _id: String(v._id),
      name: v.name,
      category: v.category,
      description: v.description || "",
      image: v.image,
      logo: v.logo || "",
      phone: v.phone || "",
      whatsapp: v.whatsapp || "",
      email: v.email || "",
      website: v.website || "",
      instagram: v.instagram || "",
      facebook: v.facebook || "",
      branchIds: Array.isArray(v.branchIds)
        ? v.branchIds.map((b: { _id?: unknown; name?: unknown; slug?: unknown }) => ({
            _id: String(b._id),
            name: String(b.name || ""),
            slug: String(b.slug || ""),
          }))
        : [],
      isFeatured: Boolean(v.isFeatured),
      displayOrder: typeof v.displayOrder === "number" ? v.displayOrder : 0,
    }));

    const branches: PublicBranchInfo[] = rawBranches.map((b) => ({
      _id: String(b._id),
      name: b.name,
      slug: b.slug,
    }));

    const bookingUrl = settings?.externalSystem?.bookingUrl || "";

    return { vendors, branches, bookingUrl };
  } catch (error) {
    console.error("Failed to load vendors on server:", error);
    return { vendors: [], branches: [], bookingUrl: "" };
  }
}

export default async function PublicVendorsPage() {
  const { vendors, branches, bookingUrl } = await getVendorsData();

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Page Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-[#151221] to-[#0D0A17] text-white py-20 sm:py-24 lg:py-28">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-900/40 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-[#C4B5FD] uppercase mb-6 shadow-sm backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A78BFA] animate-pulse" />
              <span>SALVORA PARTNERS</span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
              Trusted Vendors for Your Special Moments
            </h1>

            {/* Description */}
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Explore service providers featured by SALVORA. Discover selected partners for wedding cars, venues, photography, floral design, and celebratory services.
            </p>
          </div>
        </section>

        {/* 3. Interactive Vendors Explorer */}
        <VendorsExplorer initialVendors={vendors} branches={branches} />

        {/* 4. Booking CTA */}
        <BookingCTA
          tag="✦ CELEBRATE WITH SALVORA"
          heading="Planning Your Big Day with Us?"
          description="Book a bridal consultation with our certified styling specialists across our salon branches."
          bookingUrl={bookingUrl}
        />
      </main>

      {/* 5. Footer */}
      <Footer />
    </div>
  );
}
