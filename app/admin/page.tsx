"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  ScissorsIcon,
  StarIcon,
  SparklesIcon,
  SettingsIcon,
  ArrowRightIcon,
  ImageIcon,
  UsersIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();

        if (res.ok && data.success && isMounted) {
          setStats(data.stats);
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
      isMounted = false;
    };
  }, []);

  const quickActions = [
    {
      title: "Add New Service",
      description: "Create a new salon service, pricing, and treatment duration",
      href: "/admin/services",
      icon: ScissorsIcon,
      highlight: true,
    },
    {
      title: "Add Beautician Profile",
      description: "Update team profiles, bios, and specialties for the About page",
      href: "/admin/beauticians",
      icon: UsersIcon,
    },
    {
      title: "Add Gallery Photo",
      description: "Upload and organize photos displayed on the public salon portfolio",
      href: "/admin/gallery",
      icon: ImageIcon,
    },
    {
      title: "Website Settings",
      description: "Update salon contact info, opening hours, and external system links",
      href: "/admin/settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Website Content Administration"
        description="Manage the public website content, active treatments, beautician profiles, and photo gallery."
      />

      {/* Error banner if dashboard API failed */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* 2. Key Statistics Grid */}
      <section aria-label="Website content metrics">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Active Services */}
          <StatCard
            title="Active Services"
            value={loading ? "..." : stats?.activeServices}
            description={`Out of ${stats?.totalServices ?? 0} total services in catalog`}
            icon={ScissorsIcon}
            href="/admin/services"
            badge="Live"
          />

          {/* Active Beauticians */}
          <StatCard
            title="Active Beauticians"
            value={loading ? "..." : stats?.activeBeauticians ?? 0}
            description={`${stats?.totalBeauticians ?? 0} total team profiles configured`}
            icon={UsersIcon}
            href="/admin/beauticians"
            badge="Live"
          />

          {/* Gallery Photos */}
          <StatCard
            title="Gallery Photos"
            value={loading ? "..." : stats?.totalGalleryPhotos ?? 0}
            description={`${stats?.activeGalleryPhotos ?? 0} active portfolio photos published`}
            icon={ImageIcon}
            href="/admin/gallery"
            badge="Live"
          />

          {/* Featured Gallery Photos */}
          <StatCard
            title="Featured Works"
            value={loading ? "..." : stats?.featuredGalleryPhotos ?? 0}
            description="Highlighted photos showcased on the public gallery"
            icon={SparklesIcon}
            href="/admin/gallery"
          />

          {/* Google Reviews Display */}
          <StatCard
            title="Google Reviews"
            value={loading ? "..." : stats?.googleReviewsEnabled ? "Enabled" : "Disabled"}
            description={
              stats?.googleReviewsEnabled
                ? "Live ratings displayed from Google Places"
                : "Display disabled in Website Settings"
            }
            icon={StarIcon}
            href="/admin/settings"
          />

          {/* External Booking Link Status */}
          <StatCard
            title="External Booking"
            value={loading ? "..." : stats?.externalBookingConfigured ? "Connected" : "Not Set"}
            description={
              stats?.externalBookingConfigured
                ? "Public CTA buttons route to external booking system"
                : "Configure booking URL in Website Settings"
            }
            icon={ExternalLinkIcon}
            href="/admin/settings"
          />
        </div>
      </section>

      {/* 3. Quick Actions Section */}
      <section aria-label="Quick Actions" className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Quick Actions
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Content management shortcuts for your public salon website
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  action.highlight
                    ? "border-[#B7925A]/50 bg-gradient-to-br from-white via-white to-[#FAF7F2]"
                    : "border-stone-200/90 bg-white hover:border-[#B7925A]/40"
                }`}
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25 mb-3 group-hover:bg-stone-900 group-hover:text-[#C5A46D] transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="font-serif text-base font-semibold text-stone-900 group-hover:text-[#B7925A] transition-colors">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-[#B7925A]">
                  <span>Open</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}