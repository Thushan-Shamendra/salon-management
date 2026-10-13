"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpIcon } from "@/components/ui/icons";

export interface ScrollProgressButtonProps {
  /**
   * Optional custom class name to override default styles or positioning.
   */
  className?: string;
}

/**
 * SALVORA Floating Scroll-Progress & Back-To-Top Button.
 *
 * Displays a minimal, circular button with a thin outer progress ring that
 * progressively fills clockwise with brand green (#03BF62) as the user scrolls.
 * When reaching the bottom of the page (>= 98%), the entire ring glows.
 * Clicking smoothly scrolls the user back to the top of the page.
 */
export default function ScrollProgressButton({ className = "" }: ScrollProgressButtonProps) {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Do not render in admin portal
  const isAdmin = pathname?.startsWith("/admin");

  const handleScroll = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const totalScrollable = documentHeight - windowHeight;

    if (totalScrollable <= 0) {
      setScrollProgress(0);
      setIsVisible(false);
      return;
    }

    const percentage = Math.min(
      100,
      Math.max(0, (scrollY / totalScrollable) * 100)
    );

    setScrollProgress(percentage);
    // Hide until user scrolls at least 100px
    setIsVisible(scrollY >= 100);
  }, []);

  useEffect(() => {
    if (isAdmin) return;

    const frameId = window.requestAnimationFrame(handleScroll);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isAdmin, handleScroll]);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  // SVG ring calculations (viewBox: 0 0 48 48, radius: 21)
  const radius = 21;
  const circumference = 2 * Math.PI * radius; // ~131.95
  const strokeOffset = useMemo(() => {
    return circumference - (scrollProgress / 100) * circumference;
  }, [circumference, scrollProgress]);

  const isCompleted = scrollProgress >= 98;

  if (isAdmin) return null;

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 pointer-events-auto translate-y-0"
          : "opacity-0 pointer-events-none translate-y-3"
      } right-[18px] bottom-[82px] sm:right-[24px] sm:bottom-[92px] ${className}`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        className={`group relative flex items-center justify-center rounded-full bg-[#0A0A0A]/85 backdrop-blur-md transition-all duration-300 cursor-pointer select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#03BF62] focus-visible:ring-offset-2 focus-visible:ring-offset-black hover:scale-105 active:scale-95 w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] ${
          isCompleted
            ? "shadow-[0_0_12px_rgba(3,191,98,0.7),0_0_24px_rgba(3,191,98,0.35)]"
            : "hover:shadow-[0_0_15px_rgba(3,191,98,0.35)] shadow-lg shadow-black/40"
        }`}
      >
        {/* SVG Circular Progress Ring */}
        <svg
          viewBox="0 0 48 48"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          {/* Background Ring: Subtle Neutral Stroke */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-white/10 group-hover:text-white/20 transition-colors"
          />

          {/* Progress Ring: Brand Green (#03BF62), Starts at Top (-90deg), Fills Clockwise */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="#03BF62"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 24 24)"
            className="transition-[stroke-dashoffset] duration-150 ease-out"
            style={
              isCompleted
                ? { filter: "drop-shadow(0 0 5px #03BF62)" }
                : undefined
            }
          />
        </svg>

        {/* Centered Clean UP Arrow */}
        <ArrowUpIcon
          className={`relative z-10 h-4.5 w-4.5 sm:h-5 sm:w-5 transition-all duration-300 ${
            isCompleted
              ? "text-white drop-shadow-[0_0_8px_#03BF62]"
              : "text-[#03BF62] group-hover:brightness-110"
          }`}
        />

        {/* Screen Reader Label */}
        <span className="sr-only">Back to top</span>
      </button>
    </div>
  );
}
