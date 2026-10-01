import React from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import {
  CalendarIcon,
  SearchIcon,
  ClockIcon,
  ScissorsIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "Appointment Management | LUMINA Admin",
  description: "Salon appointment bookings and calendar scheduling.",
};

export default function AdminAppointmentsPage() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Appointment Management"
        description="Monitor client calendar reservations, adjust styling schedules, and manage appointment booking statuses."
        breadcrumbs={[{ label: "Appointments" }]}
      />

      {/* 2. Expected Filter Skeleton (Disabled / Preview) */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs opacity-75">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              disabled
              placeholder="Search by customer name, phone, or appointment reference..."
              className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-400 bg-stone-50 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              disabled
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-400 cursor-not-allowed"
            >
              <option>All Statuses (Pending, Confirmed, Completed, Cancelled)</option>
            </select>

            <select
              disabled
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-400 cursor-not-allowed"
            >
              <option>All Services</option>
            </select>

            <input
              type="date"
              disabled
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 3. Empty State with Clear Architecture Notice - No Fake Data */}
      <EmptyState
        icon={CalendarIcon}
        title="Appointment Module Coming Next"
        description="The real-time database schema for calendar slot reservations, SMS reminders, and multi-service scheduling is currently being wired into the booking pipeline. No appointment records exist in the database yet."
        actionText="Manage Active Services Instead"
        actionHref="/admin/services"
      />

      {/* 4. Specification Preview Grid */}
      <div className="rounded-2xl border border-[#B7925A]/30 bg-white p-6 shadow-xs">
        <h3 className="font-serif text-base font-semibold text-stone-900 mb-3">
          Planned Booking Operations Workflow
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
          <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <ClockIcon className="h-4 w-4 text-[#B7925A]" />
              <span>Real-Time Calendar Slots</span>
            </div>
            <p className="text-stone-500 leading-relaxed">
              Automatic slot allocation based on selected service duration (e.g. 30–120 min).
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <ScissorsIcon className="h-4 w-4 text-[#B7925A]" />
              <span>Status Lifecycle</span>
            </div>
            <p className="text-stone-500 leading-relaxed">
              One-click transitions across Pending, Confirmed, Completed, and Cancelled.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <CalendarIcon className="h-4 w-4 text-[#B7925A]" />
              <span>Client Concierge Sync</span>
            </div>
            <p className="text-stone-500 leading-relaxed">
              Direct pre-fill with verified customer phone and WhatsApp confirmation notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
