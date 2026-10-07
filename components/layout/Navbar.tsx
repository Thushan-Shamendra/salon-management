"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ScissorsIcon,
  CalendarIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

interface ExternalSystemLinks {
  loginUrl: string;
  registerUrl: string;
  bookingUrl: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [salonLogo, setSalonLogo] = useState<string>("");
  const [salonName, setSalonName] = useState<string>("LUMINA");
  const [externalSystem, setExternalSystem] = useState<ExternalSystemLinks>({
    loginUrl: "",
    registerUrl: "",
    bookingUrl: "",
  });

  // Load public salon settings (logo, brand name, external links)
  useEffect(() => {
    let isMounted = true;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.settings) {
          if (data.settings.logo) setSalonLogo(data.settings.logo);
          if (data.settings.salonName) setSalonName(data.settings.salonName);
          if (data.settings.externalSystem) {
            setExternalSystem({
              loginUrl: data.settings.externalSystem.loginUrl || "",
              registerUrl: data.settings.externalSystem.registerUrl || "",
              bookingUrl: data.settings.externalSystem.bookingUrl || "",
            });
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle scroll effect for navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Gallery", href: "/gallery" },
    { name: "Reviews", href: "/reviews" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#FAF7F2]/95 backdrop-blur-md shadow-sm shadow-stone-200/60 border-b border-[#B7925A]/20"
          : "bg-[#FAF7F2] border-b border-[#B7925A]/15"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        {/* Salon Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] rounded-lg"
        >
          {salonLogo ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white shadow-sm border border-[#B7925A]/40 p-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={salonLogo}
                alt={salonName || "Salon Logo"}
                onError={() => setSalonLogo("")}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-[#C5A46D] shadow-sm transition-transform duration-300 group-hover:scale-105 border border-[#B7925A]/40">
              <ScissorsIcon className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-stone-900 group-hover:text-[#B7925A] transition-colors">
              {salonName.replace(/\s*luxury\s*salon/i, "").trim() || salonName}
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 font-medium -mt-1">
              Luxury Salon
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center space-x-1 lg:space-x-2"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] ${
                  isActive
                    ? "text-[#B7925A] font-semibold"
                    : "text-stone-700 hover:text-stone-950 hover:bg-[#B7925A]/5"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#B7925A] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* External Customer Login */}
          {externalSystem.loginUrl ? (
            <a
              href={externalSystem.loginUrl}
              className="rounded-full px-3.5 py-2 text-xs lg:text-sm font-medium text-stone-700 hover:text-stone-950 transition-colors"
            >
              Login
            </a>
          ) : null}

          {/* External Customer Register */}
          {externalSystem.registerUrl ? (
            <a
              href={externalSystem.registerUrl}
              className="rounded-full border border-stone-300 bg-white px-3.5 py-2 text-xs lg:text-sm font-medium text-stone-800 hover:border-[#B7925A] hover:text-[#B7925A] transition-all shadow-xs"
            >
              Register
            </a>
          ) : null}

          {/* External Book Appointment */}
          {externalSystem.bookingUrl ? (
            <a
              href={externalSystem.bookingUrl}
              className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-xs lg:text-sm font-medium text-[#FAF7F2] transition-all hover:bg-stone-800 hover:shadow-md hover:shadow-stone-900/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] border border-[#B7925A]/30"
            >
              <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
              <span>Book Appointment</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Online booking link not yet configured"
              className="flex items-center gap-2 rounded-full bg-stone-900/60 px-4 py-2 text-xs lg:text-sm font-medium text-[#FAF7F2]/60 cursor-not-allowed border border-[#B7925A]/20"
            >
              <CalendarIcon className="h-4 w-4 text-[#C5A46D]/50" />
              <span>Book Appointment</span>
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {externalSystem.bookingUrl ? (
            <a
              href={externalSystem.bookingUrl}
              className="sm:hidden flex items-center justify-center rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-[#FAF7F2] border border-[#B7925A]/30"
            >
              <span>Book</span>
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-800 hover:text-stone-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A]"
          >
            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200/80 bg-[#FAF7F2] px-4 pt-4 pb-6 shadow-xl transition-all animate-fadeIn">
          <nav aria-label="Mobile navigation" className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-[#B7925A]/10 text-[#B7925A] font-semibold"
                      : "text-stone-800 hover:bg-stone-100/80"
                  }`}
                >
                  <span>{link.name}</span>
                  <ChevronRightIcon className="h-4 w-4 opacity-50" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-5 border-t border-stone-200/80 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              {externalSystem.loginUrl ? (
                <a
                  href={externalSystem.loginUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
                >
                  Login
                </a>
              ) : null}

              {externalSystem.registerUrl ? (
                <a
                  href={externalSystem.registerUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
                >
                  Register
                </a>
              ) : null}
            </div>

            {externalSystem.bookingUrl ? (
              <a
                href={externalSystem.bookingUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-[#FAF7F2] shadow-sm hover:bg-stone-800 border border-[#B7925A]/30"
              >
                <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
                <span>Book Appointment</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Online booking link not yet configured"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900/60 py-3 text-sm font-semibold text-[#FAF7F2]/60 cursor-not-allowed border border-[#B7925A]/20"
              >
                <CalendarIcon className="h-4 w-4 text-[#C5A46D]/50" />
                <span>Book Appointment</span>
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-stone-500">
              Opening Hours: Mon–Sat 9AM–7PM | Sun 10AM–5PM
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
