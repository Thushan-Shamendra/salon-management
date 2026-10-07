"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import ImageUpload from "@/components/ui/ImageUpload";
import ImageCropAdjuster, { CropPosition } from "@/components/admin/ImageCropAdjuster";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  ImageIcon,
  StarIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  SearchIcon,
  PlusIcon,
  XIcon,
  CheckCircleIcon,
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
  cropPosition?: CropPosition;
  createdAt?: string;
  updatedAt?: string;
}

interface GalleryFormState {
  title: string;
  description: string;
  category: string;
  image: string;
  imagePublicId: string;
  altText: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: string;
  cropPosition: CropPosition;
}

const PRESET_CATEGORIES = [
  "Hair Styling",
  "Hair Treatments",
  "Hair Coloring",
  "Bridal",
  "Makeup",
  "Nails",
  "Skin Care",
  "Salon Interior",
  "Special Events",
];

const emptyForm: GalleryFormState = {
  title: "",
  description: "",
  category: "Hair Styling",
  image: "",
  imagePublicId: "",
  altText: "",
  isActive: true,
  isFeatured: false,
  displayOrder: "0",
  cropPosition: {
    x: 50,
    y: 50,
    zoom: 1,
  },
};

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<GalleryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not-featured">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"order" | "newest" | "oldest">("order");

  // Toggle loading states
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // Notification feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete modal state
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image Preview Lightbox modal state
  const [previewPhoto, setPreviewPhoto] = useState<GalleryPhoto | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadGallery = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (res.ok && data.success) {
        setPhotos(data.photos || []);
      } else {
        showNotification("error", data.message || "Failed to load gallery photos");
      }
    } catch {
      showNotification("error", "Network error loading gallery photos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch("/api/admin/gallery");
        const data = await res.json();
        if (isMounted && res.ok && data.success) {
          setPhotos(data.photos || []);
        } else if (isMounted) {
          showNotification("error", data.message || "Failed to load gallery photos");
        }
      } catch {
        if (isMounted) showNotification("error", "Network error loading gallery photos");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Stats calculation from real database records
  const stats = useMemo(() => {
    const totalPhotos = photos.length;
    const activePhotos = photos.filter((p) => p.isActive).length;
    const hiddenPhotos = photos.filter((p) => !p.isActive).length;
    const featuredPhotos = photos.filter((p) => p.isFeatured).length;

    return { totalPhotos, activePhotos, hiddenPhotos, featuredPhotos };
  }, [photos]);

  // Unique categories for filtering and suggestions
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [photos]);

  const availableCategoryOptions = useMemo(() => {
    const set = new Set<string>([...PRESET_CATEGORIES, ...dynamicCategories]);
    return Array.from(set).sort();
  }, [dynamicCategories]);

  // Filtered and sorted photos
  const filteredPhotos = useMemo(() => {
    return photos
      .filter((photo) => {
        // Status filter
        if (statusFilter === "active" && !photo.isActive) return false;
        if (statusFilter === "hidden" && photo.isActive) return false;

        // Featured filter
        if (featuredFilter === "featured" && !photo.isFeatured) return false;
        if (featuredFilter === "not-featured" && photo.isFeatured) return false;

        // Category filter
        if (categoryFilter !== "all" && photo.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }

        // Search query (title, description, category)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const titleMatch = photo.title.toLowerCase().includes(q);
          const descMatch = (photo.description || "").toLowerCase().includes(q);
          const catMatch = photo.category.toLowerCase().includes(q);
          return titleMatch || descMatch || catMatch;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "order") {
          const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
          if (orderDiff !== 0) return orderDiff;
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        }
        return 0;
      });
  }, [photos, statusFilter, featuredFilter, categoryFilter, searchQuery, sortBy]);

  // Open Form for Create
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      displayOrder: String(photos.length + 1),
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditForm = (photo: GalleryPhoto) => {
    setEditingId(photo._id);
    setForm({
      title: photo.title,
      description: photo.description || "",
      category: photo.category,
      image: photo.image,
      imagePublicId: photo.imagePublicId,
      altText: photo.altText || "",
      isActive: photo.isActive,
      isFeatured: photo.isFeatured,
      displayOrder: String(photo.displayOrder ?? 0),
      cropPosition: photo.cropPosition
        ? {
            x: typeof photo.cropPosition.x === "number" ? photo.cropPosition.x : 50,
            y: typeof photo.cropPosition.y === "number" ? photo.cropPosition.y : 50,
            zoom: typeof photo.cropPosition.zoom === "number" ? photo.cropPosition.zoom : 1,
          }
        : { x: 50, y: 50, zoom: 1 },
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.image || !form.imagePublicId) {
      showNotification("error", "Gallery image is required. Please upload a photo.");
      return;
    }
    if (!form.title.trim()) {
      showNotification("error", "Photo title is required.");
      return;
    }
    if (!form.category.trim()) {
      showNotification("error", "Category is required.");
      return;
    }

    setFormLoading(true);

    try {
      const url = editingId
        ? `/api/admin/gallery/${editingId}`
        : "/api/admin/gallery";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        image: form.image,
        imagePublicId: form.imagePublicId,
        altText: form.altText.trim() || form.title.trim(),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        displayOrder: Number(form.displayOrder) || 0,
        cropPosition: form.cropPosition,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to save photo");
        return;
      }

      showNotification(
        "success",
        editingId ? "Photo updated successfully." : "Photo added successfully."
      );

      handleCloseForm();
      await loadGallery();
    } catch {
      showNotification("error", "Network error saving gallery photo");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Active / Hidden Status
  const handleToggleStatus = async (photo: GalleryPhoto) => {
    try {
      setTogglingStatusId(photo._id);
      const res = await fetch(`/api/admin/gallery/${photo._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !photo.isActive }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          "success",
          photo.isActive ? "Photo hidden." : "Photo published."
        );
        setPhotos((prev) =>
          prev.map((item) =>
            item._id === photo._id ? { ...item, isActive: !item.isActive } : item
          )
        );
      } else {
        showNotification("error", data.message || "Failed to update photo status");
      }
    } catch {
      showNotification("error", "Network error updating photo status");
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Toggle Featured Status
  const handleToggleFeatured = async (photo: GalleryPhoto) => {
    try {
      setTogglingFeaturedId(photo._id);
      const res = await fetch(`/api/admin/gallery/${photo._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !photo.isFeatured }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          "success",
          photo.isFeatured ? "Photo removed from featured." : "Photo featured."
        );
        setPhotos((prev) =>
          prev.map((item) =>
            item._id === photo._id ? { ...item, isFeatured: !item.isFeatured } : item
          )
        );
      } else {
        showNotification("error", data.message || "Failed to update featured state");
      }
    } catch {
      showNotification("error", "Network error updating featured state");
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  // Delete Action via ConfirmModal
  const handleExecuteDelete = async () => {
    if (!photoToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/gallery/${photoToDelete._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification("success", "Photo deleted successfully.");
        setPhotos((prev) => prev.filter((item) => item._id !== photoToDelete._id));
        setPhotoToDelete(null);

        if (editingId === photoToDelete._id) {
          handleCloseForm();
        }
      } else {
        showNotification("error", data.message || "Failed to delete photo");
      }
    } catch {
      showNotification("error", "Network error deleting photo");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ========================================================== */}
      {/* 1. HEADER & ACTIONS                                        */}
      {/* ========================================================== */}
      <AdminPageHeader
        title="Gallery"
        description="Manage photos displayed on the INVORA website gallery."
        breadcrumbs={[{ label: "Gallery" }]}
        action={
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Photo</span>
          </button>
        }
      />

      {/* Floating Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-3 rounded-2xl border p-4 text-xs sm:text-sm font-medium shadow-md transition-all ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. STATS ROW (4 CARDS MATCHING MOCKUP)                     */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Photos */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Total Photos</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.totalPhotos}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              All photos in database
            </p>
          </div>
        </div>

        {/* Published Photos */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Published Photos</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.activePhotos}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Currently visible on website
            </p>
          </div>
        </div>

        {/* Hidden Photos */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
            <EyeOffIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Hidden Photos</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.hiddenPhotos}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Not visible on website
            </p>
          </div>
        </div>

        {/* Featured Photos */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <StarIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Featured Photos</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.featuredPhotos}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Marked as featured
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. SEARCH & FILTER TOOLBAR (MATCHES MOCKUP)                */}
      {/* ========================================================== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gallery photos by title, description or category..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden sm:inline">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "hidden")
              }
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="all">All Photos</option>
              <option value="active">Published</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          {/* Featured Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden sm:inline">
              Featured
            </span>
            <select
              value={featuredFilter}
              onChange={(e) =>
                setFeaturedFilter(
                  e.target.value as "all" | "featured" | "not-featured"
                )
              }
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="all">All Featured</option>
              <option value="featured">Featured Only</option>
              <option value="not-featured">Not Featured</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden sm:inline">
              Category
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {availableCategoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden sm:inline">
              Sort By
            </span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "order" | "newest" | "oldest")
              }
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="order">Display Order</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 4. MAIN CONTENT AREA: GALLERY GRID + ADD/EDIT PANEL        */}
      {/* ========================================================== */}
      <div
        className={
          isFormOpen
            ? "grid grid-cols-1 lg:grid-cols-12 gap-7 items-start"
            : "block"
        }
      >
        {/* ======================================================== */}
        {/* LEFT: PHOTOS GRID                                        */}
        {/* ======================================================== */}
        <div
          className={
            isFormOpen ? "lg:col-span-7 xl:col-span-8" : "w-full"
          }
        >
          {loading ? (
            /* Skeleton Loading Grid */
            <div
              className={`grid grid-cols-1 gap-5 ${
                isFormOpen
                  ? "sm:grid-cols-2 xl:grid-cols-3"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs animate-pulse"
                >
                  <div className="h-44 w-full rounded-xl bg-stone-200" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-stone-200" />
                    <div className="h-4 w-1/3 rounded bg-blue-100" />
                    <div className="h-3 w-full rounded bg-stone-100" />
                    <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2">
                      <div className="h-8 flex-1 rounded-lg bg-stone-100" />
                      <div className="h-8 flex-1 rounded-lg bg-stone-100" />
                      <div className="h-8 flex-1 rounded-lg bg-stone-100" />
                      <div className="h-8 flex-1 rounded-lg bg-stone-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPhotos.length === 0 ? (
            /* Empty State */
            <EmptyState
              icon={ImageIcon}
              title={
                searchQuery ||
                statusFilter !== "all" ||
                featuredFilter !== "all" ||
                categoryFilter !== "all"
                  ? "No gallery photos found matching criteria"
                  : "No gallery photos yet"
              }
              description={
                searchQuery ||
                statusFilter !== "all" ||
                featuredFilter !== "all" ||
                categoryFilter !== "all"
                  ? "Try adjusting or clearing your search and filters to view photos."
                  : "Upload your first salon photo to display it in the INVORA gallery."
              }
              actionText={
                searchQuery ||
                statusFilter !== "all" ||
                featuredFilter !== "all" ||
                categoryFilter !== "all"
                  ? "Clear All Filters"
                  : "+ Add Photo"
              }
              onAction={
                searchQuery ||
                statusFilter !== "all" ||
                featuredFilter !== "all" ||
                categoryFilter !== "all"
                  ? () => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setFeaturedFilter("all");
                      setCategoryFilter("all");
                    }
                  : handleOpenCreateForm
              }
            />
          ) : (
            /* Gallery Photos Grid */
            <div
              className={`grid grid-cols-1 gap-5 ${
                isFormOpen
                  ? "sm:grid-cols-2 xl:grid-cols-3"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {filteredPhotos.map((photo) => (
                <div
                  key={photo._id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-all duration-200 hover:border-purple-200 hover:shadow-md"
                >
                  <div>
                    {/* Card Photo Section */}
                    <div
                      onClick={() => setPreviewPhoto(photo)}
                      className="relative h-44 sm:h-48 w-full overflow-hidden bg-stone-100 cursor-pointer"
                      title="Click to preview full image"
                    >
                      {photo.image ? (
                        <div
                          className="w-full h-full relative overflow-hidden"
                          style={{
                            transform:
                              (photo.cropPosition?.zoom ?? 1) > 1
                                ? `scale(${photo.cropPosition?.zoom})`
                                : undefined,
                            transformOrigin: `${photo.cropPosition?.x ?? 50}% ${photo.cropPosition?.y ?? 50}%`,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.image}
                            alt={photo.altText || photo.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                            style={{
                              objectPosition: `${photo.cropPosition?.x ?? 50}% ${photo.cropPosition?.y ?? 50}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-300">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}

                      {/* Floating Badges on top-right */}
                      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
                        {/* Published / Hidden Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-xs ${
                            photo.isActive
                              ? "bg-white/95 text-emerald-700 border border-emerald-200/80"
                              : "bg-white/95 text-stone-600 border border-stone-200/80"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              photo.isActive ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                          <span>{photo.isActive ? "Published" : "Hidden"}</span>
                        </span>

                        {/* Featured Pill */}
                        {photo.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED] text-white px-2.5 py-0.5 text-[11px] font-semibold shadow-xs">
                            <StarIcon className="h-3 w-3 fill-current" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 space-y-2.5">
                      {/* Title and Display Order */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight line-clamp-1">
                          {photo.title}
                        </h3>
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600 shrink-0">
                          #{photo.displayOrder ?? 0}
                        </span>
                      </div>

                      {/* Category Pill (Soft Blue Badge matching Mockup) */}
                      <div>
                        <span className="inline-block rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-0.5 text-xs font-medium">
                          {photo.category}
                        </span>
                      </div>

                      {/* Description Preview */}
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed min-h-[32px]">
                        {photo.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions (Edit, Hide/Publish, Feature/Unfeature, Delete) */}
                  <div className="p-4 sm:p-5 pt-0">
                    <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-stone-100 text-xs font-semibold">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(photo)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50/50 px-2 py-1.5 text-purple-700 hover:bg-purple-100/70 transition-all cursor-pointer"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Hide / Publish Toggle */}
                      <button
                        type="button"
                        disabled={togglingStatusId === photo._id}
                        onClick={() => handleToggleStatus(photo)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {photo.isActive ? (
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

                      {/* Feature / Unfeature Toggle */}
                      <button
                        type="button"
                        disabled={togglingFeaturedId === photo._id}
                        onClick={() => handleToggleFeatured(photo)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-stone-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <StarIcon
                          className={`h-3.5 w-3.5 ${
                            photo.isFeatured ? "fill-purple-600 text-purple-600" : ""
                          }`}
                        />
                        <span>{photo.isFeatured ? "Unfeature" : "Feature"}</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setPhotoToDelete(photo)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer"
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
        </div>

        {/* ======================================================== */}
        {/* RIGHT: ADD / EDIT PHOTO PANEL (MATCHES MOCKUP)            */}
        {/* ======================================================== */}
        {isFormOpen && (
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-md transition-all">
              {/* Panel Header */}
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    {editingId ? "Edit Photo" : "Add New Photo"}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {editingId
                      ? "Update this gallery photo information."
                      : "Upload a new gallery photo to display on your website."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                  aria-label="Close form"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
                {/* Gallery Image Upload */}
                <div>
                  <ImageUpload
                    folder={CLOUDINARY_FOLDERS.GALLERY}
                    value={form.image}
                    publicId={form.imagePublicId}
                    label="Gallery Image *"
                    description="PNG, JPG, WebP (Max 5MB)"
                    onChange={({ url, publicId }) => {
                      setForm((prev) => ({
                        ...prev,
                        image: url,
                        imagePublicId: publicId,
                      }));
                    }}
                    onRemove={() => {
                      setForm((prev) => ({
                        ...prev,
                        image: "",
                        imagePublicId: "",
                        cropPosition: { x: 50, y: 50, zoom: 1 },
                      }));
                    }}
                  />
                </div>

                {/* Interactive Adjust Image Section */}
                {form.image && (
                  <div>
                    <ImageCropAdjuster
                      imageUrl={form.image}
                      cropPosition={form.cropPosition}
                      onChange={(newCrop) =>
                        setForm((prev) => ({ ...prev, cropPosition: newCrop }))
                      }
                      isFeatured={form.isFeatured}
                      category={form.category}
                      title={form.title}
                      onPreviewFull={() =>
                        setPreviewPhoto({
                          _id: editingId || "temp-preview",
                          title: form.title || "Full Image Preview",
                          category: form.category || "Gallery",
                          description: form.description,
                          image: form.image,
                          imagePublicId: form.imagePublicId,
                          isActive: form.isActive,
                          isFeatured: form.isFeatured,
                          displayOrder: Number(form.displayOrder) || 0,
                          cropPosition: form.cropPosition,
                        })
                      }
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Hair Spa Treatment"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe this photo..."
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                  />
                </div>

                {/* Category with suggestions & custom entry */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="category-suggestions"
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      placeholder="e.g. Hair Treatments"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                    <datalist id="category-suggestions">
                      {availableCategoryOptions.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  {/* Quick Suggestions Pills */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-stone-400 mr-0.5">Quick select:</span>
                    {availableCategoryOptions.slice(0, 5).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                          form.category === cat
                            ? "bg-purple-100 text-purple-700 font-semibold"
                            : "bg-stone-100 hover:bg-purple-50 hover:text-purple-700 text-stone-600"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Display Order <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.displayOrder}
                      onChange={(e) =>
                        setForm({ ...form, displayOrder: e.target.value })
                      }
                      placeholder="e.g. 1"
                      className="w-24 rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                    <span className="text-xs text-stone-500">
                      Lower numbers appear first on the website
                    </span>
                  </div>
                </div>

                {/* Featured Photo Toggle Switch */}
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
                  <div>
                    <p className="text-xs font-semibold text-stone-800">
                      Featured Photo
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Show as featured in gallery
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isFeatured}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isFeatured: !prev.isFeatured,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 ${
                      form.isFeatured ? "bg-[#7C3AED]" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        form.isFeatured ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Published Toggle Switch */}
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
                  <div>
                    <p className="text-xs font-semibold text-stone-800">
                      Published
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Show this photo on the website
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: !prev.isActive,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 ${
                      form.isActive ? "bg-[#7C3AED]" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        form.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#6D28D9] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {formLoading && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>
                      {editingId ? "Save Changes" : "Add Photo"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* 5. CONFIRM DELETE MODAL                                    */}
      {/* ========================================================== */}
      <ConfirmModal
        isOpen={!!photoToDelete}
        onClose={() => !isDeleting && setPhotoToDelete(null)}
        onConfirm={handleExecuteDelete}
        title="Delete Gallery Photo?"
        message="Are you sure you want to permanently delete this gallery photo? This action cannot be undone."
        confirmText="Delete Photo"
        cancelText="Cancel"
        loading={isDeleting}
        variant="danger"
      />

      {/* ========================================================== */}
      {/* 6. IMAGE PREVIEW MODAL (LIGHTBOX)                          */}
      {/* ========================================================== */}
      {previewPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl cursor-default flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-0.5 text-xs font-medium">
                  {previewPhoto.category}
                </span>
                <h3 className="text-sm font-bold text-stone-900 truncate">
                  {previewPhoto.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
                aria-label="Close preview"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="relative flex-1 bg-stone-950 flex items-center justify-center max-h-[70vh] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.image}
                alt={previewPhoto.title}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Modal Caption */}
            {previewPhoto.description && (
              <div className="p-4 bg-white border-t border-stone-100">
                <p className="text-xs text-stone-600 leading-relaxed">
                  {previewPhoto.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
