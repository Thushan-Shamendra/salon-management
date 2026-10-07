import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import Gallery from "@/models/Gallery";
import Beautician from "@/models/Beautician";
import SalonSettings from "@/models/SalonSettings";

// GET /api/admin/dashboard - ADMIN ONLY: Website Content Metrics
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Admin role required." },
        { status: 403 }
      );
    }

    await connectDB();

    const [
      totalServices,
      activeServices,
      totalGalleryPhotos,
      activeGalleryPhotos,
      featuredGalleryPhotos,
      totalBeauticians,
      activeBeauticians,
      settings,
    ] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Gallery.countDocuments(),
      Gallery.countDocuments({ isActive: true }),
      Gallery.countDocuments({ isActive: true, isFeatured: true }),
      Beautician.countDocuments(),
      Beautician.countDocuments({ isActive: true }),
      SalonSettings.findOne().lean(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalServices,
        activeServices,
        totalGalleryPhotos,
        activeGalleryPhotos,
        featuredGalleryPhotos,
        totalBeauticians,
        activeBeauticians,
        googleReviewsEnabled: Boolean(settings?.googleReviews?.enabled),
        externalBookingConfigured: Boolean(settings?.externalSystem?.bookingUrl?.trim()),
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard statistics" },
      { status: 500 }
    );
  }
}
