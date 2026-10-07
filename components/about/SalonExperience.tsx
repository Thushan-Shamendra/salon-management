import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function SalonExperience() {
  return (
    <section id="experience" className="bg-white py-16 sm:py-20 lg:py-24 border-b border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Salon Experience & Treatment Products Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-stone-100 shadow-md group">
              <Image
                src="/images/salon-experience.jpg"
                alt="Invora Salon modern treatment products and serene space"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5" />
            </div>
          </div>

          {/* Right Column: Experience Description */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Small Label */}
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                  OUR SALON
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
                A Modern Space <br className="hidden sm:inline" />
                Designed for You
              </h2>
            </div>

            {/* Description */}
            <p className="text-base text-stone-600 leading-relaxed font-normal">
              Our salon is designed to give you a comfortable and relaxing experience.
              With modern equipment, a clean environment, and a friendly team, Invora
              is the perfect place to take time for yourself and feel your best.
            </p>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/20 transition-all hover:bg-[#6D28D9] hover:gap-3 active:scale-[0.98]"
              >
                <span>Visit Our Salon</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
