"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ScissorsIcon,
  UsersIcon,
  ImageIcon,
  StarIcon,
  CalendarIcon,
  AlertCircleIcon,
  SettingsIcon,
  SparklesIcon,
  StoreIcon,
  PhoneIcon,
  EyeIcon,
  WhatsAppIcon,
  CompassIcon,
  BriefcaseIcon,
  TagIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import AnalyticsStatCard from "@/components/admin/analytics/AnalyticsStatCard";
import ActivityChart, { ChartBucket } from "@/components/admin/analytics/ActivityChart";
import TopPages, { TopPageItem } from "@/components/admin/analytics/TopPages";
import BranchPerformance, { BranchPerformanceItem } from "@/components/admin/analytics/BranchPerformance";
import WebsiteHealth, { WebsiteHealthData } from "@/components/admin/analytics/WebsiteHealth";
import RecentActivity, { RecentActivityItem } from "@/components/admin/analytics/RecentActivity";
import { useSectionCustomization, useGlobalCustomization } from "@/components/customization/CustomizationProvider";
import { normalizeHex, adjustColor, getRgbComponents } from "@/lib/dashboard-theme";

type DateRange = "today" | "7d" | "30d";

interface ContentStats {
  branches: { total: number; active: number };
  services: { total: number; active: number };
  beauticians: { total: number; active: number };
  gallery: { total: number; active: number; featured: number };
  products: { total: number; active: number };
  vendors: { total: number; active: number };
  weddingServices: { total: number; active: number };
  weddingPackages: { total: number; active: number };
}

interface AnalyticsMetric {
  value: number;
  previous: number;
  change: {
    pct: number | null;
    text: string;
    isPositive: boolean;
    isNeutral: boolean;
  };
}

interface AnalyticsData {
  range: DateRange;
  metrics: {
    pageViews: AnalyticsMetric;
    whatsappClicks: AnalyticsMetric;
    callClicks: AnalyticsMetric;
    bookingClicks: AnalyticsMetric;
    reviewClicks: AnalyticsMetric;
    mapClicks: AnalyticsMetric;
    vendorClicks: AnalyticsMetric;
    serviceViews: AnalyticsMetric;
    weddingViews: AnalyticsMetric;
    productClicks: AnalyticsMetric;
  };
  chart: {
    bucketType: "hour" | "day";
    buckets: ChartBucket[];
  };
  topPages: TopPageItem[];
  branchPerformance: BranchPerformanceItem[];
  topAction: {
    name: string;
    clicks: number;
    allActions: Array<{ name: string; count: number; type: string }>;
  } | null;
  recentActivity: RecentActivityItem[];
}

