import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

interface StatCardProps {
  title: string;
  value: number | string | null | undefined;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string;
  isUnavailable?: boolean;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  badge,
  isUnavailable = false,
}: StatCardProps) {
  const content = (
    <div className="relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#B7925A]/50 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {title}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          {isUnavailable || value === null || value === undefined ? (
            <span className="text-sm font-medium text-stone-400 italic">
              Not available yet
            </span>
          ) : (
            <span className="font-serif text-3xl font-bold tracking-tight text-stone-900">
              {value}
            </span>
          )}

          {badge && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              {badge}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {href && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-[#B7925A] group-hover:text-stone-900 transition-colors">
          <span>Manage {title.toLowerCase()}</span>
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
}
