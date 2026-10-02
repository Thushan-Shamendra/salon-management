"use client";

import React, { useState, useEffect, useTransition } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { formatTime12Hour, formatReadableDate } from "@/lib/appointments";
import {
  CalendarIcon,
  SearchIcon,
  ClockIcon,
  ScissorsIcon,
  UserIcon,
  XIcon,
  AlertCircleIcon,
} from "@/components/ui/icons";

interface AdminServiceItem {
  _id: string;
  name: string;
  duration: number;
  price: number;
}

interface AdminAppointmentItem {
  _id: string;
  customer?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  service?: AdminServiceItem;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  note?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAppointmentsManager() {
  const [appointments, setAppointments] = useState<AdminAppointmentItem[]>([]);
  const [servicesList, setServicesList] = useState<AdminServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Modals
  const [detailModalAppt, setDetailModalAppt] = useState<AdminAppointmentItem | null>(null);
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<AdminAppointmentItem | null>(null);
  const [cancelModalAppt, setCancelModalAppt] = useState<AdminAppointmentItem | null>(null);

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Cancel Form State
  const [adminCancelReason, setAdminCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [isUpdating, startUpdateTransition] = useTransition();

  // Load Services for Filter Dropdown
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.services)) {
          setServicesList(data.services);
        }
      })
      .catch((err) => console.error("Error loading services for filter:", err));
  }, []);

  // Fetch Appointments
  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append("search", searchTerm.trim());
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (serviceFilter !== "all") params.append("service", serviceFilter);
    if (dateFilter) params.append("date", dateFilter);

    fetch(`/api/admin/appointments?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setAppointments(data.appointments || []);
        } else {
          setError(data.message || "Failed to load appointments");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Load appointments error:", err);
        setError("Network error loading appointments.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchTerm, statusFilter, serviceFilter, dateFilter]);

  // Status Action (Confirm, Complete, Cancel)
  const handleStatusChange = (
    appointmentId: string,
    newStatus: "confirmed" | "completed" | "cancelled",
    reason?: string
  ) => {
    startUpdateTransition(async () => {
      try {
        const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, reason }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          alert(data.message || "Failed to update appointment status");
          return;
        }

        // Update local state
        setAppointments((prev) =>
          prev.map((a) => (a._id === appointmentId ? { ...a, ...data.appointment } : a))
        );

        if (detailModalAppt?._id === appointmentId) {
          setDetailModalAppt({ ...detailModalAppt, ...data.appointment });
        }

        if (cancelModalAppt) {
          setCancelModalAppt(null);
          setAdminCancelReason("");
        }
      } catch (err) {
        console.error("Status update error:", err);
        alert("Network error updating status.");
      }
    });
  };

  // Open Reschedule Modal
  const openRescheduleModal = (appt: AdminAppointmentItem) => {
    setRescheduleModalAppt(appt);
    const currentDateStr = appt.appointmentDate.split("T")[0];
    setRescheduleDate(currentDateStr);
    setRescheduleTime(appt.startTime);
    setRescheduleSlots([]);
    setRescheduleLoading(true);
    setRescheduleError(null);
  };

  // Fetch Slots for Rescheduling
  useEffect(() => {
    if (!rescheduleModalAppt || !rescheduleDate) {
      return;
    }

    const serviceId = rescheduleModalAppt.service?._id;
    if (!serviceId) return;

    let isMounted = true;
    const url = `/api/appointments/availability?serviceId=${serviceId}&date=${rescheduleDate}&excludeAppointmentId=${rescheduleModalAppt._id}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setRescheduleLoading(false);
        if (data.success) {
          setRescheduleSlots(data.slots || []);
          if (data.openingHours?.isClosed) {
            setRescheduleError(`The salon is closed on ${data.day}s.`);
          } else if (data.slots && data.slots.length === 0) {
            setRescheduleError("No available time slots for this date.");
          }
        } else {
          setRescheduleSlots([]);
          setRescheduleError(data.message || "Failed to calculate available slots.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Reschedule slots error:", err);
        setRescheduleLoading(false);
        setRescheduleSlots([]);
        setRescheduleError("Network error fetching availability.");
      });

    return () => {
      isMounted = false;
    };
  }, [rescheduleModalAppt, rescheduleDate]);

  // Submit Reschedule
  const handleRescheduleSubmit = () => {
    if (!rescheduleModalAppt || !rescheduleDate || !rescheduleTime) {
      setRescheduleError("Please select both a new date and a new time.");
      return;
    }

    startUpdateTransition(async () => {
      try {
        setRescheduleError(null);
        const res = await fetch(`/api/admin/appointments/${rescheduleModalAppt._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reschedule",
            date: rescheduleDate,
            time: rescheduleTime,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setRescheduleError(data.message || "Failed to reschedule appointment.");
          return;
        }

        // Updated successfully
        setAppointments((prev) =>
          prev.map((a) => (a._id === rescheduleModalAppt._id ? { ...a, ...data.appointment } : a))
        );

        if (detailModalAppt?._id === rescheduleModalAppt._id) {
          setDetailModalAppt({ ...detailModalAppt, ...data.appointment });
        }

        setRescheduleModalAppt(null);
      } catch (err) {
        console.error("Reschedule submit error:", err);
        setRescheduleError("Network error rescheduling appointment.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Search and Filters Toolbar */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, email, or phone..."
              className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-900 bg-stone-50/50 focus:bg-white focus:border-[#B7925A] focus:outline-none focus:ring-1 focus:ring-[#B7925A]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:border-[#B7925A] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:border-[#B7925A] focus:outline-none"
            >
              <option value="all">All Services</option>
              {servicesList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:border-[#B7925A] focus:outline-none"
            />

            {(searchTerm || statusFilter !== "all" || serviceFilter !== "all" || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setServiceFilter("all");
                  setDateFilter("");
                }}
                className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* 2. Appointments Table / Cards */}
      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-500">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#B7925A] border-t-transparent mb-2" />
          <p>Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No appointments found"
          description="No appointment bookings matched your filter criteria. Try clearing search filters or check back later."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF7F2] text-stone-600 uppercase text-[11px] tracking-wider border-b border-stone-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Ref &amp; Date</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Time Slot</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Customer</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Service</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Price</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                    {/* Ref & Date */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-stone-900">
                        {formatReadableDate(appt.appointmentDate)}
                      </div>
                      <div className="font-mono text-[11px] text-stone-400">
                        #{appt._id.slice(-6).toUpperCase()}
                      </div>
                    </td>

                    {/* Time Slot */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-stone-800">
                        <ClockIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                        <span>
                          {formatTime12Hour(appt.startTime)} - {formatTime12Hour(appt.endTime)}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">{appt.duration} mins</div>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-stone-900">{appt.customerName}</div>
                      <div className="text-[11px] text-stone-500">{appt.customerPhone}</div>
                      <div className="text-[11px] text-stone-400 truncate max-w-[150px]">
                        {appt.customerEmail}
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-medium text-stone-900">
                        {appt.service?.name || "Service Snapshot"}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 whitespace-nowrap font-serif font-bold text-stone-900">
                      LKR {appt.price.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={appt.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status specific actions */}
                        {appt.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(appt._id, "confirmed")}
                              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Confirm Appointment"
                            >
                              Confirm
                            </button>

                            <button
                              type="button"
                              onClick={() => openRescheduleModal(appt)}
                              className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                              title="Reschedule Appointment"
                            >
                              Reschedule
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCancelModalAppt(appt);
                                setAdminCancelReason("");
                                setCancelError(null);
                              }}
                              className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                              title="Cancel Appointment"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {appt.status === "confirmed" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(appt._id, "completed")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                              title="Complete Appointment"
                            >
                              Complete
                            </button>

                            <button
                              type="button"
                              onClick={() => openRescheduleModal(appt)}
                              className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                              title="Reschedule Appointment"
                            >
                              Reschedule
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCancelModalAppt(appt);
                                setAdminCancelReason("");
                                setCancelError(null);
                              }}
                              className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                              title="Cancel Appointment"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {/* View Details always available */}
                        <button
                          type="button"
                          onClick={() => setDetailModalAppt(appt)}
                          className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Details Modal (Section 15) */}
      {detailModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#B7925A]" />
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  Appointment Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalAppt(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between bg-[#FAF7F2] p-3 rounded-xl border border-stone-200">
                <span className="text-stone-500">Status</span>
                <StatusBadge status={detailModalAppt.status} />
              </div>

              {/* Customer */}
              <div className="rounded-xl border border-stone-200 p-4 space-y-2">
                <h4 className="font-semibold text-stone-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-500">
                  <UserIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>Customer Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Name</span>
                    <span className="font-semibold text-stone-900">{detailModalAppt.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Phone</span>
                    <span className="font-medium text-stone-900">{detailModalAppt.customerPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-stone-500 block">Email</span>
                    <span className="font-medium text-stone-900">{detailModalAppt.customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Service & Time */}
              <div className="rounded-xl border border-stone-200 p-4 space-y-2">
                <h4 className="font-semibold text-stone-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-500">
                  <ScissorsIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>Service &amp; Schedule</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Service</span>
                    <span className="font-semibold text-stone-900">
                      {detailModalAppt.service?.name || "Service"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Price Snapshot</span>
                    <span className="font-serif font-bold text-stone-900">
                      LKR {detailModalAppt.price.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Date</span>
                    <span className="font-medium text-stone-900">
                      {formatReadableDate(detailModalAppt.appointmentDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Time Slot</span>
                    <span className="font-mono text-xs font-semibold text-stone-900">
                      {formatTime12Hour(detailModalAppt.startTime)} - {formatTime12Hour(detailModalAppt.endTime)} ({detailModalAppt.duration}m)
                    </span>
                  </div>
                </div>
              </div>

              {detailModalAppt.note && (
                <div className="rounded-xl border border-stone-200 p-3 bg-stone-50/50">
                  <span className="text-[11px] text-stone-500 block font-semibold mb-0.5">Customer Note:</span>
                  <p className="italic text-stone-700">&ldquo;{detailModalAppt.note}&rdquo;</p>
                </div>
              )}

              {detailModalAppt.status === "cancelled" && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                  <span className="text-[11px] font-semibold block mb-0.5">Cancellation Details:</span>
                  <p className="text-xs">
                    Reason: {detailModalAppt.cancellationReason || "No reason given"}
                  </p>
                  {detailModalAppt.cancelledAt && (
                    <p className="text-[11px] text-red-500 mt-1">
                      Cancelled on: {new Date(detailModalAppt.cancelledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div className="text-[11px] text-stone-400 pt-1">
                Created: {new Date(detailModalAppt.createdAt).toLocaleString()} • ID: {detailModalAppt._id}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDetailModalAppt(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reschedule Modal (Section 17) */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-[#B7925A]" />
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  Reschedule Appointment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalAppt(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-stone-200 bg-[#FAF7F2] p-3 text-xs space-y-1">
              <div className="font-semibold text-stone-900">
                {rescheduleModalAppt.customerName} • {rescheduleModalAppt.service?.name}
              </div>
              <div className="text-stone-500">
                Current Time: {formatReadableDate(rescheduleModalAppt.appointmentDate)} at{" "}
                {formatTime12Hour(rescheduleModalAppt.startTime)} ({rescheduleModalAppt.duration} mins)
              </div>
            </div>

            {/* Date Input */}
            <div className="space-y-1.5">
              <label htmlFor="reschedule-date" className="block text-xs font-semibold text-stone-700">
                Select New Date
              </label>
              <input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  setRescheduleTime("");
                }}
                className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900 focus:border-[#B7925A] focus:outline-none"
              />
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Select Available Slot
              </label>
              {rescheduleLoading ? (
                <div className="py-6 text-center text-xs text-stone-500">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#B7925A] border-t-transparent mb-1" />
                  <p>Checking slot availability...</p>
                </div>
              ) : rescheduleSlots.length === 0 ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center text-xs text-stone-500">
                  {rescheduleError || "No slots available for this date."}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {rescheduleSlots.map((slot) => {
                    const isSelected = rescheduleTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setRescheduleTime(slot)}
                        className={`rounded-lg border py-2 px-2 text-xs font-medium transition-all text-center ${
                          isSelected
                            ? "border-[#B7925A] bg-stone-900 text-white font-bold"
                            : "border-stone-200 bg-white text-stone-800 hover:border-[#B7925A]"
                        }`}
                      >
                        {formatTime12Hour(slot)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {rescheduleError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {rescheduleError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setRescheduleModalAppt(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!rescheduleTime || isUpdating}
                onClick={handleRescheduleSubmit}
                className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors disabled:opacity-50 border border-[#B7925A]/30"
              >
                {isUpdating ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Cancel Confirmation Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                <AlertCircleIcon className="h-5 w-5" />
                <span>Cancel Appointment</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to cancel the appointment for{" "}
              <strong className="text-stone-900">{cancelModalAppt.customerName}</strong> (
              {cancelModalAppt.service?.name}) on{" "}
              <strong className="text-stone-900">
                {formatReadableDate(cancelModalAppt.appointmentDate)} at{" "}
                {formatTime12Hour(cancelModalAppt.startTime)}
              </strong>
              ?
            </p>

            <div className="space-y-1.5">
              <label htmlFor="admin-cancel-reason" className="block text-xs font-semibold text-stone-700">
                Cancellation Reason (Optional)
              </label>
              <textarea
                id="admin-cancel-reason"
                rows={2}
                maxLength={500}
                value={adminCancelReason}
                onChange={(e) => setAdminCancelReason(e.target.value)}
                placeholder="e.g. Salon maintenance, customer requested via phone..."
                className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900 focus:border-[#B7925A] focus:outline-none"
              />
            </div>

            {cancelError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Keep
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() =>
                  handleStatusChange(
                    cancelModalAppt._id,
                    "cancelled",
                    adminCancelReason || "Cancelled by administrator"
                  )
                }
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
