import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import Beautician from "@/models/Beautician";
import Branch from "@/models/Branch";
import ProductBrand from "@/models/ProductBrand";
import Vendor from "@/models/Vendor";
import WeddingService from "@/models/WeddingService";
import WeddingPackage from "@/models/WeddingPackage";

export interface HealthItem {
  id: string;
  title: string;
  status: "ok" | "warning" | "critical";
  detail: string;
}

export interface WebsiteHealthData {
  status: "Healthy" | "Needs Attention" | "Critical";
  warningsCount: number;
  items: HealthItem[];
}

export async function getWebsiteHealth(): Promise<WebsiteHealthData> {
  await connectDB();

  const [
    activeBranches,
    allActiveBranchesList,
    activeServices,
    servicesWithoutImageCount,
    servicesWithoutDescCount,
    activeBeauticians,
    beauticiansWithoutBranchCount,
    beauticiansWithoutImageCount,
    productsWithoutLogoCount,
    vendorsWithoutImageCount,
    vendorsWithoutContactCount,
    weddingServicesWithoutImageCount,
    weddingServicesWithoutDescCount,
    weddingPackagesWithoutImageCount,
    weddingPackagesWithoutDescCount,
  ] = await Promise.all([
    Branch.countDocuments({ isActive: true }),
    Branch.find({ isActive: true }).lean(),
    Service.countDocuments({ isActive: true }),
    Service.countDocuments({
      $or: [{ image: { $exists: false } }, { image: "" }],
    }),
    Service.countDocuments({
      $or: [{ description: { $exists: false } }, { description: "" }],
    }),
    Beautician.countDocuments({ isActive: true }),
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
    WeddingService.countDocuments({
      $or: [{ image: { $exists: false } }, { image: "" }],
    }),
    WeddingService.countDocuments({
      $or: [{ description: { $exists: false } }, { description: "" }],
    }),
    WeddingPackage.countDocuments({
      $or: [{ image: { $exists: false } }, { image: "" }],
    }),
    WeddingPackage.countDocuments({
      $or: [{ description: { $exists: false } }, { description: "" }],
    }),
  ]);

  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

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

  if (weddingServicesWithoutImageCount > 0) {
    healthItems.push({
      id: "wedding_services_image",
      title: "Wedding Service Images",
      status: "warning",
      detail: `${weddingServicesWithoutImageCount} wedding service${
        weddingServicesWithoutImageCount === 1 ? "" : "s"
      } missing cover image`,
    });
  }

  if (weddingServicesWithoutDescCount > 0) {
    healthItems.push({
      id: "wedding_services_desc",
      title: "Wedding Service Descriptions",
      status: "warning",
      detail: `${weddingServicesWithoutDescCount} wedding service${
        weddingServicesWithoutDescCount === 1 ? "" : "s"
      } missing description text`,
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

  if (weddingPackagesWithoutDescCount > 0) {
    healthItems.push({
      id: "wedding_packages_desc",
      title: "Wedding Package Descriptions",
      status: "warning",
      detail: `${weddingPackagesWithoutDescCount} wedding package${
        weddingPackagesWithoutDescCount === 1 ? "" : "s"
      } missing description text`,
    });
  }

  const hasCritical = healthItems.some((h) => h.status === "critical");
  const warningCount = healthItems.filter((h) => h.status === "warning").length;
  const overallHealthStatus: "Healthy" | "Needs Attention" | "Critical" =
    hasCritical
      ? "Critical"
      : warningCount > 0
      ? "Needs Attention"
      : "Healthy";

  return {
    status: overallHealthStatus,
    warningsCount: warningCount,
    items: healthItems,
  };
}
