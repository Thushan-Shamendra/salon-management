import React from "react";
import Link from "next/link";
import { StarIcon, ArrowRightIcon, CheckIcon } from "@/components/ui/icons";

// Clearly marked temporary sample reviews for UI preview
// Structured to be swapped with real Review API data when implemented
export interface ReviewItem {
  id: string;
  name: string;
  service: string;
  rating: number;
  date: string;
  comment: string;
  initials: string;
}

const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Kavindi Wickramasinghe",
    service: "Keratin Treatment & Cut",
    rating: 5,
    date: "March 2026",
    initials: "KW",
    comment:
      "The best salon experience in Colombo hands down. My stylist took the time to assess my hair texture before recommending a tailored treatment. My hair has never felt so silky and manageable!",
  },
  {
    id: "rev-2",
    name: "Roshini Senanayake",
    service: "Hydra Glow Facial",
    rating: 5,
    date: "February 2026",
    initials: "RS",
    comment:
      "Such a calming oasis. The private aesthetic suites and gentle facial techniques made my skin radiate instantly for my sister's engagement. Truly personalized and hygienic care.",
  },
  {
    id: "rev-3",
    name: "Tariq Mansoor",
    service: "Executive Haircut & Scalp Spa",
    rating: 5,
    date: "March 2026",
    initials: "TM",
    comment:
      "Precision haircut and an exceptionally relaxing scalp therapy. Professional hospitality from the moment you step through the doors. The online booking process was super smooth.",
  },
];

export default function ReviewPreview() {
  return (
    <section className="bg-white py-16 md:py-24 border-b border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with Average Rating Overview */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#B7925A] mb-2">
              <StarIcon className="h-4 w-4" />
              <span>Client Testimonials</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] tracking-tight">
              Cherished Words from Our Guests
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#78716C] leading-relaxed">
              Read genuine feedback from guests who have experienced our bespoke hair
              and wellness treatments.
            </p>
          </div>

          {/* Average Rating Scorecard Card */}
          <div className="rounded-2xl border border-[#B7925A]/25 bg-[#FAF7F2] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-serif text-4xl sm:text-5xl font-bold text-[#1C1917]">
                4.9
              </span>
              <div>
                <div className="flex items-center gap-1 text-[#B7925A]">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                </div>
                <p className="text-xs text-[#78716C] mt-1 font-medium">
                  Based on 320+ verified reviews
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-stone-300 hidden sm:block" />

            <div className="flex items-center gap-2 text-xs text-stone-700">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold text-[#B7925A] border border-[#B7925A]/20">
                <CheckIcon className="h-3 w-3" />
                99% Recommendation
              </span>
            </div>
          </div>
        </div>

        {/* Reviews Grid (Structured for future API replacement) */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {SAMPLE_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-6 sm:p-8 transition-all duration-300 hover:border-[#B7925A]/60 hover:bg-white hover:shadow-md hover:shadow-stone-900/5 hover:-translate-y-1"
            >
              <div>
                {/* Star rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#B7925A]">
                    {[...Array(review.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4" />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#78716C]">{review.date}</span>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-[#292524] leading-relaxed italic">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Author & Service Footer */}
              <div className="mt-6 pt-5 border-t border-stone-200/70 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900 font-serif font-bold text-xs border border-[#B7925A]/30 shrink-0">
                  {review.initials}
                </div>
                <div className="overflow-hidden">
                  <p className="font-serif text-sm font-semibold text-stone-900 truncate">
                    {review.name}
                  </p>
                  <p className="text-[11px] text-[#B7925A] truncate font-medium">
                    {review.service}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Reviews Button */}
        <div className="mt-12 text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-7 py-3 text-sm font-medium text-stone-900 transition-all hover:border-[#B7925A] hover:text-[#B7925A] hover:shadow-xs group"
          >
            <span>View All Reviews</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
