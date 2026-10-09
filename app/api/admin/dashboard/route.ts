import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import Gallery from "@/models/Gallery";
import Beautician from "@/models/Beautician";
import SalonSettings from "@/models/SalonSettings";
import WeddingService from "@/models/WeddingService";
import WeddingPackage from "@/models/WeddingPackage";

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
      totalWeddingServices,
      activeWeddingServices,
      totalWeddingPackages,
      activeWeddingPackages,
      settings,
      recentServicesDoc,
      recentBeauticiansDoc,
      recentGalleryDoc,
    ] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Gallery.countDocuments(),
      Gallery.countDocuments({ isActive: true }),
      Gallery.countDocuments({ isActive: true, isFeatured: true }),
      Beautician.countDocuments(),
      Beautician.countDocuments({ isActive: true }),
      WeddingService.countDocuments(),
      WeddingService.countDocuments({ isActive: true }),
      WeddingPackage.countDocuments(),
      WeddingPackage.countDocuments({ isActive: true }),
      SalonSettings.findOne().lean(),
      Service.find().sort({ createdAt: -1 }).limit(3).lean(),
      Beautician.find().sort({ createdAt: -1 }).limit(3).lean(),
      Gallery.find().sort({ createdAt: -1 }).limit(3).lean(),
    ]);

    const hasSalonName = Boolean(settings?.salonName?.trim());
    const hasLogo = Boolean(settings?.logo?.trim());
    const hasPhone = Boolean(settings?.phone?.trim());
    const hasEmail = Boolean(settings?.email?.trim());
    const hasBookingUrl = Boolean(settings?.externalSystem?.bookingUrl?.trim());
    const isGoogleReviewsEnabled = Boolean(settings?.googleReviews?.enabled);

    const isWebsiteReady = hasSalonName && hasPhone && hasEmail && hasBookingUrl;

    const websiteStatus = {
      salonName: settings?.salonName || "Invora Salon",
      hasSalonName,
      logo: settings?.logo || "/images/invora-logo-dark-trimmed.png",
      hasLogo,
      phone: settings?.phone || "Not configured",
      hasPhone,
      email: settings?.email || "Not configured",
      hasEmail,
      bookingUrl: hasBookingUrl ? "Connected" : "Not configured",
      hasBookingUrl,
      googleReviewsEnabled: isGoogleReviewsEnabled,
      isReady: isWebsiteReady,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentServices = recentServicesDoc.map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      image: s.image || "",
      isActive: Boolean(s.isActive),
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentBeauticians = recentBeauticiansDoc.map((b: any) => ({
      id: b._id.toString(),
      name: b.name,
      jobTitle: b.jobTitle || "Beauty Specialist",
      image: b.image || "",
      isActive: Boolean(b.isActive),
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentGallery = recentGalleryDoc.map((g: any) => ({
      id: g._id.toString(),
      title: g.title,
      category: g.category || "Salon",
      image: g.image || "",
      isActive: Boolean(g.isActive),
      isFeatured: Boolean(g.isFeatured),
      createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : new Date().toISOString(),
    }));

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
        totalWeddingServices,
        activeWeddingServices,
        totalWeddingPackages,
        activeWeddingPackages,
        googleReviewsEnabled: isGoogleReviewsEnabled,
        externalBookingConfigured: hasBookingUrl,
      },
      websiteStatus,
      recentServices,
      recentBeauticians,
      recentGallery,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard statistics" },
      { status: 500 }
    );
  }
}
