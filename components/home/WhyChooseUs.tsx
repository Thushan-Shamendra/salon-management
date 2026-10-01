import React from "react";
import {
  ScissorsIcon,
  CalendarIcon,
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
  AwardIcon,
} from "@/components/ui/icons";

export default function WhyChooseUs() {
  const highlights = [
    {
      title: "Professional Beauty Care",
      description:
        "Every treatment is delivered by certified master stylists and skin therapists dedicated to perfection and contemporary trend mastery.",
      icon: ScissorsIcon,
      badge: "Certified Experts",
    },
    {
      title: "Easy Online Booking",
      description:
        "Effortlessly schedule your salon session 24/7 with instant slot confirmation, zero waiting queues, and easy rescheduling.",
      icon: CalendarIcon,
      badge: "Instant 24/7",
    },
    {
      title: "Quality Salon Services",
      description:
        "We prioritize your wellness by using dermatologically approved, cruelty-free, and ammonia-free world-class beauty products.",
      icon: SparklesIcon,
      badge: "Premium Formulas",
    },
    {
      title: "Comfortable Experience",
      description:
        "Relax in an intimate, tranquil atmosphere featuring private aesthetic suites, calming aromatherapy, and bespoke personal attention.",
      icon: HeartIcon,
      badge: "Tranquil Oasis",
    },
  ];

  return (
    <section className="bg-white py-16 md:py-24 border-b border-stone-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#B7925A] mb-2">
            <AwardIcon className="h-4 w-4" />
            <span>The Lumina Standard</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] tracking-tight">
            Why Choose Our Salon
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#78716C] leading-relaxed">
            We are dedicated to elevating your salon journey through masterful
            craftsmanship, immaculate hygiene, and warm, unhurried care.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-6 transition-all duration-300 hover:border-[#B7925A]/60 hover:bg-white hover:shadow-lg hover:shadow-stone-900/5 hover:-translate-y-1"
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#B7925A] shadow-xs border border-[#B7925A]/20 group-hover:bg-[#B7925A] group-hover:text-white transition-colors duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7925A] bg-[#B7925A]/10 px-2.5 py-1 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-serif text-lg font-semibold text-[#1C1917] group-hover:text-[#B7925A] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-[#78716C] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Subtle Bottom Accent Line */}
                <div className="mt-6 pt-4 border-t border-stone-200/50 flex items-center gap-1.5 text-xs text-[#B7925A] font-medium">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Excellence Assured</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges Banner */}
        <div className="mt-14 rounded-2xl border border-[#B7925A]/20 bg-[#FAF7F2] p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">100%</p>
              <p className="text-xs text-[#78716C]">Hygienic Sterilization</p>
            </div>
            <div className="space-y-1">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">5,000+</p>
              <p className="text-xs text-[#78716C]">Appointments Served</p>
            </div>
            <div className="space-y-1">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">15+</p>
              <p className="text-xs text-[#78716C]">Certified Specialists</p>
            </div>
            <div className="space-y-1">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">Top 5</p>
              <p className="text-xs text-[#78716C]">Colombo Beauty Destination</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
