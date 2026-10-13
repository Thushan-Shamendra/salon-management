"use client";

import React from "react";
import ProductCard, { PublicRetailProduct } from "./ProductCard";

interface ProductFeatureSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  products: PublicRetailProduct[];
  whatsappNumber?: string;
  salonName?: string;
  sectionKey?: string;
  accentColor?: "blue" | "green" | "purple";
}

export default function ProductFeatureSection({
  eyebrow,
  title,
  description,
  products,
  whatsappNumber,
  salonName,
  sectionKey,
  accentColor = "blue",
}: ProductFeatureSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  // Limit to maximum 4 products
  const displayProducts = products.slice(0, 4);

  const accentStyles = {
    blue: {
      text: "text-blue-600",
      dot: "bg-blue-600",
    },
    green: {
      text: "text-[#03BF62]",
      dot: "bg-[#03BF62]",
    },
    purple: {
      text: "text-[#7C3AED]",
      dot: "bg-[#7C3AED]",
    },
  }[accentColor];

  return (
    <section
      className="bg-[#FAF9FB] pt-12 pb-6 sm:pt-16 sm:pb-8 border-b border-stone-200/50"
      {...(sectionKey ? { "data-customization-section": sectionKey } : {})}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-8 sm:mb-10">
          <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${accentStyles.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${accentStyles.dot}`} />
            <span>{eyebrow}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl mx-auto">
            {description}
          </p>
        </div>

        {/* 4 Cards Grid (Desktop: 4, Tablet: 2, Mobile: 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              whatsappNumber={whatsappNumber}
              salonName={salonName}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
