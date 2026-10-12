import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AnalyticsEvent from "@/models/AnalyticsEvent";
import Branch from "@/models/Branch";

// Helper: Calculate Colombo (UTC+05:30) date range bounds
function getDateRangeBounds(range: string) {
  const now = new Date();
  const colomboOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowColombo = new Date(now.getTime() + colomboOffsetMs);

  let startCurrent: Date;
  const endCurrent: Date = now;
  let startPrevious: Date;
  let endPrevious: Date;
  let bucketType: "hour" | "day" = "day";
  let bucketCount = 30;

  if (range === "today") {
    // Midnight today in Colombo
    const colomboMidnightToday = new Date(
      Date.UTC(
        nowColombo.getUTCFullYear(),
        nowColombo.getUTCMonth(),
        nowColombo.getUTCDate()
      ) - colomboOffsetMs
    );
    startCurrent = colomboMidnightToday;
    startPrevious = new Date(startCurrent.getTime() - 24 * 60 * 60 * 1000);
    endPrevious = startCurrent;
    bucketType = "hour";
    bucketCount = 24;
  } else if (range === "7d") {
    const durationMs = 7 * 24 * 60 * 60 * 1000;
    startCurrent = new Date(now.getTime() - durationMs);
    startPrevious = new Date(startCurrent.getTime() - durationMs);
    endPrevious = startCurrent;
    bucketType = "day";
    bucketCount = 7;
  } else {
    // Default: 30d
    const durationMs = 30 * 24 * 60 * 60 * 1000;
    startCurrent = new Date(now.getTime() - durationMs);
    startPrevious = new Date(startCurrent.getTime() - durationMs);
    endPrevious = startCurrent;
    bucketType = "day";
    bucketCount = 30;
  }

  return { startCurrent, endCurrent, startPrevious, endPrevious, bucketType, bucketCount };
}

// Helper: Safe percentage change calculation
function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) {
      return { pct: 0, text: "—", isPositive: false, isNeutral: true };
    }
    return { pct: null, text: "New", isPositive: true, isNeutral: false };
  }
  const change = ((current - previous) / previous) * 100;
  const formatted = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  return {
    pct: Math.round(change * 10) / 10,
    text: formatted,
    isPositive: change > 0,
    isNeutral: change === 0,
  };
}

