import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VendorsHero from "@/components/vendors/VendorsHero";
import VendorsBottomCTA from "@/components/vendors/VendorsBottomCTA";
import VendorsExplorer, {
  PublicVendorItem,
  PublicBranchInfo,
} from "@/components/vendors/VendorsExplorer";
import { connectDB } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import Branch from "@/models/Branch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trusted Vendors & Wedding Partners | SALVORA",
  description:
    "Explore service providers featured by SALVORA. Discover trusted wedding cars, venues, photographers, florists, and event specialists.",
};

async function getVendorsData(): Promise<{
  vendors: PublicVendorItem[];
  branches: PublicBranchInfo[];
}> {
  try {
    await connectDB();

    const [rawVendors, rawBranches] = await Promise.all([
      Vendor.find({ isActive: true })
        .populate("branchIds", "_id name slug")
        .sort({ isFeatured: -1, displayOrder: 1, name: 1 })
        .lean(),
      Branch.find({ isActive: true })
        .select("_id name slug")
        .sort({ displayOrder: 1, name: 1 })
        .lean(),
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

    return { vendors, branches };
  } catch (error) {
    console.error("Failed to load vendors on server:", error);
    return { vendors: [], branches: [] };
  }
}

export default async function PublicVendorsPage() {
  const { vendors, branches } = await getVendorsData();

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Page Hero */}
        <VendorsHero />

        {/* 3. Interactive Vendors Explorer */}
        <div id="vendors" className="scroll-mt-20">
          <VendorsExplorer initialVendors={vendors} branches={branches} />
        </div>

        {/* 4. Bottom CTA */}
        <VendorsBottomCTA />
      </main>

      {/* 5. Footer */}
      <Footer />
    </div>
  );
}
