"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ScissorsIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ExternalLinkIcon,
  LogOutIcon,
  XIcon,
  LockIcon,
  ImageIcon,
  UsersIcon,
} from "@/components/ui/icons";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mustChangePassword?: boolean;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [salonLogo, setSalonLogo] = useState<string>("");
  const [salonName, setSalonName] = useState<string>("LUMINA");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.settings) {
          if (data.settings.logo) setSalonLogo(data.settings.logo);
          if (data.settings.salonName) setSalonName(data.settings.salonName);
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
      icon: LayoutDashboardIcon,
      exact: true,
    },
    {
      name: "Services",
      href: "/admin/services",
      icon: ScissorsIcon,
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
    {
      name: "Change Password",
      href: "/admin/change-password",
      icon: LockIcon,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#1C1917] text-stone-300">
      <div>
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-stone-800">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3 focus:outline-none"
          >
            {salonLogo ? (
              <div className="relative h-10 max-w-[120px] flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={salonLogo}
                  alt={salonName}
                  className="max-h-10 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-[#C5A46D] border border-stone-700/80 shadow-xs">
                <ScissorsIcon className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-wider text-white">
                {salonName.toUpperCase()}
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A46D] font-medium -mt-0.5">
                Admin Portal
              </span>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 md:hidden"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Main Navigation Links */}
        <div className="px-3 py-6">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2">
            Operations
          </p>
          <nav className="space-y-1" aria-label="Admin navigation">
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
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#B7925A] text-stone-950 font-semibold shadow-xs"
                      : "text-stone-300 hover:bg-stone-800/80 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-stone-950"
                        : "text-stone-400 group-hover:text-[#C5A46D]"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-stone-800 space-y-1">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
        >
          <ExternalLinkIcon className="h-4 w-4 text-[#C5A46D]" />
          <span>View Website</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
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
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col sticky top-0 h-screen border-r border-stone-800 shadow-md">
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
