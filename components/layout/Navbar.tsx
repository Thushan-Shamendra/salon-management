"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ScissorsIcon,
  CalendarIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check auth session
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.user && isMounted) {
            setUser(data.user);
          }
        }
      } catch {
        // Silently treat as logged out
      }
    }
    checkAuth();
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
    { name: "Community", href: "/community" },
    { name: "Reviews", href: "/reviews" },
    { name: "Contact", href: "/contact" },
  ];

  const accountHref = user
    ? user.role === "admin"
      ? "/admin"
      : "/account"
    : "/login";

  const accountLabel = user
    ? user.role === "admin"
      ? "Admin Panel"
      : "My Account"
    : "Login";

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
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-[#C5A46D] shadow-sm transition-transform duration-300 group-hover:scale-105 border border-[#B7925A]/40">
            <ScissorsIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-stone-900 group-hover:text-[#B7925A] transition-colors">
              LUMINA
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
        <div className="hidden sm:flex items-center gap-3">
          {/* Login / Account button */}
          <Link
            href={accountHref}
            className="flex items-center gap-1.5 rounded-full border border-stone-300/80 bg-white px-4 py-2 text-xs lg:text-sm font-medium text-stone-800 transition-all hover:border-[#B7925A] hover:text-[#B7925A] hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] shadow-xs"
          >
            <UserIcon className="h-4 w-4 text-[#B7925A]" />
            <span>{accountLabel}</span>
          </Link>

          {/* Book Appointment button */}
          <Link
            href="/appointments"
            className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-xs lg:text-sm font-medium text-[#FAF7F2] transition-all hover:bg-stone-800 hover:shadow-md hover:shadow-stone-900/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] border border-[#B7925A]/30"
          >
            <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
            <span>Book Appointment</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/appointments"
            className="sm:hidden flex items-center justify-center rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-[#FAF7F2] border border-[#B7925A]/30"
          >
            <span>Book</span>
          </Link>
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

          <div className="mt-6 pt-5 border-t border-stone-200/80 space-y-3">
            <Link
              href={accountHref}
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              <UserIcon className="h-4 w-4 text-[#B7925A]" />
              <span>{accountLabel}</span>
            </Link>

            <Link
              href="/appointments"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-[#FAF7F2] shadow-sm hover:bg-stone-800 border border-[#B7925A]/30"
            >
              <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
              <span>Book Appointment</span>
            </Link>
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
