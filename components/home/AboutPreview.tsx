import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ScissorsIcon,
  SparklesIcon,
  HeartIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@/components/ui/icons";

export default function AboutPreview() {
  const benefits = [
    {
      title: "Professional Service",
      description:
        "Our certified master stylists and aesthetic therapists are trained in contemporary international trends and tailored consulting.",
      icon: ScissorsIcon,
    },
    {
      title: "Quality Products",
      description:
        "We curate exclusively dermatologically tested, organic, and cruelty-free professional formulas that nurture your hair and skin.",
      icon: SparklesIcon,
    },
    {
      title: "Relaxing Experience",
      description:
        "Step into a peaceful ambiance designed with private suites, calming aromatherapy, and attentive personalized hospitality.",
      icon: HeartIcon,
    },
  ];

  return (
    <section className="bg-white py-16 md:py-24 border-y border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Visual Side Frame */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative card */}
              <div className="overflow-hidden rounded-3xl border border-[#B7925A]/25 bg-[#FAF7F2] p-4 shadow-lg shadow-stone-200/50">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100">
                  <Image
                    src="/images/about-salon.svg"
                    alt="Lumina Salon holistic care and luxury beauty craftsmanship"
                    width={600}
                    height={500}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>

                {/* Bottom Highlight inside Frame */}
                <div className="mt-4 flex items-center justify-between px-2 pt-2 border-t border-stone-200/70 text-xs">
                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="flex h-2 w-2 rounded-full bg-[#B7925A]" />
                    <span className="font-medium">Crafted with Attention to Detail</span>
                  </div>
                  <span className="font-semibold text-[#B7925A]">Est. 2018</span>
                </div>
              </div>

              {/* Decorative side accent badge */}
              <div className="absolute -bottom-5 -right-3 rounded-2xl border border-stone-200 bg-[#FAF7F2] px-5 py-3 shadow-md flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B7925A]/20 text-[#B7925A]">
                  <CheckIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C1917]">5,000+ Happy Guests</p>
                  <p className="text-[11px] text-[#78716C]">Personalized Care</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text & 3 Benefit Features */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B7925A]">
                Our Philosophy
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] leading-tight">
                Crafting Timeless Beauty & Refined Personal Style
              </h2>
            </div>

            <p className="text-base sm:text-lg leading-relaxed text-[#78716C]">
              At Lumina Salon, beauty is an individual expression of grace and
              well-being. We combine modern artistry with genuine hospitality to
              deliver transformative hair and skincare experiences. Every appointment
              begins with an individualized consultation to bring your distinct vision
              to life.
            </p>

            {/* 3 Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="group rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-5 transition-all duration-300 hover:border-[#B7925A]/50 hover:bg-white hover:shadow-sm hover:-translate-y-1"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#B7925A] shadow-xs border border-[#B7925A]/20 group-hover:bg-[#B7925A] group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-serif text-base font-semibold text-[#1C1917]">
                      {benefit.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#78716C] leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Learn More Button */}
            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-[#1C1917] bg-[#1C1917] px-7 py-3 text-sm font-medium text-white transition-all hover:bg-stone-800 hover:shadow-md hover:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A]"
              >
                <span>Learn More About Us</span>
                <ArrowRightIcon className="h-4 w-4 text-[#C5A46D]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
