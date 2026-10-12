"use client";

import React from "react";
import { TrendingUpIcon, TrendingDownIcon } from "@/components/ui/icons";

interface ChangeData {
  pct: number | null;
  text: string;
  isPositive: boolean;
  isNeutral: boolean;
}

interface AnalyticsStatCardProps {
  title: string;
  value: number;
  change?: ChangeData;
  icon: React.ComponentType<{ className?: string }>;
  rangeLabel?: string;
  subtitle?: string;
}

export default function AnalyticsStatCard({
  title,
  value,
  change,
  icon: Icon,
  rangeLabel = "vs previous period",
  subtitle,
}: AnalyticsStatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all hover:border-purple-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {value.toLocaleString()}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
        {change ? (
          <div className="flex items-center gap-1.5">
            {change.isNeutral ? (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 font-bold text-stone-600 text-[11px]">
                {change.text}
              </span>
            ) : change.isPositive ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200 text-[11px]">
                <TrendingUpIcon className="h-3 w-3" />
                <span>{change.text}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-2 py-0.5 font-bold text-red-600 border border-red-200 text-[11px]">
                <TrendingDownIcon className="h-3 w-3" />
                <span>{change.text}</span>
              </span>
            )}
            <span className="text-stone-400 text-[11px] font-medium truncate">
              {rangeLabel}
            </span>
          </div>
        ) : subtitle ? (
          <span className="text-stone-400 text-[11px] font-medium">{subtitle}</span>
        ) : (
          <span className="text-stone-400 text-[11px]">Real website events</span>
        )}
      </div>
    </div>
  );
}
