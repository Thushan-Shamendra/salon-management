import React from "react";
import {
  ScissorsIcon,
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

export default function WhyChooseUs() {
  const features = [
    {
      title: "Experienced Beauticians",
      description: "Skilled and passionate professionals committed to exceptional care.",
      icon: ScissorsIcon,
    },
    {
      title: "Quality Products",
      description: "High quality and trusted brands that nurture your hair and skin.",
      icon: SparklesIcon,
    },
    {
      title: "Personalized Care",
      description: "Treatments tailored to your distinct style, preferences, and needs.",
      icon: HeartIcon,
    },
    {
      title: "Relaxing Environment",
      description: "A calm and comfortable salon sanctuary designed for total rejuvenation.",
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <section className="bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-t border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Heading */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
            ✦ The Invora Standard
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Why Choose Invora
          </h2>
        </div>

        {/* 4 Prominent Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-7 sm:p-8 min-h-[220px] shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  {/* Large Icon Box with Enhanced Contrast */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] shadow-2xs transition-all duration-300 group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED] mb-5">
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description with Higher Contrast */}
                  <p className="mt-2.5 text-sm text-stone-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
