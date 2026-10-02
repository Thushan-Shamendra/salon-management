import React from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminAppointmentsManager from "@/components/admin/AdminAppointmentsManager";

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
        description="Monitor client calendar reservations, adjust styling schedules, confirm requests, and manage appointment booking statuses."
        breadcrumbs={[{ label: "Appointments" }]}
      />

      {/* 2. Real Interactive Appointments Manager */}
      <AdminAppointmentsManager />
    </div>
  );
}
