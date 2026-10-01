"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminUser {
  name?: string;
  email?: string;
  role?: string;
  mustChangePassword?: boolean;
}

interface AdminLayoutClientProps {
  user: AdminUser;
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  user,
  children,
}: AdminLayoutClientProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Client-side guard for seeded admin with mustChangePassword: true
  useEffect(() => {
    if (user.mustChangePassword && pathname !== "/admin/change-password") {
      router.replace("/admin/change-password");
    }
  }, [user.mustChangePassword, pathname, router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex">
      {/* Sidebar (Desktop sticky + Mobile drawer) */}
      <AdminSidebar
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        mustChangePassword={user.mustChangePassword}
      />

      {/* Main Viewport Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          user={user}
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
