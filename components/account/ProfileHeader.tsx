"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserProfile } from "@/types/account";
import {
  ShieldCheckIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  EditIcon,
} from "@/components/ui/icons";

interface ProfileHeaderProps {
  user: UserProfile;
  showEditButton?: boolean;
}

export default function ProfileHeader({
  user,
  showEditButton = false,
}: ProfileHeaderProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  // Helper to extract clean initials from name
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Format member since date
  const formatMemberSince = (date?: string | Date) => {
    if (!date) return "Recently joined";
    try {
      const d = new Date(date);
      return `Member since ${d.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })}`;
    } catch {
      return "Member";
    }
  };

  const hasValidImage = Boolean(
    user.profileImage &&
    user.profileImage.trim().length > 0 &&
    failedImageUrl !== user.profileImage
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm">
      {/* Subtle gold accent aura in background */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#B7925A]/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Left: Avatar + Details */}
        <div className="flex items-start sm:items-center gap-5">
          {/* Avatar Container */}
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full border-2 border-[#B7925A]/40 bg-[#FAF7F2] p-0.5 shadow-sm">
            {hasValidImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.profileImage}
                alt={user.name}
                onError={() => setFailedImageUrl(user.profileImage || "")}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[#1C1917] via-[#2D2825] to-[#B7925A] text-lg sm:text-2xl font-serif font-bold tracking-wider text-[#FAF7F2] select-none">
                {getInitials(user.name)}
              </div>
            )}

            {/* Active Status Ring Indicator */}
            {user.isActive && (
              <span
                className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-xs"
                title="Active Account"
              />
            )}
          </div>

          {/* User Details */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1C1917]">
                {user.name}
              </h1>

              {/* Role Badge */}
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#B7925A] border border-[#B7925A]/30">
                <ShieldCheckIcon className="h-3 w-3" />
                <span>{user.role === "admin" ? "Admin" : "Customer"}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-[#78716C]">
              <div className="flex items-center gap-1.5">
                <MailIcon className="h-3.5 w-3.5 text-stone-400" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5 text-stone-400" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-xs text-stone-400">
              <CalendarIcon className="h-3.5 w-3.5 text-[#B7925A]" />
              <span>{formatMemberSince(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right: Optional Edit Button */}
        {showEditButton && (
          <div className="sm:self-center shrink-0">
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-[#FAF7F2] px-5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 transition-all hover:border-[#B7925A] hover:bg-white hover:text-[#B7925A] hover:shadow-xs"
            >
              <EditIcon className="h-4 w-4" />
              <span>Edit Profile</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
