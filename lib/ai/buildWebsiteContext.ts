import { connectDB } from "@/lib/mongodb";
import { getAnalyticsSummary, AnalyticsRange, AnalyticsSummaryResult } from "@/lib/analytics/summary";
import { getWebsiteHealth, WebsiteHealthData } from "@/lib/website-health";
import Branch from "@/models/Branch";
import Service from "@/models/Service";
import Beautician from "@/models/Beautician";
import ProductBrand from "@/models/ProductBrand";
import Vendor from "@/models/Vendor";
import Gallery from "@/models/Gallery";
import WeddingService from "@/models/WeddingService";
import WeddingPackage from "@/models/WeddingPackage";
import SalonSettings from "@/models/SalonSettings";

export interface WebsiteContext {
  dateRange: {
    range: AnalyticsRange;
    label: string;
    start: string;
    end: string;
    startPrevious: string;
    endPrevious: string;
    timezone: string;
  };
  dataConfidence: "low" | "medium" | "high";
  confidenceExplanation: string;
  analytics: {
    metrics: AnalyticsSummaryResult["metrics"];
    topPages: AnalyticsSummaryResult["topPages"];
    branchPerformance: AnalyticsSummaryResult["branchPerformance"];
    topAction: AnalyticsSummaryResult["topAction"];
    recentActivityCount: number;
  };
  content: {
    salonName: string;
    hasBookingUrl: boolean;
    activeBranches: Array<{
      name: string;
      slug: string;
      hasPhone: boolean;
      hasWhatsApp: boolean;
      hasAddress: boolean;
      hasMapCoordinates: boolean;
      hasReviewUrl: boolean;
    }>;
    counts: {
      branches: number;
      services: number;
      beauticians: number;
      products: number;
      vendors: number;
      gallery: number;
      weddingServices: number;
      weddingPackages: number;
    };
    weddingSummary: {
      services: {
        activeCount: number;
        hiddenCount: number;
        missingImageCount: number;
        missingDescriptionCount: number;
      };
      packages: {
        activeCount: number;
        hiddenCount: number;
        missingImageCount: number;
        missingDescriptionCount: number;
      };
    };
  };
  health: WebsiteHealthData;
}

/**
 * Builds a compact, trusted, strictly non-sensitive context snapshot
 * of SALVORA's analytics, branch performance, content, and website health.
 */
