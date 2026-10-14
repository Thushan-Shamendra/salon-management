"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SalvoraLogo from "@/components/ui/SalvoraLogo";
import {
  MenuIcon,
  XIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";

interface ExternalSystemLinks {
  loginUrl: string;
  registerUrl: string;
  bookingUrl: string;
}

interface PageVisibilityLinks {
  products: boolean;
  promotions: boolean;
  wedding: boolean;
  vendors: boolean;
  gallery: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerLogo, setHeaderLogo] = useState<string>("");
  const [salonName, setSalonName] = useState<string>("Salvora");
  const [externalSystem, setExternalSystem] = useState<ExternalSystemLinks>({
    loginUrl: "",
    registerUrl: "",
    bookingUrl: "",
  });
  const [pageVisibility, setPageVisibility] = useState<PageVisibilityLinks>({
    products: true,
    promotions: true,
    wedding: true,
    vendors: true,
    gallery: true,
  });

  // Fetch external system links and branding from Website Settings
  useEffect(() => {
    let isMounted = true;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.settings) {
          if (data.settings.headerLogo || data.settings.logo) {
            setHeaderLogo(data.settings.headerLogo || data.settings.logo);
          }
          if (data.settings.salonName) {
            setSalonName(data.settings.salonName);
          }
          if (data.settings.externalSystem) {
            setExternalSystem({
              loginUrl: data.settings.externalSystem.loginUrl || "",
              registerUrl: data.settings.externalSystem.registerUrl || "",
              bookingUrl: data.settings.externalSystem.bookingUrl || "",
            });
          }
          if (data.settings.pageVisibility) {
            const pv = data.settings.pageVisibility;
            setPageVisibility({
              products: pv.products !== undefined ? Boolean(pv.products) : true,
              promotions: pv.promotions !== undefined ? Boolean(pv.promotions) : true,
              wedding: pv.wedding !== undefined ? Boolean(pv.wedding) : true,
              vendors: pv.vendors !== undefined ? Boolean(pv.vendors) : true,
              gallery: pv.gallery !== undefined ? Boolean(pv.gallery) : true,
            });
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle subtle scroll styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const allNavLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Products", href: "/products", visibilityKey: "products" as const },
    { name: "Promotions", href: "/promotions", visibilityKey: "promotions" as const },
    { name: "About", href: "/about" },
    { name: "Wedding", href: "/wedding", visibilityKey: "wedding" as const },
    { name: "Vendors", href: "/vendors", visibilityKey: "vendors" as const },
    { name: "Gallery", href: "/gallery", visibilityKey: "gallery" as const },
    { name: "Reviews", href: "/reviews" },
    { name: "Contact", href: "/contact" },
  ];

  const navLinks = allNavLinks.filter(
    (link) => !link.visibilityKey || pageVisibility[link.visibilityKey]
  );

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-stone-200/70"
          : "bg-white border-b border-stone-100"
      }`} data-customization-header="public"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        {/* SALVORA Brand Logo */}
        <Link
          href="/"
          className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03BF62] rounded-lg transition-transform hover:opacity-90"
          aria-label={`${salonName} Home`}
        >
          {headerLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headerLogo}
              alt={salonName}
              className="h-12 sm:h-13 lg:h-14 w-auto max-w-[260px] object-contain"
            />
          ) : (
            <SalvoraLogo theme="light" className="h-12 sm:h-13 lg:h-14 w-auto object-contain" />
          )}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#03BF62] relative py-1 ${
                  isActive
                    ? "text-[#03BF62] font-semibold"
                    : "text-stone-700"
                }`} data-customization-active={isActive}
              >
                {link.name}
                {isActive && (
                  <span data-customization-role="headerAccent" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#03BF62] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop External Actions (Login, Book Appointment) */}
        <div className="hidden lg:flex items-center gap-5">
          {externalSystem.loginUrl && (
            <a
              href={externalSystem.loginUrl}
              className="text-sm font-medium text-stone-700 hover:text-[#03BF62] transition-colors px-2 py-1.5"
            >
              Login
            </a>
          )}

          {externalSystem.bookingUrl ? (
            <a
              href={externalSystem.bookingUrl}
              onClick={() => {
                trackEvent({
                  eventType: "BOOKING_CLICK",
                  page: pathname || undefined,
                  metadata: {
                    source: "navbar",
                  },
                });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#03BF62] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#029e51] hover:shadow-md hover:shadow-stone-900/20 active:scale-[0.98]" data-customization-role="primaryButton"
            >
              <span>Book Appointment</span>
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Online booking link not yet configured"
              className="inline-flex items-center gap-2 rounded-full bg-[#03BF62]/50 px-6 py-2.5 text-sm font-medium text-white/80 cursor-not-allowed shadow-none" data-customization-role="primaryButton"
            >
              <span>Book Appointment</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-3">
          {externalSystem.bookingUrl && (
            <a
              href={externalSystem.bookingUrl}
              onClick={() => {
                trackEvent({
                  eventType: "BOOKING_CLICK",
                  page: pathname || undefined,
                  metadata: {
                    source: "navbar-mobile-header",
                  },
                });
              }}
              className="rounded-full bg-[#03BF62] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#029e51]" data-customization-role="primaryButton"
            >
              Book
            </a>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#03BF62]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <XIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-100 bg-white px-4 pt-4 pb-6 shadow-xl animate-in fade-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#03BF62]/10 text-[#03BF62] font-semibold"
                      : "text-stone-800 hover:bg-stone-50 hover:text-[#03BF62]"
                  }`} data-customization-active={isActive}
                >
                  <span>{link.name}</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 opacity-60" />
                </Link>
              );
            })}
          </nav>

          {/* Mobile External CTAs */}
          <div className="mt-5 pt-5 border-t border-stone-100 space-y-3">
            {externalSystem.bookingUrl ? (
              <a
                href={externalSystem.bookingUrl}
                onClick={() => {
                  trackEvent({
                    eventType: "BOOKING_CLICK",
                    page: pathname || undefined,
                    metadata: {
                      source: "navbar-mobile-drawer",
                    },
                  });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#03BF62] py-3 text-sm font-medium text-white shadow-sm hover:bg-[#029e51] transition-colors" data-customization-role="primaryButton"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Book Appointment</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#03BF62]/50 py-3 text-sm font-medium text-white/80 cursor-not-allowed"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Book Appointment</span>
              </button>
            )}

            {externalSystem.loginUrl ? (
              <div className="pt-1">
                <a
                  href={externalSystem.loginUrl}
                  className="flex w-full items-center justify-center rounded-xl border border-stone-200 py-2.5 text-xs font-medium text-stone-700 hover:border-[#03BF62] hover:text-[#03BF62] transition-colors"
                >
                  Login
                </a>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
