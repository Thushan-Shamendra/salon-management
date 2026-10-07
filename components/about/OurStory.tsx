import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  PlayIcon,
  HeartIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

export default function OurStory() {
  const highlights = [
    { title: "Professional Care", icon: HeartIcon },
    { title: "Modern Techniques", icon: SparklesIcon },
    { title: "Relaxing Environment", icon: ShieldCheckIcon },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24 border-b border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Modern Salon Interior Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-stone-100 shadow-md group">
              <Image
                src="/images/about-salon.jpg"
                alt="Invora Salon interior and styling chairs"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/5" />

              {/* Centered Play / Explore Button Emblem */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#7C3AED] shadow-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <PlayIcon className="h-5 w-5 ml-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Philosophy */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Small Label */}
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                  OUR STORY
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
                Where Beauty <br className="hidden sm:inline" />
                Meets Confidence
              </h2>
            </div>

            {/* Paragraph */}
            <p className="text-base text-stone-600 leading-relaxed font-normal">
              At Invora, we believe beauty is more than a look — it is a feeling.
              Our professional team is dedicated to bringing out your natural beauty
              with personalized care and modern techniques, in a clean and relaxing environment.
            </p>

            {/* Small Highlight Items Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200/80 px-3.5 py-2 rounded-xl"
                  >
                    <Icon className="h-4 w-4 text-[#7C3AED]" />
                    <span>{item.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/20 transition-all hover:bg-[#6D28D9] hover:gap-3 active:scale-[0.98]"
              >
                <span>Discover Our Story</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
