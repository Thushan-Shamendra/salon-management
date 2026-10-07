"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import ImageUpload from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  UsersIcon,
  StarIcon,
  BriefcaseIcon,
  TagIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  SearchIcon,
  PlusIcon,
  XIcon,
  InstagramIcon,
  FacebookIcon,
  CheckCircleIcon,
  AlertCircleIcon,
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
  updatedAt?: string;
}

interface BeauticianFormState {
  name: string;
  jobTitle: string;
  bio: string;
  specialties: string[];
  experienceYears: string;
  image: string;
  imagePublicId: string;
  instagram: string;
  facebook: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: string;
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

const emptyForm: BeauticianFormState = {
  name: "",
  jobTitle: "",
  bio: "",
  specialties: [],
  experienceYears: "",
  image: "",
  imagePublicId: "",
  instagram: "",
  facebook: "",
  isActive: true,
  isFeatured: false,
  displayOrder: "0",
};

export default function AdminBeauticiansPage() {
  const [beauticians, setBeauticians] = useState<Beautician[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<BeauticianFormState>(emptyForm);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not-featured">("all");
  const [sortBy, setSortBy] = useState<"order" | "newest" | "oldest" | "exp-desc">("order");

  // Toggle loading states
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // Notification feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete modal state
  const [beauticianToDelete, setBeauticianToDelete] = useState<Beautician | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadBeauticians = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/beauticians");
      const data = await res.json();
      if (res.ok && data.success) {
        setBeauticians(data.beauticians || []);
      } else {
        showNotification("error", data.message || "Failed to load beauticians");
      }
    } catch {
      showNotification("error", "Network error loading beauticians");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch("/api/admin/beauticians");
        const data = await res.json();
        if (isMounted && res.ok && data.success) {
          setBeauticians(data.beauticians || []);
        } else if (isMounted) {
          showNotification("error", data.message || "Failed to load beauticians");
        }
      } catch {
        if (isMounted) showNotification("error", "Network error loading beauticians");
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
    const total = beauticians.length;
    const active = beauticians.filter((b) => b.isActive).length;
    const hidden = beauticians.filter((b) => !b.isActive).length;
    const featured = beauticians.filter((b) => b.isFeatured).length;

    return { total, active, hidden, featured };
  }, [beauticians]);

  // Filtered and sorted beauticians
  const filteredBeauticians = useMemo(() => {
    return beauticians
      .filter((b) => {
        // Status filter
        if (statusFilter === "active" && !b.isActive) return false;
        if (statusFilter === "hidden" && b.isActive) return false;

        // Featured filter
        if (featuredFilter === "featured" && !b.isFeatured) return false;
        if (featuredFilter === "not-featured" && b.isFeatured) return false;

        // Search query (name, job title, specialties, bio)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = b.name.toLowerCase().includes(q);
          const titleMatch = b.jobTitle.toLowerCase().includes(q);
          const specialtyMatch = b.specialties?.some((s) =>
            s.toLowerCase().includes(q)
          );
          const bioMatch = (b.bio || "").toLowerCase().includes(q);
          return nameMatch || titleMatch || specialtyMatch || bioMatch;
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
        if (sortBy === "exp-desc") {
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        }
        return 0;
      });
  }, [beauticians, statusFilter, featuredFilter, searchQuery, sortBy]);

