"use client";

import React from "react";
import { StoreIcon, WhatsAppIcon, PhoneIcon, StarIcon, CompassIcon } from "@/components/ui/icons";

export interface BranchPerformanceItem {
  branchId: string;
  name: string;
  slug?: string;
  interactions: number;
  whatsapp: number;
  calls: number;
  reviews: number;
  maps: number;
}

interface BranchPerformanceProps {
  branches: BranchPerformanceItem[];
}

export default function BranchPerformance({ branches }: BranchPerformanceProps) {
  const hasAnyData = branches.some((b) => b.interactions > 0);
  const maxInteractions = Math.max(...branches.map((b) => b.interactions), 0);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs h-full">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              Branch Performance
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Customer inquiries, calls, reviews, and interactions per location
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
            {branches.length} Active {branches.length === 1 ? "Branch" : "Branches"}
          </span>
        </div>

        <div className="mt-5 space-y-3.5">
          {!branches || branches.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No active branches found. Add branches in Branch Management.
            </div>
          ) : !hasAnyData ? (
            <div className="py-8 text-center">
              <p className="text-xs text-stone-400 font-medium">
                No branch engagement data has been recorded yet.
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Events with branch context (WhatsApp, calls, reviews, directions) will rank here.
              </p>
            </div>
          ) : (
            branches.map((branch) => {
              const isTopPerformer =
                maxInteractions > 0 && branch.interactions === maxInteractions;

              return (
                <div
                  key={branch.branchId}
                  className={`rounded-xl border p-3.5 transition-all ${
                    isTopPerformer
                      ? "border-purple-200 bg-purple-50/30 shadow-2xs"
                      : "border-stone-100 bg-stone-50/50 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StoreIcon
                        className={`h-4 w-4 ${
                          isTopPerformer ? "text-[#7C3AED]" : "text-stone-400"
                        }`}
                      />
                      <span className="text-xs font-bold text-stone-900">
                        {branch.name}
                      </span>
                      {isTopPerformer && (
                        <span className="rounded-full bg-[#7C3AED] px-2 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                          Top
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-extrabold text-stone-900">
                      {branch.interactions.toLocaleString()}{" "}
                      <span className="text-[10px] font-medium text-stone-400">
                        interactions
                      </span>
                    </span>
                  </div>

                  {/* Detailed actions breakdown row */}
                  <div className="mt-2.5 pt-2 border-t border-stone-200/60 grid grid-cols-4 gap-2 text-[11px]">
                    <div className="flex items-center gap-1 text-stone-600">
                      <WhatsAppIcon className="h-3 w-3 text-emerald-600 fill-current" />
                      <span className="font-semibold">{branch.whatsapp}</span>
                      <span className="text-stone-400 text-[10px] hidden sm:inline">WA</span>
                    </div>

                    <div className="flex items-center gap-1 text-stone-600">
                      <PhoneIcon className="h-3 w-3 text-purple-600" />
                      <span className="font-semibold">{branch.calls}</span>
                      <span className="text-stone-400 text-[10px] hidden sm:inline">Calls</span>
                    </div>

                    <div className="flex items-center gap-1 text-stone-600">
                      <StarIcon className="h-3 w-3 text-amber-500 fill-current" />
                      <span className="font-semibold">{branch.reviews}</span>
                      <span className="text-stone-400 text-[10px] hidden sm:inline">Reviews</span>
                    </div>

                    <div className="flex items-center gap-1 text-stone-600">
                      <CompassIcon className="h-3 w-3 text-blue-500" />
                      <span className="font-semibold">{branch.maps}</span>
                      <span className="text-stone-400 text-[10px] hidden sm:inline">Maps</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
