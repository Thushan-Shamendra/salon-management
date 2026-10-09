import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, SparklesIcon } from "@/components/ui/icons";

export default function WeddingPreview() {
  return (
    <section className="relative overflow-hidden bg-[#FAF6FE] py-14 sm:py-16 border-y border-purple-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Bridal Image */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-purple-100 shadow-md group">
              <Image
                src="/images/wedding-hero.jpg"
                alt="Bridal Beauty at Invora"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                  Bridal Elegance
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Promotional Content */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED]">
                <SparklesIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">
                SPECIAL OCCASIONS
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
              Wedding Beauty
            </h2>

            <p className="text-base sm:text-lg font-medium text-stone-800">
              Your special day deserves a look made just for you.
            </p>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
              Explore bridal makeup, hair styling, nail care, and complete
              wedding packages curated to make you look and feel your most radiant.
            </p>

            <div className="pt-2">
              <Link
                href="/wedding"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-all hover:bg-[#6D28D9] hover:shadow-purple-500/35 hover:gap-3 active:scale-[0.98]"
              >
                <span>Explore Wedding Services</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
