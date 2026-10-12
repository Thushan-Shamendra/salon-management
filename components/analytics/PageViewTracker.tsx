"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";
import { useBranchContext } from "@/components/context/BranchContext";

export default function PageViewTracker() {
  const pathname = usePathname();
  const { selectedBranchId } = useBranchContext();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Do NOT track admin or internal API pages
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    // Deduplicate React re-renders / Strict Mode within the same route
    if (lastTrackedPathRef.current === pathname) {
      return;
    }

    lastTrackedPathRef.current = pathname;

    trackEvent({
      eventType: "PAGE_VIEW",
      page: pathname,
      branchId: selectedBranchId || undefined,
      metadata: {
        source: "navigation",
      },
    });
  }, [pathname, selectedBranchId]);

  return null;
}
