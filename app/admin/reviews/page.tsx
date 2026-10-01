"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import {
  StarIcon,
  SearchIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@/components/ui/icons";

interface AdminReview {
  id: string;
  author: string;
  rating: number;
  service: string;
  comment: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (ratingFilter !== "all") params.set("rating", ratingFilter);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setReviews(data.reviews || []);
      } else {
        setError(data.message || "Failed to load reviews");
      }
    } catch (err) {
      console.error("Fetch reviews error:", err);
      setError("Network error loading client reviews");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, ratingFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  const updateStatus = async (id: string, newStatus: "approved" | "hidden") => {
    if (updatingId) return;
    setUpdatingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        setMessage(`Review marked as ${newStatus}`);
      } else {
        setMessage(data.message || "Failed to update review status");
      }
    } catch (err) {
      console.error("Review update error:", err);
      setMessage("Error updating review status");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) {
      return;
    }

    if (updatingId) return;
    setUpdatingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setMessage("Review permanently deleted");
      } else {
        setMessage(data.message || "Failed to delete review");
      }
    } catch (err) {
      console.error("Delete review error:", err);
      setMessage("Error deleting review");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Review Management"
        description="Moderate customer testimonials, verify ratings, and control which client experiences display on the public salon website."
        breadcrumbs={[{ label: "Reviews" }]}
      />

      {message && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-xs sm:text-sm text-stone-800 shadow-xs flex items-center justify-between">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 2. Filters & Search Bar */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by author, review text, or service..."
            className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
          />
        </div>

        {/* Status and Rating Dropdowns/Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-1">
            {["all", "pending", "approved", "hidden"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-stone-900 text-white font-semibold"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#B7925A]"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* 3. Reviews List */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm text-stone-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[#B7925A] mb-3" />
            <p>Loading guest reviews from database...</p>
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={StarIcon}
            title="No reviews found"
            description={
              search || statusFilter !== "all" || ratingFilter !== "all"
                ? "No reviews match your current search and filter criteria."
                : "No customer reviews submitted yet."
            }
            actionText={
              search || statusFilter !== "all" || ratingFilter !== "all"
                ? "Reset Filters"
                : undefined
            }
            onAction={() => {
              setSearch("");
              setStatusFilter("all");
              setRatingFilter("all");
            }}
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {reviews.map((review) => {
              const formattedDate = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent";

              return (
                <div
                  key={review.id}
                  className="p-5 sm:p-6 hover:bg-stone-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-semibold text-stone-900 text-sm">
                        {review.author}
                      </span>
                      <span className="text-xs text-stone-400">&bull;</span>
                      <span className="text-xs text-[#B7925A] font-medium">
                        {review.service}
                      </span>
                      <span className="text-xs text-stone-400">&bull;</span>
                      <span className="text-xs text-stone-500">{formattedDate}</span>
                      <StatusBadge status={review.status} />
                    </div>

                    <div className="flex items-center gap-1 text-[#B7925A]">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          filled={i < review.rating}
                          className="h-3.5 w-3.5"
                        />
                      ))}
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic max-w-3xl">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>

                  {/* Moderation Controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {review.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(review.id, "approved")}
                        disabled={updatingId === review.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {review.status !== "hidden" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(review.id, "hidden")}
                        disabled={updatingId === review.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200 disabled:opacity-50 transition-colors"
                      >
                        <XCircleIcon className="h-3.5 w-3.5" />
                        <span>Hide</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteReview(review.id)}
                      disabled={updatingId === review.id}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="Delete review"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
