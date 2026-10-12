"use client";

import React, { useMemo } from "react";
import { ClockIcon, CheckCircleIcon, XCircleIcon } from "@/components/ui/icons";
import { useBranchContext } from "@/components/context/BranchContext";
import { BranchData, FallbackSettingsData } from "@/components/contact/BranchContactSection";

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
  if (!todayItem || todayItem.isClosed || !todayItem.openTime || !todayItem.closeTime) {
    return {
      isOpen: false,
      statusLabel: "Closed Today",
      todayDayName: currentDayName,
    };
  }

  const [openH, openM] = todayItem.openTime.split(":").map(Number);
  const [closeH, closeM] = todayItem.closeTime.split(":").map(Number);

  if (isNaN(openH) || isNaN(closeH)) {
    return {
      isOpen: false,
      statusLabel: "Closed Today",
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
      detailLabel: `Open until ${formattedClose}`,
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

  const hasBranches = branches.length > 0;

  // Determine active branch: from context if present, or first branch
  const activeBranch = useMemo(() => {
    if (!hasBranches) return null;
    if (selectedBranchId) {
      const found = branches.find((b) => b._id === selectedBranchId);
      if (found) return found;
    }
    return branches[0];
  }, [branches, selectedBranchId, hasBranches]);

  // Handle branch switch
  const handleSelectBranch = (branch: BranchData) => {
    setSelectedBranchId(branch._id);
    setSelectedBranchWhatsapp(branch.whatsappNumber || branch.phone);
  };

  // Build normalized weekly schedule (Monday - Sunday)
  const schedule: NormalizedScheduleItem[] = useMemo(() => {
    if (activeBranch && Array.isArray(activeBranch.openingHours) && activeBranch.openingHours.length > 0) {
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

  return (
    <section className="bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-b border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 mb-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#7C3AED]">
              OPENING HOURS
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Visit Us at a Time That Works for You
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl mx-auto">
            Opening hours may vary by SALVORA branch. Select a location to view its weekly schedule.
          </p>
        </div>

        {/* Branch Selector Tabs (when multiple active branches exist) */}
        {hasBranches && branches.length > 1 && (
          <div className="mb-10 sm:mb-12">
            <div className="flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto pb-2 px-1 no-scrollbar">
              {branches.map((b) => {
                const isSelected = b._id === activeBranch?._id;
                const formattedTabName = `SALVORA ${b.name.replace(/^salvora\s*/i, "")}`;
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => handleSelectBranch(b)}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-[#7C3AED] text-white shadow-md shadow-purple-600/30 scale-102"
                        : "bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80 shadow-2xs"
                    }`}
                  >
                    <ClockIcon
                      className={`h-4 w-4 ${
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

        {/* Opening Hours Schedule Card */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-sm transition-all duration-300 hover:shadow-md">
            {/* Card Header: Branch Name & Live Today Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                  {displayName}
                </h3>
                {activeBranch?.address && (
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                    {activeBranch.address}
                  </p>
                )}
              </div>

              {/* Today Status Badge & Timing Info */}
              <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                    todayStatus.isOpen
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : todayStatus.statusLabel === "Closed Today"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-stone-100 text-stone-700 border-stone-200"
                  }`}
                >
                  {todayStatus.isOpen ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  ) : todayStatus.statusLabel === "Closed Today" ? (
                    <XCircleIcon className="h-4 w-4 text-rose-600 shrink-0" />
                  ) : (
                    <ClockIcon className="h-4 w-4 text-stone-500 shrink-0" />
                  )}
                  <span>{todayStatus.statusLabel}</span>
                </div>

                {todayStatus.detailLabel && (
                  <span className="text-[11px] font-semibold text-stone-600 sm:text-right">
                    {todayStatus.detailLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Weekly Schedule Rows (Monday to Sunday) */}
            <div className="mt-6 divide-y divide-stone-100">
              {schedule.map((item) => {
                const isToday =
                  item.day.toLowerCase() === todayDayName.toLowerCase();

                return (
                  <div
                    key={item.day}
                    className={`flex items-center justify-between py-3.5 px-3 sm:px-4 rounded-xl transition-colors ${
                      isToday
                        ? "bg-purple-50/80 border border-purple-200/90 shadow-2xs my-1"
                        : "hover:bg-stone-50"
                    }`}
                  >
                    {/* Day Column */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs sm:text-sm ${
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

                    {/* Hours Column */}
                    <div className="text-xs sm:text-sm text-right">
                      {item.isClosed ? (
                        <span className="inline-block rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-500 border border-stone-200/70">
                          Closed
                        </span>
                      ) : item.openTime && item.closeTime ? (
                        <span
                          className={`${
                            isToday
                              ? "font-bold text-stone-900"
                              : "font-medium text-stone-700"
                          }`}
                        >
                          {formatTime(item.openTime)} – {formatTime(item.closeTime)}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 italic">
                          Hours unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3.5 w-3.5 text-purple-400" />
                <span>Appointments available during operating hours</span>
              </span>
              <span>Times in Sri Lanka Time (SLST)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
