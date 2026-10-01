import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
  ScissorsIcon,
  CheckIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "Book an Appointment | Lumina Salon",
  description: "Schedule your luxury hair styling, facial therapy, or bridal appointment.",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const serviceId = params?.service;

  // Protect route server-side with destination preserving
  if (!user) {
    const returnUrl = serviceId
      ? `/appointments?service=${encodeURIComponent(serviceId)}`
      : "/appointments";
    const target = serviceId
      ? `/login?redirect=${encodeURIComponent(returnUrl)}`
      : "/login?redirect=/appointments";
    redirect(target);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Online Reservations</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
              Book Your Salon Appointment
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#78716C]">
              Welcome, <span className="font-semibold text-stone-900">{user.name}</span>. Select your desired treatment time and our master stylists will prepare your personalized sanctuary.
            </p>
          </div>

          {/* Booking Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-sm">
            {serviceId && (
              <div className="mb-6 rounded-xl border border-[#B7925A]/30 bg-[#FAF7F2] p-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-stone-800">
                  <ScissorsIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>Pre-selected Service Reference: <strong className="text-stone-900 font-mono text-xs">{serviceId}</strong></span>
                </div>
                <Link href="/services" className="text-[#B7925A] hover:underline font-medium text-xs">
                  Change Service
                </Link>
              </div>
            )}

            <div className="space-y-6">
              {/* Customer Pre-filled Details */}
              <div className="border-b border-stone-100 pb-6">
                <h2 className="font-serif text-lg font-normal text-stone-900 mb-4">
                  1. Guest Information
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs sm:text-sm">
                  <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/40 p-3">
                    <span className="text-[11px] text-stone-500 block">Name</span>
                    <span className="font-medium text-stone-900">{user.name}</span>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/40 p-3">
                    <span className="text-[11px] text-stone-500 block">Email</span>
                    <span className="font-medium text-stone-900 truncate block">{user.email}</span>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/40 p-3">
                    <span className="text-[11px] text-stone-500 block">Phone</span>
                    <span className="font-medium text-stone-900">{user.phone || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {/* Booking Engine Preview Notice */}
              <div className="rounded-xl border border-dashed border-[#B7925A]/40 bg-[#FAF7F2] p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#B7925A] border border-[#B7925A]/20 shadow-2xs mb-3">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-base font-medium text-stone-900">
                  Interactive Appointment Calendar
                </h3>
                <p className="mt-1.5 text-xs text-[#78716C] max-w-md mx-auto leading-relaxed">
                  Real-time calendar slot booking engine is being connected. You are logged in as an authenticated customer and can reserve appointments directly through our concierge desk.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="https://wa.me/94771234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30"
                  >
                    <SparklesIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
                    <span>Instant WhatsApp Booking Confirmation</span>
                  </a>

                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <span>Browse All Services</span>
                  </Link>
                </div>
              </div>

              {/* Guarantees */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>No upfront cancellation fee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>SMS confirmation & reminders</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>Private sanitised suites</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
