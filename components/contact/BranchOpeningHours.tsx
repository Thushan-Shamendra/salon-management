"use client";

import React, { useMemo } from "react";
import {
  ClockIcon,
  MapPinIcon,
  StoreIcon,
  XCircleIcon,
} from "@/components/ui/icons";
import { useBranchContext } from "@/components/context/BranchContext";
import {
  BranchData,
  FallbackSettingsData,
} from "@/components/contact/BranchContactSection";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface NormalizedScheduleItem {
  day: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface TodayStatusResult {
  isOpen: boolean;
  statusLabel: "Open Now" | "Closed Now" | "Closed Today";
  detailLabel?: string;
  todayDayName: string;
}

export function formatTime(t?: string): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export function getSriLankaTime(): {
  dayName: string;
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const now = new Date();

  // Weekday in Asia/Colombo timezone
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    weekday: "long",
  });
  const dayName = dayFormatter.format(now);

  // 24-hour time in Asia/Colombo timezone
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });

  const parts = timeFormatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minutePart = parts.find((p) => p.type === "minute")?.value ?? "0";

  const hours = parseInt(hourPart, 10);
  const minutes = parseInt(minutePart, 10);

  return {
    dayName,
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
}

export function calculateTodayStatus(
  schedule: NormalizedScheduleItem[],
  customSlTime?: { dayName: string; totalMinutes: number }
): TodayStatusResult {
  const slTime = customSlTime ?? getSriLankaTime();
  const currentDayName = slTime.dayName;
  const currentMinutes = slTime.totalMinutes;

  const todayItem = schedule.find(
    (h) => h.day.toLowerCase() === currentDayName.toLowerCase()
  );

  // If closed or missing hours on this day
  if (
    !todayItem ||
    todayItem.isClosed ||
    !todayItem.openTime ||
    !todayItem.closeTime
  ) {
    return {
      isOpen: false,
      statusLabel: "Closed Now",
      detailLabel: "Closed Today",
      todayDayName: currentDayName,
    };
  }

  const [openH, openM] = todayItem.openTime.split(":").map(Number);
  const [closeH, closeM] = todayItem.closeTime.split(":").map(Number);

  if (isNaN(openH) || isNaN(closeH)) {
    return {
      isOpen: false,
      statusLabel: "Closed Now",
      detailLabel: "Closed Today",
      todayDayName: currentDayName,
    };
  }

  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  const formattedOpen = formatTime(todayItem.openTime);
  const formattedClose = formatTime(todayItem.closeTime);

  if (currentMinutes < openMinutes) {
    // Before opening
    return {
      isOpen: false,
      statusLabel: "Closed Now",
      detailLabel: `Opens at ${formattedOpen}`,
      todayDayName: currentDayName,
    };
  } else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    // During opening hours
    return {
      isOpen: true,
      statusLabel: "Open Now",
      detailLabel: `Closes at ${formattedClose}`,
      todayDayName: currentDayName,
    };
  } else {
    // After closing
    return {
      isOpen: false,
      statusLabel: "Closed Now",
      detailLabel: `Closed at ${formattedClose}`,
      todayDayName: currentDayName,
    };
  }
}

interface BranchOpeningHoursProps {
  branches?: BranchData[];
  fallbackSettings?: FallbackSettingsData;
}

