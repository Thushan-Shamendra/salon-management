"use client";

import React, { useId } from "react";

export interface ScissorsLoaderProps {
  /**
   * Diameter of the circular loading ring in pixels.
   * Default is 72px.
   */
  size?: number;
  /**
   * Optional label text displayed beneath the loading ring.
   * Default is undefined (or "Loading..." in fullScreen mode).
   */
  label?: string;
  /**
   * If true, renders a fixed full-screen overlay with backdrop blur.
   * Default is false.
   */
  fullScreen?: boolean;
  /**
   * Visual theme for fullScreen background and text.
   * "auto" (default) | "dark" | "light"
   */
  theme?: "auto" | "dark" | "light";
  /**
   * Optional custom CSS class name applied to the outer container.
   */
  className?: string;
}

/**
 * SALVORA Custom Scissors Loading Animation.
 *
 * Lightweight SVG + CSS animation featuring a scissors icon orbiting
 * continuously around a circular loading ring while performing a subtle
 * cutting/snipping motion.
 */
export default function ScissorsLoader({
  size = 72,
  label,
  fullScreen = false,
  theme = "auto",
  className = "",
}: ScissorsLoaderProps) {
  const uniqueId = useId().replace(/[:]/g, "-");
  const ringGradId = `salvora-ring-grad-${uniqueId}`;
  const scissorsGradId = `salvora-scissors-grad-${uniqueId}`;
  const centerGlowId = `salvora-center-glow-${uniqueId}`;

  const displayLabel = label || (fullScreen ? "Loading..." : undefined);
  const showCenterMark = size >= 40;

  // The core SVG Scissors Loading Widget
  const loaderGraphic = (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="overflow-visible block"
      >
        <defs>
          {/* Active Ring Gradient: Purple -> SALVORA Emerald -> Teal */}
          <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#03BF62" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>

          {/* Scissors Gradient: SALVORA Teal / Turquoise */}
          <linearGradient id={scissorsGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#03BF62" />
          </linearGradient>

          {/* Subtle Ambient Center Glow */}
          <radialGradient id={centerGlowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#03BF62" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#03BF62" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Background Ring: Light Neutral */}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-stone-300 dark:text-stone-700 opacity-25"
        />

        {/* 2. Active Ring: Purple & Teal gradient with stroke-dash loading sweep */}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke={`url(#${ringGradId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="140 74"
          className="salvora-ring-sweep"
        />

        {/* 3. Center Minimal SALVORA 'S' Icon (displayed when size >= 40) */}
        {showCenterMark && (
          <g className="select-none pointer-events-none">
            <circle cx="50" cy="50" r="18" fill={`url(#${centerGlowId})`} />
            <text
              x="50"
              y="51.5"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold fill-current text-stone-800 dark:text-stone-100"
              style={{
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                fontSize: "17px",
                letterSpacing: "0.06em",
              }}
            >
              S
            </text>
          </g>
        )}

        {/* 4. Orbiting Scissors (travels continuously clockwise around the ring) */}
        <g className="salvora-scissors-orbit">
          {/* Position scissors with hinge centered at (50, 16) */}
          <g transform="translate(38, 4)">
            {/* Upper Blade & Handle */}
            <g
              className="salvora-blade-top"
              stroke={`url(#${scissorsGradId})`}
              fill="none"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="18" r="3" />
              <path d="M8.12 15.88 20 4" />
            </g>

            {/* Lower Blade & Handle */}
            <g
              className="salvora-blade-bottom"
              stroke={`url(#${scissorsGradId})`}
              fill="none"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="6" r="3" />
              <path d="M8.12 8.12 12 12" />
              <path d="M14.8 14.8 20 20" />
            </g>

            {/* Scissors Center Hinge Screw */}
            <circle
              cx="12"
              cy="12"
              r="1.4"
              fill="#03BF62"
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
          </g>
        </g>
      </svg>

      {/* Scoped CSS animations for orbit, blade snipping, and ring sweep */}
      <style>{`
        @keyframes salvora-scissors-orbit-cw {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes salvora-blade-snip-top {
          0%, 100% {
            transform: rotate(0deg);
          }
          30% {
            transform: rotate(-6deg);
          }
          50% {
            transform: rotate(12deg);
          }
          70% {
            transform: rotate(-3deg);
          }
        }

        @keyframes salvora-blade-snip-bottom {
          0%, 100% {
            transform: rotate(0deg);
          }
          30% {
            transform: rotate(6deg);
          }
          50% {
            transform: rotate(-12deg);
          }
          70% {
            transform: rotate(3deg);
          }
        }

        @keyframes salvora-ring-sweep-dash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -214;
          }
        }

        .salvora-scissors-orbit {
          transform-origin: 50px 50px;
          animation: salvora-scissors-orbit-cw 2s linear infinite;
        }

        .salvora-blade-top {
          transform-origin: 12px 12px;
          animation: salvora-blade-snip-top 0.67s ease-in-out infinite;
        }

        .salvora-blade-bottom {
          transform-origin: 12px 12px;
          animation: salvora-blade-snip-bottom 0.67s ease-in-out infinite;
        }

        .salvora-ring-sweep {
          transform-origin: 50px 50px;
          animation: salvora-ring-sweep-dash 2s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .salvora-scissors-orbit,
          .salvora-blade-top,
          .salvora-blade-bottom,
          .salvora-ring-sweep {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );

  // Full Screen Mode
  if (fullScreen) {
    const themeBg =
      theme === "light"
        ? "bg-white/95 text-stone-900"
        : theme === "dark"
        ? "bg-[#0A0A0A]/95 text-stone-100"
        : "bg-white/95 dark:bg-[#0A0A0A]/95 text-stone-900 dark:text-stone-100";

    return (
      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 ${themeBg} backdrop-blur-md transition-colors ${className}`}
      >
        {/* Soft Ambient Backdrop Glow */}
        <div className="absolute h-64 w-64 rounded-full bg-[#03BF62]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {loaderGraphic}

          {displayLabel && (
            <div className="mt-6 flex flex-col items-center text-center space-y-1.5">
              <p className="text-sm font-semibold tracking-wider text-stone-800 dark:text-stone-200">
                {displayLabel}
              </p>
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#03BF62]">
                SALVORA
              </p>
            </div>
          )}
        </div>

        <span className="sr-only">{displayLabel || "Loading..."}</span>
      </div>
    );
  }

  // Inline / Component Mode
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex flex-col items-center justify-center ${className}`}
    >
      {loaderGraphic}

      {displayLabel && size >= 40 && (
        <p className="mt-2.5 text-xs font-medium tracking-wide text-stone-600 dark:text-stone-300 text-center">
          {displayLabel}
        </p>
      )}

      <span className="sr-only">{displayLabel || "Loading..."}</span>
    </div>
  );
}
