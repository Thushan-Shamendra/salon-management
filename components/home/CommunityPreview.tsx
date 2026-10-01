import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SparklesIcon,
  HeartIcon,
  MessageCircleIcon,
  ArrowRightIcon,
  ScissorsIcon,
} from "@/components/ui/icons";

// Clearly marked temporary sample community stories for UI preview
// To be connected to real Community API when implemented
interface SampleCommunityPost {
  id: string;
  author: string;
  tag: string;
  service: string;
  image: string;
  quote: string;
  likes: number;
  comments: number;
}

const SAMPLE_COMMUNITY_STORIES: SampleCommunityPost[] = [
  {
    id: "sample-1",
    author: "Shenali Perera",
    tag: "Hair Transformation",
    service: "Honey Balayage & Gloss",
    image: "/images/community-1.svg",
    quote: "Could not be happier with my warm honey balayage! The dimensions under natural light are stunning.",
    likes: 42,
    comments: 6,
  },
  {
    id: "sample-2",
    author: "Dinithi Silva",
    tag: "Bridal Glow",
    service: "Pre-Bridal Skincare & Makeup",
    image: "/images/community-2.svg",
    quote: "My wedding morning look stayed radiant all evening. Thank you for making me feel like royalty!",
    likes: 58,
    comments: 11,
  },
  {
    id: "sample-3",
    author: "Ananya Jayawardena",
    tag: "Style & Care",
    service: "Silk Press & Precision Trim",
    image: "/images/community-3.svg",
    quote: "Healthy hair journey milestone! The silk press is weightless with zero heat damage.",
    likes: 35,
    comments: 4,
  },
];

export default function CommunityPreview() {
  return (
    <section className="bg-[#FAF7F2] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with Preview Badge */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A] mb-3">
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>Community Stories Preview</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] tracking-tight">
              Real Transformations & Inspiration
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#78716C] leading-relaxed">
              Explore before & after reveals, hairstyle ideas, and beauty experiences
              shared by our vibrant salon community.
            </p>
          </div>

          <Link
            href="/community"
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-2.5 text-sm font-medium text-stone-900 transition-all hover:border-[#B7925A] hover:text-[#B7925A] hover:shadow-xs group self-start md:self-auto"
          >
            <span>View Community Hub</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3 Story Cards Grid (UI Preview Structure) */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_COMMUNITY_STORIES.map((story) => (
            <div
              key={story.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:border-[#B7925A]/60 hover:shadow-lg hover:shadow-stone-900/5 hover:-translate-y-1"
            >
              <div>
                {/* Visual Art / Photo Area */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                  <Image
                    src={story.image}
                    alt={`${story.author}'s ${story.tag}`}
                    width={500}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-[#E4C896] border border-[#B7925A]/30">
                    {story.tag}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-[#78716C] mb-2">
                    <span className="font-semibold text-stone-900">{story.author}</span>
                    <span className="italic">{story.service}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Engagement Preview Footer */}
              <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-[#78716C]">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 hover:text-[#B7925A] transition-colors">
                    <HeartIcon className="h-4 w-4 text-[#B7925A]" />
                    <span>{story.likes}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 hover:text-[#B7925A] transition-colors">
                    <MessageCircleIcon className="h-4 w-4" />
                    <span>{story.comments}</span>
                  </span>
                </div>
                <span className="text-[11px] text-[#B7925A] font-medium">Community Story</span>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Teaser & Coming Soon Banner */}
        <div className="mt-12 rounded-2xl border border-dashed border-[#B7925A]/40 bg-white/60 p-6 sm:p-8 backdrop-blur-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/30 shrink-0">
                <ScissorsIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-stone-900">
                  Salon Community Platform Launching Soon
                </h4>
                <p className="text-xs sm:text-sm text-[#78716C] mt-0.5">
                  Soon you&apos;ll be able to share your before & after photos, swap styling tips,
                  and bookmark your favorite hairstyle looks directly on our site.
                </p>
              </div>
            </div>

            <Link
              href="/community"
              className="inline-flex items-center justify-center rounded-full bg-[#1C1917] px-6 py-2.5 text-xs sm:text-sm font-medium text-white transition-all hover:bg-stone-800 shrink-0"
            >
              <span>Explore Community</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