export async function buildWebsiteContext(rangeParam: string = "30d"): Promise<WebsiteContext> {
  await connectDB();

  // 1. Fetch analytics summary and website health concurrently
  const [summary, health, activeBranchesList, counts, settings] = await Promise.all([
    getAnalyticsSummary(rangeParam),
    getWebsiteHealth(),
    Branch.find({ isActive: true })
      .select("name slug phone whatsappNumber address latitude longitude googleReviewUrl")
      .lean(),
    Promise.all([
      Branch.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
      Beautician.countDocuments({ isActive: true }),
      ProductBrand.countDocuments({ isActive: true }),
      Vendor.countDocuments({ isActive: true }),
      Gallery.countDocuments({ isActive: true }),
      WeddingService.countDocuments({ isActive: true }),
      WeddingPackage.countDocuments({ isActive: true }),
      WeddingService.countDocuments({ isActive: false }),
      WeddingService.countDocuments({
        $or: [{ image: { $exists: false } }, { image: "" }],
      }),
      WeddingService.countDocuments({
        $or: [{ description: { $exists: false } }, { description: "" }],
      }),
      WeddingPackage.countDocuments({ isActive: false }),
      WeddingPackage.countDocuments({
        $or: [{ image: { $exists: false } }, { image: "" }],
      }),
      WeddingPackage.countDocuments({
        $or: [{ description: { $exists: false } }, { description: "" }],
      }),
    ]),
    SalonSettings.findOne().select("salonName externalSystem phone email").lean(),
  ]);

  const [
    branchesCount,
    servicesCount,
    beauticiansCount,
    productsCount,
    vendorsCount,
    galleryCount,
    weddingServicesCount,
    weddingPackagesCount,
    weddingServicesHiddenCount,
    weddingServicesWithoutImage,
    weddingServicesWithoutDesc,
    weddingPackagesHiddenCount,
    weddingPackagesWithoutImage,
    weddingPackagesWithoutDesc,
  ] = counts;

  // 2. Assess data confidence based on total volume of events recorded
  const totalViews = summary.metrics.pageViews.value;
  const totalCustomerActions =
    summary.metrics.whatsappClicks.value +
    summary.metrics.callClicks.value +
    summary.metrics.bookingClicks.value +
    summary.metrics.reviewClicks.value +
    summary.metrics.mapClicks.value;
  const totalVolume = totalViews + totalCustomerActions;

  let dataConfidence: "low" | "medium" | "high" = "low";
  let confidenceExplanation = "";

  if (totalVolume === 0) {
    dataConfidence = "low";
    confidenceExplanation = "Zero website activity has been recorded in this date range. Insights are based primarily on content catalogs and health checks.";
  } else if (totalVolume < 20) {
    dataConfidence = "low";
    confidenceExplanation = `Activity is low (${totalVolume} total events recorded in this period). Comparisons should be treated as preliminary.`;
  } else if (totalVolume < 75) {
    dataConfidence = "medium";
    confidenceExplanation = `Moderate activity (${totalVolume} total events). General customer engagement patterns are emerging.`;
  } else {
    dataConfidence = "high";
    confidenceExplanation = `High data volume (${totalVolume} total events). Sufficient sample size for reliable period comparisons and branch ranking.`;
  }

  // 3. Compile clean branch summaries
  const branchesSummary = activeBranchesList.map((b) => ({
    name: b.name,
    slug: b.slug,
    hasPhone: Boolean(b.phone && b.phone.trim()),
    hasWhatsApp: Boolean(b.whatsappNumber && b.whatsappNumber.trim()),
    hasAddress: Boolean(b.address && b.address.trim()),
    hasMapCoordinates: b.latitude !== undefined && b.longitude !== undefined,
    hasReviewUrl: Boolean(b.googleReviewUrl && b.googleReviewUrl.trim()),
  }));

  return {
    dateRange: {
      range: summary.range,
      label: summary.rangeLabel,
      start: summary.period.start,
      end: summary.period.end,
      startPrevious: summary.period.startPrevious,
      endPrevious: summary.period.endPrevious,
      timezone: summary.period.timezone,
    },
    dataConfidence,
    confidenceExplanation,
    analytics: {
      metrics: summary.metrics,
      topPages: summary.topPages,
      branchPerformance: summary.branchPerformance,
      topAction: summary.topAction,
      recentActivityCount: summary.recentActivity.length,
    },
    content: {
      salonName: settings?.salonName || "SALVORA",
      hasBookingUrl: Boolean(settings?.externalSystem?.bookingUrl && settings.externalSystem.bookingUrl.trim()),
      activeBranches: branchesSummary,
      counts: {
        branches: branchesCount,
        services: servicesCount,
        beauticians: beauticiansCount,
        products: productsCount,
        vendors: vendorsCount,
        gallery: galleryCount,
        weddingServices: weddingServicesCount,
        weddingPackages: weddingPackagesCount,
      },
      weddingSummary: {
        services: {
          activeCount: weddingServicesCount,
          hiddenCount: weddingServicesHiddenCount,
          missingImageCount: weddingServicesWithoutImage,
          missingDescriptionCount: weddingServicesWithoutDesc,
        },
        packages: {
          activeCount: weddingPackagesCount,
          hiddenCount: weddingPackagesHiddenCount,
          missingImageCount: weddingPackagesWithoutImage,
          missingDescriptionCount: weddingPackagesWithoutDesc,
        },
      },
    },
    health,
  };
}
