import { PageCustomization } from "@/components/customization/PageCustomization";
import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import SalonSettings, { normalizePageVisibility } from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trusted Vendors & Wedding Partners | SALVORA",
  description:
    "Explore service providers featured by SALVORA. Discover trusted wedding cars, venues, photographers, florists, and event specialists.",
};

async function getVendorsData(): Promise<{
  vendors: PublicVendorItem[];
  branches: PublicBranchInfo[];
  isVisible: boolean;
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
      SalonSettings.findOne().select("pageVisibility").lean(),
    ]);

    const isVisible = normalizePageVisibility(settings?.pageVisibility).vendors;

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

    return { vendors, branches, isVisible };
  } catch (error) {
    console.error("Failed to load vendors on server:", error);
    return { vendors: [], branches: [], isVisible: true };
  }
}

export default async function PublicVendorsPage() {
  const { vendors, branches, isVisible } = await getVendorsData();

  if (!isVisible) {
    notFound();
  }

  return (
    <PageCustomization scope="public" pageKey="vendors">
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-[#03BF62]/30 selection:text-stone-900">
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
    </PageCustomization>
  );
}
