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

    // 1. Fetch real counts across all entities concurrently
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
      allActiveBranchesList,
      beauticiansWithoutBranchCount,
      beauticiansWithoutImageCount,
      productsWithoutLogoCount,
      vendorsWithoutImageCount,
      vendorsWithoutContactCount,
      servicesWithoutImageCount,
      servicesWithoutDescCount,
      weddingPackagesWithoutImageCount,
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
      Branch.find({ isActive: true }).lean(),
      Beautician.countDocuments({
        $or: [{ branchId: { $exists: false } }, { branchId: null }],
      }),
      Beautician.countDocuments({
        $or: [{ image: { $exists: false } }, { image: "" }],
      }),
      ProductBrand.countDocuments({
        $or: [{ logo: { $exists: false } }, { logo: "" }],
      }),
      Vendor.countDocuments({
        $or: [{ image: { $exists: false } }, { image: "" }],
      }),
      Vendor.countDocuments({
        $and: [
          { $or: [{ phone: { $exists: false } }, { phone: "" }] },
          { $or: [{ whatsapp: { $exists: false } }, { whatsapp: "" }] },
          { $or: [{ website: { $exists: false } }, { website: "" }] },
          { $or: [{ instagram: { $exists: false } }, { instagram: "" }] },
        ],
      }),
      Service.countDocuments({
        $or: [{ image: { $exists: false } }, { image: "" }],
      }),
      Service.countDocuments({
        $or: [{ description: { $exists: false } }, { description: "" }],
      }),
      WeddingPackage.countDocuments({
        $or: [{ image: { $exists: false } }, { image: "" }],
      }),
    ]);

    // 2. Deterministic Health Checks
    const isCloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

    // Branch completeness checks
    let branchesMissingPhone = 0;
    let branchesMissingWhatsApp = 0;
    let branchesMissingAddress = 0;
    let branchesMissingReviews = 0;

    for (const b of allActiveBranchesList) {
      if (!b.phone || !b.phone.trim()) branchesMissingPhone++;
      if (!b.whatsappNumber || !b.whatsappNumber.trim()) branchesMissingWhatsApp++;
      if (!b.address || !b.address.trim()) branchesMissingAddress++;
      if (!b.googleReviewUrl || !b.googleReviewUrl.trim()) branchesMissingReviews++;
    }

    // Compile Health Items list
    interface HealthItem {
      id: string;
      title: string;
      status: "ok" | "warning" | "critical";
      detail: string;
    }

    const healthItems: HealthItem[] = [
      {
        id: "database",
        title: "MongoDB Database",
        status: "ok",
        detail: "Connected and responsive",
      },
      {
        id: "cloudinary",
        title: "Cloudinary Media Storage",
        status: isCloudinaryConfigured ? "ok" : "warning",
        detail: isCloudinaryConfigured
          ? "Configured for image delivery"
          : "Missing Cloudinary environment credentials",
      },
    ];

    if (activeBranches === 0) {
      healthItems.push({
        id: "branches_count",
        title: "Branch Setup",
        status: "warning",
        detail: "No active salon branches found. Add at least one branch.",
      });
    } else {
      if (branchesMissingPhone > 0) {
        healthItems.push({
          id: "branches_phone",
          title: "Branch Contact Numbers",
          status: "warning",
          detail: `${branchesMissingPhone} active branch${
            branchesMissingPhone === 1 ? "" : "es"
          } missing phone number`,
        });
      }
      if (branchesMissingWhatsApp > 0) {
        healthItems.push({
          id: "branches_whatsapp",
          title: "Branch WhatsApp Numbers",
          status: "warning",
          detail: `${branchesMissingWhatsApp} active branch${
            branchesMissingWhatsApp === 1 ? "" : "es"
          } missing WhatsApp number`,
        });
      }
      if (branchesMissingAddress > 0) {
        healthItems.push({
          id: "branches_address",
          title: "Branch Physical Addresses",
          status: "warning",
          detail: `${branchesMissingAddress} active branch${
            branchesMissingAddress === 1 ? "" : "es"
          } missing address/location`,
        });
      }
      if (branchesMissingReviews > 0) {
        healthItems.push({
          id: "branches_reviews",
          title: "Branch Google Reviews",
          status: "warning",
          detail: `${branchesMissingReviews} branch${
            branchesMissingReviews === 1 ? "" : "es"
          } missing Google Review link`,
        });
      }
      if (
        branchesMissingPhone === 0 &&
        branchesMissingWhatsApp === 0 &&
        branchesMissingAddress === 0 &&
        branchesMissingReviews === 0
      ) {
        healthItems.push({
          id: "branches_status",
          title: "Salon Branches",
          status: "ok",
          detail: `All ${activeBranches} active branches have complete details`,
        });
      }
    }

    if (beauticiansWithoutBranchCount > 0) {
      healthItems.push({
        id: "beauticians_branch",
        title: "Beautician Branch Assignment",
        status: "warning",
        detail: `${beauticiansWithoutBranchCount} beautician${
          beauticiansWithoutBranchCount === 1 ? "" : "s"
        } not assigned to a branch`,
      });
    } else if (activeBeauticians > 0) {
      healthItems.push({
        id: "beauticians_branch",
        title: "Beautician Assignments",
        status: "ok",
        detail: "All beauticians assigned to branches",
      });
    }

    if (beauticiansWithoutImageCount > 0) {
      healthItems.push({
        id: "beauticians_image",
        title: "Beautician Photos",
        status: "warning",
        detail: `${beauticiansWithoutImageCount} beautician${
          beauticiansWithoutImageCount === 1 ? "" : "s"
        } missing profile photo`,
      });
    }

    if (servicesWithoutImageCount > 0) {
      healthItems.push({
        id: "services_image",
        title: "Service Images",
        status: "warning",
        detail: `${servicesWithoutImageCount} service${
          servicesWithoutImageCount === 1 ? "" : "s"
        } missing cover image`,
      });
    }

    if (servicesWithoutDescCount > 0) {
      healthItems.push({
        id: "services_desc",
        title: "Service Descriptions",
        status: "warning",
        detail: `${servicesWithoutDescCount} service${
          servicesWithoutDescCount === 1 ? "" : "s"
        } missing description text`,
      });
    }

    if (servicesWithoutImageCount === 0 && servicesWithoutDescCount === 0 && activeServices > 0) {
      healthItems.push({
        id: "services_complete",
        title: "Service Catalog",
        status: "ok",
        detail: `All ${activeServices} active services have complete details`,
      });
    }

    if (productsWithoutLogoCount > 0) {
      healthItems.push({
        id: "products_logo",
        title: "Product Brand Logos",
        status: "warning",
        detail: `${productsWithoutLogoCount} brand${
          productsWithoutLogoCount === 1 ? "" : "s"
        } missing brand logo`,
      });
    }

    if (vendorsWithoutImageCount > 0) {
      healthItems.push({
        id: "vendors_image",
        title: "Vendor Images",
        status: "warning",
        detail: `${vendorsWithoutImageCount} vendor${
          vendorsWithoutImageCount === 1 ? "" : "s"
        } missing showcase image`,
      });
    }

    if (vendorsWithoutContactCount > 0) {
      healthItems.push({
        id: "vendors_contact",
        title: "Vendor Contact Info",
        status: "warning",
        detail: `${vendorsWithoutContactCount} vendor${
          vendorsWithoutContactCount === 1 ? "" : "s"
        } missing contact links`,
      });
    }

    if (weddingPackagesWithoutImageCount > 0) {
      healthItems.push({
        id: "wedding_packages_image",
        title: "Wedding Package Images",
        status: "warning",
        detail: `${weddingPackagesWithoutImageCount} wedding package${
          weddingPackagesWithoutImageCount === 1 ? "" : "s"
        } missing cover image`,
      });
    }

    // Determine overall health status
    const hasCritical = healthItems.some((h) => h.status === "critical");
    const warningCount = healthItems.filter((h) => h.status === "warning").length;
    const overallHealthStatus: "Healthy" | "Needs Attention" | "Critical" =
      hasCritical
        ? "Critical"
        : warningCount > 0
        ? "Needs Attention"
        : "Healthy";

    const websiteHealth = {
      status: overallHealthStatus,
      warningsCount: warningCount,
      items: healthItems,
    };

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