export default function BranchOpeningHours({
  branches = [],
  fallbackSettings,
}: BranchOpeningHoursProps) {
  const { selectedBranchId, setSelectedBranchId, setSelectedBranchWhatsapp } =
    useBranchContext();

  // Ensure Main Branch appears first
  const sortedBranches = useMemo(() => {
    if (!branches || branches.length === 0) return [];
    return [...branches].sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }, [branches]);

  const hasBranches = sortedBranches.length > 0;

  // Determine active branch: from context if present, or first (main) branch
  const activeBranch = useMemo(() => {
    if (!hasBranches) return null;
    if (selectedBranchId) {
      const found = sortedBranches.find((b) => b._id === selectedBranchId);
      if (found) return found;
    }
    return sortedBranches[0];
  }, [sortedBranches, selectedBranchId, hasBranches]);

  // Handle branch switch
  const handleSelectBranch = (branch: BranchData) => {
    setSelectedBranchId(branch._id);
    setSelectedBranchWhatsapp(branch.whatsappNumber || branch.phone);
  };

  // Build normalized weekly schedule (Monday - Sunday)
  const schedule: NormalizedScheduleItem[] = useMemo(() => {
    if (
      activeBranch &&
      Array.isArray(activeBranch.openingHours) &&
      activeBranch.openingHours.length > 0
    ) {
      const map = new Map(
        activeBranch.openingHours.map((h) => [h.day.toLowerCase(), h])
      );
      return WEEKDAYS.map((day) => {
        const item = map.get(day.toLowerCase());
        if (item) {
          return {
            day,
            isClosed: Boolean(item.isClosed),
            openTime: item.openTime,
            closeTime: item.closeTime,
          };
        }
        return {
          day,
          isClosed: true,
        };
      });
    }

    if (
      fallbackSettings?.openingHours &&
      Array.isArray(fallbackSettings.openingHours) &&
      fallbackSettings.openingHours.length > 0
    ) {
      const map = new Map(
        fallbackSettings.openingHours.map((h) => [h.day.toLowerCase(), h])
      );
      return WEEKDAYS.map((day) => {
        const item = map.get(day.toLowerCase());
        if (item) {
          return {
            day,
            isClosed: Boolean(item.isClosed),
            openTime: item.open,
            closeTime: item.close,
          };
        }
        return {
          day,
          isClosed: true,
        };
      });
    }

    return [];
  }, [activeBranch, fallbackSettings]);

  // Gracefully hide if no opening hours data configured
  if (schedule.length === 0) {
    return null;
  }

  // Calculate today status in Asia/Colombo timezone
  const todayStatus = calculateTodayStatus(schedule);
  const todayDayName = todayStatus.todayDayName;

  const displayName = activeBranch
    ? `SALVORA ${activeBranch.name.replace(/^salvora\s*/i, "")}`
    : fallbackSettings?.salonName || "SALVORA Salon";

  const branchAddress =
    activeBranch?.address || fallbackSettings?.address || "";

  return (
    <section className="bg-[#F8F5FF] py-14 sm:py-16 lg:py-20 border-b border-purple-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#7C3AED]">
              OPENING HOURS
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Visit Us at a Time That Works for You
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl mx-auto">
            Our opening hours may vary by branch. Select a location to view the weekly schedule.
          </p>
        </div>

        {/* Branch Selector Pills */}
        {hasBranches && (
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {sortedBranches.map((b) => {
                const isSelected = b._id === activeBranch?._id;
                const formattedTabName = `SALVORA ${b.name.replace(/^salvora\s*/i, "")}`;
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => handleSelectBranch(b)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-[#7C3AED] text-white border border-[#7C3AED] shadow-md shadow-purple-600/25"
                        : "bg-white text-stone-700 hover:bg-purple-50/70 hover:text-[#7C3AED] hover:border-purple-200 border border-stone-200/90 shadow-2xs"
                    }`}
                  >
                    <StoreIcon
                      className={`h-4 w-4 shrink-0 ${
                        isSelected ? "text-white" : "text-[#7C3AED]"
                      }`}
                    />
                    <span>{formattedTabName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Single Large Schedule Card */}
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-purple-100/90 bg-white p-5 sm:p-7 lg:p-8 shadow-sm">
            {/* Card Header: Branch Name & Address on Left, Live Status Badge on Right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-stone-100">
              <div>
                <h3 className="text-lg sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                  {displayName}
                </h3>
                {branchAddress && (
                  <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-stone-500 mt-1">
                    <MapPinIcon className="h-3.5 w-3.5 text-[#7C3AED] shrink-0" />
                    <span>{branchAddress}</span>
                  </p>
                )}
              </div>

              {/* Right: Current Status Badge + Secondary Text */}
              <div className="flex flex-col sm:items-end gap-1 shrink-0">
                <div
                  className={`inline-flex items-center gap-2 self-start sm:self-end rounded-full px-3.5 py-1 text-xs font-bold border ${
                    todayStatus.isOpen
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-stone-100 text-stone-700 border-stone-200"
                  }`}
                >
                  {todayStatus.isOpen ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  ) : todayStatus.detailLabel === "Closed Today" ? (
                    <XCircleIcon className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  ) : (
                    <ClockIcon className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                  )}
                  <span>{todayStatus.statusLabel}</span>
                </div>

                {todayStatus.detailLabel && (
                  <span className="text-xs font-medium text-stone-500 sm:text-right">
                    {todayStatus.detailLabel}
                  </span>
                )}
              </div>
            </div>

            {/* DESKTOP: 7-Day Horizontal Grid (lg and above) */}
            <div className="hidden lg:grid lg:grid-cols-7 divide-x divide-stone-100 rounded-2xl border border-stone-100 bg-stone-50/30 overflow-hidden">
              {schedule.map((item) => {
                const isToday =
                  item.day.toLowerCase() === todayDayName.toLowerCase();

                return (
                  <div
                    key={item.day}
                    className={`flex flex-col items-center justify-center text-center px-2.5 py-5 transition-colors ${
                      isToday
                        ? "bg-purple-50/90 ring-1 ring-inset ring-purple-200/80"
                        : "hover:bg-stone-50/80"
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        isToday
                          ? "font-extrabold text-[#7C3AED]"
                          : "font-bold text-stone-800"
                      }`}
                    >
                      {item.day}
                    </span>

                    <div className="mt-2 text-xs">
                      {item.isClosed ? (
                        <span className="inline-block rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-500">
                          Closed
                        </span>
                      ) : item.openTime && item.closeTime ? (
                        <span
                          className={`whitespace-nowrap ${
                            isToday
                              ? "font-bold text-[#7C3AED]"
                              : "font-medium text-stone-600"
                          }`}
                        >
                          {formatTime(item.openTime)} – {formatTime(item.closeTime)}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">Closed</span>
                      )}
                    </div>

                    {isToday && (
                      <span className="mt-2.5 inline-flex items-center rounded-full bg-[#7C3AED] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                        Today
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* TABLET: Responsive 2-Column / 4-Column Grid (sm to md) */}
            <div className="hidden sm:grid lg:hidden sm:grid-cols-2 md:grid-cols-4 gap-3">
              {schedule.map((item) => {
                const isToday =
                  item.day.toLowerCase() === todayDayName.toLowerCase();

                return (
                  <div
                    key={item.day}
                    className={`flex flex-col justify-between rounded-2xl p-4 border transition-colors ${
                      isToday
                        ? "bg-purple-50/90 border-purple-200/90 shadow-2xs"
                        : "bg-stone-50/40 border-stone-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm ${
                          isToday
                            ? "font-extrabold text-[#7C3AED]"
                            : "font-bold text-stone-800"
                        }`}
                      >
                        {item.day}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs">
                      {item.isClosed ? (
                        <span className="inline-block rounded-md bg-stone-100 px-2.5 py-0.5 font-semibold text-stone-500">
                          Closed
                        </span>
                      ) : item.openTime && item.closeTime ? (
                        <span
                          className={
                            isToday
                              ? "font-bold text-[#7C3AED]"
                              : "font-medium text-stone-600"
                          }
                        >
                          {formatTime(item.openTime)} – {formatTime(item.closeTime)}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MOBILE: Vertical List (< 640px) */}
            <div className="sm:hidden divide-y divide-stone-100">
              {schedule.map((item) => {
                const isToday =
                  item.day.toLowerCase() === todayDayName.toLowerCase();

                return (
                  <div
                    key={item.day}
                    className={`flex items-center justify-between py-3 px-3.5 rounded-xl transition-colors ${
                      isToday
                        ? "bg-purple-50/90 border border-purple-200/90 my-1"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${
                          isToday
                            ? "font-extrabold text-[#7C3AED]"
                            : "font-semibold text-stone-800"
                        }`}
                      >
                        {item.day}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-right">
                      {item.isClosed ? (
                        <span className="inline-block rounded-md bg-stone-100 px-2.5 py-0.5 font-semibold text-stone-500">
                          Closed
                        </span>
                      ) : item.openTime && item.closeTime ? (
                        <span
                          className={
                            isToday
                              ? "font-bold text-[#7C3AED]"
                              : "font-medium text-stone-700"
                          }
                        >
                          {formatTime(item.openTime)} – {formatTime(item.closeTime)}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
