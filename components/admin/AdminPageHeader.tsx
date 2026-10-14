"use client";

import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import AdminButton from "./AdminButton";

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
  const customization = useSectionCustomization("page");
  // Only the explicit page-header action is editable. Never walk form buttons,
  // table rows, icons or destructive actions elsewhere in the page.
  let presentationAction = action;
  if (React.isValidElement<{ children?: React.ReactNode; variant?: string }>(action) &&
      (action.type === "button" || action.type === AdminButton) && action.props.variant !== "danger") {
    const children = React.Children.map(action.props.children, (child) => {
      if (!customization.has("primaryButtonText")) return child;
      if (typeof child === "string") return customization.text("primaryButtonText", child);
      if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === "span" && typeof child.props.children === "string") {
        return React.cloneElement(child, {}, customization.text("primaryButtonText", child.props.children));
      }
      return child;
    });
    presentationAction = React.cloneElement(action as React.ReactElement<Record<string, unknown>>, {
      "data-customization-role": "primaryButton",
      "data-customization-admin-primary": "true",
    }, children);
  }
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
              className="hover:text-[#03BF62] transition-colors"
            >
              Admin
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRightIcon className="h-3 w-3 opacity-50" />
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[#03BF62] transition-colors"
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

        <h1 data-customization-role="heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          {customization.text("heading", title)}
        </h1>

        {description && (
          <p data-customization-role="description" data-customization-admin-body className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            {customization.text("description", description)}
          </p>
        )}
      </div>

      {presentationAction && <div className="flex items-center gap-3 shrink-0">{presentationAction}</div>}
    </div>
  );
}
