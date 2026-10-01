import Link from "next/link";
import { ArrowRightIcon, StarIcon } from "@/components/ui/icons";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";

export default async function ReviewPreview() {
  let reviews: { id: string; author: string; service: string; rating: number; comment: string }[] = [];
  let average = 0; let total = 0;
  try {
    await connectDB();
    const records = await Review.find({ status: "approved" }).sort({ createdAt: -1 }).limit(3).lean();
    total = await Review.countDocuments({ status: "approved" });
    if (total && records.length) {
      const aggResult = await Review.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, average: { $avg: "$rating" } } },
      ]);
      average = Number(aggResult[0]?.average || 0);
    }
    reviews = records.map((review) => ({
      id: review._id.toString(),
      author: review.author,
      service: review.service || "Salon Service",
      rating: review.rating,
      comment: review.comment,
    }));
  } catch {
    /* Keep the homepage available if MongoDB is temporarily unavailable. */
  }

  return <section className="border-b border-stone-200/60 bg-white py-16 md:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-2xl"><div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#B7925A]"><StarIcon className="h-4 w-4"/>Client Testimonials</div><h2 className="font-serif text-3xl font-normal tracking-tight text-[#1C1917] sm:text-4xl">Cherished Words from Our Guests</h2><p className="mt-3 text-sm leading-relaxed text-[#78716C]">Read approved feedback from guests who have experienced our salon services.</p></div><div className="flex items-center gap-4 rounded-2xl border border-[#B7925A]/25 bg-[#FAF7F2] p-5"><span className="font-serif text-4xl font-bold text-[#1C1917]">{average.toFixed(1)}</span><div><div className="flex gap-1 text-[#B7925A]">{[1,2,3,4,5].map((star) => <StarIcon key={star} className="h-4 w-4" filled={star <= Math.round(average)}/>)}</div><p className="mt-1 text-xs text-[#78716C]">Based on {total} approved {total === 1 ? "review" : "reviews"}</p></div></div></div>
    {reviews.length ? <div className="grid gap-6 md:grid-cols-3">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-6"><div className="mb-3 flex gap-1 text-[#B7925A]">{[1,2,3,4,5].map((star) => <StarIcon key={star} className="h-4 w-4" filled={star <= review.rating}/>)}</div><p className="text-sm leading-relaxed text-stone-700">“{review.comment}”</p><div className="mt-5 border-t border-stone-200/70 pt-4"><p className="text-sm font-semibold text-stone-900">{review.author}</p><p className="text-xs text-[#B7925A]">{review.service}</p></div></article>)}</div> : <div className="rounded-2xl border border-stone-200 bg-[#FAF7F2] p-8 text-center text-sm text-stone-500">No approved reviews yet.</div>}
    <div className="mt-10 text-center"><Link href="/reviews" className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-7 py-3 text-sm font-medium text-stone-900 hover:border-[#B7925A] hover:text-[#B7925A]">See all reviews<ArrowRightIcon className="h-4 w-4"/></Link></div>
  </div></section>;
}
