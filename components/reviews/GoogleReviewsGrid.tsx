"use client";

import React, { useState, useEffect } from "react";
import {
  StarIcon,
  GoogleIcon,
  ArrowRightIcon,
  MessageCircleIcon,
} from "@/components/ui/icons";

interface NormalizedGoogleReview {
  authorName: string;
  authorPhoto: string;
  rating: number;
  text: string;
  relativeTime: string;
  googleMapsUrl?: string;
}

interface GoogleReviewsData {
  success: boolean;
  enabled: boolean;
  rating: number;
  totalReviews: number;
  reviews: NormalizedGoogleReview[];
  businessUrl: string;
}

export default function GoogleReviewsGrid() {
  const [data, setData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [failedAvatarIds, setFailedAvatarIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    fetch("/api/google-reviews")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json?.success && json?.enabled) {
          setData(json);
        } else {
          setData(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load Google reviews:", err);
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleExpand = (index: number) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAvatarError = (index: number) => {
    setFailedAvatarIds((prev) => ({ ...prev, [index]: true }));
  };

  // Adaptive Grid Class Helper
  const getGridClass = (count: number) => {
    if (count === 1) return "max-w-md mx-auto";
    if (count === 2) return "max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6";
    if (count === 3) return "grid grid-cols-1 md:grid-cols-3 gap-6";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <section className="bg-white py-16 sm:py-20 animate-pulse">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Rating Summary Skeleton */}
          <div className="max-w-md mx-auto rounded-3xl border border-stone-200/80 bg-white p-8 shadow-xs text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-stone-200 mx-auto" />
            <div className="h-8 w-24 rounded bg-stone-200 mx-auto" />
            <div className="h-4 w-40 rounded bg-stone-100 mx-auto" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-stone-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 rounded bg-stone-200" />
                    <div className="h-3 w-20 rounded bg-stone-100" />
                  </div>
                </div>
                <div className="h-16 rounded bg-stone-100" />
                <div className="h-4 w-24 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 2. Disabled / Unavailable / No Reviews State
  if (!data || !data.enabled || !data.reviews || data.reviews.length === 0) {
    return (
      <section className="bg-white py-16 sm:py-20 border-b border-stone-100">
        <div className="mx-auto max-w-md px-4 sm:px-6 text-center">
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] mb-4">
              <MessageCircleIcon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Reviews Updating
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
              Google reviews are temporarily unavailable. Please check back soon or visit our salon to experience our care firsthand.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { rating, totalReviews, reviews, businessUrl } = data;

  return (
    <section className="bg-white py-16 sm:py-20 border-b border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* ============================================================== */}
        {/* SECTION 3 - GOOGLE RATING SUMMARY (MATCHES MOCKUP)             */}
        {/* ============================================================== */}
        {rating > 0 && (
          <div className="flex justify-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-5 sm:gap-6 rounded-3xl border border-stone-200/90 bg-white px-8 py-6 sm:px-10 sm:py-7 shadow-xs hover:shadow-md transition-shadow text-center sm:text-left">
              {/* Google Brand Logo */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-50 border border-stone-200/80 shadow-2xs shrink-0">
                <GoogleIcon className="h-8 w-8" />
              </div>

              {/* Rating Numbers & Stars */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Google Reviews
                </p>
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 leading-none">
                    {rating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(rating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-stone-200 text-stone-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-stone-500 font-medium">
                  Based on {totalReviews} Google reviews
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 4 - GOOGLE REVIEWS GRID (MATCHES MOCKUP)               */}
        {/* ============================================================== */}
        <div>
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                  OUR CLIENTS
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
                Real Reviews from Real Clients
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-xl">
                See what our valued clients have to say about their experience at Invora.
              </p>
            </div>

            {businessUrl && (
              <a
                href={businessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-5 py-2.5 text-xs font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
              >
                <span>View All Reviews on Google</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* Adaptive Review Cards Grid */}
          <div className={getGridClass(reviews.length)}>
            {reviews.map((review, idx) => {
              const isLong = review.text && review.text.length > 160;
              const isExpanded = expandedReviews[idx] || false;
              const hasAvatar =
                review.authorPhoto && !failedAvatarIds[idx];

              return (
                <div
                  key={idx}
                  className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar, Name, Rating & Relative Date */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {hasAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={review.authorPhoto}
                            alt={review.authorName}
                            className="h-11 w-11 rounded-full object-cover border border-purple-100 ring-2 ring-stone-100 shrink-0"
                            onError={() => handleAvatarError(idx)}
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] font-bold text-sm shrink-0 border border-purple-200">
                            {review.authorName?.charAt(0) || "C"}
                          </div>
                        )}

                        <div>
                          <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors line-clamp-1">
                            {review.authorName}
                          </h3>

                          {/* Star Rating Row */}
                          <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < (review.rating || 5)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-stone-200 text-stone-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Relative Time Description */}
                      {review.relativeTime && (
                        <span className="text-[11px] font-normal text-stone-400 shrink-0">
                          {review.relativeTime}
                        </span>
                      )}
                    </div>

                    {/* Review Text Body */}
                    <div className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                      <p>
                        {isLong && !isExpanded
                          ? `"${review.text.slice(0, 155)}..."`
                          : `"${review.text}"`}
                      </p>

                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(idx)}
                          className="mt-2 text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                        >
                          {isExpanded ? "Show Less" : "Read More"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Google Review Attribution */}
                  <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                      <GoogleIcon className="h-4 w-4" />
                      <span className="font-medium text-stone-600">Google Review</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
