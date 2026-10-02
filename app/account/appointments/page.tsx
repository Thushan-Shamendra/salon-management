import React from "react";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@/components/ui/icons";
import CustomerAppointmentsList from "@/components/account/CustomerAppointmentsList";

export const metadata = {
  title: "My Appointments | Lumina Salon",
  description: "View and manage your scheduled salon appointments.",
};

export default function AccountAppointmentsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78716C]">
        <Link href="/account" className="hover:text-stone-900 transition-colors flex items-center gap-1">
          <HomeIcon className="h-3.5 w-3.5" />
          <span>Account</span>
        </Link>
        <ChevronRightIcon className="h-3 w-3 opacity-60" />
        <span className="font-semibold text-stone-900">My Appointments</span>
      </nav>

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900">
            My Appointments
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#78716C]">
            Review your upcoming beauty sanctuary reservations and past treatment history.
          </p>
        </div>
      </div>

      {/* Real Appointments Management List */}
      <CustomerAppointmentsList />
    </div>
  );
}