export default function AdminDashboardPage() {
  const customization = useSectionCustomization("page");
  const globalCustomization = useGlobalCustomization();
  const themeColor = normalizeHex(
    customization.style?.iconColor ||
    globalCustomization?.adminWebsite?.style?.iconColor,
    "#03BF62"
  );
  const [range, setRange] = useState<DateRange>("30d");
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [websiteHealth, setWebsiteHealth] = useState<WebsiteHealthData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  // Live client-side date/time
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentDateTime(`${dateStr} • ${timeStr}`);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Load Content Overview and Health (from /api/admin/dashboard)
  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      try {
        setLoadingDashboard(true);
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success) {
            setContentStats(data.stats);
            setWebsiteHealth(data.websiteHealth);
          } else {
            setDashboardError(data.message || "Failed to load dashboard metrics");
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (isMounted) setDashboardError("Network error loading dashboard statistics");
      } finally {
        if (isMounted) setLoadingDashboard(false);
      }
    }

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Analytics Data based on selected date range (from /api/admin/analytics/summary)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadAnalytics() {
      try {
        const res = await fetch(`/api/admin/analytics/summary?range=${range}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success) {
            setAnalytics(data);
            setAnalyticsError(null);
          } else {
            setAnalyticsError(data.message || "Failed to load analytics");
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Analytics fetch error:", err);
          if (isMounted) setAnalyticsError("Network error loading website analytics");
        }
      } finally {
        if (isMounted) setLoadingAnalytics(false);
      }
    }

    loadAnalytics();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [range]);

  const handleRangeChange = (newRange: DateRange) => {
    if (newRange !== range) {
      setLoadingAnalytics(true);
      setRange(newRange);
    }
  };

  // Label for current range comparison
  const rangeCompareLabel =
    range === "today"
      ? "vs yesterday"
      : range === "7d"
      ? "vs prior 7 days"
      : "vs prior 30 days";

  const rangeTitle =
    range === "today"
      ? "Today (Hourly Trends)"
      : range === "7d"
      ? "Last 7 Days (Daily Trends)"
      : "Last 30 Days (Daily Trends)";

  const { r, g, b } = getRgbComponents(themeColor);

  return (
    <div
      className="space-y-8 animate-fadeIn pb-14"
      style={{
        ["--admin-theme" as string]: themeColor,
        ["--admin-theme-rgb" as string]: `${r}, ${g}, ${b}`,
        ["--admin-hover-border" as string]: `rgba(${r}, ${g}, ${b}, 0.55)`,
        ["--admin-hover-glow" as string]: `0 6px 20px -2px rgba(${r}, ${g}, ${b}, 0.32)`,
      }}
    >
      {/* ========================================================== */}
      {/* 1. DASHBOARD HEADER: TITLE + DATE RANGE FILTER             */}
      {/* ========================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 data-customization-role="heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              {customization.text("heading", "SALVORA Salon Dashboard")}
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold border"
              style={{
                backgroundColor: `${themeColor}18`,
                borderColor: `${themeColor}33`,
                color: themeColor,
              }}
            >
              Live
            </span>
          </div>
          <p data-customization-role="description" data-customization-admin-body className="mt-1 text-xs sm:text-sm text-stone-500">
            {customization.text("description", "Executive overview of your salon content, branch operations, and customer analytics.")}
          </p>
        </div>

        {/* Date Display and Range Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Current Date/Time Pill */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 shadow-2xs">
            <CalendarIcon className="h-4 w-4" style={{ color: themeColor }} />
            <span>{currentDateTime || "Today"}</span>
          </div>

          {/* Quick Date Range Filter: [ Today ] [ 7 Days ] [ 30 Days ] */}
          <div className="inline-flex rounded-xl border border-stone-200/90 bg-stone-100 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleRangeChange("today")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                range === "today"
                  ? "text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
              style={range === "today" ? { backgroundColor: themeColor } : undefined}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange("7d")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                range === "7d"
                  ? "text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
              style={range === "7d" ? { backgroundColor: themeColor } : undefined}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange("30d")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                range === "30d"
                  ? "text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
              style={range === "30d" ? { backgroundColor: themeColor } : undefined}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Error Notifications */}
      {(dashboardError || analyticsError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <span>{dashboardError || analyticsError}</span>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. SECTION 1: CONTENT OVERVIEW (REAL DB COUNTS)            */}
      {/* ========================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 data-customization-role="sectionHeading" className="text-base font-bold text-stone-900">Salon Content Overview</h2>
            <p className="text-xs text-stone-500">
              Live records across all salon operations and public website catalogs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 sm:gap-4">
          {/* 1. Branches */}
          <Link
            href="/admin/branches"
            className="admin-glow-card group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="admin-glow-title text-xs font-bold text-stone-600 transition-colors">
                Branches
              </span>
              <div
                className="admin-glow-icon flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200"
                style={{
                  backgroundColor: `${themeColor}18`,
                  borderColor: `${themeColor}26`,
                  color: themeColor,
                }}
              >
                <StoreIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-stone-900">
                {loadingDashboard ? "..." : contentStats?.branches.active ?? 0}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                of {contentStats?.branches.total ?? 0} total
              </p>
            </div>
          </Link>

          {/* 2. Services */}
          <Link
            href="/admin/services"
            className="admin-glow-card group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="admin-glow-title text-xs font-bold text-stone-600 transition-colors">
                Services
              </span>
              <div
                className="admin-glow-icon flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200"
                style={{
                  backgroundColor: `${themeColor}18`,
                  borderColor: `${themeColor}26`,
                  color: themeColor,
                }}
              >
                <ScissorsIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-stone-900">
                {loadingDashboard ? "..." : contentStats?.services.active ?? 0}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                of {contentStats?.services.total ?? 0} total
              </p>
            </div>
          </Link>

          {/* 3. Beauticians */}
          <Link
            href="/admin/beauticians"
            className="admin-glow-card group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="admin-glow-title text-xs font-bold text-stone-600 transition-colors">
                Beauticians
              </span>
              <div
                className="admin-glow-icon flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200"
                style={{
                  backgroundColor: `${themeColor}18`,
                  borderColor: `${themeColor}26`,
                  color: themeColor,
                }}
              >
                <UsersIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-stone-900">
                {loadingDashboard ? "..." : contentStats?.beauticians.active ?? 0}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                of {contentStats?.beauticians.total ?? 0} total
              </p>
            </div>
          </Link>

          {/* 4. Products & Brands */}
          <Link
            href="/admin/products"
            className="admin-glow-card group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="admin-glow-title text-xs font-bold text-stone-600 transition-colors">
                Products / Brands
              </span>
              <div
                className="admin-glow-icon flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200"
                style={{
                  backgroundColor: `${themeColor}18`,
                  borderColor: `${themeColor}26`,
                  color: themeColor,
                }}
              >
                <TagIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-stone-900">
                {loadingDashboard ? "..." : contentStats?.products.active ?? 0}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                of {contentStats?.products.total ?? 0} brands
              </p>
            </div>
          </Link>

          {/* 5. Gallery */}
          <Link
            href="/admin/gallery"
            className="admin-glow-card group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="admin-glow-title text-xs font-bold text-stone-600 transition-colors">
                Gallery Photos
              </span>
              <div
                className="admin-glow-icon flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200"
                style={{
                  backgroundColor: `${themeColor}18`,
                  borderColor: `${themeColor}26`,
                  color: themeColor,
                }}
              >
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-stone-900">
                {loadingDashboard ? "..." : contentStats?.gallery.active ?? 0}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                of {contentStats?.gallery.total ?? 0} photos
              </p>
            </div>
          </Link>

          {/* 6. Vendors */}
          <Link
            href="/admin/vendors"
            className="admin-glow-card group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="admin-glow-title text-xs font-bold text-stone-600 transition-colors">
                Vendors
              </span>
              <div
                className="admin-glow-icon flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200"
                style={{
                  backgroundColor: `${themeColor}18`,
                  borderColor: `${themeColor}26`,
                  color: themeColor,
                }}
              >
                <BriefcaseIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-stone-900">
                {loadingDashboard ? "..." : contentStats?.vendors.active ?? 0}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                of {contentStats?.vendors.total ?? 0} partners
              </p>
            </div>
          </Link>

          {/* 7. Wedding */}
          <Link
            href="/admin/wedding"
            className="admin-glow-card group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="admin-glow-title text-xs font-bold text-stone-600 transition-colors">
                Wedding
              </span>
              <div
                className="admin-glow-icon flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200"
                style={{
                  backgroundColor: `${themeColor}18`,
                  borderColor: `${themeColor}26`,
                  color: themeColor,
                }}
              >
                <SparklesIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-stone-900">
                {loadingDashboard
                  ? "..."
                  : (contentStats?.weddingServices.active ?? 0) +
                    (contentStats?.weddingPackages.active ?? 0)}
              </span>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: themeColor }}>
                {contentStats?.weddingServices.active ?? 0} svc •{" "}
                {contentStats?.weddingPackages.active ?? 0} pkgs
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. SECTION 2: WEBSITE ENGAGEMENT (REAL ANALYTICS CARDS)     */}
      {/* ========================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 data-customization-role="sectionHeading" className="text-base font-bold text-stone-900">Website Engagement</h2>
            <p className="text-xs text-stone-500">
              First-party traffic and conversion metrics for {range === "today" ? "today" : `the past ${range.replace("d", " days")}`}
            </p>
          </div>
          {loadingAnalytics && (
            <span className="text-xs text-stone-400 font-semibold animate-pulse">
              Updating analytics...
            </span>
          )}
        </div>

        {/* Primary 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsStatCard
            title="Page Views"
            value={analytics?.metrics.pageViews.value ?? 0}
            change={analytics?.metrics.pageViews.change}
            icon={EyeIcon}
            rangeLabel={rangeCompareLabel}
            accentColor={themeColor}
          />
          <AnalyticsStatCard
            title="WhatsApp Clicks"
            value={analytics?.metrics.whatsappClicks.value ?? 0}
            change={analytics?.metrics.whatsappClicks.change}
            icon={WhatsAppIcon}
            rangeLabel={rangeCompareLabel}
            accentColor={themeColor}
          />
          <AnalyticsStatCard
            title="Call Clicks"
            value={analytics?.metrics.callClicks.value ?? 0}
            change={analytics?.metrics.callClicks.change}
            icon={PhoneIcon}
            rangeLabel={rangeCompareLabel}
            accentColor={themeColor}
          />
          <AnalyticsStatCard
            title="Booking Clicks"
            value={analytics?.metrics.bookingClicks.value ?? 0}
            change={analytics?.metrics.bookingClicks.change}
            icon={CalendarIcon}
            rangeLabel={rangeCompareLabel}
            accentColor={themeColor}
          />
        </div>

        {/* Secondary Engagement Metrics Row */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="admin-glow-card rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
              <StarIcon className="h-3.5 w-3.5 text-amber-500 fill-current" />
              <span className="admin-glow-title transition-colors">Review Clicks</span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-stone-900">
              {analytics?.metrics.reviewClicks.value ?? 0}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">Google Reviews</p>
          </div>

          <div className="admin-glow-card rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
              <CompassIcon className="h-3.5 w-3.5" style={{ color: themeColor }} />
              <span className="admin-glow-title transition-colors truncate">Map / Directions Clicks</span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-stone-900">
              {analytics?.metrics.mapClicks.value ?? 0}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">Branch directions</p>
          </div>

          <div className="admin-glow-card rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
              <ScissorsIcon className="h-3.5 w-3.5" style={{ color: themeColor }} />
              <span className="admin-glow-title transition-colors">Service Views</span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-stone-900">
              {analytics?.metrics.serviceViews.value ?? 0}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">Catalog inquiries</p>
          </div>

          <div className="admin-glow-card rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
              <SparklesIcon className="h-3.5 w-3.5" style={{ color: themeColor }} />
              <span className="admin-glow-title transition-colors">Wedding Views</span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-stone-900">
              {analytics?.metrics.weddingViews.value ?? 0}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">Packages & services</p>
          </div>

          <div className="admin-glow-card rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
              <TagIcon className="h-3.5 w-3.5 text-pink-500" />
              <span className="admin-glow-title transition-colors">Brand Clicks</span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-stone-900">
              {analytics?.metrics.productClicks.value ?? 0}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">Product brands</p>
          </div>

          <div className="admin-glow-card rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
              <BriefcaseIcon className="h-3.5 w-3.5" style={{ color: themeColor }} />
              <span className="admin-glow-title transition-colors">Vendor Clicks</span>
            </div>
            <p className="mt-2 text-lg font-extrabold text-stone-900">
              {analytics?.metrics.vendorClicks.value ?? 0}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">Partner links</p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 4. SECTION 3: ENGAGEMENT TREND CHART                       */}
      {/* ========================================================== */}
      <div>
        <ActivityChart
          buckets={analytics?.chart.buckets || []}
          rangeTitle={rangeTitle}
          accentColor={themeColor}
        />
      </div>

      {/* ========================================================== */}
      {/* 5. SECTIONS 4 & 5: TOP PAGES & BRANCH PERFORMANCE          */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TopPages pages={analytics?.topPages || []} accentColor={themeColor} />
        </div>
        <div>
          <BranchPerformance branches={analytics?.branchPerformance || []} accentColor={themeColor} />
        </div>
      </div>

      {/* ========================================================== */}
      {/* 6. SECTIONS 6 & 7: TOP CUSTOMER ACTION & WEBSITE HEALTH    */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customer Action Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs h-full">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900 tracking-tight">
                  Top Customer Action
                </h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Most converting customer action channel during selected period
                </p>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold border"
                style={{
                  backgroundColor: `${themeColor}18`,
                  borderColor: `${themeColor}33`,
                  color: themeColor,
                }}
              >
                Conversion Leader
              </span>
            </div>

            <div className="mt-5">
              {!analytics?.topAction ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-stone-400 font-medium">
                    No customer actions recorded yet for this period.
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    As visitors click WhatsApp, Call, or Bookings, your top converting channel will appear here.
                  </p>
                </div>
              ) : (
                <div>
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: `${themeColor}44`,
                      backgroundColor: `${themeColor}0D`,
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: themeColor }}>
                      #1 Inquiries Channel
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">
                      {analytics.topAction.name} is your #1 inquiry channel
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Generated <strong style={{ color: themeColor }}>{analytics.topAction.clicks}</strong> customer interactions in this period.
                    </p>
                  </div>

                  {/* Channel Breakdown List */}
                  <div className="mt-4 space-y-2.5">
                    <p className="text-xs font-bold text-stone-700">Actions Breakdown</p>
                    {analytics.topAction.allActions.map((action) => {
                      const totalActions = analytics.topAction?.allActions.reduce(
                        (acc, cur) => acc + cur.count,
                        0
                      ) || 1;
                      const pct = Math.round((action.count / totalActions) * 100);

                      return (
                        <div key={action.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-stone-700">
                              {action.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900">
                                {action.count}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                ({pct}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(pct, 2)}%`,
                                backgroundColor: themeColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Website Health Component */}
        <div>
          {websiteHealth ? (
            <WebsiteHealth health={websiteHealth} />
          ) : (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs text-center text-xs text-stone-400">
              Checking website health...
            </div>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 7. SECTION 8: QUICK ACTIONS                                */}
      {/* ========================================================== */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircleIcon className="h-5 w-5" style={{ color: themeColor }} />
          <h2 data-customization-role="sectionHeading" className="text-base font-bold text-stone-900">Quick Actions</h2>
        </div>
        <p className="text-xs text-stone-500 mb-5">
          Fast shortcuts to manage branches, services, staff, brands, and settings.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/branches"
            className="admin-glow-card group flex flex-col items-center justify-center p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 transition-all text-center cursor-pointer"
          >
            <div
              className="admin-glow-icon flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                backgroundColor: `${themeColor}18`,
                borderColor: `${themeColor}26`,
                color: themeColor,
              }}
            >
              <StoreIcon className="h-5 w-5" />
            </div>
            <span className="admin-glow-title mt-2 text-xs font-bold text-stone-800 transition-colors">
              + Add Branch
            </span>
            <span className="text-[10px] text-stone-400">Locations</span>
          </Link>

          <Link
            href="/admin/services"
            className="admin-glow-card group flex flex-col items-center justify-center p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 transition-all text-center cursor-pointer"
          >
            <div
              className="admin-glow-icon flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                backgroundColor: `${themeColor}18`,
                borderColor: `${themeColor}26`,
                color: themeColor,
              }}
            >
              <ScissorsIcon className="h-5 w-5" />
            </div>
            <span className="admin-glow-title mt-2 text-xs font-bold text-stone-800 transition-colors">
              + Add Service
            </span>
            <span className="text-[10px] text-stone-400">Catalog</span>
          </Link>

          <Link
            href="/admin/beauticians"
            className="admin-glow-card group flex flex-col items-center justify-center p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 transition-all text-center cursor-pointer"
          >
            <div
              className="admin-glow-icon flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                backgroundColor: `${themeColor}18`,
                borderColor: `${themeColor}26`,
                color: themeColor,
              }}
            >
              <UsersIcon className="h-5 w-5" />
            </div>
            <span className="admin-glow-title mt-2 text-xs font-bold text-stone-800 transition-colors">
              + Add Beautician
            </span>
            <span className="text-[10px] text-stone-400">Team</span>
          </Link>

          <Link
            href="/admin/products"
            className="admin-glow-card group flex flex-col items-center justify-center p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 transition-all text-center cursor-pointer"
          >
            <div
              className="admin-glow-icon flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                backgroundColor: `${themeColor}18`,
                borderColor: `${themeColor}26`,
                color: themeColor,
              }}
            >
              <TagIcon className="h-5 w-5" />
            </div>
            <span className="admin-glow-title mt-2 text-xs font-bold text-stone-800 transition-colors">
              + Add Product
            </span>
            <span className="text-[10px] text-stone-400">Brands</span>
          </Link>

          <Link
            href="/admin/vendors"
            className="admin-glow-card group flex flex-col items-center justify-center p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 transition-all text-center cursor-pointer"
          >
            <div
              className="admin-glow-icon flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                backgroundColor: `${themeColor}18`,
                borderColor: `${themeColor}26`,
                color: themeColor,
              }}
            >
              <BriefcaseIcon className="h-5 w-5" />
            </div>
            <span className="admin-glow-title mt-2 text-xs font-bold text-stone-800 transition-colors">
              + Add Vendor
            </span>
            <span className="text-[10px] text-stone-400">Partners</span>
          </Link>

          <Link
            href="/admin/settings"
            className="admin-glow-card group flex flex-col items-center justify-center p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 transition-all text-center cursor-pointer"
          >
            <div
              className="admin-glow-icon flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                backgroundColor: `${themeColor}18`,
                borderColor: `${themeColor}26`,
                color: themeColor,
              }}
            >
              <SettingsIcon className="h-5 w-5" />
            </div>
            <span className="admin-glow-title mt-2 text-xs font-bold text-stone-800 transition-colors">
              Edit Settings
            </span>
            <span className="text-[10px] text-stone-400">Salon info</span>
          </Link>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 8. SECTIONS 9 & 10: RECENT ACTIVITY & AI ASSISTANT         */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity (2 Columns) */}
        <div className="lg:col-span-2">
          <RecentActivity activity={analytics?.recentActivity || []} accentColor={themeColor} />
        </div>

        {/* AI Website Assistant Placeholder Card (1 Column) */}
        <div
          className="flex flex-col justify-between rounded-2xl border p-5 sm:p-6 shadow-xs h-full relative overflow-hidden"
          style={{
            borderColor: `${themeColor}44`,
            background: `linear-gradient(135deg, ${themeColor}12 0%, #FFFFFF 50%, ${themeColor}08 100%)`,
          }}
        >
          {/* Decorative background glow */}
          <div
            className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full blur-2xl pointer-events-none"
            style={{ backgroundColor: `${themeColor}26` }}
          />

          <div>
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: `${themeColor}26` }}
            >
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${themeColor}1F`,
                  color: themeColor,
                }}
              >
                Group 5 • AI Analytics
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold border"
                style={{
                  backgroundColor: `${themeColor}14`,
                  color: themeColor,
                  borderColor: `${themeColor}33`,
                }}
              >
                Ready
              </span>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-xs"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}, ${adjustColor(themeColor, -25)})`,
                }}
                data-icon-color="white"
              >
                <SparklesIcon
                  className="h-5 w-5 !text-white text-white"
                  style={{ color: "#FFFFFF" }}
                  data-icon-color="white"
                />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
                  SALVORA AI Assistant
                </h3>
                <p className="text-xs font-semibold" style={{ color: themeColor }}>
                  Powered by real salon analytics
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone-600 leading-relaxed">
              SALVORA AI continuously monitors your website analytics, customer inquiry channels, and branch performance to deliver executive intelligence.
            </p>

            {/* Feature Highlights */}
            <div
              className="mt-4 space-y-2 border-t pt-3 text-xs text-stone-700"
              style={{ borderColor: `${themeColor}26` }}
            >
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: themeColor }}>📊</span>
                <span>Analyze branch traffic & customer inquiry patterns</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: themeColor }}>💬</span>
                <span>Track service demand and WhatsApp conversion trends</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: themeColor }}>💡</span>
                <span>Smart salon recommendations powered by real MongoDB data</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t" style={{ borderColor: `${themeColor}26` }}>
            <Link
              href="/admin/ai-assistant"
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all"
              style={{ backgroundColor: themeColor }}
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Open AI Assistant →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}