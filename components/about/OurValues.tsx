import React from "react";
import {
  UsersIcon,
  SparklesIcon,
  AwardIcon,
  HeartIcon,
} from "@/components/ui/icons";

export default function OurValues() {
  const values = [
    {
      title: "Personalized Care",
      description:
        "Every client is unique, and we tailor our services to your individual needs.",
      icon: UsersIcon,
    },
    {
      title: "Quality Products",
      description:
        "We use high quality and trusted products for the best results.",
      icon: SparklesIcon,
    },
    {
      title: "Experienced Team",
      description:
        "Our skilled beauticians bring expertise and passion to every service.",
      icon: AwardIcon,
    },
    {
      title: "A Relaxing Experience",
      description:
        "Enjoy a clean, modern and welcoming environment designed for your comfort.",
      icon: HeartIcon,
    },
  ];

  return (
    <section id="values" className="bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-b border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              OUR VALUES
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            What We Stand For
          </h2>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-7 min-h-[220px] shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  {/* Icon Badge */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] shadow-2xs mb-5 transition-colors duration-300 group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED]">
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {item.description}
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
