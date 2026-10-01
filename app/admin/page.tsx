import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/account/LogoutButton";
import {
  ScissorsIcon,
  ShieldCheckIcon,
  HomeIcon,
  UserIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "Admin Portal | Lumina Salon",
  description: "Salon administration dashboard and operations portal.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="bg-stone-900 border-b border-stone-800 text-stone-100 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-[#C5A46D] border border-stone-700">
              <ScissorsIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-wide text-white">
                LUMINA
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#C5A46D] block">
                Admin Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-800/80 px-3.5 py-2 text-xs font-medium text-stone-200 hover:bg-stone-700 transition-colors"
            >
              <HomeIcon className="h-4 w-4" />
              <span>View Site</span>
            </Link>

            <LogoutButton variant="button" className="!bg-stone-800 !border-stone-700 !text-stone-200 hover:!bg-red-950 hover:!border-red-800 hover:!text-red-300" />
          </div>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 p-6 md:p-10">
        <div className="mx-auto max-w-5xl">
          {/* Welcome Card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Administrator
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">
              Admin Portal
            </h1>
            <p className="mt-1 text-stone-600 text-sm">
              Welcome back, <strong className="text-stone-900">{user?.name}</strong> ({user?.email}). Manage salon catalog, services, and administrative preferences.
            </p>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Link
              href="/admin/services"
              className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-[#B7925A] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25 mb-4 group-hover:bg-stone-900 group-hover:text-[#C5A46D] transition-colors">
                  <ScissorsIcon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-stone-900 group-hover:text-[#B7925A] transition-colors">
                  Service Management
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Add, edit, disable, or delete salon services, durations, and pricing.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-[#B7925A]">
                <span>Manage services &rarr;</span>
              </div>
            </Link>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25 mb-4">
                  <UserIcon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-stone-900">
                  Salon Account Details
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Admin session is securely authenticated via HTTP-only cookie with role-based guards.
                </p>
              </div>
              <div className="mt-6 text-xs text-stone-500">
                <span>Role: <strong>{user?.role}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}