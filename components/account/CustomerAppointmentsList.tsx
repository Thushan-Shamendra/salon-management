"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatTime12Hour, formatReadableDate } from "@/lib/appointments";
import {
  CalendarIcon,
  ClockIcon,
  ScissorsIcon,
  SparklesIcon,
  AlertCircleIcon,
  XIcon,
} from "@/components/ui/icons";

interface AppointmentService {
  _id?: string;
  name?: string;
  image?: string;
  price?: number;
  duration?: number;
}

interface CustomerAppointment {
  _id: string;
  service?: AppointmentService;
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
}

export default function CustomerAppointmentsList() {
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "previous" | "cancelled">("upcoming");

  // Cancellation Modal state
  const [cancellingAppt, setCancellingAppt] = useState<CustomerAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, startCancelTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    fetch("/api/account/appointments")
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
        console.error("Fetch appointments error:", err);
        setError("Network error occurred while fetching your appointments.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter appointments into tabs
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const upcomingList = appointments.filter((a) => {
    if (a.status === "cancelled" || a.status === "completed") return false;
    const dateStr = a.appointmentDate.split("T")[0];
    return dateStr >= todayStr;
  });

  const previousList = appointments.filter((a) => {
    if (a.status === "completed") return true;
    if (a.status === "cancelled") return false;
    const dateStr = a.appointmentDate.split("T")[0];
    return dateStr < todayStr;
  });

  const cancelledList = appointments.filter((a) => a.status === "cancelled");

  const displayedList =
    activeTab === "upcoming"
      ? upcomingList
      : activeTab === "previous"
      ? previousList
      : cancelledList;

  const handleCancelSubmit = () => {
    if (!cancellingAppt) return;
    setCancelError(null);

    startCancelTransition(async () => {
      try {
        const res = await fetch(`/api/account/appointments/${cancellingAppt._id}/cancel`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: cancelReason }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setCancelError(data.message || "Failed to cancel appointment");
          return;
        }

        // Successfully cancelled -> update state
        setAppointments((prev) =>
          prev.map((item) =>
            item._id === cancellingAppt._id
              ? {
                  ...item,
                  status: "cancelled",
                  cancelledAt: new Date().toISOString(),
                  cancellationReason: cancelReason || "Cancelled by customer",
                }
              : item
          )
        );

        setCancellingAppt(null);
        setCancelReason("");
      } catch (err) {
        console.error("Cancellation error:", err);
        setCancelError("Network error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "upcoming"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <span>Upcoming</span>
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"
              }`}
            >
              {upcomingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("previous")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "previous"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <span>Previous</span>
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === "previous" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"
              }`}
            >
              {previousList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "cancelled"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <span>Cancelled</span>
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === "cancelled" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"
              }`}
            >
              {cancelledList.length}
            </span>
          </button>
        </div>

        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C1917] px-4 py-2 text-xs font-medium text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-2xs"
        >
          <SparklesIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
          <span>New Booking</span>
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Appointments List Display */}
      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-500">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#B7925A] border-t-transparent mb-2" />
          <p>Loading your appointments...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/90 bg-white p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25 mb-4">
            <CalendarIcon className="h-7 w-7" />
          </div>

          <h3 className="font-serif text-lg font-semibold text-stone-900">
            No {activeTab} appointments found
          </h3>

          <p className="mt-1.5 text-xs text-stone-500 max-w-sm mx-auto">
            {activeTab === "upcoming"
              ? "You do not have any upcoming salon visits scheduled at this time."
              : activeTab === "previous"
              ? "You have no past completed salon bookings."
              : "You have not cancelled any bookings."}
          </p>

          {activeTab === "upcoming" && (
            <div className="mt-6">
              <Link
                href="/appointments"
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30"
              >
                <SparklesIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
                <span>Book an Appointment</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((appt) => {
            const isEligibleToCancel =
              (appt.status === "pending" || appt.status === "confirmed") &&
              appt.appointmentDate.split("T")[0] >= todayStr;

            return (
              <div
                key={appt._id}
                className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:border-[#B7925A]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Service & Timing Info */}
                <div className="flex items-start gap-4 flex-1">
                  {appt.service?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={appt.service.image}
                      alt={appt.service?.name || "Service"}
                      className="h-16 w-16 rounded-xl object-cover shrink-0 border border-stone-200"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] shrink-0 border border-[#B7925A]/20">
                      <ScissorsIcon className="h-6 w-6" />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-serif text-base font-semibold text-stone-900">
                        {appt.service?.name || "Salon Treatment"}
                      </h4>
                      <StatusBadge status={appt.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-stone-600">
                      <span className="flex items-center gap-1 font-medium text-stone-800">
                        <CalendarIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                        <span>{formatReadableDate(appt.appointmentDate)}</span>
                      </span>

                      <span className="flex items-center gap-1 font-mono text-stone-700">
                        <ClockIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                        <span>
                          {formatTime12Hour(appt.startTime)} – {formatTime12Hour(appt.endTime)}
                        </span>
                      </span>

                      <span className="text-stone-400">•</span>
                      <span>{appt.duration} mins</span>
                    </div>

                    <div className="pt-1 flex items-center gap-3 text-xs">
                      <span className="font-serif font-bold text-stone-900">
                        LKR {appt.price?.toLocaleString()}
                      </span>

                      <span className="font-mono text-[11px] text-stone-400">
                        Ref: #{appt._id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    {appt.note && (
                      <p className="text-[11px] text-stone-500 italic pt-1">
                        Note: &ldquo;{appt.note}&rdquo;
                      </p>
                    )}

                    {appt.status === "cancelled" && appt.cancellationReason && (
                      <p className="text-[11px] text-red-600 pt-1">
                        Reason: {appt.cancellationReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                  {isEligibleToCancel && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancellingAppt(appt);
                        setCancelReason("");
                        setCancelError(null);
                      }}
                      className="rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}

                  <Link
                    href={`/appointments?service=${appt.service?._id || ""}`}
                    className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    Book Again
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                <AlertCircleIcon className="h-5 w-5" />
                <span>Cancel Appointment</span>
              </div>
              <button
                type="button"
                onClick={() => setCancellingAppt(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to cancel your appointment for{" "}
              <strong className="text-stone-900">{cancellingAppt.service?.name}</strong> on{" "}
              <strong className="text-stone-900">
                {formatReadableDate(cancellingAppt.appointmentDate)} at{" "}
                {formatTime12Hour(cancellingAppt.startTime)}
              </strong>
              ?
            </p>

            <div className="space-y-1.5">
              <label htmlFor="cancel-reason" className="block text-xs font-semibold text-stone-700">
                Reason for cancellation (Optional)
              </label>
              <textarea
                id="cancel-reason"
                rows={2}
                maxLength={500}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, feeling unwell..."
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
                onClick={() => setCancellingAppt(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Keep Appointment
              </button>

              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelSubmit}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
