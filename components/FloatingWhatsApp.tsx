"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { WhatsAppIcon, MapPinIcon, PhoneIcon, XIcon } from "@/components/ui/icons";
import { useBranchContext } from "@/components/context/BranchContext";
import { trackEvent } from "@/lib/analytics-client";

function normalizeWhatsAppNumber(raw?: string): string {
  if (!raw) return "";
  // Remove spaces, +, -, and parentheses
  const cleaned = raw.replace(/[\s+\-()]/g, "").trim();
  // Ensure it contains digits
  return /^\d{7,15}$/.test(cleaned) ? cleaned : "";
}

interface BranchItem {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  whatsappNumber?: string;
  isMain?: boolean;
}

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const { selectedBranchWhatsapp, selectedBranchId } = useBranchContext();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [settingsWhatsapp, setSettingsWhatsapp] = useState<string>("");
  const [salonName, setSalonName] = useState<string>("SALVORA");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Do not display inside /admin
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    let isMounted = true;

    async function fetchData() {
      try {
        // Fetch active branches
        const branchRes = await fetch("/api/branches");
        if (branchRes.ok) {
          const branchData = await branchRes.json();
          if (
            branchData?.success &&
            Array.isArray(branchData.branches) &&
            branchData.branches.length > 0
          ) {
            if (isMounted) setBranches(branchData.branches);
          }
        }

        // Fetch settings as secondary fallback
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData?.success && settingsData.settings) {
            if (isMounted) {
              if (settingsData.settings.salonName) {
                setSalonName(settingsData.settings.salonName);
              }
              const candidate =
                settingsData.settings.whatsapp ||
                settingsData.settings.socialMedia?.whatsapp ||
                settingsData.settings.phone ||
                "";
              setSettingsWhatsapp(candidate);
            }
          }
        }
      } catch {
        // Silently handle network errors
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // Handle click outside & escape key to close popup
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Determine if there is at least one valid WhatsApp target
  const hasValidContact = useMemo(() => {
    if (branches.some((b) => b.whatsappNumber || b.phone)) return true;
    if (selectedBranchWhatsapp) return true;
    if (settingsWhatsapp) return true;
    return false;
  }, [branches, selectedBranchWhatsapp, settingsWhatsapp]);

  // If inside /admin or no valid contact exists after load, hide button gracefully
  if (isAdmin || (!hasValidContact && isLoaded)) {
    return null;
  }

  const handleBranchClick = (branch: BranchItem) => {
    const rawNumber =
      branch.whatsappNumber || branch.phone || selectedBranchWhatsapp || settingsWhatsapp;
    const normalized = normalizeWhatsAppNumber(rawNumber);

    if (!normalized) return;

    trackEvent({
      eventType: "WHATSAPP_CLICK",
      branchId: branch._id || selectedBranchId || undefined,
      page: pathname || undefined,
      metadata: {
        source: "floating-whatsapp-popup",
        label: branch.name,
      },
    });

    const branchLabel = branch.name ? ` (${branch.name})` : "";
    const defaultMessage = encodeURIComponent(
      `Hello ${salonName}${branchLabel}, I would like to know more about your salon services.`
    );
    const whatsappUrl = `https://wa.me/${normalized}?text=${defaultMessage}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleMainButtonClick = () => {
    // Toggle popup open/close
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-auto"
    >
      {/* Branches Popup Modal */}
      {isOpen && (
        <div
          className="mb-3 w-[320px] sm:w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Select a branch to chat on WhatsApp"
        >
          {/* Popup Header */}
          <div className="bg-[#141414] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366]">
                <WhatsAppIcon className="h-5 w-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Chat with {salonName}
                </h3>
                <p className="text-[11px] text-stone-400">Select a branch to continue</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="h-7 w-7 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Branches List */}
          <div className="p-3 max-h-[60vh] overflow-y-auto space-y-2">
            {branches.length > 0 ? (
              branches.map((branch) => {
                const number = branch.whatsappNumber || branch.phone;
                return (
                  <button
                    type="button"
                    key={branch._id}
                    onClick={() => handleBranchClick(branch)}
                    className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#25D366]/50 hover:bg-white/[0.08] transition-all group flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MapPinIcon className="h-3.5 w-3.5 text-[#25D366] shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#25D366] transition-colors truncate">
                          {branch.name}
                        </span>
                        {branch.isMain && (
                          <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                            Main Branch
                          </span>
                        )}
                      </div>
                      {branch.address && (
                        <p className="text-[11px] text-stone-400 truncate pl-5 mt-0.5">
                          {branch.address}
                        </p>
                      )}
                      {number && (
                        <div className="flex items-center gap-1.5 pl-5 pt-1 text-[11px] text-stone-300">
                          <PhoneIcon className="h-2.5 w-2.5 text-[#25D366] shrink-0" />
                          <span>{number}</span>
                        </div>
                      )}
                    </div>

                    <div className="h-8 w-8 rounded-full bg-[#25D366]/10 group-hover:bg-[#25D366] text-[#25D366] group-hover:text-white flex items-center justify-center shrink-0 transition-all mt-0.5 shadow-xs">
                      <WhatsAppIcon className="h-4.5 w-4.5 fill-current" />
                    </div>
                  </button>
                );
              })
            ) : (
              // Fallback single salon contact if no branch list
              <button
                type="button"
                onClick={() =>
                  handleBranchClick({
                    _id: "main",
                    name: salonName,
                    phone: settingsWhatsapp,
                  })
                }
                className="w-full text-left p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#25D366]/50 hover:bg-white/[0.08] transition-all group flex items-center justify-between gap-3 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-[#25D366] transition-colors">
                    {salonName} Customer Care
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Start WhatsApp conversation directly
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-[#25D366]/10 group-hover:bg-[#25D366] text-[#25D366] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <WhatsAppIcon className="h-4.5 w-4.5 fill-current" />
                </div>
              </button>
            )}
          </div>

          {/* Popup Footer Note */}
          <div className="px-4 py-2 bg-[#0A0A0A] border-t border-white/5 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
              <span>Replies directly on WhatsApp</span>
            </span>
            <span className="text-[10px] text-stone-500 font-medium">SALVORA</span>
          </div>
        </div>
      )}

      {/* Floating Trigger Row */}
      <div className="flex items-center group">
        {/* Desktop Hover Label (hidden when popup is open) */}
        {!isOpen && (
          <div
            onClick={handleMainButtonClick}
            className="hidden md:flex items-center mr-3 px-3.5 py-1.5 rounded-full bg-stone-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 cursor-pointer select-none border border-white/10"
            aria-hidden="true"
          >
            <span>Chat with {salonName}</span>
          </div>
        )}

        {/* Floating Button */}
        <button
          type="button"
          onClick={handleMainButtonClick}
          aria-label={isOpen ? "Close WhatsApp branch selector" : "Chat with SALVORA on WhatsApp"}
          aria-expanded={isOpen}
          className={`flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full text-white shadow-lg shadow-emerald-900/30 transition-all duration-200 focus:outline-hidden cursor-pointer ${
            isOpen
              ? "bg-[#1F2937] hover:bg-[#374151] ring-4 ring-white/20 scale-105"
              : "bg-[#25D366] hover:bg-[#20BD5A] hover:scale-105 active:scale-95 ring-4 ring-emerald-400/20"
          }`}
        >
          {isOpen ? (
            <XIcon className="h-6 w-6 text-white" />
          ) : (
            <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white fill-current" />
          )}
        </button>
      </div>
    </div>
  );
}
