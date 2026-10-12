"use client";

import React, { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useBranchContext } from "@/components/context/BranchContext";
import { trackEvent } from "@/lib/analytics-client";

function normalizeWhatsAppNumber(raw?: string): string {
  if (!raw) return "";
  // Remove spaces, +, -, and parentheses
  const cleaned = raw.replace(/[\s+\-()]/g, "").trim();
  // Ensure it contains digits
  return /^\d{7,15}$/.test(cleaned) ? cleaned : "";
}

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const { selectedBranchWhatsapp, selectedBranchId } = useBranchContext();
  const [firstBranchWhatsapp, setFirstBranchWhatsapp] = useState<string>("");
  const [settingsWhatsapp, setSettingsWhatsapp] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Do not display inside /admin
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    let isMounted = true;

    async function fetchFallbacks() {
      try {
        // Fetch active branches first
        const branchRes = await fetch("/api/branches");
        if (branchRes.ok) {
          const branchData = await branchRes.json();
          if (branchData?.success && Array.isArray(branchData.branches) && branchData.branches.length > 0) {
            const first = branchData.branches[0];
            const candidate = first.whatsappNumber || first.phone || "";
            if (isMounted) setFirstBranchWhatsapp(candidate);
          }
        }

        // Fetch settings as secondary fallback
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData?.success && settingsData.settings) {
            const candidate =
              settingsData.settings.whatsapp ||
              settingsData.settings.socialMedia?.whatsapp ||
              settingsData.settings.phone ||
              "";
            if (isMounted) setSettingsWhatsapp(candidate);
          }
        }
      } catch {
        // Silently handle network errors
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }

    fetchFallbacks();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // Determine active number based on priority:
  // 1. selected/current branch WhatsApp number where branch context exists
  // 2. first active branch WhatsApp number
  // 3. main Website Settings phone/WhatsApp fallback if available
  const effectiveNumber = useMemo(() => {
    if (selectedBranchWhatsapp) {
      const normalized = normalizeWhatsAppNumber(selectedBranchWhatsapp);
      if (normalized) return normalized;
    }

    if (firstBranchWhatsapp) {
      const normalized = normalizeWhatsAppNumber(firstBranchWhatsapp);
      if (normalized) return normalized;
    }

    if (settingsWhatsapp) {
      const normalized = normalizeWhatsAppNumber(settingsWhatsapp);
      if (normalized) return normalized;
    }

    return "";
  }, [selectedBranchWhatsapp, firstBranchWhatsapp, settingsWhatsapp]);

  // If inside /admin or no valid number exists, hide button gracefully
  if (isAdmin || (!effectiveNumber && isLoaded)) {
    return null;
  }

  // Pre-encoded default message
  const defaultMessage = encodeURIComponent(
    "Hello SALVORA, I would like to know more about your salon services."
  );
  const whatsappUrl = `https://wa.me/${effectiveNumber}?text=${defaultMessage}`;

  const handleClick = () => {
    trackEvent({
      eventType: "WHATSAPP_CLICK",
      branchId: selectedBranchId || undefined,
      page: pathname || undefined,
      metadata: {
        source: "floating-whatsapp",
      },
    });
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center group pointer-events-auto">
      {/* Desktop Hover Label */}
      <div
        className="hidden md:flex items-center mr-3 px-3.5 py-1.5 rounded-full bg-stone-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none select-none border border-white/10"
        aria-hidden="true"
      >
        <span>Chat with SALVORA</span>
      </div>

      {/* Floating Button */}
      <a
        href={whatsappUrl}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with SALVORA on WhatsApp"
        className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/30 hover:bg-[#20BD5A] hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-hidden focus:ring-4 focus:ring-emerald-400/40"
      >
        <WhatsAppIcon className="h-7 w-7 text-white fill-current" />
      </a>
    </div>
  );
}
