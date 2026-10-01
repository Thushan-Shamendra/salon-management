import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AccountSidebar from "@/components/account/AccountSidebar";
import LogoutButton from "@/components/account/LogoutButton";
import { ScissorsIcon, CalendarIcon } from "@/components/ui/icons";

export default async function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Format initials
  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col">
      {/* Top Luxury Account Header Bar */}
      <header className="sticky top-0 z-40 border-b border-[#B7925A]/20 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-18">
          {/* Brand Logo & Back to Home */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] rounded-lg group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-[#C5A46D] border border-[#B7925A]/30 group-hover:scale-105 transition-transform">
                <ScissorsIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-wider text-stone-900 group-hover:text-[#B7925A] transition-colors">
                  LUMINA
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#B7925A] font-semibold -mt-1">
                  Customer Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/appointments"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-[#FAF7F2] border border-[#B7925A]/30 hover:bg-stone-800 transition-colors shadow-2xs"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
              <span>Book Appointment</span>
            </Link>

            {/* User Quick Info */}
            <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-stone-200">
              <Link
                href="/account/profile"
                className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
              >
                <div className="h-8 w-8 rounded-full border border-[#B7925A]/40 bg-[#FAF7F2] overflow-hidden flex items-center justify-center">
                  {user.profileImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-xs font-bold text-stone-900">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-stone-900 truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#78716C] capitalize">
                    {user.role}
                  </p>
                </div>
              </Link>

              <div className="hidden sm:block">
                <LogoutButton variant="button" className="!py-1.5 !px-3 !text-xs !rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Account Viewport */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Account Navigation Sidebar */}
          <AccountSidebar userRole={user.role} userName={user.name} />

          {/* Account Content Area */}
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}