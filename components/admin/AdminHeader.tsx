"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MenuIcon,
  ExternalLinkIcon,
  LogOutIcon,
  LockIcon,
  SearchIcon,
  ChevronDownIcon,
  UserIcon,
} from "@/components/ui/icons";

interface AdminUser {
  name?: string;
  email?: string;
  role?: string;
}

interface AdminHeaderProps {
  user?: AdminUser | null;
  onToggleMobileNav: () => void;
  pageTitle?: string;
}

export default function AdminHeader({
  user,
  onToggleMobileNav,
  pageTitle,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  // Derive dynamic page title if not explicitly passed
  const getDynamicTitle = () => {
    if (pageTitle) return pageTitle;
    if (pathname === "/admin") return "Dashboard";
    if (pathname.startsWith("/admin/services")) return "Services";
    if (pathname.startsWith("/admin/beauticians")) return "Beauticians";
    if (pathname.startsWith("/admin/gallery")) return "Gallery";
    if (pathname.startsWith("/admin/settings")) return "Website Settings";
    if (pathname.startsWith("/admin/change-password")) return "Change Password";
    return "Admin Portal";
  };

  const dynamicTitle = getDynamicTitle();
  const adminName = user?.name || "Admin";
  const adminRole = user?.role === "admin" ? "Administrator" : "Staff";

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-stone-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Search input (or title on mobile) */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Toggle admin navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 md:hidden cursor-pointer"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        {/* Mobile Page Title */}
        <h2 className="text-lg font-bold text-stone-900 md:hidden">
          {dynamicTitle}
        </h2>

        {/* Desktop Search Bar (Matches Mockup) */}
        <div className="hidden md:flex items-center w-full relative">
          <SearchIcon className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search anything..."
            aria-label="Search admin portal"
            className="w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
          />
        </div>
      </div>

      {/* Right: Actions, Live Website, & Admin Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* View Website Button (Matches Mockup) */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED] bg-white px-4 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all shadow-2xs"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          <span className="hidden sm:inline">View Website</span>
        </a>

        {/* Profile Pill with Dropdown (Matches Mockup) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 rounded-full border border-stone-200 bg-white p-1 sm:pr-3.5 sm:pl-1 text-left transition-all hover:border-[#7C3AED]/40 focus:outline-none cursor-pointer"
            aria-expanded={dropdownOpen}
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-xs">
              <UserIcon className="h-5 w-5" />
            </div>

            {/* Name and Role */}
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-bold text-stone-900 truncate max-w-[120px]">
                {adminName}
              </p>
              <p className="text-[11px] text-stone-500 font-medium">
                {adminRole}
              </p>
            </div>

            <ChevronDownIcon className="hidden sm:block h-3.5 w-3.5 text-stone-400 transition-transform" />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl animate-fadeIn z-40">
              <div className="px-3 py-2 border-b border-stone-100">
                <p className="text-xs font-bold text-stone-900">{adminName}</p>
                <p className="text-[11px] text-stone-500 truncate">{user?.email || "admin@invora.lk"}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/change-password"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <LockIcon className="h-4 w-4 text-stone-500" />
                  <span>Change Password</span>
                </Link>

                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setDropdownOpen(false)}
                  className="sm:hidden flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <ExternalLinkIcon className="h-4 w-4 text-[#7C3AED]" />
                  <span>View Website</span>
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOutIcon className="h-4 w-4 text-red-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
