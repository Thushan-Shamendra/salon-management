import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BookingWizard from "@/components/appointments/BookingWizard";
import { getSriLankaNow } from "@/lib/appointments";
import { CalendarIcon } from "@/components/ui/icons";
import { ServiceItem } from "@/types/service";

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

  // Protect route server-side with destination preserving (Section 25)
  if (!user) {
    const returnUrl = serviceId
      ? `/appointments?service=${encodeURIComponent(serviceId)}`
      : "/appointments";
    const target = `/login?redirect=${encodeURIComponent(returnUrl)}`;
    redirect(target);
  }

  await connectDB();

  // Load active services
  const rawServices = await Service.find({ isActive: true })
    .sort({ name: 1 })
    .lean();

  const services: ServiceItem[] = rawServices.map((s) => ({
    _id: s._id.toString(),
    name: s.name,
    description: s.description,
    price: s.price,
    duration: s.duration,
    image: s.image || "",
    isActive: s.isActive ?? true,
  }));

  const { dateStr: todayString } = getSriLankaNow();

  const customerUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      <Navbar />

      <main className="flex-1 py-10 md:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3 shadow-2xs">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Online Reservations</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
              Reserve Your Salon Appointment
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#78716C]">
              Welcome, <span className="font-semibold text-stone-900">{user.name}</span>. Select your desired treatment time and our master stylists will prepare your personalized sanctuary.
            </p>
          </div>

          {/* Interactive Booking Wizard */}
          <BookingWizard
            user={customerUser}
            services={services}
            initialServiceId={serviceId}
            todayString={todayString}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