  // Open Form for Create
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      displayOrder: String(beauticians.length + 1),
    });
    setCustomSpecialty("");
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditForm = (b: Beautician) => {
    setEditingId(b._id);
    setForm({
      name: b.name,
      jobTitle: b.jobTitle,
      bio: b.bio || "",
      specialties: [...(b.specialties || [])],
      experienceYears: String(b.experienceYears ?? 0),
      image: b.image,
      imagePublicId: b.imagePublicId,
      instagram: b.instagram || "",
      facebook: b.facebook || "",
      isActive: b.isActive,
      isFeatured: b.isFeatured,
      displayOrder: String(b.displayOrder ?? 0),
    });
    setCustomSpecialty("");
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setCustomSpecialty("");
  };

  // Specialties helpers
  const handleAddPresetSpecialty = (preset: string) => {
    if (!form.specialties.includes(preset)) {
      setForm((prev) => ({
        ...prev,
        specialties: [...prev.specialties, preset],
      }));
    }
  };

  const handleAddCustomSpecialty = () => {
    const trimmed = customSpecialty.trim();
    if (!trimmed) return;
    if (!form.specialties.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        specialties: [...prev.specialties, trimmed],
      }));
    }
    setCustomSpecialty("");
  };

  const handleRemoveSpecialty = (spec: string) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s !== spec),
    }));
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showNotification("error", "Full Name is required.");
      return;
    }
    if (!form.jobTitle.trim()) {
      showNotification("error", "Job Title is required.");
      return;
    }
    if (!form.image || !form.imagePublicId) {
      showNotification("error", "Profile Photo is required. Please upload an image.");
      return;
    }
    const expNum = Number(form.experienceYears);
    if (isNaN(expNum) || expNum < 0 || expNum > 60) {
      showNotification("error", "Years of experience must be between 0 and 60.");
      return;
    }
    if (form.specialties.length === 0) {
      showNotification("error", "Please add at least one specialty.");
      return;
    }

    if (form.instagram.trim()) {
      try {
        const u = new URL(form.instagram.trim());
        if (u.protocol !== "https:") throw new Error();
      } catch {
        showNotification(
          "error",
          "Instagram URL must be a valid https link (e.g. https://instagram.com/username)."
        );
        return;
      }
    }

    if (form.facebook.trim()) {
      try {
        const u = new URL(form.facebook.trim());
        if (u.protocol !== "https:") throw new Error();
      } catch {
        showNotification(
          "error",
          "Facebook URL must be a valid https link (e.g. https://facebook.com/username)."
        );
        return;
      }
    }

    setFormLoading(true);

    try {
      const url = editingId
        ? `/api/admin/beauticians/${editingId}`
        : "/api/admin/beauticians";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        jobTitle: form.jobTitle.trim(),
        bio: form.bio.trim(),
        specialties: form.specialties,
        experienceYears: Number(form.experienceYears) || 0,
        image: form.image,
        imagePublicId: form.imagePublicId,
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        displayOrder: Number(form.displayOrder) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to save beautician");
        return;
      }

      showNotification(
        "success",
        editingId
          ? `Updated "${form.name}" successfully.`
          : `Added "${form.name}" to the team.`
      );

      handleCloseForm();
      await loadBeauticians();
    } catch {
      showNotification("error", "Network error saving beautician profile");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Active / Hidden Status
  const handleToggleStatus = async (b: Beautician) => {
    try {
      setTogglingStatusId(b._id);
      const res = await fetch(`/api/admin/beauticians/${b._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !b.isActive }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          "success",
          `Beautician "${b.name}" is now ${!b.isActive ? "visible on website" : "hidden"}.`
        );
        setBeauticians((prev) =>
          prev.map((item) =>
            item._id === b._id ? { ...item, isActive: !item.isActive } : item
          )
        );
      } else {
        showNotification("error", data.message || "Failed to update visibility");
      }
    } catch {
      showNotification("error", "Network error updating visibility");
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Toggle Featured Status
  const handleToggleFeatured = async (b: Beautician) => {
    try {
      setTogglingFeaturedId(b._id);
      const res = await fetch(`/api/admin/beauticians/${b._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !b.isFeatured }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          "success",
          `Beautician "${b.name}" is now ${!b.isFeatured ? "featured" : "unfeatured"}.`
        );
        setBeauticians((prev) =>
          prev.map((item) =>
            item._id === b._id ? { ...item, isFeatured: !item.isFeatured } : item
          )
        );
      } else {
        showNotification("error", data.message || "Failed to update featured status");
      }
    } catch {
      showNotification("error", "Network error updating featured status");
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  // Delete Action via ConfirmModal
  const handleExecuteDelete = async () => {
    if (!beauticianToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/beauticians/${beauticianToDelete._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(
          "success",
          `Deleted "${beauticianToDelete.name}" successfully.`
        );
        setBeauticians((prev) =>
          prev.filter((item) => item._id !== beauticianToDelete._id)
        );
        setBeauticianToDelete(null);

        if (editingId === beauticianToDelete._id) {
          handleCloseForm();
        }
      } else {
        showNotification("error", data.message || "Failed to delete beautician");
      }
    } catch {
      showNotification("error", "Network error deleting beautician");
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
        title="Beauticians"
        description="Manage the beauty professionals displayed on the INVORA website."
        breadcrumbs={[{ label: "Beauticians" }]}
        action={
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Beautician</span>
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
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. STATS ROW (4 CARDS MATCHING MOCKUP)                     */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Beauticians */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Total Beauticians</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.total}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              All beauticians in database
            </p>
          </div>
        </div>

        {/* Active Beauticians */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Active Beauticians</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.active}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Currently visible on website
            </p>
          </div>
        </div>

        {/* Hidden Beauticians */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
            <EyeOffIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Hidden Beauticians</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.hidden}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Not visible on website
            </p>
          </div>
        </div>

        {/* Featured Beauticians */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <StarIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Featured Beauticians</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.featured}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search beauticians by name, job title or specialties..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden lg:inline">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "hidden")
              }
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="all">All Beauticians</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          {/* Featured Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden lg:inline">
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

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden lg:inline">
              Sort By
            </span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "order" | "newest" | "oldest" | "exp-desc"
                )
              }
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="order">Display Order</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="exp-desc">Experience: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 4. MAIN CONTENT AREA: BEAUTICIANS GRID + ADD/EDIT PANEL    */}
      {/* ========================================================== */}
      <div
        className={
          isFormOpen
            ? "grid grid-cols-1 lg:grid-cols-12 gap-7 items-start"
            : "block"
        }
      >
        {/* ======================================================== */}
        {/* LEFT: BEAUTICIANS GRID                                   */}
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
                  <div className="h-48 w-full rounded-xl bg-stone-200" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-stone-200" />
                    <div className="h-3 w-1/2 rounded bg-stone-100" />
                    <div className="h-3 w-2/3 rounded bg-stone-100" />
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
          ) : filteredBeauticians.length === 0 ? (
            /* Empty State */
            <EmptyState
              icon={UsersIcon}
              title={
                searchQuery || statusFilter !== "all" || featuredFilter !== "all"
                  ? "No beauticians found matching criteria"
                  : "No beauticians added yet"
              }
              description={
                searchQuery || statusFilter !== "all" || featuredFilter !== "all"
                  ? "Try clearing your search query or reset your status filters."
                  : "Start creating your salon beauty professional profiles to showcase on the website."
              }
              actionText={
                searchQuery || statusFilter !== "all" || featuredFilter !== "all"
                  ? "Clear All Filters"
                  : "+ Add Beautician"
              }
              onAction={
                searchQuery || statusFilter !== "all" || featuredFilter !== "all"
                  ? () => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setFeaturedFilter("all");
                    }
                  : handleOpenCreateForm
              }
            />
          ) : (
            /* Beauticians Cards Grid */
            <div
              className={`grid grid-cols-1 gap-5 ${
                isFormOpen
                  ? "sm:grid-cols-2 xl:grid-cols-3"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {filteredBeauticians.map((b) => (
                <div
                  key={b._id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-all duration-200 hover:border-purple-200 hover:shadow-md"
                >
                  <div>
                    {/* Card Photo Section */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-100">
                      {b.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.image}
                          alt={b.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-300">
                          <UsersIcon className="h-12 w-12" />
                        </div>
                      )}

                      {/* Floating Badges on top-right */}
                      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                        {/* Active / Hidden Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-xs ${
                            b.isActive
                              ? "bg-white/95 text-emerald-700 border border-emerald-200/80"
                              : "bg-white/95 text-stone-600 border border-stone-200/80"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              b.isActive ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                          <span>{b.isActive ? "Active" : "Hidden"}</span>
                        </span>

                        {/* Featured Pill */}
                        {b.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED] text-white px-2.5 py-0.5 text-[11px] font-semibold shadow-xs">
                            <StarIcon className="h-3 w-3 fill-current" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Name and Display Order */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight line-clamp-1">
                          {b.name}
                        </h3>
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600 shrink-0">
                          #{b.displayOrder ?? 0}
                        </span>
                      </div>

                      {/* Job Title */}
                      <p className="text-xs font-medium text-stone-500 -mt-1.5">
                        {b.jobTitle}
                      </p>

                      {/* Experience */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                        <BriefcaseIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span>{b.experienceYears || 0}+ Years Experience</span>
                      </div>

                      {/* Specialties */}
                      <div className="flex items-start gap-1.5 text-xs text-stone-500">
                        <TagIcon className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">
                          {b.specialties && b.specialties.length > 0
                            ? b.specialties.join(" • ")
                            : "No specialties specified"}
                        </span>
                      </div>

                      {/* Social Links */}
                      {(b.instagram || b.facebook) && (
                        <div className="flex items-center gap-2 pt-1">
                          {b.instagram && (
                            <a
                              href={b.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
                              title="View Instagram"
                            >
                              <InstagramIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {b.facebook && (
                            <a
                              href={b.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="View Facebook"
                            >
                              <FacebookIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions (Edit, Hide/Publish, Feature/Unfeature, Delete) */}
                  <div className="p-4 sm:p-5 pt-0">
                    <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-stone-100 text-xs font-semibold">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(b)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50/50 px-2 py-1.5 text-purple-700 hover:bg-purple-100/70 transition-all cursor-pointer"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Hide / Publish Toggle */}
                      <button
                        type="button"
                        disabled={togglingStatusId === b._id}
                        onClick={() => handleToggleStatus(b)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-50"
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

                      {/* Feature / Unfeature Toggle */}
                      <button
                        type="button"
                        disabled={togglingFeaturedId === b._id}
                        onClick={() => handleToggleFeatured(b)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-stone-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <StarIcon
                          className={`h-3.5 w-3.5 ${
                            b.isFeatured ? "fill-purple-600 text-purple-600" : ""
                          }`}
                        />
                        <span>{b.isFeatured ? "Unfeature" : "Feature"}</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setBeauticianToDelete(b)}
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
        {/* RIGHT: ADD / EDIT BEAUTICIAN PANEL (MATCHES MOCKUP)       */}
        {/* ======================================================== */}
        {isFormOpen && (
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-md transition-all">
              {/* Panel Header */}
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    {editingId ? "Edit Beautician" : "Add New Beautician"}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {editingId
                      ? "Update this beautician profile for your website."
                      : "Create a new beautician profile to display on your website."}
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
                {/* Profile Photo Upload */}
                <div>
                  <ImageUpload
                    folder={CLOUDINARY_FOLDERS.BEAUTICIANS}
                    value={form.image}
                    publicId={form.imagePublicId}
                    label="Profile Photo *"
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
                      }));
                    }}
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Nadee Silva"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.jobTitle}
                    onChange={(e) =>
                      setForm({ ...form, jobTitle: e.target.value })
                    }
                    placeholder="e.g. Hair Stylist"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) =>
                      setForm({ ...form, bio: e.target.value })
                    }
                    placeholder="Tell us about this beautician..."
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                  />
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="60"
                    value={form.experienceYears}
                    onChange={(e) =>
                      setForm({ ...form, experienceYears: e.target.value })
                    }
                    placeholder="e.g. 5"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                {/* Specialties Chip Input */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Specialties <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Selected Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-xl border border-stone-200 bg-stone-50/40 min-h-[38px] items-center">
                    {form.specialties.length === 0 ? (
                      <span className="text-xs text-stone-400 italic">
                        No specialties added yet
                      </span>
                    ) : (
                      form.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-1 text-xs font-medium"
                        >
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialty(spec)}
                            className="rounded-full p-0.5 hover:bg-purple-200/60 text-purple-600 transition-colors cursor-pointer"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSpecialty();
                        }
                      }}
                      placeholder="Add a specialty..."
                      className="flex-1 rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSpecialty}
                      className="rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-stone-400 mr-0.5">Quick add:</span>
                    {PRESET_SPECIALTIES.filter(
                      (preset) => !form.specialties.includes(preset)
                    )
                      .slice(0, 5)
                      .map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddPresetSpecialty(preset)}
                          className="rounded-lg bg-stone-100 hover:bg-purple-50 hover:text-purple-700 px-2 py-0.5 text-[11px] text-stone-600 transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Instagram URL */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Instagram URL
                  </label>
                  <div className="relative">
                    <InstagramIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500 pointer-events-none" />
                    <input
                      type="url"
                      value={form.instagram}
                      onChange={(e) =>
                        setForm({ ...form, instagram: e.target.value })
                      }
                      placeholder="https://instagram.com/username"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                {/* Facebook URL */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Facebook URL
                  </label>
                  <div className="relative">
                    <FacebookIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 pointer-events-none" />
                    <input
                      type="url"
                      value={form.facebook}
                      onChange={(e) =>
                        setForm({ ...form, facebook: e.target.value })
                      }
                      placeholder="https://facebook.com/username"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Display Order
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
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

                {/* Featured Beautician Toggle Switch */}
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
                  <div>
                    <p className="text-xs font-semibold text-stone-800">
                      Featured Beautician
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Show as featured on the website
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

                {/* Active Toggle Switch */}
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
                  <div>
                    <p className="text-xs font-semibold text-stone-800">
                      Active
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Show this beautician on the website
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
                      {editingId ? "Save Changes" : "Add Beautician"}
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
        isOpen={!!beauticianToDelete}
        onClose={() => !isDeleting && setBeauticianToDelete(null)}
        onConfirm={handleExecuteDelete}
        title="Delete Beautician"
        message={`Are you sure you want to delete "${beauticianToDelete?.name}"? This will permanently remove their profile and delete the photo from Cloudinary.`}
        confirmText="Delete Beautician"
        cancelText="Cancel"
        loading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
