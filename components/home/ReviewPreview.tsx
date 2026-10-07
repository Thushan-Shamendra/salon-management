"use client";

import React, { useState, useEffect } from "react";
import { StarIcon, ArrowRightIcon, GoogleIcon } from "@/components/ui/icons";

interface NormalizedReview {
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  relativeTime?: string;
}

export default function ReviewPreview() {
  const [reviews, setReviews] = useState<NormalizedReview[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [businessUrl, setBusinessUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/google-reviews")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        // Only populate if real Google Reviews were returned from Google API
        if (data?.success && data?.enabled && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews.slice(0, 3));
          setRating(data.rating || 0);
          setTotalCount(data.totalReviews || 0);
          setBusinessUrl(data.businessUrl || "https://maps.google.com");
        } else {
          setReviews([]);
        }
      })
      .catch(() => {
        if (isMounted) setReviews([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // If loading or Google Reviews are unavailable/not configured, hide this section completely
  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24 border-t border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              ✦ Client Love
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
              What Our Clients Say
            </h2>
          </div>

          {/* Real Google Score & CTA */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-[#FAF8F5] rounded-2xl p-3 sm:px-5 sm:py-3 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <GoogleIcon className="h-6 w-6 shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-stone-900 leading-none">
                    {rating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-3.5 w-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 font-medium">
                  Based on {totalCount} Google reviews
                </p>
              </div>
            </div>

            {businessUrl && (
              <a
                href={businessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] active:scale-[0.98]"
              >
                <span>View on Google</span>
                <ArrowRightIcon className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Real Review Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-[#FAF8F5] p-6 shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-md hover:-translate-y-1"
            >
              <div>
                {/* Author Info & Rating */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {review.authorPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.authorPhoto}
                        alt={review.authorName}
                        className="h-10 w-10 rounded-full object-cover border border-purple-100"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] font-bold text-xs">
                        {review.authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        {review.authorName}
                      </h3>
                      <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <StarIcon key={i} className="h-3 w-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {review.relativeTime && (
                    <span className="text-[11px] text-stone-400 whitespace-nowrap">
                      {review.relativeTime}
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="mt-4 text-xs sm:text-sm text-stone-600 leading-relaxed italic">
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>

              {/* Google Attribution Badge */}
              <div className="mt-6 pt-4 border-t border-stone-200/70 flex items-center gap-2 text-stone-400 text-xs">
                <GoogleIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] font-medium text-stone-500">Google Review</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
