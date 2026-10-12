import React from "react";
import { PhoneIcon } from "@/components/ui/icons";

interface QuickCallProps {
  phone: string;
  label?: string;
  className?: string;
  ariaLabel?: string;
  showIcon?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export default function QuickCall({
  phone,
  label = "Call Now",
  className = "",
  ariaLabel,
  showIcon = true,
  variant = "primary",
}: QuickCallProps) {
  if (!phone || !phone.trim()) return null;

  // Normalize phone number for tel: link (keep leading + and digits)
  const normalizedTel = phone.replace(/[^\d+]/g, "");

  const variantStyles = {
    primary:
      "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-sm shadow-purple-600/30",
    secondary:
      "bg-purple-50 text-[#7C3AED] hover:bg-purple-100 border border-purple-200",
    outline:
      "border border-stone-300 text-stone-700 hover:border-[#7C3AED] hover:text-[#7C3AED] bg-white",
  };

  return (
    <a
      href={`tel:${normalizedTel}`}
      aria-label={ariaLabel || `Call SALVORA at ${phone}`}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${variantStyles[variant]} ${className}`}
    >
      {showIcon && <PhoneIcon className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
    </a>
  );
}
