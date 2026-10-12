"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React, { useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics-client";
import {
  StarIcon,
  GoogleIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  MapPinIcon,
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
  rating: number | null;
  totalReviews?: number;
  reviewCount?: number;
  reviews: NormalizedGoogleReview[];
  businessUrl: string;
  writeReviewUrl?: string | null;
  branch?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  message?: string;
}

interface BranchItem {
  _id: string;
  name: string;
  slug: string;
  googleReviewUrl?: string;
  reviewsEnabled?: boolean;
}

export default function GoogleReviewsGrid() {
  const custom = useSectionCustomization("reviews");

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [data, setData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [failedAvatarIds, setFailedAvatarIds] = useState<Record<number, boolean>>({});

  // 1. Initial load: fetch branches and default reviews
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const branchRes = await fetch("/api/branches");
        const branchJson = await branchRes.json();

        let initialBranchId = "";
        if (isMounted && branchJson?.success && Array.isArray(branchJson.branches) && branchJson.branches.length > 0) {
          setBranches(branchJson.branches);
          initialBranchId = branchJson.branches[0]._id;
          setSelectedBranchId(initialBranchId);
        }

        // Fetch reviews (for initial branch or fallback global)
        const reviewsUrl = initialBranchId
          ? `/api/google-reviews?branch=${encodeURIComponent(initialBranchId)}`
          : "/api/google-reviews";

        const revRes = await fetch(reviewsUrl);
        const revJson = await revRes.json();

        if (isMounted) {
          if (revJson?.success) {
            setData(revJson);
          } else {
            setData(null);
          }
        }
      } catch (err) {
        console.error("Failed to initialize Google reviews:", err);
        if (isMounted) setData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch reviews when switching branch tab
  const handleSelectBranch = async (branchId: string) => {
    setSelectedBranchId(branchId);
    setReviewsLoading(true);
    setExpandedReviews({});
    setFailedAvatarIds({});

    try {
      const url = branchId
        ? `/api/google-reviews?branch=${encodeURIComponent(branchId)}`
        : "/api/google-reviews";

      const res = await fetch(url);
      const json = await res.json();

      if (json?.success) {
        setData(json);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error("Failed to load reviews for branch:", err);
      setData(null);
    } finally {
      setReviewsLoading(false);
    }
  };

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

  const currentBranch = branches.find((b) => b._id === selectedBranchId) || data?.branch;
  const currentBranchName = currentBranch?.name || "SALVORA";

  // Initial loading skeleton
  if (loading) {
    return (
      <section className="bg-white py-16 sm:py-20 animate-pulse border-b border-stone-100" data-customization-section="reviews">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-md mx-auto rounded-3xl border border-stone-200/80 bg-white p-8 shadow-xs text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-stone-200 mx-auto" />
            <div className="h-8 w-24 rounded bg-stone-200 mx-auto" />
            <div className="h-4 w-40 rounded bg-stone-100 mx-auto" />
          </div>

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
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const rating = typeof data?.rating === "number" ? data.rating : null;
  const totalReviews = data?.totalReviews ?? data?.reviewCount ?? 0;
  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
  const businessUrl = data?.businessUrl ?? "";
  const writeReviewUrl = data?.writeReviewUrl ? data.writeReviewUrl.trim() : null;
  const hasReviews = Boolean(data?.enabled && reviews.length > 0);
  const reviewsDisabled = data?.enabled === false;

  return (
    <section className="bg-white py-16 sm:py-20 border-b border-stone-100" data-customization-section="reviews">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* ============================================================== */}
        {/* BRANCH SELECTOR TABS                                           */}
        {/* ============================================================== */}
        {branches.length > 1 && (
          <div className="flex flex-col items-center justify-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
              SELECT BRANCH LOCATION
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {branches.map((b) => {
                const isSelected = selectedBranchId === b._id;
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => handleSelectBranch(b._id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#7C3AED] text-white shadow-md shadow-purple-950/20"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    <MapPinIcon className={`h-3.5 w-3.5 ${isSelected ? "text-purple-200" : "text-stone-400"}`} />
                    <span>{b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading state when switching branches */}
        {reviewsLoading ? (
          <div className="py-16 text-center space-y-3 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-stone-200 mx-auto" />
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Loading reviews for {currentBranchName}...
            </p>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* GOOGLE RATING SUMMARY FOR SELECTED BRANCH                      */}
            {/* ============================================================== */}
            {data?.enabled && typeof rating === "number" && rating > 0 && (
              <div className="flex justify-center">
                <div className="inline-flex flex-col sm:flex-row items-center gap-5 sm:gap-6 rounded-3xl border border-stone-200/90 bg-white px-8 py-6 sm:px-10 sm:py-7 shadow-xs hover:shadow-md transition-shadow text-center sm:text-left">
                  {/* Google Brand Logo */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-50 border border-stone-200/80 shadow-2xs shrink-0">
                    <GoogleIcon className="h-8 w-8" />
                  </div>

                  {/* Rating Numbers & Stars */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      {currentBranchName} • Google Reviews
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
            {/* SECTION HEADER & WRITE A REVIEW BUTTON                         */}
            {/* ============================================================== */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
                      OUR CLIENTS
                    </>}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
                    Client Feedback &amp; Reviews
                  </>}</h2>
                  <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-xl" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
                    See what our valued guests say about their experience at {currentBranchName}.
                  </>}</p>
                </div>

                {/* Actions: Write a Review per Branch + View on Google */}
                <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                  {writeReviewUrl && (
                    <a
                      href={writeReviewUrl}
                      onClick={() => {
                        trackEvent({
                          eventType: "GOOGLE_REVIEW_CLICK",
                          branchId: selectedBranchId || undefined,
                          page: "/reviews",
                          metadata: {
                            source: "write-review-button",
                          },
                        });
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] hover:shadow-md active:scale-[0.98]" data-customization-role="primaryButton"
                    >
                      <StarIcon className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                      <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>Write a Review</>}</span>
                      <ExternalLinkIcon className="h-3.5 w-3.5 text-white/80" />
                    </a>
                  )}

                  {data?.enabled && businessUrl && (
                    <a
                      href={businessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-5 py-2.5 text-xs font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]" data-customization-role="secondaryButton"
                    >
                      <span data-customization-role="buttonText">{custom.has("secondaryButtonText") ? custom.text("secondaryButtonText", "") : <>View on Google</>}</span>
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Reviews Cards Grid OR Friendly Empty State */}
              {!hasReviews ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] mb-4">
                    <MessageCircleIcon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {reviewsDisabled
                      ? "Reviews Unavailable"
                      : `Reviews Updating for ${currentBranchName}`}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
                    {reviewsDisabled
                      ? "Google Reviews are not currently available for this branch."
                      : `Google reviews for ${currentBranchName} are currently updating or not configured yet.`}
                  </p>
                  {writeReviewUrl && (
                    <div className="mt-5">
                      <a
                        href={writeReviewUrl}
                        onClick={() => {
                          trackEvent({
                            eventType: "GOOGLE_REVIEW_CLICK",
                            branchId: selectedBranchId || undefined,
                            page: "/reviews",
                            metadata: {
                              source: "empty-state-review-button",
                            },
                          });
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9]" data-customization-role="primaryButton"
                      >
                        <StarIcon className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                        <span data-customization-role="buttonText">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>Write a Review</>}</span>
                        <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className={getGridClass(reviews.length)}>
                  {reviews.map((review, idx) => {
                    const isLong = review.text && review.text.length > 160;
                    const isExpanded = expandedReviews[idx] || false;
                    const hasAvatar = review.authorPhoto && !failedAvatarIds[idx];

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

                            {/* Relative Time */}
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

                        {/* Bottom Row: Google Review Attribution & Location */}
                        <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                          <div className="flex items-center gap-2">
                            <GoogleIcon className="h-4 w-4" />
                            <span className="font-medium text-stone-600">Google Review</span>
                          </div>
                          <span className="text-[11px] text-stone-400">
                            {currentBranchName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
