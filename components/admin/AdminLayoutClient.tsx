"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import CustomizationProvider from "@/components/customization/CustomizationProvider";
import { getAdminPageKey } from "@/lib/customization-admin-registry";
import type { GlobalOverrides, PageOverrides } from "@/lib/customization-types";

interface AdminUser {
  name?: string;
  email?: string;
  role?: string;
  mustChangePassword?: boolean;
}

interface AdminLayoutClientProps {
  user: AdminUser;
  children: React.ReactNode;
  customizationGlobal?: GlobalOverrides;
  initialPageKey?: string;
  initialSections?: PageOverrides;
}

export default function AdminLayoutClient({
  user,
  children,
  customizationGlobal = {},
  initialPageKey = "dashboard",
  initialSections = {},
}: AdminLayoutClientProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pageKey = getAdminPageKey(pathname) || "dashboard";
  const [loadedPage, setLoadedPage] = useState<{ key: string; sections: PageOverrides }>({ key: initialPageKey, sections: initialSections });
  const sections = pageKey === initialPageKey ? initialSections : loadedPage.key === pageKey ? loadedPage.sections : {};

  // Shared layouts survive client navigation. Load all presentation overrides
  // for the next admin page together instead of making requests per section.
  useEffect(() => {
    if (pageKey === initialPageKey) return;
    const controller = new AbortController();
    fetch(`/api/admin/customization/pages/admin/${pageKey}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!controller.signal.aborted) setLoadedPage({ key: pageKey, sections: data?.success ? data.sections || {} : {} });
      })
      .catch(() => { /* Original presentation remains available on request failure. */ });
    return () => controller.abort();
  }, [pageKey, initialPageKey, initialSections]);

  // Client-side guard for seeded admin with mustChangePassword: true
  useEffect(() => {
    if (user.mustChangePassword && pathname !== "/admin/change-password") {
      router.replace("/admin/change-password");
    }
  }, [user.mustChangePassword, pathname, router]);

  return (
    <CustomizationProvider scope="admin" pageKey={pageKey} global={customizationGlobal} sections={sections}>
    <div className="min-h-screen bg-[#F8F9FA] text-stone-900 flex">
      {/* Sidebar (Desktop sticky + Mobile drawer) */}
      <AdminSidebar
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Viewport Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          user={user}
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
        />

        <main data-customization-section="page" className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
    </CustomizationProvider>
  );
}
