import React from "react";
import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";

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
      className={`rounded-2xl border border-dashed border-stone-300 bg-white p-8 sm:p-12 text-center shadow-2xs ${className}`}
    >
      {Icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs mb-4">
          <Icon className="h-7 w-7" />
        </div>
      )}

      <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
        {title}
      </h3>

      <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {actionText && actionHref && (
        <div className="mt-6">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#6D28D9] transition-all shadow-xs cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>{actionText}</span>
          </Link>
        </div>
      )}

      {actionText && !actionHref && onAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#6D28D9] transition-all shadow-xs cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
