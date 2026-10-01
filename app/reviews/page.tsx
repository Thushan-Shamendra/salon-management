import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ReviewForm from "@/components/reviews/ReviewForm";
import {
  StarIcon,
  CheckIcon,
  EditIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "Client Reviews & Testimonials | Lumina Salon",
  description: "Read real client reviews and ratings for Lumina Salon hair and beauty services.",
};

const APPROVED_REVIEWS = [
  {
    id: "rev-1",
    author: "Kavindi Wickramasinghe",
    rating: 5,
    service: "Keratin Treatment & Cut",
    date: "March 2026",
    initials: "KW",
    comment:
      "The best salon experience in Colombo hands down. My stylist took the time to assess my hair texture before recommending a tailored treatment. My hair has never felt so silky and manageable!",
  },
  {
    id: "rev-2",
    author: "Roshini Senanayake",
    rating: 5,
    service: "Hydra Glow Facial",
    date: "February 2026",
    initials: "RS",
    comment:
      "Such a calming oasis. The private aesthetic suites and gentle facial techniques made my skin radiate instantly for my sister's engagement. Truly personalized and hygienic care.",
  },
  {
    id: "rev-3",
    author: "Tariq Mansoor",
    rating: 5,
    service: "Executive Haircut & Scalp Spa",
    date: "March 2026",
    initials: "TM",
    comment:
      "Precision haircut and an exceptionally relaxing scalp therapy. Professional hospitality from the moment you step through the doors. The online booking process was super smooth.",
  },
  {
    id: "rev-4",
    author: "Shenali Perera",
    rating: 5,
    service: "Honey Balayage & Gloss",
    date: "March 2026",
    initials: "SP",
    comment:
      "Transformed my dark hair into a vibrant warm dimensional balayage with zero breakage. The attention to detail was exceptional.",
  },
];

export default async function ReviewsPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-stone-200/80 pb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3">
                <StarIcon className="h-3.5 w-3.5" />
                <span>Verified Client Feedback</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                Guest Reviews & Testimonials
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#78716C] leading-relaxed">
                Discover firsthand experiences from our salon guests. Every review reflects our dedication to artisanal craftsmanship and personalized wellness.
              </p>
            </div>

            {/* Scorecard Pill */}
            <div className="rounded-2xl border border-[#B7925A]/25 bg-white p-4 sm:p-5 shadow-xs flex items-center gap-4 shrink-0">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                4.9
              </span>
              <div>
                <div className="flex items-center gap-1 text-[#B7925A]">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-3.5 w-3.5" />
                  ))}
                </div>
                <p className="text-xs text-[#78716C] mt-0.5">320+ verified ratings</p>
              </div>
            </div>
          </div>

          {/* Write a Review Section */}
          <div className="mb-14">
            {user ? (
              <ReviewForm userName={user.name} />
            ) : (
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm">
                <div>
                  <h3 className="font-serif text-lg font-normal text-stone-900">
                    Visited Lumina Salon recently?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78716C] mt-1">
                    Sign in to your customer account to submit your rating and review.
                  </p>
                </div>

                <Link
                  href="/login?redirect=/reviews"
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shrink-0"
                >
                  <EditIcon className="h-4 w-4 text-[#C5A46D]" />
                  <span>Write a Review</span>
                </Link>
              </div>
            )}
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {APPROVED_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-7 shadow-xs transition-all hover:border-[#B7925A]/40 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-[#B7925A]">
                      {[...Array(review.rating)].map((_, i) => (
                        <StarIcon key={i} className="h-3.5 w-3.5" />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-400">{review.date}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF7F2] font-serif text-xs font-bold text-stone-900 border border-[#B7925A]/30">
                      {review.initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-900">{review.author}</p>
                      <p className="text-[11px] text-[#B7925A] font-medium">{review.service}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckIcon className="h-3 w-3" />
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
