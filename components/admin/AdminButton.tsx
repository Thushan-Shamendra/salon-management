import React from "react";

export type AdminButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type AdminButtonSize = "sm" | "md" | "lg";

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export default function AdminButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  children,
  className = "",
  disabled,
  ...props
}: AdminButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-xs sm:text-sm gap-2",
    lg: "px-6 py-3 text-sm gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-xs active:scale-[0.99]",
    secondary:
      "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs active:scale-[0.99]",
    danger:
      "bg-red-600 text-white hover:bg-red-700 shadow-xs active:scale-[0.99]",
    ghost:
      "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}
