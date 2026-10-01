import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import { EditIcon } from "@/components/ui/icons";

export const metadata = { title: "Client Reviews & Testimonials | Lumina Salon", description: "Read client reviews and ratings for Lumina Salon services." };

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  return <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]"><Navbar/><main className="flex-1 py-12 md:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <ReviewList/>
    <div className="my-12">{user ? <ReviewForm userName={user.name}/> : <div className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-center"><div><h2 className="font-serif text-xl text-stone-900">Visited Lumina Salon recently?</h2><p className="mt-1 text-sm text-stone-600">Sign in to submit a rating and review.</p></div><Link href="/login?redirect=/reviews" className="inline-flex items-center gap-2 self-start rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white sm:self-auto"><EditIcon className="h-4 w-4 text-[#C5A46D]"/>Write a review</Link></div>}</div>
  </div></main><Footer/></div>;
}
