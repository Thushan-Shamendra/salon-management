import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import Gallery from "@/models/Gallery";
import Beautician from "@/models/Beautician";
import SalonSettings from "@/models/SalonSettings";
import WeddingService from "@/models/WeddingService";
import WeddingPackage from "@/models/WeddingPackage";
import Branch from "@/models/Branch";
import ProductBrand from "@/models/ProductBrand";
import Vendor from "@/models/Vendor";
import { getWebsiteHealth } from "@/lib/website-health";

// GET /api/admin/dashboard - Real Content Overview & Deterministic Website Health
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

    // 1. Fetch real counts across all entities and website health concurrently
    const [
      totalBranches,
      activeBranches,
      totalServices,
      activeServices,
      totalBeauticians,
      activeBeauticians,
      totalGalleryPhotos,
      activeGalleryPhotos,
      featuredGalleryPhotos,
      totalProducts,
      activeProducts,
      totalVendors,
      activeVendors,
      totalWeddingServices,
      activeWeddingServices,
      totalWeddingPackages,
      activeWeddingPackages,
      settings,
      websiteHealth,
    ] = await Promise.all([
      Branch.countDocuments(),
      Branch.countDocuments({ isActive: true }),
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Beautician.countDocuments(),
      Beautician.countDocuments({ isActive: true }),
      Gallery.countDocuments(),
      Gallery.countDocuments({ isActive: true }),
      Gallery.countDocuments({ isActive: true, isFeatured: true }),
      ProductBrand.countDocuments(),
      ProductBrand.countDocuments({ isActive: true }),
      Vendor.countDocuments(),
      Vendor.countDocuments({ isActive: true }),
      WeddingService.countDocuments(),
      WeddingService.countDocuments({ isActive: true }),
      WeddingPackage.countDocuments(),
      WeddingPackage.countDocuments({ isActive: true }),
      SalonSettings.findOne().lean(),
      getWebsiteHealth(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        branches: {
          total: totalBranches,
          active: activeBranches,
        },
        services: {
          total: totalServices,
          active: activeServices,
        },
        beauticians: {
          total: totalBeauticians,
          active: activeBeauticians,
        },
        gallery: {
          total: totalGalleryPhotos,
          active: activeGalleryPhotos,
          featured: featuredGalleryPhotos,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        vendors: {
          total: totalVendors,
          active: activeVendors,
        },
        weddingServices: {
          total: totalWeddingServices,
          active: activeWeddingServices,
        },
        weddingPackages: {
          total: totalWeddingPackages,
          active: activeWeddingPackages,
        },
      },
      websiteHealth,
      salonSettings: {
        salonName: settings?.salonName || "SALVORA",
        phone: settings?.phone || "",
        email: settings?.email || "",
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
