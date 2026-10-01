import React from "react";

export type StatusType =
  | "active"
  | "disabled"
  | "pending"
  | "approved"
  | "hidden"
  | "confirmed"
  | "completed"
  | "cancelled";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export default function StatusBadge({
  status,
  label,
  className = "",
}: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let styles = "bg-stone-100 text-stone-700 border-stone-200";
  let dotColor = "bg-stone-400";
  const displayLabel = label || status;

  switch (normalized) {
    case "active":
    case "approved":
    case "completed":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      dotColor = "bg-emerald-500";
      break;

    case "pending":
    case "rescheduled":
      styles = "bg-amber-50 text-amber-700 border-amber-200/80";
      dotColor = "bg-amber-500";
      break;

    case "disabled":
    case "hidden":
    case "cancelled":
      styles = "bg-red-50 text-red-700 border-red-200/80";
      dotColor = "bg-red-500";
      break;

    case "confirmed":
      styles = "bg-blue-50 text-blue-700 border-blue-200/80";
      dotColor = "bg-blue-500";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize tracking-wide ${styles} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span>{displayLabel}</span>
    </span>
  );
}
