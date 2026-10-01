import React from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import {
  MessageCircleIcon,
  SearchIcon,
  SparklesIcon,
  HeartIcon,
} from "@/components/ui/icons";

export const metadata = {
  title: "Community Moderation | LUMINA Admin",
  description: "Salon member transformations, story feeds, and comment moderation.",
};

export default function AdminCommunityPage() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Community Moderation"
        description="Oversee member transformations, beauty after-care inspiration, and moderate customer commentary."
        breadcrumbs={[{ label: "Community" }]}
      />

      {/* 2. Expected Search / Filter Skeleton (Preview) */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs opacity-75">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              disabled
              placeholder="Search community posts by author, caption, or hashtag..."
              className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-400 bg-stone-50 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              disabled
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-400 cursor-not-allowed"
            >
              <option>All Community Posts</option>
              <option>Featured Transformations</option>
              <option>Flagged for Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Empty State - No Fake Data */}
      <EmptyState
        icon={MessageCircleIcon}
        title="Community Management Module In Progress"
        description="Community backend storage, image moderation, and comment feeds are being developed. When customer posts are published via the member portal, they will appear here for administrative approval."
        actionText="Manage Reviews Instead"
        actionHref="/admin/reviews"
      />

      {/* 4. Planned Capabilities Roadmap */}
      <div className="rounded-2xl border border-[#B7925A]/30 bg-white p-6 shadow-xs">
        <h3 className="font-serif text-base font-semibold text-stone-900 mb-3">
          Community Moderation Roadmap
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
          <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <SparklesIcon className="h-4 w-4 text-[#B7925A]" />
              <span>Feature Selected Glows</span>
            </div>
            <p className="text-stone-500 leading-relaxed">
              Pin top hairstyle transformations to the public homepage showcase.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <HeartIcon className="h-4 w-4 text-[#B7925A]" />
              <span>Reaction & Like Monitoring</span>
            </div>
            <p className="text-stone-500 leading-relaxed">
              Track customer engagement metrics and popular stylist mentions.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-[#FAF7F2]/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <MessageCircleIcon className="h-4 w-4 text-[#B7925A]" />
              <span>Comment Moderation</span>
            </div>
            <p className="text-stone-500 leading-relaxed">
              One-click hide or remove inappropriate feedback to maintain a supportive space.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
