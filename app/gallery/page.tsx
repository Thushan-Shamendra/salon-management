import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GalleryHero from "@/components/gallery/GalleryHero";
import GalleryView from "@/components/gallery/GalleryView";
import { GalleryPhotoItem } from "@/components/gallery/GalleryLightbox";
import { connectDB } from "@/lib/mongodb";
import Gallery, { normalizeCropSettings } from "@/models/Gallery";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery | INVORA Salon",
  description:
    "Explore our gallery of real salon moments, treatments, styling and client transformations at Invora.",
};

async function getGalleryData(): Promise<{
  photos: GalleryPhotoItem[];
  bookingUrl: string;
}> {
  try {
    await connectDB();

    const [rawPhotos, settings] = await Promise.all([
      Gallery.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      SalonSettings.findOne().lean(),
    ]);

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

    return { photos, bookingUrl };
  } catch (error) {
    console.error("Failed to load gallery photos on server:", error);
    return { photos: [], bookingUrl: "" };
  }
}

export default async function PublicGalleryPage() {
  const { photos, bookingUrl } = await getGalleryData();

  return (
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
  );
}
