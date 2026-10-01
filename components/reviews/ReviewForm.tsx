"use client";

import React, { useState, FormEvent } from "react";
import { StarIcon, CheckIcon, AlertCircleIcon } from "@/components/ui/icons";

interface ReviewFormProps {
  userName: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ userName, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [service, setService] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!comment.trim() || comment.trim().length < 5) {
      setError("Please write at least 5 characters for your review.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          service: service.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit review");
        return;
      }

      setSuccess(data.message || "Thank you! Your review was submitted.");
      setComment("");
      setService("");
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <h3 className="font-serif text-xl font-normal text-stone-900 mb-1">
        Share Your Salon Experience
      </h3>
      <p className="text-xs text-[#78716C] mb-5">
        Posting as <span className="font-semibold text-stone-900">{userName}</span>
      </p>

      {success && (
        <div
          role="alert"
          className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs sm:text-sm text-emerald-800"
        >
          <CheckIcon className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs sm:text-sm text-red-700"
        >
          <AlertCircleIcon className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
            Your Rating
          </label>
          <div className="flex items-center gap-1.5 text-[#B7925A]">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 focus:outline-none"
                aria-label={`Rate ${star} stars`}
              >
                <StarIcon
                  className="h-6 w-6"
                  filled={star <= (hoverRating || rating)}
                />
              </button>
            ))}
            <span className="text-xs text-stone-500 ml-2 font-medium">
              {rating} of 5 Stars
            </span>
          </div>
        </div>

        {/* Service Experienced */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
            Service Experienced (Optional)
          </label>
          <input
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="e.g. Haircut & Styling, Hydra Facial"
            className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2]/40 px-4 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:bg-white"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
            Review Comments <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about the ambiance, quality of service, and how you felt..."
            className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2]/40 px-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors border border-[#B7925A]/30 shadow-2xs"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
