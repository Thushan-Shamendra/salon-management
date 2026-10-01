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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <Link href="/admin" className="hover:text-stone-900 transition-colors">
              Admin
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRightIcon className="h-3.5 w-3.5 opacity-60" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-stone-900 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-stone-800">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
