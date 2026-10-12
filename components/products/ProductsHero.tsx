import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

interface ProductsHeroProps {
  salonName?: string;
}

export default function ProductsHero({ salonName = "Salvora" }: ProductsHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0A0812] text-white py-16 sm:py-24 border-b border-white/10">
      {/* Background Graphic / Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/products-hero.png"
          alt={`${salonName} Professional Beauty & Salon Retail Products`}
          fill
          priority
          sizes="100vw"
          className="object-cover object-right sm:object-right opacity-80 sm:opacity-90"
        />
        {/* Controlled gradient overlay for crisp text readability while showcasing the product atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0812] via-[#0A0812]/85 to-[#0A0812]/30 sm:via-[#0A0812]/75 sm:to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#A78BFA]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A78BFA]" />
            <span>Our Products</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Products Chosen <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#A78BFA] to-[#C4B5FD] bg-clip-text text-transparent">
              For You
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
            Premium salon and beauty products, carefully selected by {salonName} experts to
            help you look and feel your best every day.
          </p>

          {/* Breadcrumb */}
          <div className="pt-2 flex items-center gap-2 text-xs text-stone-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRightIcon className="h-3 w-3 opacity-60" />
            <span className="text-stone-200 font-semibold">Products</span>
          </div>
        </div>
      </div>
    </section>
  );
}
