"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import ImageUpload, { UploadResult } from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  UsersIcon,
  PlusIcon,
  SparklesIcon,
  CheckCircleIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  XIcon,
  AlertCircleIcon,
  InstagramIcon,
  FacebookIcon,
  EyeIcon,
} from "@/components/ui/icons";

interface Beautician {
  _id: string;
  name: string;
  jobTitle: string;
  bio?: string;
  specialties: string[];
  experienceYears?: number;
  image: string;
  imagePublicId: string;
  instagram?: string;
  facebook?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt?: string;
}

interface BeauticianStats {
  totalBeauticians: number;
  activeBeauticians: number;
  hiddenBeauticians: number;
  featuredBeauticians: number;
}

const PRESET_SPECIALTIES = [
  "Hair Styling",
  "Hair Coloring",
  "Hair Treatment",
  "Bridal Makeup",
  "Makeup",
  "Nail Care",
  "Skin Care",
  "Facials",
  "Eyebrows",
];

const emptyFormData = {
  name: "",
  jobTitle: "",
  bio: "",
  specialties: [] as string[],
  customSpecialty: "",
  experienceYears: 0,
  image: "",
  imagePublicId: "",
  instagram: "",
  facebook: "",
  isActive: true,
  isFeatured: false,
  displayOrder: 0,
};

