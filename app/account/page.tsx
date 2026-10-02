import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import ProfileHeader from "@/components/account/ProfileHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatTime12Hour, formatReadableDate, getSriLankaNow, normalizeAppointmentDate } from "@/lib/appointments";
import {
  CalendarIcon,
  SparklesIcon,
  StarIcon,
  ScissorsIcon,
  EditIcon,
  PhoneIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@/components/ui/icons";
import "@/models/Service";

export default async function AccountPage() {
  const user = await getCurrentUser();

  await connectDB();

  const { dateStr: todayStr } = getSriLankaNow();
  const todayDate = normalizeAppointmentDate(todayStr);

  // Load customer's next upcoming appointment
  const nextAppointment = user
    ? await Appointment.findOne({
        customer: user._id,
        status: { $in: ["pending", "confirmed"] },
        appointmentDate: { $gte: todayDate },
      })
        .sort({ appointmentDate: 1, startTime: 1 })
        .populate("service", "name duration price image")
        .lean()
    : null;

  const upcomingCount = user
    ? await Appointment.countDocuments({
        customer: user._id,
        status: { $in: ["pending", "confirmed"] },
        appointmentDate: { $gte: todayDate },
      })
    : 0;

  const userProfile = {
    id: user?._id?.toString() || "",
    name: user?.name || "Customer",
    email: user?.email || "",
    phone: user?.phone || "",
    profileImage: user?.profileImage || "",
    role: (user?.role as "customer" | "admin") || "customer",
    isActive: user?.isActive ?? true,
    createdAt: user?.createdAt,
  };

  const quickActions = [
    {
      title: "Edit Profile",
      description: "Update your personal details, phone number, and avatar image.",
      href: "/account/profile",
      icon: EditIcon,
      badge: "Account Settings",
      color: "hover:border-[#B7925A]",
    },
    {
      title: "Book Appointment",
      description: "Reserve your next hair transformation or rejuvenating skin treatment.",
      href: "/appointments",
      icon: CalendarIcon,
      badge: "Instant 24/7",
      color: "hover:border-[#B7925A]",
    },
    {
      title: "My Appointments",
      description: `${upcomingCount} upcoming booking${upcomingCount === 1 ? "" : "s"} scheduled.`,
      href: "/account/appointments",
      icon: ScissorsIcon,
      badge: `${upcomingCount} Upcoming`,
      color: "hover:border-[#B7925A]",
    },
    {
      title: "Browse Services",
      description: "Explore our full catalog of hair styling, facials, and beauty rituals.",
      href: "/services",
      icon: SparklesIcon,
      badge: "Price Menu & Details",
      color: "hover:border-[#B7925A]",
    },
    {
      title: "Community Hub",
      description: "Discover hairstyle transformations and beauty inspiration.",
      href: "/community",
      icon: SparklesIcon,
      badge: "Stories & Styles",
      color: "hover:border-[#B7925A]",
    },
    {
      title: "Salon Reviews",
      description: "Read genuine feedback and share your salon experience with others.",
      href: "/reviews",
      icon: StarIcon,
      badge: "Verified Testimonials",
      color: "hover:border-[#B7925A]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Profile Header Overview Card */}
      <ProfileHeader user={userProfile} showEditButton={true} />

      {/* 2. Welcome Banner */}
      <div className="rounded-2xl border border-[#B7925A]/25 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div
          className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#B7925A]/10 blur-xl"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B7925A]">
            Client Dashboard
          </p>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-normal text-stone-900">
            Welcome back, {user?.name}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#78716C] max-w-2xl leading-relaxed">
            Manage your personal profile, review scheduled salon appointments, and explore
            our signature beauty treatments crafted for your personal grace.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30"
            >
              <EditIcon className="h-4 w-4 text-[#C5A46D]" />
              <span>Manage Profile</span>
            </Link>

            <Link
              href="/appointments"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-[#FAF7F2] px-5 py-2.5 text-xs sm:text-sm font-medium text-stone-800 hover:border-[#B7925A] hover:bg-white hover:text-[#B7925A] transition-colors"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Next Upcoming Appointment (Section 19) */}
      {nextAppointment && (
        <div className="rounded-2xl border border-[#B7925A]/40 bg-gradient-to-br from-white via-white to-[#FAF7F2] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 text-[#C5A46D] shrink-0 border border-[#B7925A]/30">
              <CalendarIcon className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7925A]">
                  Next Appointment
                </span>
                <StatusBadge status={nextAppointment.status} />
              </div>

              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {/* @ts-expect-error populated name */}
                {nextAppointment.service?.name || "Salon Treatment"}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                <span className="font-medium text-stone-800">
                  {formatReadableDate(nextAppointment.appointmentDate)}
                </span>
                <span>•</span>
                <span className="font-mono text-stone-700 flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                  <span>
                    {formatTime12Hour(nextAppointment.startTime)} – {formatTime12Hour(nextAppointment.endTime)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/account/appointments"
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-xs"
            >
              <span>Manage Booking</span>
              <ArrowRightIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
            </Link>
          </div>
        </div>
      )}

      {/* 4. Quick Actions Grid */}
      <div>
        <div className="mb-4">
          <h3 className="font-serif text-lg sm:text-xl font-normal text-stone-900">
            Quick Navigation & Services
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Access your salon features and browse upcoming treatments.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all duration-300 hover:border-[#B7925A]/60 hover:shadow-md hover:shadow-stone-900/5 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25 group-hover:bg-[#B7925A] group-hover:text-white transition-colors duration-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B7925A] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#B7925A]/20">
                      {action.badge}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-semibold text-stone-900 group-hover:text-[#B7925A] transition-colors">
                    {action.title}
                  </h4>
                  <p className="mt-1.5 text-xs text-[#78716C] leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-[#B7925A] font-medium">
                  <span>Open {action.title}</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. Salon Concierge Assistance Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7925A]">
            Salon Concierge
          </span>
          <h4 className="font-serif text-lg font-normal text-stone-900 mt-0.5">
            Need Help With Your Booking or Custom Treatments?
          </h4>
          <p className="text-xs text-[#78716C] mt-1 max-w-xl">
            Our guest support desk is available Monday to Saturday 9:00 AM – 7:00 PM to assist with bridal packages, special requests, and appointment rescheduling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="tel:+94112345678"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-medium text-stone-800 hover:border-[#B7925A] hover:text-[#B7925A] transition-colors shadow-2xs"
          >
            <PhoneIcon className="h-4 w-4 text-[#B7925A]" />
            <span>+94 11 234 5678</span>
          </a>

          <a
            href="https://wa.me/94771234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-2xs"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#C5A46D]" />
            <span>WhatsApp Us</span>
          </a>
        </div>
      </div>
    </div>
  );
}