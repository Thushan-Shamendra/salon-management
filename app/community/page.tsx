import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  SparklesIcon,
  HeartIcon,
  MessageCircleIcon,
  ScissorsIcon,
  CalendarIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "Salon Community Hub | Lumina Salon",
  description: "Hair transformations, beauty tips, and inspiration from our salon community.",
};

const SAMPLE_POSTS = [
  {
    id: "post-1",
    author: "Shenali Perera",
    tag: "Balayage Artistry",
    service: "Honey Balayage & Gloss",
    image: "/images/community-1.svg",
    quote: "Could not be happier with my warm honey balayage! The dimensions under natural sunlight are stunning.",
    likes: 48,
    comments: 9,
    date: "2 days ago",
  },
  {
    id: "post-2",
    author: "Dinithi Silva",
    tag: "Bridal Glow",
    service: "Pre-Bridal Skincare & Makeup",
    image: "/images/community-2.svg",
    quote: "My wedding morning look stayed radiant all evening. Thank you to the Lumina team for the royal treatment!",
    likes: 64,
    comments: 14,
    date: "4 days ago",
  },
  {
    id: "post-3",
    author: "Ananya Jayawardena",
    tag: "Style & Care",
    service: "Silk Press & Precision Trim",
    image: "/images/community-3.svg",
    quote: "Healthy hair journey milestone! The silk press is weightless with zero heat damage.",
    likes: 39,
    comments: 6,
    date: "1 week ago",
  },
];

export default async function CommunityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/community");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-stone-200/80 pb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3">
                <SparklesIcon className="h-3.5 w-3.5" />
                <span>Member Community Hub</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                Transformations & Inspiration
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#78716C] leading-relaxed">
                Welcome to our private member community, <span className="font-semibold text-stone-900">{user.name}</span>. Explore hairstyle transformations, swap after-care tips, and share your salon glow.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/appointments"
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-xs"
              >
                <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
                <span>Book Appointment</span>
              </Link>
            </div>
          </div>

          {/* Feed Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_POSTS.map((post) => (
              <div
                key={post.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:border-[#B7925A]/60 hover:shadow-lg hover:shadow-stone-900/5 hover:-translate-y-1"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image}
                      alt={post.tag}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-[#E4C896] border border-[#B7925A]/30">
                      {post.tag}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-[#78716C] mb-2">
                      <span className="font-semibold text-stone-900">{post.author}</span>
                      <span className="text-[11px]">{post.date}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                      &ldquo;{post.quote}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-[#78716C]">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 text-stone-600 hover:text-[#B7925A] transition-colors">
                      <HeartIcon className="h-4 w-4 text-[#B7925A]" />
                      <span>{post.likes}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-stone-600 hover:text-[#B7925A] transition-colors">
                      <MessageCircleIcon className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#B7925A] font-medium">{post.service}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Member Posting Teaser */}
          <div className="mt-12 rounded-2xl border border-dashed border-[#B7925A]/40 bg-white p-8 text-center max-w-2xl mx-auto shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/30 mb-3">
              <ScissorsIcon className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-stone-900">
              Community Post Creation Underway
            </h3>
            <p className="mt-1 text-xs text-[#78716C] leading-relaxed">
              Full member photo upload and commenting features are being wired into the Community API. You are authenticated and will be among the first to publish your styling journey.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
