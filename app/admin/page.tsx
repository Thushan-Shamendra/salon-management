"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatTime12Hour } from "@/lib/appointments";
import {
  ScissorsIcon,
  UserIcon,
  StarIcon,
  CalendarIcon,
  MessageCircleIcon,
  SparklesIcon,
  SettingsIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

interface AppointmentRow {
  _id: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone?: string;
  service?: {
    _id: string;
    name: string;
    duration: number;
    price: number;
  };
  duration: number;
  price: number;
  status: string;
}

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalServices: number;
  activeServices: number;
  totalReviews: number;
  pendingReviews: number;
  averageRating: number;
  totalAppointments: number | null;
  todayAppointments: number | null;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  todayDate?: string;
  totalCommunityPosts: number | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<AppointmentRow[]>([]);
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
          setTodaySchedule(data.todaySchedule || []);
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
      title: "Manage Appointments",
      description: "Review bookings, confirm requests, and manage salon calendar",
      href: "/admin/appointments",
      icon: CalendarIcon,
    },
    {
      title: "Manage Customers",
      description: "Inspect customer accounts, membership status, and permissions",
      href: "/admin/customers",
      icon: UserIcon,
    },
    {
      title: "Review Guest Feedback",
      description: "Moderate, approve, and filter client ratings and testimonials",
      href: "/admin/reviews",
      icon: StarIcon,
    },
    {
      title: "Community Moderation",
      description: "Oversee customer transformations and salon community posts",
      href: "/admin/community",
      icon: MessageCircleIcon,
    },
    {
      title: "Website Settings",
      description: "Update salon contact info, opening hours, and social media handles",
      href: "/admin/settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Dashboard"
        description="Welcome to your operational salon sanctuary. Monitor real customer registrations, live services, and client bookings."
      />

      {/* Error banner if dashboard API failed */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* 2. Key Statistics Grid */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Active Services (Real) */}
          <StatCard
            title="Active Services"
            value={loading ? "..." : stats?.activeServices}
            description={`Out of ${stats?.totalServices ?? 0} total services in catalog`}
            icon={ScissorsIcon}
            href="/admin/services"
          />

          {/* Total Customers (Real) */}
          <StatCard
            title="Total Customers"
            value={loading ? "..." : stats?.totalCustomers}
            description={`${stats?.activeCustomers ?? 0} verified active customer accounts`}
            icon={UserIcon}
            href="/admin/customers"
          />

          {/* Appointments Metric (Real) */}
          <StatCard
            title="Total Appointments"
            value={loading ? "..." : stats?.totalAppointments ?? 0}
            description={`${stats?.todayAppointments ?? 0} today (${stats?.pendingAppointments ?? 0} pending, ${stats?.confirmedAppointments ?? 0} confirmed)`}
            icon={CalendarIcon}
            href="/admin/appointments"
          />

          {/* Total Reviews & Rating (Real) */}
          <StatCard
            title="Guest Reviews"
            value={loading ? "..." : stats?.totalReviews}
            description={
              stats?.averageRating
                ? `Average rating: ${stats.averageRating} ★ (${stats.pendingReviews ?? 0} pending approval)`
                : "No reviews submitted yet"
            }
            icon={StarIcon}
            href="/admin/reviews"
          />

          {/* Community Posts */}
          <StatCard
            title="Community Posts"
            value={null}
            description="Member transformation feed is currently in configuration"
            icon={MessageCircleIcon}
            href="/admin/community"
            isUnavailable={true}
          />

          {/* Operational Status Card */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-[#B7925A]/30 bg-white p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B7925A]">
                  System Status
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <SparklesIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-stone-900">
                  Online & Active
                </span>
              </div>

              <p className="mt-2 text-xs text-stone-500 leading-relaxed">
                MongoDB database connected with live booking engine &amp; JWT sessions.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
              <span>Environment</span>
              <span className="font-mono text-[11px] text-stone-600">Production Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Today's Appointments Section */}
      <section aria-label="Today's Appointments" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Today&apos;s Appointments
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Scheduled client appointments and treatments for today ({stats?.todayDate || "Today"})
            </p>
          </div>

          <Link
            href="/admin/appointments"
            className="text-xs font-semibold text-[#B7925A] hover:underline"
          >
            View all appointments &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-500">
            Loading today&apos;s schedule...
          </div>
        ) : todaySchedule.length === 0 ? (
          <EmptyState
            icon={ClockIcon}
            title="No appointments scheduled for today"
            description="There are currently no customer bookings scheduled for today. New bookings made by customers will automatically appear here."
            actionText="View All Appointments"
            actionHref="/admin/appointments"
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF7F2] text-stone-600 uppercase text-[11px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Time</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Customer</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Service</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {todaySchedule.map((appt) => (
                    <tr key={appt._id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                      <td className="px-5 py-4 font-medium text-stone-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                          <ClockIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                          <span>{formatTime12Hour(appt.startTime)} - {formatTime12Hour(appt.endTime)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-stone-900">{appt.customerName}</div>
                        {appt.customerPhone && (
                          <div className="text-[11px] text-stone-500">{appt.customerPhone}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-medium text-stone-900">
                          {appt.service?.name || "Service"}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {appt.duration} min • LKR {appt.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link
                          href="/admin/appointments"
                          className="text-xs font-medium text-[#B7925A] hover:underline"
                        >
                          Manage &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 4. Quick Actions Section */}
      <section aria-label="Quick Actions" className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Quick Actions
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Operational shortcuts to manage salon services, clientele, and settings
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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