"use client";

import React from "react";
import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";
import { useSectionCustomization } from "@/components/customization/CustomizationProvider";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  actionClassName?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = "",
  actionClassName = "",
}: EmptyStateProps) {
  const customization = useSectionCustomization("page");

  const cleanActionText = actionText ? actionText.replace(/^\+\s*/, "").trim() : "";
  const isClearAction = cleanActionText.toLowerCase().includes("clear");
  const displayedText =
    !isClearAction && customization.has("primaryButtonText")
      ? customization.text("primaryButtonText", cleanActionText)
      : cleanActionText;

  const defaultButtonClass =
    actionClassName ||
    "inline-flex items-center gap-2 rounded-xl bg-[#03BF62] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#029E51] transition-all shadow-xs cursor-pointer";

  return (
    <div
      className={`rounded-2xl border border-dashed border-stone-300 bg-white p-8 sm:p-12 text-center shadow-2xs ${className}`}
    >
      {Icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#03BF62] border border-emerald-100 shadow-2xs mb-4">
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
            data-customization-role={!isClearAction ? "primaryButton" : undefined}
            data-customization-admin-primary={!isClearAction ? "true" : undefined}
            className={defaultButtonClass}
          >
            {!isClearAction && <PlusIcon className="h-4 w-4" />}
            <span>{displayedText}</span>
          </Link>
        </div>
      )}

      {actionText && !actionHref && onAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            data-customization-role={!isClearAction ? "primaryButton" : undefined}
            data-customization-admin-primary={!isClearAction ? "true" : undefined}
            className={defaultButtonClass}
          >
            {!isClearAction && <PlusIcon className="h-4 w-4" />}
            <span>{displayedText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
