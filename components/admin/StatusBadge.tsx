import React from "react";

export type StatusType =
  | "active"
  | "inactive"
  | "hidden"
  | "featured"
  | "enabled"
  | "disabled"
  | "configured"
  | "missing"
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  dot?: boolean;
}

export default function StatusBadge({
  status,
  label,
  className = "",
  dot = true,
}: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase().trim();

  let styles = "bg-stone-100 text-stone-700 border-stone-200";
  let dotColor = "bg-stone-400";
  const displayLabel = label || status;

  switch (normalized) {
    case "active":
    case "enabled":
    case "configured":
    case "ready":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200/90";
      dotColor = "bg-emerald-500";
      break;

    case "featured":
      styles = "bg-purple-50 text-[#7C3AED] border-purple-200/90";
      dotColor = "bg-[#7C3AED]";
      break;

    case "hidden":
    case "inactive":
    case "disabled":
      styles = "bg-stone-100 text-stone-600 border-stone-200";
      dotColor = "bg-stone-400";
      break;

    case "missing":
    case "warning":
      styles = "bg-amber-50 text-amber-700 border-amber-200";
      dotColor = "bg-amber-500";
      break;

    case "danger":
    case "error":
      styles = "bg-red-50 text-red-700 border-red-200";
      dotColor = "bg-red-500";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-normal ${styles} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      <span>{displayLabel}</span>
    </span>
  );
}
