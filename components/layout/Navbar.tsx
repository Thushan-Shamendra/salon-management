"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import InvoraLogo from "@/components/ui/InvoraLogo";
import {
  MenuIcon,
  XIcon,
  CalendarIcon,
  ArrowRightIcon,
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
  const [externalSystem, setExternalSystem] = useState<ExternalSystemLinks>({
    loginUrl: "",
    registerUrl: "",
    bookingUrl: "",
  });

  // Fetch external system links from Website Settings
  useEffect(() => {
    let isMounted = true;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.settings?.externalSystem) {
          setExternalSystem({
            loginUrl: data.settings.externalSystem.loginUrl || "",
            registerUrl: data.settings.externalSystem.registerUrl || "",
            bookingUrl: data.settings.externalSystem.bookingUrl || "",
          });
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
          ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-stone-200/70"
          : "bg-white border-b border-stone-100"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
        {/* INVORA Brand Logo */}
        <Link
          href="/"
          className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded-lg transition-transform hover:opacity-90"
          aria-label="Invora Home"
        >
          <InvoraLogo theme="light" className="h-10 sm:h-11 w-auto" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#7C3AED] relative py-1 ${
                  isActive
                    ? "text-[#7C3AED] font-semibold"
                    : "text-stone-700"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop External Actions (Login, Register, Book Appointment) */}
        <div className="hidden lg:flex items-center gap-5">
          {externalSystem.loginUrl && (
            <a
              href={externalSystem.loginUrl}
              className="text-sm font-medium text-stone-700 hover:text-[#7C3AED] transition-colors px-2 py-1.5"
            >
              Login
            </a>
          )}

          {externalSystem.registerUrl && (
            <a
              href={externalSystem.registerUrl}
              className="text-sm font-medium text-stone-700 hover:text-[#7C3AED] transition-colors px-2 py-1.5"
            >
              Register
            </a>
          )}

          {externalSystem.bookingUrl ? (
            <a
              href={externalSystem.bookingUrl}
              className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#6D28D9] hover:shadow-md hover:shadow-purple-500/20 active:scale-[0.98]"
            >
              <span>Book Appointment</span>
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Online booking link not yet configured"
              className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED]/50 px-6 py-2.5 text-sm font-medium text-white/80 cursor-not-allowed shadow-none"
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
              className="rounded-full bg-[#7C3AED] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#6D28D9]"
            >
              Book
            </a>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
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
                      ? "bg-purple-50 text-[#7C3AED] font-semibold"
                      : "text-stone-800 hover:bg-stone-50 hover:text-[#7C3AED]"
                  }`}
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
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] py-3 text-sm font-medium text-white shadow-sm hover:bg-[#6D28D9] transition-colors"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Book Appointment</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED]/50 py-3 text-sm font-medium text-white/80 cursor-not-allowed"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Book Appointment</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              {externalSystem.loginUrl ? (
                <a
                  href={externalSystem.loginUrl}
                  className="flex items-center justify-center rounded-xl border border-stone-200 py-2.5 text-xs font-medium text-stone-700 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
                >
                  Login
                </a>
              ) : null}

              {externalSystem.registerUrl ? (
                <a
                  href={externalSystem.registerUrl}
                  className="flex items-center justify-center rounded-xl border border-stone-200 py-2.5 text-xs font-medium text-stone-700 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
                >
                  Register
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
