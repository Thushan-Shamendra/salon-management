"use client";

import React, { useState } from "react";

export interface ChartBucket {
  date: string;
  label: string;
  pageViews: number;
  customerActions: number;
}

interface ActivityChartProps {
  buckets: ChartBucket[];
  rangeTitle?: string;
}

export default function ActivityChart({ buckets, rangeTitle = "Website Activity" }: ActivityChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!buckets || buckets.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs text-center text-stone-500 text-sm">
        No chart activity data available.
      </div>
    );
  }

  // Calculate maximum value for Y-axis scaling
  const maxVal = Math.max(
    ...buckets.map((b) => Math.max(b.pageViews, b.customerActions)),
    5 // minimum ceiling so zero-data looks neat
  );

  const totalPageViews = buckets.reduce((acc, b) => acc + b.pageViews, 0);
  const totalActions = buckets.reduce((acc, b) => acc + b.customerActions, 0);

  // SVG dimensions
  const height = 220;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;
  const plotWidth = 700 - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (buckets.length <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (buckets.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return paddingTop + plotHeight - (val / maxVal) * plotHeight;
  };

  // Build SVG polyline paths
  const viewsPoints = buckets.map((b, i) => `${getX(i)},${getY(b.pageViews)}`).join(" ");
  const actionsPoints = buckets.map((b, i) => `${getX(i)},${getY(b.customerActions)}`).join(" ");

  // Closed area paths for soft gradients
  const viewsArea = `${getX(0)},${paddingTop + plotHeight} ${viewsPoints} ${getX(
    buckets.length - 1
  )},${paddingTop + plotHeight}`;

  const actionsArea = `${getX(0)},${paddingTop + plotHeight} ${actionsPoints} ${getX(
    buckets.length - 1
  )},${paddingTop + plotHeight}`;

  const hoveredBucket = hoveredIdx !== null ? buckets[hoveredIdx] : null;

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header with Title and Series Legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-stone-900 tracking-tight">{rangeTitle}</h3>
            {totalPageViews === 0 && totalActions === 0 && (
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-500">
                Zero data in period
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Daily engagement trends for page views and customer conversions
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#7C3AED]" />
            <span className="text-stone-700">Page Views</span>
            <span className="text-stone-400 font-normal">({totalPageViews})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-stone-700">Customer Actions</span>
            <span className="text-stone-400 font-normal">({totalActions})</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Frame */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 700 ${height}`}
          className="w-full h-48 sm:h-56 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="actionsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + plotHeight * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={700 - paddingRight}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#9CA3AF"
                  fontFamily="inherit"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <polygon points={viewsArea} fill="url(#viewsGrad)" />
          <polygon points={actionsArea} fill="url(#actionsGrad)" />

          {/* Trend Lines */}
          <polyline
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={viewsPoints}
          />

          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={actionsPoints}
          />

          {/* Interactive vertical hover indicator */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={paddingTop}
              x2={getX(hoveredIdx)}
              y2={paddingTop + plotHeight}
              stroke="#6B7280"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Hit test columns */}
          {buckets.map((b, i) => {
            const colWidth = plotWidth / buckets.length;
            const x = getX(i) - colWidth / 2;
            return (
              <rect
                key={b.date}
                x={Math.max(paddingLeft, x)}
                y={paddingTop}
                width={colWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* X-axis Labels (Sampled to avoid clutter on mobile) */}
        <div className="flex justify-between pl-9 pr-3 mt-2 text-[10px] text-stone-400 font-medium">
          {buckets.length <= 10 ? (
            buckets.map((b) => <span key={b.date}>{b.label}</span>)
          ) : (
            <>
              <span>{buckets[0]?.label}</span>
              <span>{buckets[Math.floor(buckets.length / 2)]?.label}</span>
              <span>{buckets[buckets.length - 1]?.label}</span>
            </>
          )}
        </div>
      </div>

      {/* Floating Hover Details Bar */}
      {hoveredBucket && (
        <div className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-white text-xs flex items-center justify-between shadow-md transition-all">
          <div className="font-semibold text-purple-300">
            {hoveredBucket.label} ({hoveredBucket.date})
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-stone-400">Page Views:</span>{" "}
              <span className="font-bold text-white">{hoveredBucket.pageViews}</span>
            </div>
            <div>
              <span className="text-stone-400">Actions:</span>{" "}
              <span className="font-bold text-emerald-400">{hoveredBucket.customerActions}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
