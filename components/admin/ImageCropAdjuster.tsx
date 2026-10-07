"use client";

import React, { useState, useRef, useCallback } from "react";
import { StarIcon, EyeIcon } from "@/components/ui/icons";

export interface CropPosition {
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  zoom: number; // 1 to 3
}

interface ImageCropAdjusterProps {
  imageUrl: string;
  cropPosition: CropPosition;
  onChange: (newCrop: CropPosition) => void;
  isFeatured: boolean;
  category?: string;
  title?: string;
  onPreviewFull?: () => void;
}

export default function ImageCropAdjuster({
  imageUrl,
  cropPosition,
  onChange,
  isFeatured,
  category = "Hair Styling",
  title = "Photo Title",
  onPreviewFull,
}: ImageCropAdjusterProps) {
  // Preview Aspect Ratio tab: '4:3' (Standard card) or '4:5' (Featured large card)
  const [aspectRatio, setAspectRatio] = useState<"4:3" | "4:5">(
    isFeatured ? "4:5" : "4:3"
  );
  // View mode: 'guides' (framing grid & focal target) or 'card' (simulated public card)
  const [viewMode, setViewMode] = useState<"guides" | "card">("guides");

  // Drag interaction state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    rectWidth: number;
    rectHeight: number;
  }>({
    clientX: 0,
    clientY: 0,
    startX: 50,
    startY: 50,
    rectWidth: 1,
    rectHeight: 1,
  });

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: cropPosition.x,
      startY: cropPosition.y,
      rectWidth: rect.width || 1,
      rectHeight: rect.height || 1,
    };

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Pointer Move (Mouse drag or Finger drag)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const { clientX, clientY, startX, startY, rectWidth, rectHeight } =
      dragStartRef.current;
    const deltaX = e.clientX - clientX;
    const deltaY = e.clientY - clientY;

    // Moving mouse to the left should move image left (focal point increases)
    // Moving mouse to the right reveals left side (focal point decreases)
    // Scale delta relative to current zoom for natural finger tracking
    const zoomFactor = Math.max(1, cropPosition.zoom);
    const percentX = (deltaX / rectWidth) * 100 * (1 / zoomFactor);
    const percentY = (deltaY / rectHeight) * 100 * (1 / zoomFactor);

    const newX = clamp(Math.round(startX - percentX), 0, 100);
    const newY = clamp(Math.round(startY - percentY), 0, 100);

    onChange({
      ...cropPosition,
      x: newX,
      y: newY,
    });
  };

  // Pointer Up or Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Nudge focal position
  const nudge = useCallback(
    (dx: number, dy: number) => {
      onChange({
        ...cropPosition,
        x: clamp(cropPosition.x + dx, 0, 100),
        y: clamp(cropPosition.y + dy, 0, 100),
      });
    },
    [cropPosition, onChange]
  );

  // Reset crop to standard center
  const handleReset = () => {
    onChange({
      x: 50,
      y: 50,
      zoom: 1,
    });
  };

  return (
    <div className="rounded-2xl border border-purple-200/80 bg-purple-50/30 p-4 sm:p-5 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-purple-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#7C3AED]" />
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight">
              Adjust Thumbnail Framing & Crop
            </h3>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Drag image or use sliders below. Original Cloudinary photo is preserved untouched.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {onPreviewFull && (
            <button
              type="button"
              onClick={onPreviewFull}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition cursor-pointer"
              title="View full original uncropped image"
            >
              <EyeIcon className="h-3.5 w-3.5 text-stone-500" />
              <span>Full Photo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-purple-700 shadow-2xs hover:bg-purple-100/60 transition cursor-pointer"
            title="Reset crop to center with 1x zoom"
          >
            <span>Reset Crop</span>
          </button>
        </div>
      </div>

      {/* Aspect Ratio & View Mode Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Aspect Ratio Tabs */}
        <div className="inline-flex rounded-xl bg-stone-200/70 p-1 text-xs">
          <button
            type="button"
            onClick={() => setAspectRatio("4:3")}
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              aspectRatio === "4:3"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            4:3 Standard
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio("4:5")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              aspectRatio === "4:5"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <span>4:5 Portrait</span>
            {isFeatured && (
              <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-[#7C3AED]">
                <StarIcon className="h-2.5 w-2.5 fill-current" />
                Featured
              </span>
            )}
          </button>
        </div>

        {/* View Mode Toggle: Guides vs Card Simulation */}
        <div className="inline-flex rounded-xl bg-stone-200/70 p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("guides")}
            className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
              viewMode === "guides"
                ? "bg-white text-stone-900 shadow-xs font-semibold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Framing Guides
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
              viewMode === "card"
                ? "bg-white text-stone-900 shadow-xs font-semibold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Card Preview
          </button>
        </div>
      </div>

      {/* Interactive Crop Preview Canvas */}
      <div className="relative mx-auto w-full max-w-md">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full overflow-hidden rounded-2xl bg-stone-950 shadow-inner select-none touch-none border-2 border-stone-200/90 transition-all ${
            aspectRatio === "4:3" ? "aspect-[4/3]" : "aspect-[4/5]"
          } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          title="Click and drag image to reposition focal center"
        >
          {/* Cropped & Scaled Image Container */}
          <div
            className="w-full h-full relative"
            style={{
              transform: `scale(${cropPosition.zoom})`,
              transformOrigin: `${cropPosition.x}% ${cropPosition.y}%`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Crop positioning preview"
              className="w-full h-full object-cover pointer-events-none select-none"
              style={{
                objectPosition: `${cropPosition.x}% ${cropPosition.y}%`,
              }}
              draggable={false}
            />
          </div>

          {/* MODE A: Framing Guides & Focal Target Marker */}
          {viewMode === "guides" && (
            <>
              {/* Subtle 3x3 Composition Grid (Rule of Thirds) */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-white/15" />
                <div className="border-r border-white/15" />
                <div />
              </div>

              {/* Dynamic Focal Center Marker */}
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity"
                style={{
                  left: `${cropPosition.x}%`,
                  top: `${cropPosition.y}%`,
                }}
              >
                <div className="relative flex items-center justify-center h-8 w-8">
                  {/* Outer Pulsing Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-[#7C3AED] bg-purple-500/20 shadow-md animate-pulse" />
                  {/* Center Dot */}
                  <div className="h-2 w-2 rounded-full bg-white border border-[#7C3AED]" />
                  {/* Crosshairs */}
                  <div className="absolute h-full w-0.5 bg-white/70" />
                  <div className="absolute w-full h-0.5 bg-white/70" />
                </div>
              </div>

              {/* Top Readout Badge */}
              <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none rounded-full bg-black/70 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-medium text-stone-200 border border-white/15">
                X: {cropPosition.x}% • Y: {cropPosition.y}% • Zoom: {cropPosition.zoom.toFixed(2)}x
              </div>

              {/* Drag Hint on Bottom */}
              <div className="absolute bottom-2.5 inset-x-2.5 z-10 pointer-events-none flex justify-center">
                <span className="rounded-full bg-black/65 backdrop-blur-xs px-3 py-1 text-[10px] font-medium text-stone-200 shadow-sm border border-white/10">
                  {isDragging ? "Panning..." : "Drag image to pan • Adjust zoom below"}
                </span>
              </div>
            </>
          )}

          {/* MODE B: Simulated Final Public Website Card */}
          {viewMode === "card" && (
            <>
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Card Meta Content */}
              <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C4B5FD]">
                  {category || "Category"}
                </span>
                <p className="text-xs sm:text-sm font-bold tracking-tight truncate mt-0.5">
                  {title || "Photo Title"}
                </p>
              </div>

              <div className="absolute top-2.5 right-2.5 pointer-events-none">
                <span className="rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] text-stone-300">
                  Website Card Preview
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls: Zoom, Sliders & Directional Nudge D-Pad */}
      <div className="space-y-3 pt-1">
        {/* 1. Zoom Slider & Quick Presets */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1">
            <label htmlFor="zoom-slider">Zoom Level</label>
            <span className="font-mono text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md text-[11px]">
              {cropPosition.zoom.toFixed(2)}x
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-stone-400">1.0x</span>
            <input
              id="zoom-slider"
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={cropPosition.zoom}
              onChange={(e) =>
                onChange({
                  ...cropPosition,
                  zoom: parseFloat(e.target.value) || 1,
                })
              }
              className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
            />
            <span className="text-[11px] font-medium text-stone-400">3.0x</span>
          </div>

          {/* Quick Zoom Buttons */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[10px] text-stone-400 mr-1">Presets:</span>
            {[1.0, 1.25, 1.5, 2.0].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange({ ...cropPosition, zoom: preset })}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                  Math.abs(cropPosition.zoom - preset) < 0.03
                    ? "bg-[#7C3AED] text-white"
                    : "bg-white text-stone-600 border border-stone-200 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                {preset.toFixed(2)}x
              </button>
            ))}
          </div>
        </div>

        {/* 2. Position Sliders (Horizontal X & Vertical Y) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Horizontal Position X */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700 mb-1">
              <span>Horizontal (Left ↔ Right)</span>
              <span className="font-mono text-stone-500">{cropPosition.x}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={cropPosition.x}
              onChange={(e) =>
                onChange({
                  ...cropPosition,
                  x: parseInt(e.target.value, 10) || 50,
                })
              }
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
            />
          </div>

          {/* Vertical Position Y */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700 mb-1">
              <span>Vertical (Top ↕ Bottom)</span>
              <span className="font-mono text-stone-500">{cropPosition.y}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={cropPosition.y}
              onChange={(e) =>
                onChange({
                  ...cropPosition,
                  y: parseInt(e.target.value, 10) || 50,
                })
              }
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
            />
          </div>
        </div>

        {/* 3. Micro-Adjustment Directional D-Pad */}
        <div className="flex items-center justify-between pt-1 border-t border-purple-100">
          <span className="text-[11px] text-stone-500">Fine nudge:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => nudge(-5, 0)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition text-xs font-bold cursor-pointer"
              title="Nudge Left 5%"
            >
              ◀
            </button>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => nudge(0, -5)}
                className="flex h-6 w-7 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition text-[10px] font-bold cursor-pointer"
                title="Nudge Up 5%"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => nudge(0, 5)}
                className="flex h-6 w-7 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition text-[10px] font-bold cursor-pointer"
                title="Nudge Down 5%"
              >
                ▼
              </button>
            </div>
            <button
              type="button"
              onClick={() => nudge(5, 0)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition text-xs font-bold cursor-pointer"
              title="Nudge Right 5%"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...cropPosition, x: 50, y: 50 })}
              className="ml-1 rounded-lg bg-white border border-stone-200 px-2 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              title="Center focal position"
            >
              Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
