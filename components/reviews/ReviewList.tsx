"use client";

import { useEffect, useState } from "react";
import { StarIcon, CheckIcon } from "@/components/ui/icons";

type Review = { id: string; author: string; rating: number; service: string; date: string; comment: string };
export default function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/reviews").then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not load reviews");
      if (active) { setReviews(data.reviews || []); setAverage(data.averageRating); setTotal(data.totalReviews || 0); }
    }).catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load reviews"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <>
    <div className="mb-12 flex flex-col justify-between gap-6 border-b border-stone-200/80 pb-8 md:flex-row md:items-end">
      <div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A]"><StarIcon className="h-3.5 w-3.5"/>Verified Client Feedback</div><h1 className="font-serif text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">Guest Reviews & Testimonials</h1><p className="mt-2 text-sm leading-relaxed text-stone-600">Discover firsthand experiences from our salon guests.</p></div>
      <div className="flex items-center gap-4 rounded-2xl border border-[#B7925A]/25 bg-white p-4 shadow-xs"><span className="font-serif text-4xl font-bold text-stone-900">{average === null ? "—" : average.toFixed(1)}</span><div><div className="flex gap-1 text-[#B7925A]">{[1,2,3,4,5].map((star) => <StarIcon key={star} className="h-3.5 w-3.5" filled={star <= Math.round(average || 0)}/>)}</div><p className="mt-1 text-xs text-stone-500">{total} approved {total === 1 ? "review" : "reviews"}</p></div></div>
    </div>
    {loading ? <p className="py-10 text-center text-sm text-stone-500">Loading approved reviews…</p> : error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : reviews.length === 0 ? <p className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500">No approved reviews yet. Your feedback can be the first.</p> :
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs"><div className="mb-3 flex items-center justify-between"><div className="flex gap-1 text-[#B7925A]">{[1,2,3,4,5].map((star) => <StarIcon key={star} className="h-3.5 w-3.5" filled={star <= review.rating}/>)}</div><span className="text-[11px] text-stone-400">{review.date}</span></div><p className="text-sm leading-relaxed text-stone-700">“{review.comment}”</p><div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4"><div><p className="text-sm font-semibold text-stone-900">{review.author}</p><p className="text-xs text-[#B7925A]">{review.service}</p></div><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700"><CheckIcon className="h-3 w-3"/>Approved</span></div></article>)}</div>}
  </>;
}
