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
  MapPinIcon,
  PackageIcon,
  StoreIcon,
  ExternalLinkIcon,
  LockIcon,
  LogOutIcon,
  XIcon,
  DatabaseIcon,
  ShoppingBagIcon,
  TagIcon,
  PaletteIcon,
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

  interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
  }

  interface NavSection {
    title: string | null;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: null,
      items: [
        {
          name: "Dashboard",
          href: "/admin",
          icon: HomeIcon,
          exact: true,
        },
      ],
    },
    {
      title: "CONTENT",
      items: [
        {
          name: "Services",
          href: "/admin/services",
          icon: ScissorsIcon,
        },
        {
          name: "Selling Products",
          href: "/admin/retail-products",
          icon: ShoppingBagIcon,
        },
        {
          name: "Promotions",
          href: "/admin/promotions",
          icon: TagIcon,
        },
        {
          name: "Product Brands",
          href: "/admin/products",
          icon: PackageIcon,
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
          name: "Wedding",
          href: "/admin/wedding",
          icon: SparklesIcon,
        },
        {
          name: "Vendors",
          href: "/admin/vendors",
          icon: StoreIcon,
        },
      ],
    },
    {
      title: "LOCATIONS",
      items: [
        {
          name: "Branches",
          href: "/admin/branches",
          icon: MapPinIcon,
        },
      ],
    },
    {
      title: "TOOLS",
      items: [
        {
          name: "AI Assistant",
          href: "/admin/ai-assistant",
          icon: SparklesIcon,
        },
        {
          name: "Backup & Restore",
          href: "/admin/backup",
          icon: DatabaseIcon,
        },
        {
          name: "Website Customizer",
          href: "/admin/customize",
          icon: PaletteIcon,
        },
      ],
    },
    {
      title: null,
      items: [
        {
          name: "Website Settings",
          href: "/admin/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div data-customization-sidebar className="flex h-full flex-col justify-between bg-[#12101C] text-stone-300 select-none">
      {/* Top Branding Section (Hardcoded Salvora Salon Management Suite Logo) */}
      <div className="relative flex h-24 shrink-0 items-center justify-center px-4 border-b border-white/5">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex flex-col items-center justify-center text-center focus:outline-none group"
        >
          <Image
            src="/images/salvora-suite-logo.png"
            alt="Salvora Salon Management Suite"
            width={220}
            height={88}
            priority
            unoptimized
            className="w-[180px] sm:w-[195px] h-auto object-contain"
          />
        </Link>

        {/* Close button for mobile drawer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close admin menu"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 md:hidden cursor-pointer"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Main Navigation Links (Scrollable without visible white scrollbar) */}
      <div className="flex-1 min-h-0 px-3 py-4 space-y-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <nav className="space-y-4" aria-label="Admin navigation">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <p className="px-4 pt-1 pb-1 text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    data-customization-active={isActive ? "true" : "false"}
                    href={item.href}
                    onClick={onClose}
                    className={`group flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-[#03BF62] text-white shadow-md shadow-black/25"
                        : "text-stone-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-stone-400 group-hover:text-emerald-300"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
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
          <ExternalLinkIcon className="h-4.5 w-4.5 text-stone-400 group-hover:text-[#03BF62]" />
          <span>View Website</span>
        </a>
      </div>

      {/* Bottom Footer Actions (Change Password + Logout) */}
      <div className="p-4 shrink-0 border-t border-white/5 space-y-1">
        <Link
          href="/admin/change-password"
          data-customization-active={pathname === "/admin/change-password" ? "true" : "false"}
          onClick={onClose}
          className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
            pathname === "/admin/change-password"
              ? "bg-[#03BF62] text-white shadow-md shadow-black/25"
              : "text-stone-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <LockIcon className={`h-4 w-4 ${pathname === "/admin/change-password" ? "text-white" : "text-stone-400"}`} />
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
