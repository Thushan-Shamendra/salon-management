"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import ProductCard, { PublicRetailProduct } from "@/components/products/ProductCard";

interface ProductsPreviewProps {
  products: PublicRetailProduct[];
  whatsappNumber?: string;
  salonName?: string;
}

export default function ProductsPreview({
  products,
  whatsappNumber = "",
  salonName = "Salvora",
}: ProductsPreviewProps) {
  // If zero products in database, hide cleanly
  if (!products || products.length === 0) {
    return null;
  }

  // Ensure maximum of 4 products displayed on Home
  const displayedProducts = products.slice(0, 4);

  return (
    <section className="bg-[#FAF8F5] py-14 sm:py-20 border-b border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#7C3AED]">
                OUR PRODUCTS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
              Beauty Essentials <br className="hidden sm:inline" />
              For Your Routine
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
              Discover selected professional beauty products available from SALVORA.
            </p>
          </div>

          <Link
            href="/products"
            className="self-start md:self-auto shrink-0 group inline-flex items-center gap-2.5 rounded-full border border-purple-200 bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
          >
            <span>View All Products</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Responsive Grid: Desktop 4, Tablet 2, Mobile 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              whatsappNumber={whatsappNumber}
              salonName={salonName}
            />
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2.5 rounded-full border border-purple-200 bg-white px-6 sm:px-7 py-3 text-sm font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
          >
            <span>View All Products</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
