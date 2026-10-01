import React from "react";
import Link from "next/link";
import {
  SparklesIcon,
  ChevronRightIcon,
  HomeIcon,
  ScissorsIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "My Community Posts | Lumina Salon",
  description: "View and share your hair transformations and beauty inspiration.",
};

export default function AccountCommunityPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78716C]">
        <Link href="/account" className="hover:text-stone-900 transition-colors flex items-center gap-1">
          <HomeIcon className="h-3.5 w-3.5" />
          <span>Account</span>
        </Link>
        <ChevronRightIcon className="h-3 w-3 opacity-60" />
        <span className="font-semibold text-stone-900">My Community Posts</span>
      </nav>

      {/* Main Placeholder Container */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/30 mb-5">
          <SparklesIcon className="h-8 w-8" />
        </div>

        <span className="inline-block rounded-full bg-[#FAF7F2] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#B7925A] border border-[#B7925A]/20 mb-3">
          Module in Development
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900">
          My Community Posts
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-[#78716C] max-w-md mx-auto leading-relaxed">
          The salon community module is currently under construction. Soon you&apos;ll be able to publish before & after transformations, share hairstyle ideas, and interact with fellow salon members.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/community"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#FAF7F2] hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-xs"
          >
            <ScissorsIcon className="h-4 w-4 text-[#C5A46D]" />
            <span>Explore Community Hub</span>
          </Link>

          <Link
            href="/account"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-2.5 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span>Back to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
