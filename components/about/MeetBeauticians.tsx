"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  InstagramIcon,
  FacebookIcon,
  SparklesIcon,
  MapPinIcon,
} from "@/components/ui/icons";

export interface BeauticianData {
  _id: string;
  name: string;
  jobTitle: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  image?: string;
  instagram?: string;
  facebook?: string;
  isFeatured?: boolean;
  branchId?: string | { _id: string; name: string; slug: string } | null;
}

export interface BranchData {
  _id: string;
  name: string;
  slug: string;
}

interface MeetBeauticiansProps {
  beauticians: BeauticianData[];
  branches?: BranchData[];
}

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?auto=format&fit=crop&w=800&q=80";

export default function MeetBeauticians({ beauticians, branches = [] }: MeetBeauticiansProps) {
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  const filteredBeauticians = useMemo(() => {
    if (selectedBranchId === "all") return beauticians;
    return beauticians.filter((b) => {
      const bId =
        typeof b.branchId === "object" && b.branchId
          ? b.branchId._id
          : typeof b.branchId === "string"
          ? b.branchId
          : null;
      return bId === selectedBranchId;
    });
  }, [beauticians, selectedBranchId]);

  if (!beauticians || beauticians.length === 0) {
    return null; // Cleanly hide if no active beauticians
  }

  const handleImageError = (id: string) => {
    setFailedImageIds((prev) => ({ ...prev, [id]: true }));
  };

  const getBranchName = (b: BeauticianData): string | null => {
    if (typeof b.branchId === "object" && b.branchId?.name) {
      return b.branchId.name;
    }
    if (typeof b.branchId === "string") {
      const match = branches.find((br) => br._id === b.branchId);
      if (match) return match.name;
    }
    return null;
  };

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24 border-b border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                OUR TEAM
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
              Meet Our Beauty Experts
            </h2>
          </div>

          <Link
            href="/services"
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-5 py-2.5 text-xs font-semibold text-[#7C3AED] shadow-2xs transition-all hover:bg-purple-50 hover:border-[#7C3AED] active:scale-[0.98]"
          >
            <span>View Our Services</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Branch Filter Tabs (when multiple active branches exist) */}
        {branches.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 mb-10">
            <button
              type="button"
              onClick={() => setSelectedBranchId("all")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                selectedBranchId === "all"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All Branches
            </button>
            {branches.map((br) => {
              const isSelected = selectedBranchId === br._id;
              return (
                <button
                  key={br._id}
                  type="button"
                  onClick={() => setSelectedBranchId(br._id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#7C3AED] text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {br.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State for Branch Filter */}
        {filteredBeauticians.length === 0 && (
          <div className="text-center py-12 rounded-3xl border border-dashed border-stone-200 p-8 max-w-md mx-auto">
            <p className="text-sm font-semibold text-stone-700">
              No beauticians found for this branch.
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Select another branch or view all branches to see our full team.
            </p>
            <button
              type="button"
              onClick={() => setSelectedBranchId("all")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer"
            >
              View All Branches
            </button>
          </div>
        )}

        {/* 1 Beautician: Horizontal Feature Card (Matches Mockup) */}
        {filteredBeauticians.length === 1 && (() => {
          const person = filteredBeauticians[0];
          const branchName = getBranchName(person);
          const imageSrc =
            failedImageIds[person._id] || !person.image
              ? FALLBACK_PHOTO
              : person.image;

          const bioText =
            person.bio ||
            (person.specialties && person.specialties.length > 0
              ? `Specializes in ${person.specialties.slice(0, 3).join(", ")} and personalized hair care.`
              : "Specializes in modern haircuts, styling and personalized hair care.");

          return (
            <div className="max-w-2xl mx-auto">
              <div className="group relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8 rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-lg">
                {/* Circular Portrait with Glow Ring */}
                <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden shrink-0 border-4 border-purple-100 ring-4 ring-cyan-100/50 shadow-sm">
                  <Image
                    src={imageSrc}
                    alt={person.name}
                    fill
                    sizes="(max-width: 640px) 128px, 144px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => handleImageError(person._id)}
                  />
                  {person.isFeatured && (
                    <div className="absolute bottom-1 right-1 rounded-full bg-[#7C3AED] p-1 text-white shadow-xs">
                      <SparklesIcon className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Profile Information */}
                <div className="text-center sm:text-left flex-1 space-y-2">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                      {person.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-stone-500 capitalize mt-0.5">
                      {person.jobTitle || "Hair Stylist"}
                    </p>
                    {branchName && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#7C3AED] border border-purple-100">
                        <MapPinIcon className="h-3 w-3 text-[#7C3AED]" />
                        <span>{branchName}</span>
                      </div>
                    )}
                  </div>

                  {/* Experience Badge */}
                  {person.experienceYears ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                      <BriefcaseIcon className="h-3.5 w-3.5 text-stone-500" />
                      <span>{person.experienceYears}+ Years Experience</span>
                    </div>
                  ) : null}

                  {/* Bio / Specialties */}
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
                    {bioText}
                  </p>

                  {/* Social Media Links */}
                  {(person.facebook || person.instagram) ? (
                    <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                      {person.facebook ? (
                        <a
                          href={person.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${person.name} Facebook`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                        >
                          <FacebookIcon className="h-4 w-4" />
                        </a>
                      ) : null}
                      {person.instagram ? (
                        <a
                          href={person.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${person.name} Instagram`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                        >
                          <InstagramIcon className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2 Beauticians: 2 Centered Cards */}
        {filteredBeauticians.length === 2 && (
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
            {filteredBeauticians.map((person) => renderPortraitCard(person))}
          </div>
        )}

        {/* 3 Beauticians: Balanced 3-Column Grid */}
        {filteredBeauticians.length === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredBeauticians.map((person) => renderPortraitCard(person))}
          </div>
        )}

        {/* 4+ Beauticians: Responsive 4-Column Grid */}
        {filteredBeauticians.length >= 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBeauticians.map((person) => renderPortraitCard(person))}
          </div>
        )}
      </div>
    </section>
  );

  function renderPortraitCard(person: BeauticianData) {
    const branchName = getBranchName(person);
    const imageSrc =
      failedImageIds[person._id] || !person.image
        ? FALLBACK_PHOTO
        : person.image;

    return (
      <div
        key={person._id}
        className="group flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-xl hover:-translate-y-1"
      >
        <div>
          {/* Portrait Photo */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone-100">
            <Image
              src={imageSrc}
              alt={person.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => handleImageError(person._id)}
            />
            {person.isFeatured && (
              <div className="absolute top-3 left-3 rounded-full bg-[#7C3AED] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-xs">
                Featured Expert
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mt-4">
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors truncate">
              {person.name}
            </h3>
            <p className="text-xs font-semibold text-stone-500 capitalize mt-0.5">
              {person.jobTitle || "Beauty Specialist"}
            </p>

            {/* Branch Label if Assigned */}
            {branchName && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                <MapPinIcon className="h-3 w-3 text-purple-500 shrink-0" />
                <span className="truncate">{branchName}</span>
              </div>
            )}

            {person.experienceYears ? (
              <p className="mt-2 text-xs font-medium text-stone-600">
                {person.experienceYears}+ Years Experience
              </p>
            ) : null}

            {person.bio && (
              <p className="mt-2 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                {person.bio}
              </p>
            )}

            {/* Social Row */}
            {(person.instagram || person.facebook) ? (
              <div className="mt-3 flex items-center gap-1.5 pt-3 border-t border-stone-100">
                {person.instagram ? (
                  <a
                    href={person.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${person.name} Instagram`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                  >
                    <InstagramIcon className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {person.facebook ? (
                  <a
                    href={person.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${person.name} Facebook`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                  >
                    <FacebookIcon className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}
