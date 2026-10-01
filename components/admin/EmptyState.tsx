import React from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-stone-300 bg-white p-8 sm:p-12 text-center ${className}`}
    >
      {Icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#B7925A] border border-[#B7925A]/25 mb-4">
          <Icon className="h-7 w-7" />
        </div>
      )}

      <h3 className="font-serif text-lg font-medium text-stone-900">
        {title}
      </h3>

      <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {actionText && actionHref && (
        <div className="mt-6">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-xs"
          >
            <span>{actionText}</span>
          </Link>
        </div>
      )}

      {actionText && !actionHref && onAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors border border-[#B7925A]/30 shadow-xs"
          >
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
