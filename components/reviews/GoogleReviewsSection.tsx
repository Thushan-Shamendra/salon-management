"use client";

import React, { useState, useEffect } from "react";
import { StarIcon, GoogleIcon, ExternalLinkIcon } from "@/components/ui/icons";

interface GoogleReviewItem {
  authorName: string;
  authorPhoto: string;
  rating: number;
  text: string;
  relativeTime: string;
  googleMapsUrl?: string;
}

interface GoogleReviewsData {
  enabled: boolean;
  configured?: boolean;
  rating: number;
  totalReviews: number;
  reviews: GoogleReviewItem[];
  businessUrl: string;
  message?: string;
}

export default function GoogleReviewsSection() {
  const [data, setData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGoogleReviews() {
      try {
        setLoading(true);
        const res = await fetch("/api/google-reviews");
        const json = await res.json();

        if (isMounted) {
          if (json.enabled === false) {
            setData({
              enabled: false,
              rating: 0,
              totalReviews: 0,
              reviews: [],
              businessUrl: "",
            });
          } else {
            setData(json);
            if (!json.success && json.message) {
              setError(json.message);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load Google reviews:", err);
        if (isMounted) {
          setError("Google reviews are temporarily unavailable.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchGoogleReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. If disabled in Website Settings, do not render anything
  if (!loading && data && !data.enabled) {
    return null;
  }

  // 2. Loading / Skeleton State
  if (loading) {
    return (
      <section className="mb-16 animate-pulse">
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100 pb-8">
            <div className="space-y-3">
              <div className="h-6 w-36 rounded-full bg-stone-200/80" />
              <div className="h-8 w-64 rounded-xl bg-stone-200/80" />
              <div className="h-4 w-48 rounded-lg bg-stone-100" />
            </div>
            <div className="h-16 w-44 rounded-2xl bg-stone-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-100 p-6 space-y-4 bg-stone-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-stone-200/80" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 rounded-md bg-stone-200/80" />
                    <div className="h-3 w-16 rounded-md bg-stone-100" />
                  </div>
                </div>
                <div className="h-14 rounded-lg bg-stone-100" />
                <div className="h-3 w-20 rounded-md bg-stone-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 3. Error or unconfigured state
  if (error && (!data || !data.reviews || data.reviews.length === 0)) {
    return (
      <section className="mb-16">
        <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-6 text-center text-xs text-stone-500">
          <p>Google reviews are temporarily unavailable.</p>
        </div>
      </section>
    );
  }

  // If no reviews loaded at all, gracefully do not render empty box
  if (!data || !data.reviews || data.reviews.length === 0) {
    return null;
  }

  const { rating, totalReviews, reviews, businessUrl } = data;

  return (
    <section className="mb-16" aria-label="Google Reviews">
      <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs">
        {/* Section Header with Google Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-[#FAF7F2] px-3.5 py-1 text-xs font-semibold text-stone-800 mb-3 shadow-xs">
              <GoogleIcon className="h-4 w-4" />
              <span className="tracking-wide">Google Reviews</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 tracking-tight">
              What Our Clients Say on Google
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#78716C] leading-relaxed">
              Authentic, unedited feedback streamed directly from our Google Business Profile.
            </p>
          </div>

          {/* Aggregate Rating Scorecard */}
          <div className="rounded-2xl border border-[#B7925A]/25 bg-[#FAF7F2] p-4 sm:p-5 shadow-xs flex items-center gap-4 shrink-0">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              {rating > 0 ? rating.toFixed(1) : "5.0"}
            </span>
            <div>
              <div className="flex items-center gap-1 text-[#B7925A]">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    filled={i < Math.round(rating || 5)}
                    className="h-4 w-4"
                  />
                ))}
              </div>
              <p className="text-xs text-[#78716C] mt-1 font-medium">
                {totalReviews > 0
                  ? `Based on ${totalReviews} Google reviews`
                  : "Verified Google reviews"}
              </p>
            </div>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {reviews.map((review, idx) => {
            const initial = review.authorName.trim().charAt(0).toUpperCase() || "G";

            return (
              <div
                key={`${review.authorName}-${idx}`}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:border-[#B7925A]/40 hover:shadow-md"
              >
                <div>
                  {/* Author Header */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      {review.authorPhoto ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-stone-200 bg-stone-100 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={review.authorPhoto}
                            alt={review.authorName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7F2] font-serif text-sm font-bold text-stone-800 border border-[#B7925A]/30 shrink-0">
                          {initial}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900 group-hover:text-[#B7925A] transition-colors">
                          {review.authorName}
                        </h3>
                        <p className="text-[11px] text-stone-400">
                          {review.relativeTime || "Recent review"}
                        </p>
                      </div>
                    </div>

                    {/* Google G attribution */}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-50 border border-stone-200/60 shadow-2xs">
                      <GoogleIcon className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1 text-[#B7925A] mb-3">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        filled={i < review.rating}
                        className="h-3.5 w-3.5"
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic line-clamp-5">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>

                {/* Card Footer Badge */}
                <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="inline-flex items-center gap-1 font-medium text-stone-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Google Review
                  </span>

                  {review.googleMapsUrl && (
                    <a
                      href={review.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B7925A] hover:text-[#C5A46D] transition-colors"
                      title="View review on Google Maps"
                    >
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* View on Google Action */}
        {businessUrl && (
          <div className="mt-10 text-center pt-6 border-t border-stone-100">
            <a
              href={businessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-xs"
            >
              <GoogleIcon className="h-4 w-4" />
              <span>View All Reviews on Google</span>
              <ExternalLinkIcon className="h-3.5 w-3.5 text-[#C5A46D]" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
