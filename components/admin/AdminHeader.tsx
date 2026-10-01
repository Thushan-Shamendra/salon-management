"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MenuIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
  LogOutIcon,
  UserIcon,
  LockIcon,
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
  pageTitle = "Admin Portal",
}: AdminHeaderProps) {
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

  const adminName = user?.name || "Administrator";
  const initials = adminName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AD";

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-stone-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile menu toggle & Page indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Toggle admin navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div>
          <span className="text-xs uppercase tracking-widest text-[#B7925A] font-semibold hidden sm:block">
            Operations
          </span>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-tight">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right: Actions, Live Website, & Admin Profile */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:border-[#B7925A] hover:text-[#B7925A] transition-colors shadow-2xs"
        >
          <ExternalLinkIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
          <span>View Website</span>
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-full border border-stone-200 bg-[#FAF7F2] p-1.5 sm:px-3 sm:py-1.5 text-left transition-all hover:border-[#B7925A]/50 focus:outline-none"
            aria-expanded={dropdownOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 font-serif text-xs font-bold text-[#C5A46D] border border-[#B7925A]/30">
              {initials}
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-stone-900 truncate max-w-[130px]">
                {adminName}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                <ShieldCheckIcon className="h-3 w-3" />
                <span>Admin</span>
              </div>
            </div>
          </button>

          {/* Menu Dropdown Popup */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl animate-fadeIn z-40">
              <div className="px-3 py-2 border-b border-stone-100">
                <p className="text-xs font-semibold text-stone-900">{adminName}</p>
                <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-stone-700 hover:bg-stone-50"
                >
                  <UserIcon className="h-4 w-4 text-stone-500" />
                  <span>Admin Settings</span>
                </Link>

                <Link
                  href="/admin/change-password"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-stone-700 hover:bg-stone-50"
                >
                  <LockIcon className="h-4 w-4 text-stone-500" />
                  <span>Change Password</span>
                </Link>

                <Link
                  href="/"
                  onClick={() => setDropdownOpen(false)}
                  className="sm:hidden flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-stone-700 hover:bg-stone-50"
                >
                  <ExternalLinkIcon className="h-4 w-4 text-[#C5A46D]" />
                  <span>View Website</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  <LogOutIcon className="h-4 w-4" />
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
