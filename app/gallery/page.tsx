import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GalleryClient, { GalleryPhotoItem } from "@/components/gallery/GalleryClient";
import { connectDB } from "@/lib/mongodb";
import Gallery from "@/models/Gallery";
import SalonSettings from "@/models/SalonSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();
    const name = settings?.salonName || "Lumina Luxury Salon";
    return {
      title: `Gallery | ${name}`,
      description:
        "Explore a curated showcase of hair styling, beauty treatments, bridal looks, and memorable client experiences.",
    };
  } catch {
    return {
      title: "Gallery | Lumina Luxury Salon",
      description: "Explore our curated showcase of hair styling and beauty treatments.",
    };
  }
}

export default async function PublicGalleryPage() {
  let photos: GalleryPhotoItem[] = [];
  let salonName = "Lumina Luxury Salon";
  let bookingUrl = "";

  try {
    await connectDB();

    const [rawPhotos, settings] = await Promise.all([
      Gallery.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      SalonSettings.findOne().lean(),
    ]);

    if (settings?.salonName) {
      salonName = settings.salonName;
    }
    if (settings?.externalSystem?.bookingUrl) {
      bookingUrl = settings.externalSystem.bookingUrl;
    }

    photos = rawPhotos.map((p) => ({
      _id: String(p._id),
      title: p.title,
      description: p.description || "",
      category: p.category,
      image: p.image,
      imagePublicId: p.imagePublicId,
      altText: p.altText || "",
      isActive: p.isActive,
      isFeatured: Boolean(p.isFeatured),
      displayOrder: typeof p.displayOrder === "number" ? p.displayOrder : 0,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    }));
  } catch (error) {
    console.error("Failed to load gallery photos on server:", error);
    // Graceful fallback: empty photos list
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917] selection:bg-[#B7925A]/20 selection:text-stone-900">
      <Navbar />

      <main className="flex-1">
        <GalleryClient
          initialPhotos={photos}
          salonName={salonName}
          bookingUrl={bookingUrl}
        />
      </main>

      <Footer />
    </div>
  );
}
