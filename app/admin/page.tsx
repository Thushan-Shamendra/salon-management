"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ScissorsIcon,
  UsersIcon,
  ImageIcon,
  StarIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  SettingsIcon,
  StoreIcon,
  PhoneIcon,
  MailIcon,
  LinkIcon,
} from "@/components/ui/icons";
import StatusBadge from "@/components/admin/StatusBadge";

interface DashboardStats {
  totalServices: number;
  activeServices: number;
  totalGalleryPhotos: number;
  activeGalleryPhotos: number;
  featuredGalleryPhotos: number;
  totalBeauticians: number;
  activeBeauticians: number;
  googleReviewsEnabled: boolean;
  externalBookingConfigured: boolean;
}

interface WebsiteStatusData {
  salonName: string;
  hasSalonName: boolean;
  logo: string;
  hasLogo: boolean;
  phone: string;
  hasPhone: boolean;
  email: string;
  hasEmail: boolean;
  bookingUrl: string;
  hasBookingUrl: boolean;
  googleReviewsEnabled: boolean;
  isReady: boolean;
}

interface RecentItem {
  id: string;
  name?: string;
  title?: string;
  jobTitle?: string;
  category?: string;
  image?: string;
  isActive: boolean;
  isFeatured?: boolean;
  createdAt: string;
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays <= 0) {
      if (diffHrs <= 0) return "Added recently";
      return `Added ${diffHrs} ${diffHrs === 1 ? "hour" : "hours"} ago`;
    }
    if (diffDays < 7) {
      return `Added ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    }
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `Added ${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    return `Added ${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  } catch {
    return "Recently added";
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatusData | null>(null);
  const [recentServices, setRecentServices] = useState<RecentItem[]>([]);
  const [recentBeauticians, setRecentBeauticians] = useState<RecentItem[]>([]);
  const [recentGallery, setRecentGallery] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  useEffect(() => {
    // Client-side date formatting
    const timer = setTimeout(() => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentDateTime(`${dateStr} • ${timeStr}`);
    }, 0);

    let isMounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();

        if (res.ok && data.success && isMounted) {
          setStats(data.stats);
          setWebsiteStatus(data.websiteStatus);
          setRecentServices(data.recentServices || []);
          setRecentBeauticians(data.recentBeauticians || []);
          setRecentGallery(data.recentGallery || []);
        } else if (isMounted) {
          setError(data.message || "Failed to load dashboard metrics");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (isMounted) setError("Network error loading dashboard statistics");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-7 animate-fadeIn pb-10">
      {/* ========================================================== */}
      {/* 1. TOP HEADER: TITLE + LIVE DATE CARD (MATCHES MOCKUP)      */}
      {/* ========================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Welcome back! Here&apos;s an overview of your website content.
          </p>
        </div>

        {/* Live Date Card */}
        <div className="inline-flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-2.5 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <CalendarIcon className="h-4.5 w-4.5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-stone-900">
              {currentDateTime || "Today"}
            </p>
          </div>
        </div>
      </div>

      {/* Error notification if API failed */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. STAT CARDS ROW (MATCHES MOCKUP)                         */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active Services */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-purple-300 hover:shadow-md">
          <div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                <ScissorsIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-stone-700">
                  Active Services
                </span>
                <div className="mt-1">
                  <span className="text-3xl font-extrabold text-stone-900">
                    {loading ? "..." : stats?.activeServices ?? 0}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500 truncate">
                  of {stats?.totalServices ?? 0} total services
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#7C3AED]">
            <Link href="/admin/services" className="hover:underline">
              View Services →
            </Link>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
              <ArrowRightIcon className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Card 2: Active Beauticians */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-purple-300 hover:shadow-md">
          <div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                <UsersIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-stone-700">
                  Active Beauticians
                </span>
                <div className="mt-1">
                  <span className="text-3xl font-extrabold text-stone-900">
                    {loading ? "..." : stats?.activeBeauticians ?? 0}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500 truncate">
                  of {stats?.totalBeauticians ?? 0} total beauticians
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#7C3AED]">
            <Link href="/admin/beauticians" className="hover:underline">
              View Beauticians →
            </Link>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
              <ArrowRightIcon className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Card 3: Gallery Photos */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-purple-300 hover:shadow-md">
          <div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-stone-700">
                  Gallery Photos
                </span>
                <div className="mt-1">
                  <span className="text-3xl font-extrabold text-stone-900">
                    {loading ? "..." : stats?.activeGalleryPhotos ?? 0}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500 truncate">
                  of {stats?.totalGalleryPhotos ?? 0} total photos
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#7C3AED]">
            <Link href="/admin/gallery" className="hover:underline">
              View Gallery →
            </Link>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
              <ArrowRightIcon className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Card 4: Google Reviews */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-purple-300 hover:shadow-md">
          <div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                <StarIcon className="h-6 w-6" filled />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-stone-700">
                  Google Reviews
                </span>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2 py-0.5 border ${
                      stats?.googleReviewsEnabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        stats?.googleReviewsEnabled ? "bg-emerald-500" : "bg-stone-400"
                      }`}
                    />
                    {stats?.googleReviewsEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500 leading-tight">
                  {stats?.googleReviewsEnabled
                    ? "Google Reviews is connected and showing on your website."
                    : "Reviews section is currently hidden in Website Settings."}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#7C3AED]">
            <Link href="/admin/settings" className="hover:underline">
              View Settings →
            </Link>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
              <ArrowRightIcon className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. QUICK ACTIONS ROW (MATCHES MOCKUP)                      */}
      {/* ========================================================== */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-bold text-stone-900">Quick Actions</h2>
        </div>
        <p className="text-xs text-stone-500 mb-5">
          Manage your website content with these quick actions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Add Service */}
          <Link
            href="/admin/services"
            className="group flex items-center justify-between p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 hover:bg-purple-50/40 hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                <ScissorsIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                  Add Service
                </h3>
                <p className="text-[11px] text-stone-500">Create a new service</p>
              </div>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-2xs group-hover:scale-105 transition-transform shrink-0 ml-2">
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Action 2: Add Beautician */}
          <Link
            href="/admin/beauticians"
            className="group flex items-center justify-between p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 hover:bg-purple-50/40 hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                  Add Beautician
                </h3>
                <p className="text-[11px] text-stone-500">Add a new team member</p>
              </div>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-2xs group-hover:scale-105 transition-transform shrink-0 ml-2">
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Action 3: Add Gallery Photo */}
          <Link
            href="/admin/gallery"
            className="group flex items-center justify-between p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 hover:bg-purple-50/40 hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                  Add Gallery Photo
                </h3>
                <p className="text-[11px] text-stone-500">Upload new photo</p>
              </div>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-2xs group-hover:scale-105 transition-transform shrink-0 ml-2">
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Action 4: Edit Website Settings */}
          <Link
            href="/admin/settings"
            className="group flex items-center justify-between p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 hover:bg-purple-50/40 hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                  Edit Website Settings
                </h3>
                <p className="text-[11px] text-stone-500">Update salon info</p>
              </div>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-2xs group-hover:scale-105 transition-transform shrink-0 ml-2">
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 4. WEBSITE STATUS ROW (MATCHES MOCKUP)                     */}
      {/* ========================================================== */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-stone-900">Website Status</h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold border ${
              websiteStatus?.isReady
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                websiteStatus?.isReady ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {websiteStatus?.isReady ? "Website is ready" : "Configuration needed"}
          </span>
        </div>
        <p className="text-xs text-stone-500 mb-5">
          Check your website configuration and settings.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Status 1: Salon Name */}
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <StoreIcon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold text-stone-500">
                Salon Name
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900 truncate">
                {websiteStatus?.salonName || "Invora Salon"}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Configured</span>
              </div>
            </div>
          </div>

          {/* Status 2: Logo */}
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                <ImageIcon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold text-stone-500">Logo</span>
            </div>
            <div>
              <div className="h-4 relative w-20 mb-1">
                <Image
                  src="/images/invora-logo-dark-trimmed.png"
                  alt="INVORA"
                  fill
                  className="object-contain object-left"
                />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Configured</span>
              </div>
            </div>
          </div>

          {/* Status 3: Phone */}
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <PhoneIcon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold text-stone-500">Phone</span>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900 truncate">
                {websiteStatus?.phone || "Not set"}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    websiteStatus?.hasPhone ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span>{websiteStatus?.hasPhone ? "Configured" : "Missing"}</span>
              </div>
            </div>
          </div>

          {/* Status 4: Email */}
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <MailIcon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold text-stone-500">Email</span>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900 truncate">
                {websiteStatus?.email || "Not set"}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    websiteStatus?.hasEmail ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span>{websiteStatus?.hasEmail ? "Configured" : "Missing"}</span>
              </div>
            </div>
          </div>

          {/* Status 5: Booking URL */}
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <LinkIcon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold text-stone-500">
                Booking URL
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900 truncate">
                {websiteStatus?.hasBookingUrl ? "Connected" : "Not Set"}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    websiteStatus?.hasBookingUrl ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span>
                  {websiteStatus?.hasBookingUrl ? "Configured" : "Missing"}
                </span>
              </div>
            </div>
          </div>

          {/* Status 6: Google Reviews */}
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <StarIcon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold text-stone-500 truncate">
                Google Reviews
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900 truncate">
                {websiteStatus?.googleReviewsEnabled ? "Enabled" : "Disabled"}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    websiteStatus?.googleReviewsEnabled
                      ? "bg-emerald-500"
                      : "bg-stone-400"
                  }`}
                />
                <span>Configured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 5. RECENT CONTENT 3 COLUMNS (MATCHES MOCKUP)               */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Recently Added Services */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                  <ScissorsIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Recently Added Services
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Your latest service additions.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/services"
                className="text-xs font-semibold text-[#7C3AED] hover:underline shrink-0"
              >
                View All →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-stone-100">
              {recentServices.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-400">
                  No services added yet.
                </p>
              ) : (
                recentServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/80">
                        {service.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={service.image}
                            alt={service.name || "Service"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-400">
                            <ScissorsIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {service.name}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {formatRelativeTime(service.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={service.isActive ? "active" : "inactive"}
                      className="shrink-0"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Recently Added Beauticians */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                  <UsersIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Recently Added Beauticians
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Your latest team members.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/beauticians"
                className="text-xs font-semibold text-[#7C3AED] hover:underline shrink-0"
              >
                View All →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-stone-100">
              {recentBeauticians.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-400">
                  No beauticians added yet.
                </p>
              ) : (
                recentBeauticians.map((beautician) => (
                  <div
                    key={beautician.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/80">
                        {beautician.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={beautician.image}
                            alt={beautician.name || "Beautician"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-400">
                            <UsersIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {beautician.name}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {beautician.jobTitle || formatRelativeTime(beautician.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={beautician.isActive ? "active" : "inactive"}
                      className="shrink-0"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Recently Added Gallery Photos */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Recently Added Gallery Photos
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Your latest gallery additions.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/gallery"
                className="text-xs font-semibold text-[#7C3AED] hover:underline shrink-0"
              >
                View All →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-stone-100">
              {recentGallery.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-400">
                  No gallery photos added yet.
                </p>
              ) : (
                recentGallery.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/80">
                        {photo.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo.image}
                            alt={photo.title || "Gallery"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-400">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {photo.title}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {formatRelativeTime(photo.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={photo.isFeatured ? "featured" : photo.isActive ? "active" : "inactive"}
                      className="shrink-0"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}