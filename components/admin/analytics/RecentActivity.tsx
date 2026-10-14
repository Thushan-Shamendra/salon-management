"use client";

import React from "react";
import { ClockIcon, SparklesIcon, WhatsAppIcon, PhoneIcon, CalendarIcon, StarIcon, CompassIcon } from "@/components/ui/icons";

export interface RecentActivityItem {
  id: string;
  eventType: string;
  title: string;
  source?: string | null;
  branchName?: string | null;
  createdAt: string;
}

interface RecentActivityProps {
  activity: RecentActivityItem[];
  accentColor?: string;
}

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 45) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHrs < 24) return `${diffHrs} ${diffHrs === 1 ? "hour" : "hours"} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

function getEventIcon(eventType: string, accentColor = "#03BF62") {
  switch (eventType) {
    case "WHATSAPP_CLICK":
      return <WhatsAppIcon className="h-3.5 w-3.5 fill-current" style={{ color: accentColor }} />;
    case "CALL_CLICK":
      return <PhoneIcon className="h-3.5 w-3.5" style={{ color: accentColor }} />;
    case "BOOKING_CLICK":
      return <CalendarIcon className="h-3.5 w-3.5 text-stone-700" />;
    case "GOOGLE_REVIEW_CLICK":
      return <StarIcon className="h-3.5 w-3.5 text-amber-500 fill-current" />;
    case "MAP_CLICK":
      return <CompassIcon className="h-3.5 w-3.5" style={{ color: accentColor }} />;
    default:
      return <SparklesIcon className="h-3.5 w-3.5" style={{ color: accentColor }} />;
  }
}

export default function RecentActivity({
  activity,
  accentColor = "#03BF62",
}: RecentActivityProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs h-full">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              Recent Activity
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Live chronological stream of visitor interactions
            </p>
          </div>
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: accentColor }}
            />
          </span>
        </div>

        <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {!activity || activity.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-stone-400 font-medium">
                No recent website activity yet.
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Real customer interactions (calls, bookings, WhatsApp) will stream here.
              </p>
            </div>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/40 p-2.5 text-xs hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200/70 shadow-2xs mt-0.5">
                    {getEventIcon(item.eventType, accentColor)}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 leading-snug">
                      {item.title}
                    </p>
                    {item.source && (
                      <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
                        Source: {item.source}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-stone-400 shrink-0 font-medium pt-0.5">
                  <ClockIcon className="h-3 w-3" />
                  <span>{formatTimeAgo(item.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
