import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

interface StatCardProps {
  title: string;
  value?: number | string | null;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  actionText?: string;
  badge?: React.ReactNode;
  statusText?: string;
  description?: string;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  actionText,
  badge,
  statusText,
  description,
  loading = false,
}: StatCardProps) {
  const defaultActionText = href ? `View ${title.replace("Active ", "")} →` : "";
  const displayActionText = actionText || defaultActionText;

  const cardContent = (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-purple-300 hover:shadow-md">
      <div>
        <div className="flex items-start gap-4">
          {/* Purple Icon Badge */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-stone-700 tracking-tight">
                {title}
              </span>
              {badge}
            </div>

            {loading ? (
              <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-stone-200" />
            ) : statusText ? (
              <div className="mt-1">
                <span className="text-base sm:text-lg font-extrabold text-stone-900">
                  {statusText}
                </span>
              </div>
            ) : (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
                  {value ?? 0}
                </span>
              </div>
            )}

            {(subtitle || description) && (
              <p className="mt-1 text-xs text-stone-500 leading-relaxed truncate">
                {subtitle || description}
              </p>
            )}
          </div>
        </div>
      </div>

      {href && (
        <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#7C3AED] transition-colors group-hover:text-[#6D28D9]">
          <span className="flex items-center gap-1.5">
            {displayActionText}
          </span>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED] transition-transform group-hover:translate-x-0.5 group-hover:bg-[#7C3AED] group-hover:text-white">
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded-2xl">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
