import React from "react";

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  headerBorder?: boolean;
}

export default function AdminCard({
  children,
  className = "",
  title,
  subtitle,
  action,
  headerBorder = true,
}: AdminCardProps) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-shadow ${className}`}
    >
      {(title || action) && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 ${
            headerBorder ? "border-b border-stone-100" : ""
          }`}
        >
          <div>
            {title && (
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={title ? "p-5 sm:p-6" : ""}>{children}</div>
    </div>
  );
}
