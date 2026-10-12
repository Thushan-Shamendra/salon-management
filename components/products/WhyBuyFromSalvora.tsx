import React from "react";
import {
  DiamondIcon,
  HeartIcon,
  StarIcon,
  ShoppingBagIcon,
} from "@/components/ui/icons";

interface WhyBuyFromSalvoraProps {
  salonName?: string;
}

export default function WhyBuyFromSalvora({ salonName = "Salvora" }: WhyBuyFromSalvoraProps) {
  const features = [
    {
      icon: DiamondIcon,
      title: "Genuine Products",
      description: "100% authentic and original products from trusted global brands.",
    },
    {
      icon: HeartIcon,
      title: "Salon Recommended",
      description: "Handpicked by our professional beauticians for real results.",
    },
    {
      icon: StarIcon,
      title: "Premium Quality",
      description: "High performance products trusted by beauty experts worldwide.",
    },
    {
      icon: ShoppingBagIcon,
      title: "Easy Enquiry",
      description: "Get product advice and place your enquiry easily through our team.",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 border-t border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span>Why Choose {salonName}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
            Why Buy From {salonName}?
          </h2>
        </div>

        {/* 4 Feature Cards (Matches Mockup) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all duration-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100/80 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-200">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-base font-bold text-stone-900 tracking-tight">
                  {feature.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
