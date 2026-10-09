"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  ScissorsIcon,
  SparklesIcon,
  UsersIcon,
  ImageIcon,
  SettingsIcon,
  ExternalLinkIcon,
  LockIcon,
  LogOutIcon,
  XIcon,
} from "@/components/ui/icons";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [headerLogo, setHeaderLogo] = React.useState<string>("");
  const [salonName, setSalonName] = React.useState<string>("INVORA Salon");

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.settings) {
          if (data.settings.headerLogo || data.settings.logo) {
            setHeaderLogo(data.settings.headerLogo || data.settings.logo);
          }
          if (data.settings.salonName) {
            setSalonName(data.settings.salonName);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      onClose();
      router.push("/");
      router.refresh();
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: HomeIcon,
      exact: true,
    },
    {
      name: "Services",
      href: "/admin/services",
      icon: ScissorsIcon,
    },
    {
      name: "Wedding",
      href: "/admin/wedding",
      icon: SparklesIcon,
    },
    {
      name: "Beauticians",
      href: "/admin/beauticians",
      icon: UsersIcon,
    },
    {
      name: "Gallery",
      href: "/admin/gallery",
      icon: ImageIcon,
    },
    {
      name: "Website Settings",
      href: "/admin/settings",
      icon: SettingsIcon,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#12101C] text-stone-300 select-none">
      <div>
        {/* Top Branding Section (Matches Mockup) */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-white/5">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3 focus:outline-none group"
          >
            <div className="flex flex-col">
              {headerLogo ? (
                <div className="relative h-8 max-w-[140px] flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={headerLogo}
                    alt={salonName}
                    className="h-8 w-auto max-w-[140px] object-contain object-left"
                  />
                </div>
              ) : (
                <div className="relative h-8 w-32">
                  <Image
                    src="/images/invora-logo-light-trimmed.png"
                    alt={salonName}
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              )}
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#A78BFA] font-bold mt-0.5">
                WEBSITE ADMIN
              </span>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 md:hidden cursor-pointer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Main Navigation Links */}
        <div className="px-3 py-6">
          <nav className="space-y-1.5" aria-label="Admin navigation">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-md shadow-purple-950/50"
                      : "text-stone-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-stone-400 group-hover:text-purple-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="my-5 border-t border-white/5" />

          {/* View Website Link */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-stone-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ExternalLinkIcon className="h-4.5 w-4.5 text-stone-400 group-hover:text-[#A78BFA]" />
            <span>View Website</span>
          </a>
        </div>
      </div>

      {/* Bottom Footer Actions (Change Password + Logout) */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <Link
          href="/admin/change-password"
          onClick={onClose}
          className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
            pathname === "/admin/change-password"
              ? "bg-white/10 text-white"
              : "text-stone-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <LockIcon className="h-4 w-4 text-stone-400" />
          <span>Change Password</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOutIcon className="h-4 w-4 text-red-400" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (~260px wide) */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col sticky top-0 h-screen border-r border-stone-800 shadow-xl z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with Backdrop overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fadeIn">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sliding drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
