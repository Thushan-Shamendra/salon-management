import { PageCustomization } from "@/components/customization/PageCustomization";
import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GalleryHero from "@/components/gallery/GalleryHero";
import GalleryView from "@/components/gallery/GalleryView";
import { GalleryPhotoItem } from "@/components/gallery/GalleryLightbox";
import { connectDB } from "@/lib/mongodb";
import Gallery, { normalizeCropSettings } from "@/models/Gallery";
import SalonSettings, { normalizePageVisibility } from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery | salvora",
  description:
    "Explore our gallery of real salon moments, treatments, styling and client transformations at salvora.",
};

async function getGalleryData(): Promise<{
  photos: GalleryPhotoItem[];
  bookingUrl: string;
  isVisible: boolean;
}> {
  try {
    await connectDB();

    const [rawPhotos, settings] = await Promise.all([
      Gallery.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      SalonSettings.findOne().lean(),
    ]);

    const isVisible = normalizePageVisibility(settings?.pageVisibility).gallery;

    const photos: GalleryPhotoItem[] = rawPhotos.map((p) => {
      const normalizedCrops = normalizeCropSettings(p);
      return {
        _id: String(p._id),
        title: p.title,
        description: p.description || "",
        category: p.category || "Hair Styling",
        image: p.image,
        imagePublicId: p.imagePublicId,
        altText: p.altText || "",
        isActive: Boolean(p.isActive),
        isFeatured: Boolean(p.isFeatured),
        displayOrder: typeof p.displayOrder === "number" ? p.displayOrder : 0,
        cropSettings: normalizedCrops,
        cropPosition: normalizedCrops.gallery,
      };
    });

    const bookingUrl = settings?.externalSystem?.bookingUrl || "";

    return { photos, bookingUrl, isVisible };
  } catch (error) {
    console.error("Failed to load gallery photos on server:", error);
    return { photos: [], bookingUrl: "", isVisible: true };
  }
}

export default async function PublicGalleryPage() {
  const { photos, bookingUrl, isVisible } = await getGalleryData();

  if (!isVisible) {
    notFound();
  }

  return (
    <PageCustomization scope="public" pageKey="gallery">
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Gallery Hero */}
        <GalleryHero />

        {/* 3. Gallery Intro, 4. Category Filters, 5. Main Grid, 6. Lightbox, 7. Booking CTA */}
        <GalleryView photos={photos} bookingUrl={bookingUrl} />
      </main>

      {/* 8. Footer */}
      <Footer />
    </div>
    </PageCustomization>
  );
}