// GET /api/admin/analytics/summary - Comprehensive website analytics for admin
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") || "30d";
    const range = ["today", "7d", "30d"].includes(rangeParam) ? rangeParam : "30d";

    await connectDB();

    const { startCurrent, endCurrent, startPrevious, endPrevious, bucketType, bucketCount } =
      getDateRangeBounds(range);

    // 1. Fetch current and previous event counts by eventType using aggregation
    const [currentEventCounts, previousEventCounts] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: startCurrent, $lte: endCurrent } } },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: startPrevious, $lt: endPrevious } } },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
      ]),
    ]);

    const currentMap = new Map<string, number>();
    for (const item of currentEventCounts) {
      currentMap.set(item._id, item.count);
    }

    const prevMap = new Map<string, number>();
    for (const item of previousEventCounts) {
      prevMap.set(item._id, item.count);
    }

    const getMetric = (type: string) => {
      const cur = currentMap.get(type) || 0;
      const prev = prevMap.get(type) || 0;
      const change = calculateChange(cur, prev);
      return { value: cur, previous: prev, change };
    };

    const metrics = {
      pageViews: getMetric("PAGE_VIEW"),
      whatsappClicks: getMetric("WHATSAPP_CLICK"),
      callClicks: getMetric("CALL_CLICK"),
      bookingClicks: getMetric("BOOKING_CLICK"),
      reviewClicks: getMetric("GOOGLE_REVIEW_CLICK"),
      mapClicks: getMetric("MAP_CLICK"),
      vendorClicks: getMetric("VENDOR_CLICK"),
      serviceViews: getMetric("SERVICE_VIEW"),
      weddingViews: getMetric("WEDDING_VIEW"),
      productClicks: getMetric("PRODUCT_CLICK"),
    };

    // 2. Daily / Hourly trend buckets for Website Activity Chart
    // Build zero-filled buckets for exact calendar intervals
    const colomboOffsetMs = 5.5 * 60 * 60 * 1000;
    const chartBuckets: Array<{
      date: string;
      label: string;
      pageViews: number;
      customerActions: number;
    }> = [];

    const now = new Date();

    if (bucketType === "hour") {
      // 24 hourly buckets for today
      for (let h = 0; h < 24; h++) {
        const hourStr = `${String(h).padStart(2, "0")}:00`;
        chartBuckets.push({
          date: hourStr,
          label: hourStr,
          pageViews: 0,
          customerActions: 0,
        });
      }

      // Aggregate events by hour in Colombo time
      const hourlyEvents = await AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: startCurrent, $lte: endCurrent } } },
        {
          $project: {
            eventType: 1,
            hour: {
              $hour: {
                date: { $add: ["$createdAt", colomboOffsetMs] },
              },
            },
          },
        },
        {
          $group: {
            _id: { hour: "$hour", eventType: "$eventType" },
            count: { $sum: 1 },
          },
        },
      ]);

      for (const item of hourlyEvents) {
        const h = item._id.hour;
        if (h >= 0 && h < 24) {
          if (item._id.eventType === "PAGE_VIEW") {
            chartBuckets[h].pageViews += item.count;
          } else if (
            [
              "WHATSAPP_CLICK",
              "CALL_CLICK",
              "BOOKING_CLICK",
              "GOOGLE_REVIEW_CLICK",
              "MAP_CLICK",
            ].includes(item._id.eventType)
          ) {
            chartBuckets[h].customerActions += item.count;
          }
        }
      }
    } else {
      // Daily buckets for 7d or 30d
      const bucketMap = new Map<string, number>();
      for (let i = bucketCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const colomboDate = new Date(d.getTime() + colomboOffsetMs);
        const key = colomboDate.toISOString().slice(0, 10); // YYYY-MM-DD
        const monthShort = colomboDate.toLocaleString("en-US", {
          month: "short",
          timeZone: "UTC",
        });
        const dayNum = colomboDate.getUTCDate();
        const label = `${monthShort} ${dayNum}`;

        bucketMap.set(key, chartBuckets.length);
        chartBuckets.push({
          date: key,
          label,
          pageViews: 0,
          customerActions: 0,
        });
      }

      const dailyEvents = await AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: startCurrent, $lte: endCurrent } } },
        {
          $project: {
            eventType: 1,
            dateKey: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $add: ["$createdAt", colomboOffsetMs] },
              },
            },
          },
        },
        {
          $group: {
            _id: { dateKey: "$dateKey", eventType: "$eventType" },
            count: { $sum: 1 },
          },
        },
      ]);

      for (const item of dailyEvents) {
        const idx = bucketMap.get(item._id.dateKey);
        if (idx !== undefined) {
          if (item._id.eventType === "PAGE_VIEW") {
            chartBuckets[idx].pageViews += item.count;
          } else if (
            [
              "WHATSAPP_CLICK",
              "CALL_CLICK",
              "BOOKING_CLICK",
              "GOOGLE_REVIEW_CLICK",
              "MAP_CLICK",
            ].includes(item._id.eventType)
          ) {
            chartBuckets[idx].customerActions += item.count;
          }
        }
      }
    }

    // 3. Top Viewed Pages (exclude admin and api routes)
    const topPagesAgg = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: "PAGE_VIEW",
          createdAt: { $gte: startCurrent, $lte: endCurrent },
          page: { $exists: true, $ne: "", $not: { $regex: "^/(admin|api)" } },
        },
      },
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const totalViewsInPeriod = metrics.pageViews.value;
    const topPages = topPagesAgg.map((item) => ({
      page: item._id,
      views: item.count,
      percentage:
        totalViewsInPeriod > 0
          ? Math.round((item.count / totalViewsInPeriod) * 1000) / 10
          : 0,
    }));

    // 4. Branch Performance
    // Fetch all active branches first
    const activeBranches = await Branch.find({ isActive: true })
      .select("name slug phone whatsappNumber googleReviewUrl")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const branchEventsAgg = await AnalyticsEvent.aggregate([
      {
        $match: {
          branchId: { $ne: null },
          createdAt: { $gte: startCurrent, $lte: endCurrent },
        },
      },
      {
        $group: {
          _id: { branchId: "$branchId", eventType: "$eventType" },
          count: { $sum: 1 },
        },
      },
    ]);

    const branchMetricMap = new Map<
      string,
      { total: number; whatsapp: number; calls: number; reviews: number; maps: number }
    >();

    for (const item of branchEventsAgg) {
      const bId = item._id.branchId.toString();
      if (!branchMetricMap.has(bId)) {
        branchMetricMap.set(bId, {
          total: 0,
          whatsapp: 0,
          calls: 0,
          reviews: 0,
          maps: 0,
        });
      }
      const data = branchMetricMap.get(bId)!;
      data.total += item.count;
      if (item._id.eventType === "WHATSAPP_CLICK") data.whatsapp += item.count;
      if (item._id.eventType === "CALL_CLICK") data.calls += item.count;
      if (item._id.eventType === "GOOGLE_REVIEW_CLICK") data.reviews += item.count;
      if (item._id.eventType === "MAP_CLICK") data.maps += item.count;
    }

    const branchPerformance = activeBranches.map((branch) => {
      const bId = branch._id.toString();
      const bData = branchMetricMap.get(bId) || {
        total: 0,
        whatsapp: 0,
        calls: 0,
        reviews: 0,
        maps: 0,
      };

      return {
        branchId: bId,
        name: branch.name,
        slug: branch.slug,
        interactions: bData.total,
        whatsapp: bData.whatsapp,
        calls: bData.calls,
        reviews: bData.reviews,
        maps: bData.maps,
      };
    });

    // 5. Top Customer Action
    const ctaCandidates = [
      { name: "WhatsApp", count: metrics.whatsappClicks.value, type: "WHATSAPP_CLICK" },
      { name: "Call", count: metrics.callClicks.value, type: "CALL_CLICK" },
      { name: "Online Booking", count: metrics.bookingClicks.value, type: "BOOKING_CLICK" },
      { name: "Google Review", count: metrics.reviewClicks.value, type: "GOOGLE_REVIEW_CLICK" },
      { name: "Directions / Map", count: metrics.mapClicks.value, type: "MAP_CLICK" },
    ].sort((a, b) => b.count - a.count);

    const topAction =
      ctaCandidates[0].count > 0
        ? {
            name: ctaCandidates[0].name,
            clicks: ctaCandidates[0].count,
            allActions: ctaCandidates,
          }
        : null;

    // 6. Recent Activity (last 12 meaningful events, populated with branch names where present)
    const recentEvents = await AnalyticsEvent.find({
      eventType: { $ne: "PAGE_VIEW" }, // Highlight meaningful CTA and interaction events
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("branchId", "name slug")
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentActivity = recentEvents.map((evt: any) => {
      let title = "Customer action";
      const branchName = evt.branchId?.name;

      switch (evt.eventType) {
        case "WHATSAPP_CLICK":
          title = branchName ? `WhatsApp clicked — ${branchName}` : "WhatsApp clicked";
          break;
        case "CALL_CLICK":
          title = branchName ? `Call initiated — ${branchName}` : "Quick Call clicked";
          break;
        case "BOOKING_CLICK":
          title = evt.metadata?.label
            ? `Appointment booking: ${evt.metadata.label}`
            : "Appointment booking clicked";
          break;
        case "GOOGLE_REVIEW_CLICK":
          title = branchName
            ? `Google Review clicked — ${branchName}`
            : "Google Review button clicked";
          break;
        case "MAP_CLICK":
          title = branchName
            ? `Directions opened — ${branchName}`
            : "Location map / directions opened";
          break;
        case "SERVICE_VIEW":
          title = evt.metadata?.label
            ? `Service viewed: ${evt.metadata.label}`
            : "Service details viewed";
          break;
        case "WEDDING_VIEW":
          title = evt.metadata?.label
            ? `Wedding item viewed: ${evt.metadata.label}`
            : "Wedding package / service viewed";
          break;
        case "VENDOR_CLICK":
          title = evt.metadata?.label
            ? `Vendor partner contacted: ${evt.metadata.label}`
            : "Vendor link opened";
          break;
        case "PRODUCT_CLICK":
          title = evt.metadata?.label
            ? `Brand website visited: ${evt.metadata.label}`
            : "Product brand link opened";
          break;
        default:
          title = evt.eventType.replace(/_/g, " ").toLowerCase();
      }

      return {
        id: evt._id.toString(),
        eventType: evt.eventType,
        title,
        source: evt.metadata?.source || null,
        branchName: branchName || null,
        createdAt: evt.createdAt ? new Date(evt.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      range,
      metrics,
      chart: {
        bucketType,
        buckets: chartBuckets,
      },
      topPages,
      branchPerformance,
      topAction,
      recentActivity,
    });
  } catch (error) {
    console.error("GET /api/admin/analytics/summary error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load analytics summary" },
      { status: 500 }
    );
  }
}
