import React from "react";
import {
  UsersIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@/components/ui/icons";

const WHY_CHOOSE_ITEMS = [
  {
    icon: UsersIcon,
    title: "Experienced Artists",
    description:
      "Our professional team has years of experience in bridal beauty.",
  },
  {
    icon: SparklesIcon,
    title: "Custom Bridal Looks",
    description:
      "We create personalized looks that match your style and vision.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Premium Products",
    description:
      "We use only high-quality, trusted beauty products.",
  },
  {
    icon: ClockIcon,
    title: "On-Time Service",
    description:
      "We value your time and ensure a smooth, stress-free experience.",
  },
];

export default function WhyChooseWedding() {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              WHY CHOOSE US
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Why Choose Our Wedding Services
          </h2>

          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            We are committed to making your wedding day even more special with
            our expertise and personalized care.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_CHOOSE_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-200">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
