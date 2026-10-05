"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const [salonLogo, setSalonLogo] = useState<string>("");
  const [salonName, setSalonName] = useState<string>("LUMINA");

  // Load public salon settings (logo & brand name)
  useEffect(() => {
    let isMounted = true;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.settings) {
          if (data.settings.logo) setSalonLogo(data.settings.logo);
          if (data.settings.salonName) setSalonName(data.settings.salonName);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setMobileMenuOpen(false);
      router.push("/");
      router.refresh();
    }
  };

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
          {user ? (
            <>
              {/* Authenticated State */}
              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-full border border-stone-300/80 bg-white px-4 py-2 text-xs lg:text-sm font-medium text-stone-800 transition-all hover:border-[#B7925A] hover:text-[#B7925A] hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] shadow-xs"
                >
                  <UserIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>Admin Portal</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/account"
                    className="flex items-center gap-1.5 rounded-full border border-stone-300/80 bg-white px-4 py-2 text-xs lg:text-sm font-medium text-stone-800 transition-all hover:border-[#B7925A] hover:text-[#B7925A] hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] shadow-xs"
                  >
                    <UserIcon className="h-4 w-4 text-[#B7925A]" />
                    <span>Account</span>
                  </Link>

                  <Link
                    href="/appointments"
                    className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-xs lg:text-sm font-medium text-[#FAF7F2] transition-all hover:bg-stone-800 hover:shadow-md hover:shadow-stone-900/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] border border-[#B7925A]/30"
                  >
                    <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
                    <span>Book Appointment</span>
                  </Link>
                </>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none"
              >
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* Logged Out State */}
              <Link
                href="/login"
                className="rounded-full px-3.5 py-2 text-xs lg:text-sm font-medium text-stone-700 hover:text-stone-950 transition-colors"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full border border-stone-300 bg-white px-3.5 py-2 text-xs lg:text-sm font-medium text-stone-800 hover:border-[#B7925A] hover:text-[#B7925A] transition-all shadow-xs"
              >
                Register
              </Link>

              {/* Book Appointment: unauthenticated clicks send to login preserving destination */}
              <Link
                href="/login?redirect=/appointments"
                className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-xs lg:text-sm font-medium text-[#FAF7F2] transition-all hover:bg-stone-800 hover:shadow-md hover:shadow-stone-900/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7925A] border border-[#B7925A]/30"
              >
                <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
                <span>Book Appointment</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href={user ? "/appointments" : "/login?redirect=/appointments"}
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

          <div className="mt-6 pt-5 border-t border-stone-200/80 space-y-2.5">
            {user ? (
              <>
                {user.role === "admin" ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
                  >
                    <UserIcon className="h-4 w-4 text-[#B7925A]" />
                    <span>Admin Portal</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
                    >
                      <UserIcon className="h-4 w-4 text-[#B7925A]" />
                      <span>Account</span>
                    </Link>

                    <Link
                      href="/appointments"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-[#FAF7F2] shadow-sm hover:bg-stone-800 border border-[#B7925A]/30"
                    >
                      <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
                      <span>Book Appointment</span>
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
                  >
                    Register
                  </Link>
                </div>

                <Link
                  href="/login?redirect=/appointments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-[#FAF7F2] shadow-sm hover:bg-stone-800 border border-[#B7925A]/30"
                >
                  <CalendarIcon className="h-4 w-4 text-[#C5A46D]" />
                  <span>Book Appointment</span>
                </Link>
              </>
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
