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
  accentColor?: string;
}

export default function AnalyticsStatCard({
  title,
  value,
  change,
  icon: Icon,
  rangeLabel = "vs previous period",
  subtitle,
  accentColor = "#03BF62",
}: AnalyticsStatCardProps) {
  return (
    <div className="admin-glow-card flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="admin-glow-title text-xs font-semibold uppercase tracking-wider text-stone-500 transition-colors">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {value.toLocaleString()}
          </p>
        </div>

        <div
          className="admin-glow-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
          style={{
            backgroundColor: `${accentColor}18`,
            borderColor: `${accentColor}33`,
            color: accentColor,
          }}
        >
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
