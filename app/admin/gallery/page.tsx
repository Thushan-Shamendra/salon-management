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
  ImageIcon,
  PlusIcon,
  SparklesIcon,
  CheckCircleIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  XIcon,
  AlertCircleIcon,
} from "@/components/ui/icons";

interface GalleryPhoto {
  _id: string;
  title: string;
  description?: string;
  category: string;
  image: string;
  imagePublicId: string;
  altText?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt?: string;
}

interface GalleryStats {
  totalPhotos: number;
  activePhotos: number;
  hiddenPhotos: number;
  featuredPhotos: number;
}

const PRESET_CATEGORIES = [
  "Hair Styling",
  "Hair Treatments",
  "Hair Coloring",
  "Bridal",
  "Makeup",
  "Nails",
  "Salon Interior",
  "Special Events",
];

const emptyFormData = {
  title: "",
  description: "",
  category: "Hair Styling",
  customCategory: "",
  image: "",
  imagePublicId: "",
  altText: "",
  isActive: true,
  isFeatured: false,
  displayOrder: 0,
};

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [stats, setStats] = useState<GalleryStats>({
    totalPhotos: 0,
    activePhotos: 0,
    hiddenPhotos: 0,
    featuredPhotos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden" | "featured">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [formError, setFormError] = useState<string | null>(null);

  // Reload gallery photos after actions
  const reloadGallery = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();

      if (res.ok && data.success) {
        setPhotos(data.photos || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setErrorMessage(data.message || "Failed to load gallery photos");
      }
    } catch (err) {
      console.error("Failed to reload gallery:", err);
      setErrorMessage("Network error: Unable to load gallery items.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/gallery")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setPhotos(data.photos || []);
          if (data.stats) setStats(data.stats);
        } else {
          setErrorMessage(data.message || "Failed to load gallery photos");
        }
      })
      .catch((err) => {
        console.error("Initial gallery load error:", err);
        if (isMounted) setErrorMessage("Network error: Unable to load gallery items.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingPhoto(null);
    setFormData(emptyFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (photo: GalleryPhoto) => {
    setEditingPhoto(photo);
    const isPreset = PRESET_CATEGORIES.includes(photo.category);
    setFormData({
      title: photo.title,
      description: photo.description || "",
      category: isPreset ? photo.category : "Custom",
      customCategory: isPreset ? "" : photo.category,
      image: photo.image,
      imagePublicId: photo.imagePublicId,
      altText: photo.altText || "",
      isActive: photo.isActive,
      isFeatured: photo.isFeatured,
      displayOrder: photo.displayOrder,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingPhoto(null);
    setFormError(null);
  };

  // Form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "displayOrder") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Image upload callback from ImageUpload component
  const handleImageUploaded = (result: UploadResult) => {
    setFormData((prev) => ({
      ...prev,
      image: result.url,
      imagePublicId: result.publicId,
    }));
    setFormError(null);
  };

  const handleImageRemoved = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
      imagePublicId: "",
    }));
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.image || !formData.imagePublicId) {
      setFormError("Please upload a photo to continue.");
      return;
    }

    if (!formData.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    const finalCategory =
      formData.category === "Custom"
        ? formData.customCategory.trim()
        : formData.category.trim();

    if (!finalCategory) {
      setFormError("Please select or enter a category.");
      return;
    }

    try {
      setSaving(true);
      const url = editingPhoto
        ? `/api/admin/gallery/${editingPhoto._id}`
        : "/api/admin/gallery";
      const method = editingPhoto ? "PATCH" : "POST";

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: finalCategory,
        image: formData.image,
        imagePublicId: formData.imagePublicId,
        altText: formData.altText.trim(),
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        displayOrder: formData.displayOrder,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(
          editingPhoto
            ? "Gallery photo updated successfully!"
            : "Gallery photo added successfully!"
        );
        setTimeout(() => setSuccessMessage(null), 4000);
        setIsModalOpen(false);
        await reloadGallery();
      } else {
        setFormError(data.message || "Failed to save photo.");
      }
    } catch (err) {
      console.error("Save gallery error:", err);
      setFormError("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Active/Hidden Status
  const handleToggleStatus = async (photo: GalleryPhoto) => {
    try {
      setTogglingId(photo._id);
      const res = await fetch(`/api/admin/gallery/${photo._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !photo.isActive }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPhotos((prev) =>
          prev.map((p) =>
            p._id === photo._id ? { ...p, isActive: !photo.isActive } : p
          )
        );
        setStats((prev) => ({
          ...prev,
          activePhotos: photo.isActive ? prev.activePhotos - 1 : prev.activePhotos + 1,
          hiddenPhotos: photo.isActive ? prev.hiddenPhotos + 1 : prev.hiddenPhotos - 1,
        }));
      } else {
        setErrorMessage(data.message || "Failed to update photo status.");
      }
    } catch {
      setErrorMessage("Network error: Failed to toggle photo status.");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Gallery Item
  const handleDeletePhoto = async (photo: GalleryPhoto) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${photo.title}"? This will also remove the image from Cloudinary.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(photo._id);
      const res = await fetch(`/api/admin/gallery/${photo._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage("Gallery photo deleted successfully.");
        setTimeout(() => setSuccessMessage(null), 3000);
        await reloadGallery();
      } else {
        setErrorMessage(data.message || "Failed to delete gallery photo.");
      }
    } catch {
      setErrorMessage("Network error: Failed to delete gallery photo.");
    } finally {
      setDeletingId(null);
    }
  };

  // Unique categories for filtering
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [photos]);

  // Filtered Photos for Management Grid
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      // Search
      const matchesSearch =
        searchQuery.trim() === "" ||
        photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (photo.description &&
          photo.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = photo.isActive;
      if (statusFilter === "hidden") matchesStatus = !photo.isActive;
      if (statusFilter === "featured") matchesStatus = photo.isFeatured;

      // Category
      const matchesCategory =
        categoryFilter === "all" ||
        photo.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [photos, searchQuery, statusFilter, categoryFilter]);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <AdminPageHeader
        title="Gallery Management"
        description="Manage photos displayed on the public salon gallery."
        breadcrumbs={[{ label: "Gallery" }]}
        action={
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition focus:outline-none focus:ring-2 focus:ring-[#B7925A] border border-[#B7925A]/30"
          >
            <PlusIcon className="h-4 w-4 text-[#C5A46D]" />
            <span>Add Photo</span>
          </button>
        }
      />

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 shadow-xs animate-fadeIn">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 shadow-xs animate-fadeIn">
          <AlertCircleIcon className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 16: Stat Cards (Real MongoDB data) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Photos"
          value={stats.totalPhotos}
          description="All portfolio items in database"
          icon={ImageIcon}
        />
        <StatCard
          title="Active Photos"
          value={stats.activePhotos}
          description="Visible to public visitors"
          icon={CheckCircleIcon}
          badge="Live"
        />
        <StatCard
          title="Hidden Photos"
          value={stats.hiddenPhotos}
          description="Draft or unpublished photos"
          icon={EyeOffIcon}
        />
        <StatCard
          title="Featured Photos"
          value={stats.featuredPhotos}
          description="Highlighted on public intro"
          icon={SparklesIcon}
          badge="Featured"
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, category, description..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF7F2] pl-10 pr-4 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B7925A] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "active" | "hidden" | "featured"
              )
            }
            aria-label="Filter photos by status"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:border-stone-300 focus:border-[#B7925A] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="hidden">Hidden Only</option>
            <option value="featured">Featured Only</option>
          </select>

          {/* Category Filter */}
          {existingCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter photos by category"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:border-stone-300 focus:border-[#B7925A] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="text-xs text-[#B7925A] hover:underline px-2 py-1 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Gallery Photos Grid / Management Cards */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-stone-200 bg-white p-4 space-y-3"
            >
              <div className="aspect-[4/3] w-full rounded-xl bg-stone-200" />
              <div className="h-4 w-3/4 rounded bg-stone-200" />
              <div className="h-3 w-1/2 rounded bg-stone-200" />
              <div className="h-8 w-full rounded bg-stone-100" />
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        /* Section 21: Admin gallery empty state */
        <EmptyState
          icon={ImageIcon}
          title="No gallery photos yet."
          description="Upload hair transformations, bridal styling, and beauty looks to showcase your salon's craftsmanship."
          actionText="Add First Photo"
          onAction={handleOpenAddModal}
        />
      ) : filteredPhotos.length === 0 ? (
        /* No results matching filter */
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-serif text-base font-semibold text-stone-800">
            No photos found matching your criteria.
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Try adjusting your search query or filter selection.
          </p>
        </div>
      ) : (
        /* Section 17: Gallery Management Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => {
            const isDeleting = deletingId === photo._id;
            const isToggling = togglingId === photo._id;

            return (
              <div
                key={photo._id}
                className={`flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs transition hover:border-[#B7925A]/60 hover:shadow-md ${
                  !photo.isActive ? "opacity-80 bg-stone-50/50" : ""
                }`}
              >
                <div>
                  {/* Photo Preview Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    <Image
                      src={photo.image}
                      alt={photo.altText || photo.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        <StatusBadge
                          status={photo.isActive ? "active" : "hidden"}
                          label={photo.isActive ? "Active" : "Hidden"}
                        />
                        {photo.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-stone-950 px-2 py-0.5 text-[10px] font-bold shadow-xs">
                            <SparklesIcon className="h-3 w-3" />
                            Featured
                          </span>
                        )}
                      </div>

                      <span className="rounded-full bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 text-[10px] font-semibold border border-white/20">
                        Order: {photo.displayOrder}
                      </span>
                    </div>
                  </div>

                  {/* Photo Metadata */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-[#FAF7F2] text-[#B7925A] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border border-[#B7925A]/20">
                        {photo.category}
                      </span>
                      {photo.altText && (
                        <span
                          className="text-[10px] text-stone-400 truncate max-w-[120px]"
                          title={`Alt: ${photo.altText}`}
                        >
                          Alt: {photo.altText}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-base font-bold text-stone-900 line-clamp-1">
                      {photo.title}
                    </h3>

                    {photo.description ? (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {photo.description}
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400 italic">
                        No description provided.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 pt-3 border-t border-stone-100 bg-[#FAF7F2]/40 flex items-center justify-between gap-2">
                  {/* Enable / Disable Quick Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(photo)}
                    disabled={isToggling}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      photo.isActive
                        ? "text-stone-600 hover:text-amber-700 hover:bg-amber-50"
                        : "text-emerald-700 hover:bg-emerald-50"
                    } disabled:opacity-50`}
                  >
                    {photo.isActive ? "Hide" : "Publish"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(photo)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:border-[#B7925A] hover:text-[#B7925A] transition"
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 shadow-xs hover:bg-red-50 disabled:opacity-50 transition"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 18 & 19 - ADD / EDIT PHOTO MODAL                       */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
        >
          <div className="relative w-full max-w-2xl my-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-[#FAF7F2]">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  {editingPhoto ? "Edit Gallery Photo" : "Add Gallery Photo"}
                </h2>
                <p className="text-xs text-stone-500">
                  {editingPhoto
                    ? "Update metadata or replace the photo."
                    : "Upload a new photo to the public salon portfolio."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Image Upload (reusing ImageUpload with folder salon-management/gallery) */}
              <div>
                <ImageUpload
                  folder={CLOUDINARY_FOLDERS.GALLERY}
                  value={formData.image}
                  publicId={formData.imagePublicId}
                  onChange={handleImageUploaded}
                  onRemove={handleImageRemoved}
                  label="Photo Image *"
                  description="High-resolution salon work photo (JPG, PNG, WEBP up to 5MB)"
                />
              </div>

              {/* 2. Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    maxLength={120}
                    placeholder="e.g. Balayage Caramel Transformation"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#B7925A] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-stone-400 text-right">
                    {formData.title.length}/120
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#B7925A] focus:outline-none"
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Custom">Custom Category...</option>
                  </select>
                </div>
              </div>

              {/* Custom Category Input if selected */}
              {formData.category === "Custom" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Custom Category Name *
                  </label>
                  <input
                    type="text"
                    name="customCategory"
                    value={formData.customCategory}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Japanese Head Spa"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#B7925A] focus:outline-none"
                  />
                </div>
              )}

              {/* 3. Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  placeholder="Describe the treatment, coloring formulation, or styling techniques used..."
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#B7925A] focus:outline-none resize-none"
                />
                <p className="mt-1 text-[11px] text-stone-400 text-right">
                  {formData.description.length}/500
                </p>
              </div>

              {/* 4. Alt Text & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    name="altText"
                    value={formData.altText}
                    onChange={handleInputChange}
                    maxLength={160}
                    placeholder="e.g. Client showcasing shiny blonde highlights"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#B7925A] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-stone-400 text-right">
                    {formData.altText.length}/160
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    min={0}
                    step={1}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#B7925A] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Lower numbers appear first on the gallery.
                  </p>
                </div>
              </div>

              {/* 5. Toggles: Featured & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-[#FAF7F2] p-3.5 cursor-pointer hover:border-[#B7925A]/50 transition">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#B7925A] focus:ring-[#B7925A]"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-stone-900">
                      Mark as Featured
                    </span>
                    <span className="block text-[11px] text-stone-500">
                      Eligible to be shown on the main gallery introduction highlight.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-[#FAF7F2] p-3.5 cursor-pointer hover:border-[#B7925A]/50 transition">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-stone-900">
                      Publish to Gallery (Active)
                    </span>
                    <span className="block text-[11px] text-stone-500">
                      When enabled, this photo is visible to public visitors.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition disabled:opacity-50 border border-[#B7925A]/30"
                >
                  {saving
                    ? editingPhoto
                      ? "Updating Photo..."
                      : "Adding Photo..."
                    : editingPhoto
                    ? "Update Photo"
                    : "Add Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
