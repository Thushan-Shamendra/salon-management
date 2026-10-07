import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-[#0C0A14] text-white py-16 sm:py-20 lg:py-24">
      {/* Background Salon Styling Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/about-hero.jpg"
          alt="About Invora Salon"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-70 sm:opacity-85"
        />
        {/* Controlled gradient overlay for crisp text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A14] via-[#0C0A14]/90 to-[#0C0A14]/35" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl space-y-4 text-left">
          {/* Label / Pill */}
          <div className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C4B5FD]">
              ABOUT INVORA
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            More Than a Salon{" "}
            <span className="block bg-gradient-to-r from-[#C4B5FD] via-[#A78BFA] to-[#8B5CF6] bg-clip-text text-transparent">
              A Place for You
            </span>
          </h1>

          {/* Short Description */}
          <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-normal max-w-xl">
            At Invora, we believe beauty is more than a look — it is about feeling
            confident, cared for, and genuinely yourself.
          </p>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="pt-2 flex items-center gap-2 text-xs font-medium">
            <Link
              href="/"
              className="text-stone-400 hover:text-white transition-colors"
            >
              Home
            </Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#C4B5FD] font-semibold">About</span>
          </nav>
        </div>
      </div>
    </section>
  );
}