export default function AdminBeauticiansPage() {
  const [beauticians, setBeauticians] = useState<Beautician[]>([]);
  const [stats, setStats] = useState<BeauticianStats>({
    totalBeauticians: 0,
    activeBeauticians: 0,
    hiddenBeauticians: 0,
    featuredBeauticians: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden" | "featured">("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeautician, setEditingBeautician] = useState<Beautician | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [formError, setFormError] = useState<string | null>(null);

  // Reload data
  const reloadBeauticians = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/beauticians");
      const data = await res.json();

      if (res.ok && data.success) {
        setBeauticians(data.beauticians || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setErrorMessage(data.message || "Failed to load beauticians");
      }
    } catch (err) {
      console.error("Failed to load beauticians:", err);
      setErrorMessage("Network error: Unable to load beauticians.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/beauticians")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success) {
          setBeauticians(data.beauticians || []);
          if (data.stats) setStats(data.stats);
        } else {
          setErrorMessage(data?.message || "Failed to load beauticians");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load beauticians:", err);
        setErrorMessage("Network error: Unable to load beauticians.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered beauticians
  const filteredBeauticians = useMemo(() => {
    return beauticians.filter((b) => {
      // Status filter
      if (statusFilter === "active" && !b.isActive) return false;
      if (statusFilter === "hidden" && b.isActive) return false;
      if (statusFilter === "featured" && !b.isFeatured) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesTitle = b.jobTitle.toLowerCase().includes(query);
        const matchesSpecialty = b.specialties.some((s) =>
          s.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesTitle && !matchesSpecialty) return false;
      }

      return true;
    });
  }, [beauticians, statusFilter, searchQuery]);

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingBeautician(null);
    setFormData({
      ...emptyFormData,
      displayOrder: beauticians.length,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (b: Beautician) => {
    setEditingBeautician(b);
    setFormData({
      name: b.name,
      jobTitle: b.jobTitle,
      bio: b.bio || "",
      specialties: [...b.specialties],
      customSpecialty: "",
      experienceYears: b.experienceYears || 0,
      image: b.image,
      imagePublicId: b.imagePublicId,
      instagram: b.instagram || "",
      facebook: b.facebook || "",
      isActive: b.isActive,
      isFeatured: b.isFeatured,
      displayOrder: b.displayOrder,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBeautician(null);
    setFormData(emptyFormData);
    setFormError(null);
  };

  // Toggle specialty selection
  const handleToggleSpecialty = (spec: string) => {
    setFormData((prev) => {
      const exists = prev.specialties.includes(spec);
      return {
        ...prev,
        specialties: exists
          ? prev.specialties.filter((s) => s !== spec)
          : [...prev.specialties, spec],
      };
    });
  };

  // Add custom specialty
  const handleAddCustomSpecialty = () => {
    const trimmed = formData.customSpecialty.trim();
    if (!trimmed) return;
    if (!formData.specialties.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, trimmed],
        customSpecialty: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        customSpecialty: "",
      }));
    }
  };

  // Handle image upload completion
  const handleImageUploadComplete = (result: UploadResult) => {
    setFormData((prev) => ({
      ...prev,
      image: result.url,
      imagePublicId: result.publicId,
    }));
    setFormError(null);
  };

  // Handle image removal
  const handleImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
      imagePublicId: "",
    }));
  };

  // Save (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError("Full Name is required.");
      return;
    }
    if (!formData.jobTitle.trim()) {
      setFormError("Job Title is required.");
      return;
    }
    if (!formData.image.trim() || !formData.imagePublicId.trim()) {
      setFormError("Profile Photo is required. Please upload an image.");
      return;
    }
    if (formData.experienceYears < 0 || formData.experienceYears > 60) {
      setFormError("Years of experience must be between 0 and 60.");
      return;
    }
    if (formData.instagram.trim()) {
      try {
        const u = new URL(formData.instagram.trim());
        if (u.protocol !== "https:") throw new Error();
      } catch {
        setFormError("Instagram URL must be a valid https link (e.g., https://instagram.com/username).");
        return;
      }
    }
    if (formData.facebook.trim()) {
      try {
        const u = new URL(formData.facebook.trim());
        if (u.protocol !== "https:") throw new Error();
      } catch {
        setFormError("Facebook URL must be a valid https link (e.g., https://facebook.com/username).");
        return;
      }
    }

    try {
      setSaving(true);
      const url = editingBeautician
        ? `/api/admin/beauticians/${editingBeautician._id}`
        : "/api/admin/beauticians";
      const method = editingBeautician ? "PATCH" : "POST";

      const payload = {
        name: formData.name.trim(),
        jobTitle: formData.jobTitle.trim(),
        bio: formData.bio.trim(),
        specialties: formData.specialties,
        experienceYears: Number(formData.experienceYears) || 0,
        image: formData.image.trim(),
        imagePublicId: formData.imagePublicId.trim(),
        instagram: formData.instagram.trim(),
        facebook: formData.facebook.trim(),
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        displayOrder: Number(formData.displayOrder) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to save beautician profile.");
        return;
      }

      setSuccessMessage(
        editingBeautician
          ? `Updated "${formData.name}" successfully.`
          : `Added "${formData.name}" to the team.`
      );
      handleCloseModal();
      await reloadBeauticians();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err) {
      console.error("Save beautician error:", err);
      setFormError("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle active / hidden status
  const handleToggleStatus = async (b: Beautician) => {
    try {
      setTogglingId(b._id);
      const res = await fetch(`/api/admin/beauticians/${b._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !b.isActive }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(
          `Beautician "${b.name}" is now ${!b.isActive ? "active on the About page" : "hidden"}.`
        );
        await reloadBeauticians();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      setErrorMessage("Network error: Could not update status.");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete beautician
  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This will permanently remove their profile and delete the photo from Cloudinary.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/beauticians/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(`Deleted "${name}" successfully.`);
        await reloadBeauticians();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.message || "Failed to delete beautician.");
      }
    } catch (err) {
      console.error("Delete beautician error:", err);
      setErrorMessage("Network error: Could not delete beautician.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <AdminPageHeader
        title="Beauticians"
        description="Manage the beauty professionals displayed on the public About page."
        action={
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B7925A] px-5 py-2.5 text-sm font-semibold text-stone-950 transition-all hover:bg-[#C5A46D] hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Beautician</span>
          </button>
        }
      />

      {/* Feedback Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400" />
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircleIcon className="h-5 w-5 shrink-0 text-rose-400" />
            <p>{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-stone-400 hover:text-white"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Beauticians"
          value={stats.totalBeauticians}
          icon={UsersIcon}
          description="All profiles in system"
        />
        <StatCard
          title="Active Beauticians"
          value={stats.activeBeauticians}
          icon={CheckCircleIcon}
          description="Visible on About page"
        />
        <StatCard
          title="Hidden Beauticians"
          value={stats.hiddenBeauticians}
          icon={EyeOffIcon}
          description="Draft / private profiles"
        />
        <StatCard
          title="Featured Beauticians"
          value={stats.featuredBeauticians}
          icon={SparklesIcon}
          description="Highlighted with badge"
        />
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-[#1C1917] p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, title, specialty..."
            className="w-full rounded-xl border border-stone-700 bg-stone-900/80 py-2 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-500 focus:border-[#B7925A] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/50 p-1">
          {(
            [
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "hidden", label: "Hidden" },
              { id: "featured", label: "Featured" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? "bg-[#B7925A] text-stone-950 font-semibold"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Beauticians Grid / Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B7925A] border-t-transparent" />
        </div>
      ) : filteredBeauticians.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={
            searchQuery || statusFilter !== "all"
              ? "No beauticians match your filter"
              : "No beauticians found"
          }
          description={
            searchQuery || statusFilter !== "all"
              ? "Try clearing your search query or switching status filters."
              : "Get started by adding your first beauty professional profile."
          }
          actionText={
            searchQuery || statusFilter !== "all" ? "Reset Filters" : "+ Add Beautician"
          }
          onAction={
            searchQuery || statusFilter !== "all"
              ? () => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }
              : handleOpenAddModal
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBeauticians.map((b) => (
            <div
              key={b._id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-800 bg-[#1C1917] transition-all hover:border-[#B7925A]/40 hover:shadow-lg hover:shadow-black/40"
            >
              {/* Photo & Badges */}
              <div>
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-900">
                  <Image
                    src={b.image}
                    alt={b.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Status Overlay Badges */}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <StatusBadge
                      status={b.isActive ? "active" : "inactive"}
                      label={b.isActive ? "Active" : "Hidden"}
                    />
                    {b.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#B7925A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-950 shadow-xs">
                        <SparklesIcon className="h-2.5 w-2.5" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Order Badge */}
                  <div className="absolute right-3 top-3">
                    <span className="rounded-md bg-stone-950/80 px-2 py-0.5 text-[11px] font-mono text-stone-400 backdrop-blur-xs">
                      #{b.displayOrder}
                    </span>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#C5A46D] transition-colors">
                        {b.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#B7925A] uppercase tracking-wider mt-0.5">
                        {b.jobTitle}
                      </p>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="mt-2.5 text-xs text-stone-400">
                    <span className="font-medium text-stone-300">
                      {b.experienceYears ? `${b.experienceYears} Years Experience` : "Experienced"}
                    </span>
                  </div>

                  {/* Specialties */}
                  {b.specialties && b.specialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {b.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="rounded-md bg-stone-800/90 px-2 py-0.5 text-[11px] text-stone-300 border border-stone-700/50"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bio Preview */}
                  {b.bio && (
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-stone-400">
                      &ldquo;{b.bio}&rdquo;
                    </p>
                  )}

                  {/* Social Handles */}
                  {(b.instagram || b.facebook) && (
                    <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-stone-800/80 text-stone-400">
                      {b.instagram && (
                        <a
                          href={b.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Instagram profile"
                          className="hover:text-[#B7925A] transition-colors p-1"
                        >
                          <InstagramIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {b.facebook && (
                        <a
                          href={b.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Facebook profile"
                          className="hover:text-[#B7925A] transition-colors p-1"
                        >
                          <FacebookIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-stone-800 bg-stone-900/60 px-4 py-3 text-xs">
                {/* Publish / Hide toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(b)}
                  disabled={togglingId === b._id}
                  className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                    b.isActive
                      ? "text-stone-400 hover:text-amber-400"
                      : "text-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  {b.isActive ? (
                    <>
                      <EyeOffIcon className="h-3.5 w-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-3.5 w-3.5" />
                      <span>Publish</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(b)}
                    className="inline-flex items-center gap-1 text-stone-300 hover:text-white transition-colors"
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  <span className="text-stone-700">|</span>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(b._id, b.name)}
                    disabled={deletingId === b._id}
                    className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Beautician Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={handleCloseModal}
          />

          {/* Modal Container */}
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-800 bg-[#1C1917] p-6 text-stone-200 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-white">
                  {editingBeautician ? "Edit Beautician Profile" : "Add New Beautician"}
                </h2>
                <p className="mt-1 text-xs text-stone-400">
                  {editingBeautician
                    ? `Update details for ${editingBeautician.name}`
                    : "Fill in the details to feature this beauty professional on the About page."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Error */}
            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircleIcon className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Profile Photo (ImageUpload) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                  Profile Photo <span className="text-[#B7925A]">*</span>
                </label>
                <ImageUpload
                  folder={CLOUDINARY_FOLDERS.BEAUTICIANS}
                  value={formData.image}
                  publicId={formData.imagePublicId}
                  onChange={handleImageUploadComplete}
                  onRemove={handleImageRemove}
                  description="Recommended portrait format (4:5). Max size: 5MB (JPG, PNG, WEBP)."
                />
              </div>

              {/* Name & Job Title */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Full Name <span className="text-[#B7925A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Nadeesha Perera"
                    className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-[#B7925A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Job Title <span className="text-[#B7925A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Hair Stylist"
                    className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-[#B7925A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Years of Experience & Display Order */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Years of Experience (0–60)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={formData.experienceYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceYears: Math.max(0, Math.min(60, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm text-stone-100 focus:border-[#B7925A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm text-stone-100 focus:border-[#B7925A] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-stone-500">
                    Lower numbers display first (e.g. 0 before 1).
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  Bio / Philosophy (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="A short quote or professional philosophy..."
                  className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-[#B7925A] focus:outline-none"
                />
                <div className="mt-1 text-right text-[11px] text-stone-500">
                  {formData.bio.length} / 500 characters
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  Specialties & Skills
                </label>
                <p className="text-[11px] text-stone-400 mb-2">
                  Click preset tags below or enter custom specialties.
                </p>

                {/* Preset suggestions */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRESET_SPECIALTIES.map((spec) => {
                    const isSelected = formData.specialties.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleToggleSpecialty(spec)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-[#B7925A] text-stone-950 font-semibold"
                            : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                        }`}
                      >
                        {isSelected ? `✓ ${spec}` : `+ ${spec}`}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Specialty Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.customSpecialty}
                    onChange={(e) =>
                      setFormData({ ...formData, customSpecialty: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSpecialty();
                      }
                    }}
                    placeholder="Add custom specialty..."
                    className="flex-1 rounded-xl border border-stone-700 bg-stone-900 px-4 py-2 text-xs text-stone-100 placeholder-stone-500 focus:border-[#B7925A] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSpecialty}
                    className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-xs font-medium text-stone-200 hover:bg-stone-700"
                  >
                    Add
                  </button>
                </div>

                {/* Active selected list */}
                {formData.specialties.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {formData.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1 rounded-full bg-stone-800 border border-stone-700 px-2.5 py-0.5 text-xs text-stone-200"
                      >
                        <span>{spec}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSpecialty(spec)}
                          className="hover:text-rose-400"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Social URLs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Instagram URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="https://instagram.com/username"
                    className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:border-[#B7925A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Facebook URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="https://facebook.com/username"
                    className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:border-[#B7925A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles: Active & Featured */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-stone-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded-sm border-stone-700 bg-stone-900 text-[#B7925A] focus:ring-[#B7925A]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-200">
                      Active (Visible publicly)
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Show this profile in the About page team section.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="h-4 w-4 rounded-sm border-stone-700 bg-stone-900 text-[#B7925A] focus:ring-[#B7925A]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-200">
                      Featured Beautician
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Highlight profile with a &ldquo;Featured Expert&rdquo; gold badge.
                    </p>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-xl border border-stone-700 px-5 py-2.5 text-xs font-medium text-stone-300 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#B7925A] px-6 py-2.5 text-xs font-semibold text-stone-950 hover:bg-[#C5A46D] disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                  )}
                  <span>{editingBeautician ? "Save Changes" : "Create Profile"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
