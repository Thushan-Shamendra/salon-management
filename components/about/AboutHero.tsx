import React from "react";
import Image from "next/image";
import Link from "next/link";
import { UsersIcon, HeartIcon, ArrowRightIcon } from "@/components/ui/icons";

// Diamond icon for Premium Products card
function DiamondIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
      <path d="M2 9h20" />
      <path d="m10 3 2 6 2-6" />
      <path d="M7 9l5 12 5-12" />
    </svg>
  );
}

// Lotus / Blossom icon for Wedding Beauty Services card
function LotusIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3c1.8 3.5 2.8 7 0 11.5-2.8-4.5-1.8-8 0-11.5z" />
      <path d="M12 14.5c3-3 6.8-4.2 9-2 .6 2.2-1.5 5.5-5.8 5.5-1.8 0-2.6-.5-3.2-3.5z" />
      <path d="M12 14.5c-3-3-6.8-4.2-9-2-.6 2.2 1.5 5.5 5.8 5.5 1.8 0 2.6-.5 3.2-3.5z" />
      <path d="M7 19c2.5 1.5 7.5 1.5 10 0" />
    </svg>
  );
}

interface FeatureCardItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  desktopPosition: string;
}

const FEATURE_CARDS: FeatureCardItem[] = [
  {
    id: "beauticians",
    title: "Experienced Beauticians",
    description: "Skilled professionals dedicated to your beauty.",
    icon: UsersIcon,
    desktopPosition: "top-3 -left-4 xl:-left-8",
  },
  {
    id: "care",
    title: "Personalized Care",
    description: "Tailored treatments for your unique needs.",
    icon: HeartIcon,
    desktopPosition: "top-14 -right-4 xl:-right-8",
  },
  {
    id: "products",
    title: "Premium Products",
    description: "High-quality and skin-friendly products.",
    icon: DiamondIcon,
    desktopPosition: "-bottom-4 -left-3 xl:-left-6",
  },
  {
    id: "wedding",
    title: "Wedding Beauty Services",
    description: "Complete bridal beauty solutions.",
    icon: LotusIcon,
    desktopPosition: "-bottom-3 -right-3 xl:-right-6",
  },
];

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] py-16 sm:py-20 lg:py-24 border-b border-stone-200/60">
      {/* Ambient decorative soft glows matching editorial warm palette */}
      <div
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-purple-100/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-amber-100/35 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 xl:gap-14 items-center">
          {/* LEFT SIDE: Editorial Typography & Call to Action */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-6 sm:space-y-7 text-left">
            {/* Small uppercase label */}
            <div className="inline-flex items-center gap-2.5">
              <span className="h-0.5 w-5 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#7C3AED]">
                ABOUT INVORA
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-stone-900 leading-[1.12]">
              More Than a Salon
              <span className="block mt-1 sm:mt-2 text-[#7C3AED]">
                A Place for You
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-xl">
              Professional beauty care, modern treatments, and personalized
              attention designed to bring out your natural beauty and confidence.
            </p>

            {/* Primary CTA Button */}
            <div className="pt-2">
              <Link
                href="/services"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#7C3AED] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-[#6D28D9] hover:shadow-purple-600/40 hover:gap-3.5 active:scale-[0.98]"
              >
                <span>Explore Our Services</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE: Large Rounded Image Container + Floating Cards */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none lg:py-8 lg:px-6 xl:px-10">
              {/* Main Beauty Editorial Image */}
              <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3] w-full overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-stone-100 shadow-2xl shadow-stone-900/10 border border-stone-200/50">
                <Image
                  src="/images/about-hero-editorial.jpg"
                  alt="Invora Salon Professional Beauty & Care"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Desktop Floating Cards: Positioned Overlapping Perimeter */}
              <div className="hidden lg:block">
                {FEATURE_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.id}
                      className={`absolute ${card.desktopPosition} z-20 w-52 sm:w-56 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-stone-900/8 border border-white/80 ring-1 ring-stone-900/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
                    >
                      <div className="h-9 w-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center mb-2.5 border border-purple-100 shadow-xs">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 tracking-tight leading-snug">
                        {card.title}
                      </h3>
                      <p className="mt-1 text-xs text-stone-500 leading-relaxed font-normal">
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile & Tablet Fallback: Clean 2-column or 1-column grid below image (Never overlapping face) */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 lg:hidden">
              {FEATURE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    className="bg-white/95 rounded-2xl p-4 shadow-sm border border-stone-200/60 ring-1 ring-stone-950/5 flex flex-col justify-start"
                  >
                    <div className="h-9 w-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center mb-2.5 border border-purple-100 shadow-xs">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 tracking-tight leading-snug">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
