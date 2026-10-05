import React from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Beautician, { IBeautician } from "@/models/Beautician";
import {
  ScissorsIcon,
  SparklesIcon,
  HeartIcon,
  CheckIcon,
  AwardIcon,
  CalendarIcon,
  UsersIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "About Us | Lumina Salon Colombo",
  description:
    "Learn about Lumina Salon, our artisanal beauty philosophy, master beauticians, and luxury sanctuary.",
};

export default async function AboutPage() {
  let beauticians: IBeautician[] = [];

  try {
    await connectDB();
    beauticians = await Beautician.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
  } catch (err) {
    console.error("Failed to load beauticians for About page:", err);
  }

  const pillars = [
    {
      title: "Artisanal Precision",
      description:
        "Every haircut, color glaze, and facial therapy is personalized with artistic precision according to your unique facial geometry and skin profile.",
      icon: ScissorsIcon,
    },
    {
      title: "Clean & Ethical Formulas",
      description:
        "We are dedicated to sustainable beauty, exclusively using certified cruelty-free, ammonia-free, and dermatologically tested hair & skin treatments.",
      icon: SparklesIcon,
    },
    {
      title: "Tranquil Luxury Oasis",
      description:
        "Designed to shield you from urban commotion, our salon features private suites, gentle ambient lighting, and bespoke hospitality.",
      icon: HeartIcon,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      <Navbar />

      <main className="flex-1 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Story Banner */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3">
              <AwardIcon className="h-3.5 w-3.5" />
              <span>Our Heritage & Vision</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-stone-900 tracking-tight leading-tight">
              Crafting Timeless Beauty in the Heart of Colombo
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#78716C] leading-relaxed">
              Founded in 2018, Lumina Salon was created with a clear aspiration: to blend refined European aesthetic standards with the warmth of Sri Lankan hospitality.
            </p>
          </div>

          {/* Core Values Pillars */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mb-16">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-stone-200/90 bg-white p-7 shadow-xs transition-all hover:border-[#B7925A]/50 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25 mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-stone-900 mb-2">
                    {pillar.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Meet Our Beauticians Section (only rendered if active beauticians exist) */}
          {beauticians.length > 0 && (
            <div className="mb-20">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3">
                  <UsersIcon className="h-3.5 w-3.5" />
                  <span>OUR TEAM</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                  Meet Our Beauticians
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#78716C] leading-relaxed max-w-2xl mx-auto">
                  Meet the talented beauty professionals dedicated to helping every client look and feel their best.
                </p>
              </div>

              {/* Responsive Grid: 4-col desktop, 2-col tablet, 1-col mobile */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {beauticians.map((b) => (
                  <div
                    key={b._id.toString()}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-all duration-300 hover:border-[#B7925A]/50 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div>
                      {/* Portrait Photo: ratio ~4:5, object-cover */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-100">
                        <Image
                          src={b.image}
                          alt={b.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          unoptimized={
                            !b.image.includes("res.cloudinary.com") &&
                            !b.image.includes("images.unsplash.com")
                          }
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Gold accent line at bottom on hover */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#B7925A] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        {/* Featured Badge */}
                        {b.isFeatured && (
                          <div className="absolute left-3 top-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#B7925A] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-950 shadow-md">
                              <SparklesIcon className="h-3 w-3" />
                              Featured Expert
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Profile Information */}
                      <div className="p-6">
                        <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#B7925A] transition-colors">
                          {b.name}
                        </h3>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#B7925A] mt-1">
                          {b.jobTitle}
                        </p>

                        {/* Years of Experience */}
                        <p className="mt-2 text-xs font-medium text-stone-500">
                          {b.experienceYears
                            ? `${b.experienceYears} Years Experience`
                            : "Expert Stylist"}
                        </p>

                        {/* Specialties Tags */}
                        {b.specialties && b.specialties.length > 0 && (
                          <div className="mt-3.5 flex flex-wrap gap-1.5">
                            {b.specialties.map((spec) => (
                              <span
                                key={spec}
                                className="rounded-md bg-[#FAF7F2] px-2.5 py-1 text-[11px] font-medium text-stone-700 border border-stone-200/80"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Short Bio */}
                        {b.bio && (
                          <p className="mt-4 text-xs italic text-stone-600 leading-relaxed line-clamp-3">
                            &ldquo;{b.bio}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Social Handles Footer */}
                    {(b.instagram || b.facebook) && (
                      <div className="flex items-center gap-3 border-t border-stone-100 px-6 py-3.5 bg-stone-50/60 text-stone-500">
                        <span className="text-[11px] font-medium text-stone-400">Connect:</span>
                        {b.instagram && (
                          <a
                            href={b.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${b.name} on Instagram`}
                            className="text-stone-500 hover:text-[#B7925A] transition-colors"
                          >
                            <InstagramIcon className="h-4 w-4" />
                          </a>
                        )}
                        {b.facebook && (
                          <a
                            href={b.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${b.name} on Facebook`}
                            className="text-stone-500 hover:text-[#B7925A] transition-colors"
                          >
                            <FacebookIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commitment Card */}
          <div className="rounded-3xl border border-[#B7925A]/30 bg-white p-8 sm:p-12 shadow-xs text-center max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 mb-4">
              Our Promise to Every Guest
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] max-w-2xl mx-auto leading-relaxed mb-8">
              We never compromise on sanitation, genuine active ingredients, or continuous professional stylist education. You will always leave looking beautiful and feeling confident.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600 mb-8">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                100% Verified Stylist Certification
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                Hospital-Grade Hygiene Standards
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-[#B7925A]" />
                Cruelty-Free International Products
              </span>
            </div>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30"
            >
              <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
              <span>Explore Our Salon Services</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
