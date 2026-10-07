import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Gallery, { normalizeCropSettings } from "@/models/Gallery";

// GET /api/gallery - Public access to active gallery photos
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");

    const query: Record<string, unknown> = {
      isActive: true,
    };

    if (categoryParam && categoryParam.trim() && categoryParam.trim().toLowerCase() !== "all") {
      query.category = categoryParam.trim();
    }

    // Sort displayOrder ascending, then newest first
    const galleryItems = await Gallery.find(query)
      .select("_id title description category image imagePublicId altText isFeatured displayOrder cropSettings cropPosition createdAt")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const formattedGallery = galleryItems.map((item) => ({
      ...item,
      cropSettings: normalizeCropSettings(item),
    }));

    // Also get all distinct categories of active photos for convenient client filtering
    const activeCategories = await Gallery.distinct("category", { isActive: true });

    return NextResponse.json({
      success: true,
      gallery: formattedGallery,
      categories: activeCategories.filter(Boolean),
    });
  } catch (error) {
    console.error("Public gallery API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load gallery photos",
      },
      { status: 500 }
    );
  }
}
