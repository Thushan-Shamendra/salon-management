"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ServiceItem } from "@/types/service";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatTime12Hour, formatReadableDate } from "@/lib/appointments";
import {
  ScissorsIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  UserIcon,
  EditIcon,
} from "@/components/ui/icons";

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface BookingWizardProps {
  user: CustomerUser;
  services: ServiceItem[];
  initialServiceId?: string;
  todayString: string;
}

interface CreatedAppointmentResult {
  _id: string;
  customerName: string;
  service?: {
    name: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
}

export default function BookingWizard({
  user,
  services,
  initialServiceId,
  todayString,
}: BookingWizardProps) {
  // Step state: 1: Service, 2: Date & Time, 3: Details & Notes, 4: Confirm, 5: Success
  const [step, setStep] = useState<number>(initialServiceId ? 2 : 1);

  // Selection states
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(() => {
    if (initialServiceId) {
      const match = services.find((s) => s._id === initialServiceId);
      return match || null;
    }
    return null;
  });

  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerNote, setCustomerNote] = useState<string>("");

  // Slots fetching state
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(Boolean(initialServiceId));
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);
  const [isClosedDay, setIsClosedDay] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState<boolean>(false);
  const [createdAppointment, setCreatedAppointment] =
    useState<CreatedAppointmentResult | null>(null);

  // Fetch available slots when service and date are selected
  useEffect(() => {
    if (!selectedService || !selectedDate) {
      return;
    }

    let isMounted = true;
    const url = `/api/appointments/availability?serviceId=${selectedService._id}&date=${selectedDate}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setSlotsLoading(false);
        if (data.success) {
          setAvailableSlots(data.slots || []);
          if (data.openingHours?.isClosed) {
            setIsClosedDay(true);
            setSlotsMessage(data.message || `The salon is closed on this day.`);
          } else if (data.slots && data.slots.length === 0) {
            setSlotsMessage(
              "No appointment times are available for this date. Please choose another date."
            );
          }
        } else {
          setAvailableSlots([]);
          setSlotsMessage(data.message || "Failed to load availability.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Availability error:", err);
        setSlotsLoading(false);
        setAvailableSlots([]);
        setSlotsMessage("Error loading appointment slots. Please try again.");
      });

    return () => {
      isMounted = false;
    };
  }, [selectedService, selectedDate]);

  // When date changes, reset time selection
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedTime("");
    setAvailableSlots([]);
    setSlotsLoading(true);
    setSlotsMessage(null);
    setIsClosedDay(false);
    setSubmitError(null);
    setIsConflict(false);
  };

  const handleServiceSelect = (service: ServiceItem) => {
    setSelectedService(service);
    setSelectedTime("");
    setAvailableSlots([]);
    setSlotsLoading(true);
    setSlotsMessage(null);
    setIsClosedDay(false);
    setSubmitError(null);
    setIsConflict(false);
    setStep(2);
  };

  const handleBookingConfirm = () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setSubmitError("Please ensure all booking options are chosen.");
      return;
    }

    setSubmitError(null);
    setIsConflict(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: selectedService._id,
            date: selectedDate,
            time: selectedTime,
            note: customerNote,
          }),
        });

        const data = await res.json();

        if (res.status === 409) {
          setIsConflict(true);
          setSubmitError(
            data.message ||
              "This appointment time is no longer available. Please choose another time."
          );
          // Refresh slots
          setSelectedTime("");
          return;
        }

        if (!res.ok || !data.success) {
          setSubmitError(data.message || "Failed to confirm appointment");
          return;
        }

        // Booking successful
        setCreatedAppointment(data.appointment);
        setStep(5);
      } catch (err) {
        console.error("Submit error:", err);
        setSubmitError("Network error occurred while booking. Please try again.");
      }
    });
  };

  const handleResetBooking = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(todayString);
    setSelectedTime("");
    setCustomerNote("");
    setCreatedAppointment(null);
    setSubmitError(null);
    setIsConflict(false);
  };

  // -------------------------------------------------------------
  // STEP 5: BOOKING SUCCESS SCREEN (Section 11)
  // -------------------------------------------------------------
  if (step === 5 && createdAppointment) {
    return (
      <div className="rounded-2xl border border-[#B7925A]/30 bg-white p-6 sm:p-10 shadow-sm text-center max-w-2xl mx-auto animate-fadeIn">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-5 shadow-xs">
          <CheckCircleIcon className="h-9 w-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F2] border border-[#B7925A]/30 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#B7925A] mb-3">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span>Appointment Reserved</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900">
          Booking Request Submitted
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          Thank you, <strong className="text-stone-900">{createdAppointment.customerName}</strong>. Your reservation request has been received and our salon concierge is preparing your experience.
        </p>

        {/* Pending Notice (Section 11) */}
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800 flex items-center justify-center gap-2 max-w-lg mx-auto">
          <ClockIcon className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Your appointment request is pending confirmation.</span>
        </div>

        {/* Appointment Snapshot Details Card */}
        <div className="mt-6 rounded-2xl border border-stone-200 bg-[#FAF7F2]/60 p-5 text-left text-xs sm:text-sm divide-y divide-stone-200">
          <div className="pb-3 flex items-center justify-between">
            <span className="text-stone-500">Appointment ID</span>
            <span className="font-mono text-xs font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
              {createdAppointment._id}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-stone-500">Service</span>
            <span className="font-semibold text-stone-900">
              {createdAppointment.service?.name || selectedService?.name}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-stone-500">Scheduled Date</span>
            <span className="font-medium text-stone-900">
              {formatReadableDate(createdAppointment.appointmentDate)}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-stone-500">Scheduled Time</span>
            <span className="font-medium text-stone-900">
              {formatTime12Hour(createdAppointment.startTime)} – {formatTime12Hour(createdAppointment.endTime)}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-stone-500">Duration</span>
            <span className="font-medium text-stone-900">
              {createdAppointment.duration} minutes
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-stone-500">Investment</span>
            <span className="font-serif text-base font-bold text-stone-900">
              LKR {createdAppointment.price?.toLocaleString()}
            </span>
          </div>

          <div className="pt-3 flex items-center justify-between">
            <span className="text-stone-500">Current Status</span>
            <StatusBadge status={createdAppointment.status} />
          </div>
        </div>

        {/* Action Buttons (Section 11) */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/account/appointments"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-xs"
          >
            <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
            <span>View My Appointments</span>
          </Link>

          <button
            type="button"
            onClick={handleResetBooking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span>Book Another Appointment</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step Navigation Tabs */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-2 px-1 sm:px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
              step === 1
                ? "bg-stone-900 text-white font-semibold shadow-xs"
                : step > 1
                ? "bg-[#FAF7F2] text-[#B7925A] hover:bg-stone-100"
                : "text-stone-400 cursor-not-allowed"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
              1
            </span>
            <span className="hidden sm:inline">Service</span>
          </button>

          <button
            type="button"
            disabled={!selectedService}
            onClick={() => selectedService && setStep(2)}
            className={`py-2 px-1 sm:px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
              step === 2
                ? "bg-stone-900 text-white font-semibold shadow-xs"
                : step > 2
                ? "bg-[#FAF7F2] text-[#B7925A] hover:bg-stone-100"
                : "text-stone-400 cursor-not-allowed"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
              2
            </span>
            <span className="hidden sm:inline">Date &amp; Time</span>
          </button>

          <button
            type="button"
            disabled={!selectedService || !selectedTime}
            onClick={() => selectedService && selectedTime && setStep(3)}
            className={`py-2 px-1 sm:px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
              step === 3
                ? "bg-stone-900 text-white font-semibold shadow-xs"
                : step > 3
                ? "bg-[#FAF7F2] text-[#B7925A] hover:bg-stone-100"
                : "text-stone-400 cursor-not-allowed"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
              3
            </span>
            <span className="hidden sm:inline">Details</span>
          </button>

          <button
            type="button"
            disabled={!selectedService || !selectedTime}
            onClick={() => selectedService && selectedTime && setStep(4)}
            className={`py-2 px-1 sm:px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
              step === 4
                ? "bg-stone-900 text-white font-semibold shadow-xs"
                : "text-stone-400 cursor-not-allowed"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
              4
            </span>
            <span className="hidden sm:inline">Confirm</span>
          </button>
        </div>
      </div>

      {/* Error or Conflict Alerts */}
      {submitError && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn ${
            isConflict
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          <AlertCircleIcon
            className={`h-5 w-5 shrink-0 mt-0.5 ${
              isConflict ? "text-amber-600" : "text-red-600"
            }`}
          />
          <div className="flex-1">
            <p className="font-semibold">{isConflict ? "Slot Conflict" : "Error"}</p>
            <p className="mt-0.5">{submitError}</p>
            {isConflict && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-2 text-xs font-semibold text-amber-800 underline hover:text-amber-950"
              >
                Choose another available time slot &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: SELECT SERVICE */}
      {/* ------------------------------------------------------------- */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl font-normal text-stone-900">
                1. Select Treatment Service
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Choose the salon experience you wish to book. Duration and pricing will determine calendar slots.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {services.map((service) => {
              const isSelected = selectedService?._id === service._id;
              return (
                <div
                  key={service._id}
                  onClick={() => handleServiceSelect(service)}
                  className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "border-[#B7925A] bg-[#FAF7F2] ring-2 ring-[#B7925A]/40 shadow-md"
                      : "border-stone-200 bg-white hover:border-[#B7925A]/50 hover:shadow-sm hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex gap-4">
                    {service.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-20 w-20 rounded-xl object-cover shrink-0 border border-stone-200"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-stone-100 text-stone-400 shrink-0 border border-stone-200">
                        <ScissorsIcon className="h-6 w-6 text-[#B7925A]" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-base font-semibold text-stone-900 group-hover:text-[#B7925A] transition-colors truncate">
                          {service.name}
                        </h3>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#B7925A] text-white shrink-0">
                            <CheckIcon className="h-3 w-3" />
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-stone-500">
                          <ClockIcon className="h-3.5 w-3.5 text-[#B7925A]" />
                          <span>{service.duration} mins</span>
                        </span>

                        <span className="font-semibold text-stone-900">
                          LKR {service.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-[#B7925A]">
                    <span>{isSelected ? "Selected" : "Select this service"}</span>
                    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {selectedService && (
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30"
              >
                <span>Continue to Date &amp; Time</span>
                <ArrowRightIcon className="h-4 w-4 text-[#C5A46D]" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: SELECT DATE & TIME */}
      {/* ------------------------------------------------------------- */}
      {step === 2 && selectedService && (
        <div className="space-y-8 animate-fadeIn">
          {/* Selected Service Recap Pill */}
          <div className="rounded-xl border border-[#B7925A]/30 bg-[#FAF7F2] p-4 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#B7925A] border border-[#B7925A]/30">
                <ScissorsIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-stone-900">{selectedService.name}</p>
                <p className="text-[11px] text-stone-500">
                  {selectedService.duration} mins • LKR {selectedService.price.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#B7925A] hover:underline font-semibold text-xs"
            >
              Change Service
            </button>
          </div>

          {/* Date Selection Section */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-[#B7925A]" />
                  <span>Choose Appointment Date</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Appointments must be booked for today or a future date.
                </p>
              </div>
            </div>

            <div className="max-w-xs">
              <label htmlFor="appointment-date" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Date (Sri Lanka Time)
              </label>
              <input
                id="appointment-date"
                type="date"
                min={todayString}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#B7925A] focus:outline-none focus:ring-1 focus:ring-[#B7925A]"
              />
            </div>

            {selectedDate && (
              <p className="text-xs text-[#B7925A] font-medium">
                Selected: {formatReadableDate(selectedDate)}
              </p>
            )}
          </div>

          {/* Time Slot Selection Section */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-[#B7925A]" />
                  <span>Available Time Slots</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Slot interval is 30 minutes. Slots require {selectedService.duration} minutes of consecutive availability before salon closing time.
                </p>
              </div>
            </div>

            {slotsLoading ? (
              <div className="py-10 text-center text-xs text-stone-500">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#B7925A] border-t-transparent mb-2" />
                <p>Checking salon calendar availability...</p>
              </div>
            ) : isClosedDay ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                <strong>Salon Closed:</strong> {slotsMessage}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-[#FAF7F2] p-6 text-center text-xs sm:text-sm text-stone-600">
                <CalendarIcon className="h-8 w-8 text-stone-400 mx-auto mb-2" />
                <p className="font-medium text-stone-800">{slotsMessage || "No slots available."}</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Please select another date above to view alternative times.
                </p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availableSlots.map((timeSlot) => {
                    const isSelected = selectedTime === timeSlot;
                    return (
                      <button
                        key={timeSlot}
                        type="button"
                        onClick={() => {
                          setSelectedTime(timeSlot);
                          setSubmitError(null);
                          setIsConflict(false);
                        }}
                        className={`rounded-xl border py-2.5 px-3 text-xs font-medium transition-all text-center ${
                          isSelected
                            ? "border-[#B7925A] bg-stone-900 text-white font-bold shadow-xs scale-102"
                            : "border-stone-200 bg-white text-stone-800 hover:border-[#B7925A] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        {formatTime12Hour(timeSlot)}
                      </button>
                    );
                  })}
                </div>

                {selectedTime && (
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500">Selected start time:</span>
                    <span className="font-mono font-bold text-stone-900 bg-[#FAF7F2] px-2.5 py-1 rounded-md border border-[#B7925A]/30">
                      {formatTime12Hour(selectedTime)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              &larr; Back to Services
            </button>

            <button
              type="button"
              disabled={!selectedTime}
              onClick={() => selectedTime && setStep(3)}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs sm:text-sm font-semibold transition-colors ${
                selectedTime
                  ? "bg-stone-900 text-white hover:bg-stone-800 border border-[#B7925A]/30 shadow-xs"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              }`}
            >
              <span>Continue to Guest Details</span>
              <ArrowRightIcon className="h-4 w-4 text-[#C5A46D]" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: CUSTOMER DETAILS & NOTES */}
      {/* ------------------------------------------------------------- */}
      {step === 3 && selectedService && selectedTime && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-serif text-2xl font-normal text-stone-900">
              3. Guest Details &amp; Special Notes
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Verify your booking contact information and include any special styling requests or allergies.
            </p>
          </div>

          {/* Customer Details Card (Read-only with profile link per Section 10) */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[#B7925A]" />
                <h3 className="font-serif text-base font-semibold text-stone-900">
                  Guest Profile Information
                </h3>
              </div>
              <Link
                href="/account/profile"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B7925A] hover:underline"
              >
                <EditIcon className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs sm:text-sm">
              <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-3.5">
                <span className="text-[11px] text-stone-500 block mb-0.5">Full Name</span>
                <span className="font-semibold text-stone-900">{user.name}</span>
              </div>

              <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-3.5">
                <span className="text-[11px] text-stone-500 block mb-0.5">Email Address</span>
                <span className="font-medium text-stone-900 truncate block">
                  {user.email}
                </span>
              </div>

              <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-3.5">
                <span className="text-[11px] text-stone-500 block mb-0.5">Contact Phone</span>
                <span className="font-medium text-stone-900">
                  {user.phone || "Not set in profile"}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Note Section */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-2">
            <label htmlFor="appointment-note" className="block text-xs font-semibold text-stone-900">
              Special Requests or Notes (Optional)
            </label>
            <p className="text-[11px] text-stone-500">
              Let us know if you have any hair therapy preferences, color history, or timing considerations.
            </p>
            <textarea
              id="appointment-note"
              rows={3}
              maxLength={500}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="e.g. Sensitive scalp, preferring ammonia-free styling, or bridal schedule details..."
              className="w-full rounded-xl border border-stone-300 p-3 text-xs sm:text-sm text-stone-900 focus:border-[#B7925A] focus:outline-none focus:ring-1 focus:ring-[#B7925A]"
            />
            <div className="text-right text-[11px] text-stone-400">
              {customerNote.length} / 500 characters
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              &larr; Back to Date &amp; Time
            </button>

            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 border border-[#B7925A]/30 shadow-xs"
            >
              <span>Review Summary &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 4: CONFIRMATION SUMMARY */}
      {/* ------------------------------------------------------------- */}
      {step === 4 && selectedService && selectedTime && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-serif text-2xl font-normal text-stone-900">
              4. Review &amp; Confirm Booking
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Please double check all booking details before confirming your reservation.
            </p>
          </div>

          <div className="rounded-2xl border border-[#B7925A]/30 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-4 pb-3 border-b border-stone-100 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-[#B7925A]" />
              <span>Reservation Overview</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                    Selected Service
                  </span>
                  <span className="font-serif text-base font-bold text-stone-900">
                    {selectedService.name}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                    Date &amp; Time
                  </span>
                  <span className="font-semibold text-stone-900 block">
                    {formatReadableDate(selectedDate)}
                  </span>
                  <span className="font-mono text-xs text-[#B7925A] block mt-0.5">
                    {formatTime12Hour(selectedTime)} ({selectedService.duration} mins session)
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                    Total Investment
                  </span>
                  <span className="font-serif text-xl font-bold text-stone-900">
                    LKR {selectedService.price.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-stone-500 block">Payable at salon counter</span>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
                <div>
                  <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                    Customer Details
                  </span>
                  <span className="font-semibold text-stone-900 block">{user.name}</span>
                  <span className="text-stone-600 block">{user.email}</span>
                  <span className="text-stone-600 block">{user.phone || "No phone specified"}</span>
                </div>

                {customerNote && (
                  <div>
                    <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                      Special Note
                    </span>
                    <p className="italic text-stone-700 bg-[#FAF7F2] p-2.5 rounded-lg border border-stone-200 mt-1">
                      &ldquo;{customerNote}&rdquo;
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-3 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5 text-stone-900 font-semibold mb-1">
                    <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                    <span>Free Cancellation Policy</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    You may cancel your appointment without fee up to 2 hours before the scheduled treatment time.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                &larr; Back to Details
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleBookingConfirm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-8 py-3.5 text-xs sm:text-sm font-semibold text-[#FAF7F2] hover:bg-stone-800 transition-all border border-[#B7925A]/40 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 text-[#C5A46D]" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
