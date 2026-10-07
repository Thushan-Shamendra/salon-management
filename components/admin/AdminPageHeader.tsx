import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumbs"
            className="flex items-center gap-1.5 text-xs text-stone-500 mb-1.5 font-medium"
          >
            <Link
              href="/admin"
              className="hover:text-[#7C3AED] transition-colors"
            >
              Admin
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRightIcon className="h-3 w-3 opacity-50" />
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[#7C3AED] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-stone-900 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
