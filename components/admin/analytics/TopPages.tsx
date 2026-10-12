"use client";

import React from "react";

export interface TopPageItem {
  page: string;
  views: number;
  percentage: number;
}

interface TopPagesProps {
  pages: TopPageItem[];
}

export default function TopPages({ pages }: TopPagesProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs h-full">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              Most Viewed Pages
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Top visitor destinations based on real page views
            </p>
          </div>
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-[#7C3AED] border border-purple-100">
            Top 5
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {!pages || pages.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-stone-400 font-medium">No page view data yet.</p>
              <p className="text-[11px] text-stone-400 mt-1">
                Public website visits will appear here as customers browse.
              </p>
            </div>
          ) : (
            pages.map((item, index) => (
              <div key={item.page} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stone-100 text-[10px] font-bold text-stone-600">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-stone-800 truncate font-mono text-[11px]">
                      {item.page === "/" ? "/ (Home)" : item.page}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-stone-900">
                      {item.views.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-[#7C3AED] transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, 3)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
