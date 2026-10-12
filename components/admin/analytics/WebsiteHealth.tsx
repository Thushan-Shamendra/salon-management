"use client";

import React from "react";
import { CheckCircleIcon, AlertCircleIcon } from "@/components/ui/icons";

export interface HealthItem {
  id: string;
  title: string;
  status: "ok" | "warning" | "critical";
  detail: string;
}

export interface WebsiteHealthData {
  status: "Healthy" | "Needs Attention" | "Critical";
  warningsCount: number;
  items: HealthItem[];
}

interface WebsiteHealthProps {
  health: WebsiteHealthData;
}

export default function WebsiteHealth({ health }: WebsiteHealthProps) {
  const isHealthy = health.status === "Healthy";
  const isCritical = health.status === "Critical";

  const badgeColor = isHealthy
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isCritical
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs h-full">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              Website Health
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Deterministic checks for content completeness & integrations
            </p>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${badgeColor}`}
          >
            {health.status}
          </span>
        </div>

        {/* Health Items Checklist */}
        <div className="mt-4 space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
          {health.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2.5 rounded-xl p-2.5 border text-xs transition-colors ${
                item.status === "ok"
                  ? "border-emerald-100/70 bg-emerald-50/30 text-stone-700"
                  : item.status === "critical"
                  ? "border-red-200 bg-red-50/50 text-red-800"
                  : "border-amber-200 bg-amber-50/40 text-amber-900"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {item.status === "ok" ? (
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                ) : item.status === "critical" ? (
                  <AlertCircleIcon className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                )}
              </div>

              <div className="space-y-0.5">
                <p className="font-semibold">{item.title}</p>
                <p className="text-[11px] opacity-80">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
