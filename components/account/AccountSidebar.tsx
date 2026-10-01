"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserIcon,
  CalendarIcon,
  StarIcon,
  SparklesIcon,
  HomeIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";
import LogoutButton from "./LogoutButton";

interface AccountSidebarProps {
  userRole?: string;
  userName?: string;
}

export default function AccountSidebar({ userRole = "customer", userName = "" }: AccountSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Overview",
      href: "/account",
      icon: HomeIcon,
      exact: true,
    },
    {
      name: "My Profile",
      href: "/account/profile",
      icon: UserIcon,
      exact: true,
    },
    {
      name: "My Appointments",
      href: "/account/appointments",
      icon: CalendarIcon,
      exact: false,
    },
    {
      name: "My Reviews",
      href: "/account/reviews",
      icon: StarIcon,
      exact: false,
    },
    {
      name: "My Community Posts",
      href: "/account/community",
      icon: SparklesIcon,
      exact: false,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Desktop Card Navigation */}
      <div className="hidden lg:block rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        {/* User Mini Summary */}
        <div className="mb-4 pb-4 border-b border-stone-100 px-2">
          <p className="text-[11px] uppercase tracking-wider text-[#B7925A] font-semibold">
            {userRole === "admin" ? "Admin Account" : "Customer Portal"}
          </p>
          <p className="font-serif text-base font-semibold text-stone-900 truncate mt-0.5">
            {userName || "My Account"}
          </p>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Customer account navigation" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/30 shadow-2xs font-semibold"
                    : "text-stone-700 hover:bg-stone-50 hover:text-stone-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? "text-[#B7925A]"
                        : "text-stone-400 group-hover:text-stone-700"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-[#B7925A]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Separator */}
        <div className="mt-5 pt-4 border-t border-stone-100 space-y-1">
          {/* Quick link to public salon home */}
          <Link
            href="/"
            className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <span>Back to Salon Home</span>
            <ChevronRightIcon className="h-3.5 w-3.5 opacity-50" />
          </Link>

          {/* Quick link to appointments */}
          <Link
            href="/appointments"
            className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs text-[#B7925A] hover:bg-[#B7925A]/10 transition-colors font-medium"
          >
            <span>+ Book New Appointment</span>
          </Link>

          {/* Logout Button */}
          <div className="pt-2">
            <LogoutButton variant="sidebar" />
          </div>
        </div>
      </div>

      {/* Mobile Horizontal / Scrollable Tabs */}
      <div className="lg:hidden rounded-2xl border border-stone-200/90 bg-white p-2.5 shadow-sm mb-6">
        <nav
          aria-label="Mobile account navigation"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-colors shrink-0 ${
                  isActive
                    ? "bg-[#1C1917] text-white shadow-2xs font-semibold"
                    : "bg-[#FAF7F2] text-stone-700 hover:bg-stone-100"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#C5A46D]" : "text-stone-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="shrink-0 pl-1">
            <LogoutButton variant="button" className="!py-1.5 !px-3 !text-xs !rounded-xl" />
          </div>
        </nav>
      </div>
    </aside>
  );
}
