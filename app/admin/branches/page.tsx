"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminButton from "@/components/admin/AdminButton";
import {
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
  MailIcon,
  ClockIcon,
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
  ExternalLinkIcon,
  SparklesIcon,
} from "@/components/ui/icons";

interface OpeningHour {
  day: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

interface Branch {
  _id: string;
  name: string;
  slug: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  googlePlaceId?: string;
  googleReviewUrl?: string;
  reviewsEnabled?: boolean;
  openingHours: OpeningHour[];
  isActive: boolean;
  displayOrder: number;
  isMain?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BranchFormState {
  name: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  latitude: string;
  longitude: string;
  googleMapsUrl: string;
  googlePlaceId: string;
  googleReviewUrl: string;
  reviewsEnabled: boolean;
  displayOrder: string;
  isActive: boolean;
  openingHours: OpeningHour[];
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultOpeningHours: OpeningHour[] = WEEKDAYS.map((day) => ({
  day,
  isClosed: day === "Sunday" ? false : false,
  openTime: "09:00",
  closeTime: day === "Sunday" ? "17:00" : "19:00",
}));

const emptyForm: BranchFormState = {
  name: "",
  phone: "",
  whatsappNumber: "",
  email: "",
  address: "",
  latitude: "",
  longitude: "",
  googleMapsUrl: "",
  googlePlaceId: "",
  googleReviewUrl: "",
  reviewsEnabled: false,
  displayOrder: "0",
  isActive: true,
  openingHours: defaultOpeningHours,
};

function formatTime(t?: string): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

function getOpeningHoursSummary(hours: OpeningHour[]): string {
  if (!hours || hours.length === 0) return "Hours not specified";

  const openDays = hours.filter((h) => !h.isClosed);
  if (openDays.length === 0) return "Closed all days";

  const mon = hours.find((h) => h.day.toLowerCase() === "monday");
  const sun = hours.find((h) => h.day.toLowerCase() === "sunday");

  if (mon && !mon.isClosed && mon.openTime && mon.closeTime) {
    const mainTime = `${formatTime(mon.openTime)} - ${formatTime(mon.closeTime)}`;
    if (sun?.isClosed) {
      return `Mon–Sat: ${mainTime} (Sun: Closed)`;
    }
    if (sun && !sun.isClosed && sun.openTime && sun.closeTime) {
      return `Mon–Sat: ${mainTime} (Sun: ${formatTime(sun.openTime)} - ${formatTime(sun.closeTime)})`;
    }
    return `Mon–Sat: ${mainTime}`;
  }

  const firstOpen = openDays[0];
  return `${firstOpen.day}: ${formatTime(firstOpen.openTime)} - ${formatTime(firstOpen.closeTime)} (+${openDays.length - 1} days)`;
}

function AdminBranchesPageContent() {
  const searchParams = useSearchParams();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<BranchFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const isInitialAdd = searchParams?.get("action") === "new" || searchParams?.get("add") === "true";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(isInitialAdd);

  // Auto-open Add Form if action=new or add=true query parameter is present
  useEffect(() => {
    if (searchParams?.get("action") === "new" || searchParams?.get("add") === "true") {
      const timer = setTimeout(() => {
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
        setIsFormOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [sortBy, setSortBy] = useState<"order" | "newest" | "oldest">("order");

  // Notification feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete modal state
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const loadBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/branches");
      const data = await res.json();
      if (res.ok && data.success) {
        setBranches(data.branches || []);
      } else {
        showNotification("error", data.message || "Failed to load branches");
      }
    } catch {
      showNotification("error", "Network error loading branches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch("/api/admin/branches");
        const data = await res.json();
        if (isMounted && res.ok && data.success) {
          setBranches(data.branches || []);
        } else if (isMounted) {
          showNotification("error", data.message || "Failed to load branches");
        }
      } catch {
        if (isMounted) showNotification("error", "Network error loading branches");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.isActive).length;
    const hidden = branches.filter((b) => !b.isActive).length;
    return { total, active, hidden };
  }, [branches]);

  // Filtered and sorted branches
  const filteredBranches = useMemo(() => {
    return branches
      .filter((branch) => {
        if (statusFilter === "active" && !branch.isActive) return false;
        if (statusFilter === "hidden" && branch.isActive) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = branch.name.toLowerCase().includes(q);
          const addressMatch = (branch.address || "").toLowerCase().includes(q);
          const phoneMatch = (branch.phone || "").toLowerCase().includes(q);
          const emailMatch = (branch.email || "").toLowerCase().includes(q);
          return nameMatch || addressMatch || phoneMatch || emailMatch;
        }

        return true;
      })
      .sort((a, b) => {
        // Main branch always comes first
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;

        if (sortBy === "order") {
          if (a.displayOrder !== b.displayOrder) {
            return (a.displayOrder || 0) - (b.displayOrder || 0);
          }
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        return 0;
      });
  }, [branches, searchQuery, statusFilter, sortBy]);

  // Open add modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (branch: Branch) => {
    setEditingId(branch._id);

    // Merge existing branch hours with default weekdays to ensure all 7 days present
    const branchHoursMap = new Map((branch.openingHours || []).map((h) => [h.day.toLowerCase(), h]));
    const completeHours = WEEKDAYS.map((day) => {
      const existing = branchHoursMap.get(day.toLowerCase());
      if (existing) {
        return {
          day,
          isClosed: Boolean(existing.isClosed),
          openTime: existing.openTime || "09:00",
          closeTime: existing.closeTime || "19:00",
        };
      }
      return {
        day,
        isClosed: false,
        openTime: "09:00",
        closeTime: day === "Sunday" ? "17:00" : "19:00",
      };
    });

    setForm({
      name: branch.name,
      phone: branch.phone,
      whatsappNumber: branch.whatsappNumber || "",
      email: branch.email || "",
      address: branch.address,
      latitude: branch.latitude !== undefined && branch.latitude !== null ? branch.latitude.toString() : "",
      longitude: branch.longitude !== undefined && branch.longitude !== null ? branch.longitude.toString() : "",
      googleMapsUrl: branch.googleMapsUrl || "",
      googlePlaceId: branch.googlePlaceId || "",
      googleReviewUrl: branch.googleReviewUrl || "",
      reviewsEnabled: Boolean(branch.reviewsEnabled),
      displayOrder: (branch.displayOrder ?? 0).toString(),
      isActive: branch.isActive,
      openingHours: completeHours,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  // Toggle active status
  const handleToggleActive = async (branch: Branch) => {
    try {
      const res = await fetch(`/api/admin/branches/${branch._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !branch.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBranches((prev) =>
          prev.map((b) => (b._id === branch._id ? { ...b, isActive: !b.isActive } : b))
        );
        showNotification(
          "success",
          `Branch "${branch.name}" ${!branch.isActive ? "published" : "hidden"} successfully.`
        );
      } else {
        showNotification("error", data.message || "Failed to update branch status");
      }
    } catch {
      showNotification("error", "Network error updating branch status");
    }
  };

  // Validate form client-side
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = "Branch name is required";
    }

    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    if (!form.address.trim()) {
      errors.address = "Address is required";
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (form.latitude.trim()) {
      const lat = Number(form.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = "Latitude must be a valid number between -90 and 90";
      }
    }

    if (form.longitude.trim()) {
      const lng = Number(form.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitude = "Longitude must be a valid number between -180 and 180";
      }
    }

    if (form.googleMapsUrl.trim()) {
      try {
        const u = new URL(form.googleMapsUrl.trim());
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          errors.googleMapsUrl = "Google Maps URL must start with http:// or https://";
        }
      } catch {
        errors.googleMapsUrl = "Please enter a valid URL";
      }
    }

    if (form.googleReviewUrl.trim()) {
      try {
        const u = new URL(form.googleReviewUrl.trim());
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          errors.googleReviewUrl = "Google Review URL must start with http:// or https://";
        }
      } catch {
        errors.googleReviewUrl = "Please enter a valid review URL";
      }
    }

    if (form.displayOrder.trim()) {
      const ord = Number(form.displayOrder);
      if (isNaN(ord) || ord < 0) {
        errors.displayOrder = "Display order must be a non-negative number";
      }
    }

    // Opening hours validation
    for (const h of form.openingHours) {
      if (!h.isClosed && (!h.openTime || !h.closeTime)) {
        errors.openingHours = `Both open and close time are required for ${h.day} when open`;
        break;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification("error", "Please fix validation errors before saving.");
      return;
    }

    setFormLoading(true);

    try {
      const url = editingId ? `/api/admin/branches/${editingId}` : "/api/admin/branches";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
        longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
        googleMapsUrl: form.googleMapsUrl.trim(),
        googlePlaceId: form.googlePlaceId.trim(),
        googleReviewUrl: form.googleReviewUrl.trim(),
        reviewsEnabled: form.reviewsEnabled,
        displayOrder: form.displayOrder.trim() ? Number(form.displayOrder) : 0,
        isActive: form.isActive,
        openingHours: form.openingHours,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to save branch");
        return;
      }

      showNotification(
        "success",
        editingId ? "Branch updated successfully" : "Branch created successfully"
      );
      handleCloseForm();
      loadBranches();
    } catch {
      showNotification("error", "Network error saving branch");
    } finally {
      setFormLoading(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;

    if (branchToDelete.isMain) {
      showNotification("error", "Main branch cannot be deleted. Its details are managed in Website Settings.");
      setBranchToDelete(null);
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/branches/${branchToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification("success", `Branch "${branchToDelete.name}" deleted successfully`);
        setBranches((prev) => prev.filter((b) => b._id !== branchToDelete._id));
        setBranchToDelete(null);
      } else {
        showNotification("error", data.message || "Failed to delete branch");
      }
    } catch {
      showNotification("error", "Network error deleting branch");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================== */}
      {/* 1. HEADER (MATCHES SALVORA ADMIN DESIGN)                   */}
      {/* ========================================================== */}
      <AdminPageHeader
        title="Branches"
        description="Manage SALVORA salon locations and contact details."
        breadcrumbs={[{ label: "Branches" }]}
        action={
          <AdminButton
            type="button"
            variant="primary"
            size="md"
            icon={PlusIcon}
            onClick={handleOpenAdd}
          >
            Add Branch
          </AdminButton>
        }
      />

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs sm:text-sm font-medium shadow-xs transition-all animate-fadeIn ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircleIcon className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. STATS ROW                                               */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Branches */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <MapPinIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Total Branches</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.total}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">All registered salon locations</p>
          </div>
        </div>

        {/* Active Branches */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Active</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.active}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">Visible on public contact page</p>
          </div>
        </div>

        {/* Hidden Branches */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
            <EyeOffIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Hidden</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.hidden}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">Not visible to public visitors</p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. SEARCH & FILTER TOOLBAR                                 */}
      {/* ========================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branches by name, city, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-[#7C3AED] focus:outline-hidden transition-all text-stone-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold text-stone-600">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-white text-stone-900 shadow-2xs" : "hover:text-stone-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "active" ? "bg-white text-emerald-700 shadow-2xs" : "hover:text-stone-900"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("hidden")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "hidden" ? "bg-white text-rose-600 shadow-2xs" : "hover:text-stone-900"
              }`}
            >
              Hidden
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "order" | "newest" | "oldest")}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 focus:border-[#7C3AED] focus:outline-hidden transition-all cursor-pointer"
          >
            <option value="order">Display Order</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 4. BRANCH CARDS / TABLE LIST                               */}
      {/* ========================================================== */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-stone-200 rounded-lg" />
                <div className="h-5 w-16 bg-stone-200 rounded-full" />
              </div>
              <div className="h-4 w-48 bg-stone-100 rounded-md" />
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-stone-100 rounded-md" />
                <div className="h-4 w-3/4 bg-stone-100 rounded-md" />
              </div>
              <div className="h-9 w-full bg-stone-100 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={MapPinIcon}
          title={searchQuery ? "No matching branches found" : "No branches configured yet"}
          description={
            searchQuery
              ? `No branches match your search "${searchQuery}". Try a different search term or clear filters.`
              : "Create your first SALVORA salon branch location to display on the contact page."
          }
          actionText={searchQuery ? undefined : "+ Add Branch"}
          onAction={searchQuery ? undefined : handleOpenAdd}
        />
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => {
            const hoursSummary = getOpeningHoursSummary(branch.openingHours);

            return (
              <div
                key={branch._id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs hover:border-purple-200 hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Top Bar: Name, Order, Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                          {branch.name}
                        </h3>
                        {branch.isMain && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-[#7C3AED] border border-purple-200 shadow-2xs">
                            <SparklesIcon className="h-3 w-3" />
                            <span>Main Branch</span>
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md" title="Display Order">
                          #{branch.displayOrder ?? 0}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-mono mt-0.5">/{branch.slug}</p>
                    </div>

                    <StatusBadge
                      status={branch.isActive ? "active" : "hidden"}
                      label={branch.isActive ? "Active" : "Hidden"}
                    />
                  </div>

                  {/* Contact Info List */}
                  <div className="space-y-2.5 text-xs text-stone-600 mt-4 pt-3 border-t border-stone-100">
                    {/* Address */}
                    <div className="flex items-start gap-2.5">
                      <MapPinIcon className="h-4 w-4 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span className="leading-relaxed line-clamp-2">{branch.address}</span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2.5">
                      <PhoneIcon className="h-4 w-4 text-stone-400 shrink-0" />
                      <a
                        href={`tel:${branch.phone}`}
                        className="font-medium text-stone-800 hover:text-[#7C3AED] transition-colors"
                      >
                        {branch.phone}
                      </a>
                    </div>

                    {/* WhatsApp */}
                    {branch.whatsappNumber && (
                      <div className="flex items-center gap-2.5">
                        <WhatsAppIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-stone-700">{branch.whatsappNumber}</span>
                      </div>
                    )}

                    {/* Email */}
                    {branch.email && (
                      <div className="flex items-center gap-2.5">
                        <MailIcon className="h-4 w-4 text-stone-400 shrink-0" />
                        <a
                          href={`mailto:${branch.email}`}
                          className="text-stone-700 hover:text-[#7C3AED] transition-colors truncate"
                        >
                          {branch.email}
                        </a>
                      </div>
                    )}

                    {/* Opening Hours Summary */}
                    <div className="flex items-start gap-2.5 pt-1">
                      <ClockIcon className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                      <span className="text-stone-600 text-[11px] leading-relaxed">
                        {hoursSummary}
                      </span>
                    </div>

                    {/* Coordinates / Map URL info */}
                    {(branch.latitude !== undefined || branch.googleMapsUrl) && (
                      <div className="flex items-center gap-2 text-[11px] text-stone-400 pt-1">
                        {branch.latitude !== undefined && branch.longitude !== undefined && (
                          <span className="bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                            {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                          </span>
                        )}
                        {branch.googleMapsUrl && (
                          <a
                            href={branch.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#7C3AED] hover:underline"
                          >
                            <span>Map Link</span>
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Google Reviews Badge */}
                    <div className="pt-1 flex items-center gap-1.5 text-[11px]">
                      {branch.reviewsEnabled && branch.googlePlaceId ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200">
                          <StarIcon className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>Google Reviews Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-500">
                          <span>Google Reviews Disabled</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Bottom */}
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  {/* Hide / Publish toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(branch)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      branch.isActive
                        ? "text-stone-600 hover:bg-stone-100"
                        : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    }`}
                  >
                    {branch.isActive ? (
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

                  <div className="flex items-center gap-1.5">
                    {branch.isMain && (
                      <Link
                        href="/admin/settings"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:underline px-2.5 py-1.5 bg-purple-50 rounded-xl border border-purple-100 transition mr-1"
                        title="Configure in Website Settings"
                      >
                        <span>Settings</span>
                        <ExternalLinkIcon className="h-3 w-3" />
                      </Link>
                    )}

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(branch)}
                      className="p-2 rounded-xl text-stone-600 hover:text-[#7C3AED] hover:bg-purple-50 transition-colors cursor-pointer"
                      title="Edit Branch"
                      aria-label={`Edit ${branch.name}`}
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    {branch.isMain ? (
                      <span
                        className="p-2 rounded-xl text-stone-300 cursor-not-allowed inline-flex items-center"
                        title="Main Branch cannot be deleted"
                      >
                        <TrashIcon className="h-4 w-4 text-stone-300" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBranchToDelete(branch)}
                        className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Branch"
                        aria-label={`Delete ${branch.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================== */}
      {/* 5. ADD / EDIT BRANCH MODAL (CENTERED DIALOG)               */}
      {/* ========================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          {/* Backdrop Click */}
          <div className="fixed inset-0" onClick={handleCloseForm} aria-hidden="true" />

          {/* Dialog Container */}
          <div className="relative w-full max-w-3xl rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-2xl transition-all my-8 z-10 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                    {editingId ? "Edit Branch" : "Add New Branch"}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {editingId ? "Update salon branch details and opening hours" : "Add a new SALVORA location to your salon network"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Form Scrollable Body */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto py-5 space-y-6 flex-1 pr-1">
              {/* General Form Error Alert */}
              {Object.keys(formErrors).length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Please check the required fields:</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {Object.values(formErrors).map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Branch Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                      }}
                      placeholder="e.g. SALVORA Malabe or Colombo 07"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all ${
                        formErrors.name
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-stone-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => {
                        setForm({ ...form, phone: e.target.value });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                      }}
                      placeholder="e.g. +94 11 234 5678"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all ${
                        formErrors.phone
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-stone-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={form.whatsappNumber}
                      onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                      placeholder="e.g. +94 77 123 4567"
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                      }}
                      placeholder="e.g. malabe@salvora.lk"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all ${
                        formErrors.email
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-stone-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Display Order */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                    />
                    <p className="text-[11px] text-stone-400 mt-0.5">Lower numbers display first (0, 1, 2...)</p>
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Physical Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={form.address}
                      onChange={(e) => {
                        setForm({ ...form, address: e.target.value });
                        if (formErrors.address) setFormErrors({ ...formErrors, address: "" });
                      }}
                      placeholder="Full street address and city"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all resize-y ${
                        formErrors.address
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-stone-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                      }`}
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Map & Coordinates Section */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Location & Map Details (Optional)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Latitude */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Latitude (-90 to 90)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) => {
                        setForm({ ...form, latitude: e.target.value });
                        if (formErrors.latitude) setFormErrors({ ...formErrors, latitude: "" });
                      }}
                      placeholder="e.g. 6.9044"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all ${
                        formErrors.latitude
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-stone-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                      }`}
                    />
                    {formErrors.latitude && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.latitude}</p>
                    )}
                  </div>

                  {/* Longitude */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Longitude (-180 to 180)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) => {
                        setForm({ ...form, longitude: e.target.value });
                        if (formErrors.longitude) setFormErrors({ ...formErrors, longitude: "" });
                      }}
                      placeholder="e.g. 79.9542"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all ${
                        formErrors.longitude
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-stone-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                      }`}
                    />
                    {formErrors.longitude && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.longitude}</p>
                    )}
                  </div>

                  {/* Google Maps URL */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Google Maps URL
                    </label>
                    <input
                      type="url"
                      value={form.googleMapsUrl}
                      onChange={(e) => {
                        setForm({ ...form, googleMapsUrl: e.target.value });
                        if (formErrors.googleMapsUrl) setFormErrors({ ...formErrors, googleMapsUrl: "" });
                      }}
                      placeholder="https://maps.google.com/?q=..."
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all ${
                        formErrors.googleMapsUrl
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-stone-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                      }`}
                    />
                    {formErrors.googleMapsUrl && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.googleMapsUrl}</p>
                    )}
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Optional: if coordinates are not provided, map will automatically embed using coordinates or address.
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Reviews Configuration */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Google Reviews Configuration
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Configure Google reviews and review submission link for this branch location.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.reviewsEnabled}
                      onChange={(e) => setForm({ ...form, reviewsEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C3AED]" />
                    <span className="ml-2.5 text-xs font-semibold text-stone-700">
                      {form.reviewsEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Google Place ID */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Google Place ID
                    </label>
                    <input
                      type="text"
                      value={form.googlePlaceId}
                      onChange={(e) => setForm({ ...form, googlePlaceId: e.target.value })}
                      placeholder="e.g. ChIJ..."
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                    />
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Required to fetch Google ratings and reviews for this branch.
                    </p>
                  </div>

                  {/* Google Review URL */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Write a Review URL
                    </label>
                    <input
                      type="url"
                      value={form.googleReviewUrl}
                      onChange={(e) => {
                        setForm({ ...form, googleReviewUrl: e.target.value });
                        if (formErrors.googleReviewUrl) setFormErrors({ ...formErrors, googleReviewUrl: "" });
                      }}
                      placeholder="https://g.page/r/.../review"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all ${
                        formErrors.googleReviewUrl
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-stone-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200/50"
                      }`}
                    />
                    {formErrors.googleReviewUrl && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.googleReviewUrl}</p>
                    )}
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Direct review URL used for the branch &quot;Write a Review&quot; button.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Branch Status</h4>
                  <p className="text-xs text-stone-500">
                    Active branches are visible to visitors on the website contact page.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C3AED]" />
                  <span className="ml-3 text-xs font-semibold text-stone-700">
                    {form.isActive ? "Active" : "Hidden"}
                  </span>
                </label>
              </div>

              {/* Opening Hours Schedule Section */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Opening Hours Schedule
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Set operating hours for each day of the week.
                    </p>
                  </div>
                </div>

                {formErrors.openingHours && (
                  <p className="text-xs text-red-600 font-medium">{formErrors.openingHours}</p>
                )}

                <div className="space-y-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
                  {form.openingHours.map((hour, index) => (
                    <div
                      key={hour.day}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        hour.isClosed
                          ? "bg-stone-100/70 border-stone-200 opacity-70"
                          : "bg-white border-stone-200/90 shadow-2xs"
                      }`}
                    >
                      {/* Day and Closed Toggle */}
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <input
                          type="checkbox"
                          id={`closed-${hour.day}`}
                          checked={hour.isClosed}
                          onChange={(e) => {
                            const newHours = [...form.openingHours];
                            newHours[index] = { ...hour, isClosed: e.target.checked };
                            setForm({ ...form, openingHours: newHours });
                          }}
                          className="h-4 w-4 rounded border-stone-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <label
                          htmlFor={`closed-${hour.day}`}
                          className="text-xs font-semibold text-stone-800 cursor-pointer select-none"
                        >
                          {hour.day}
                          {hour.isClosed && (
                            <span className="ml-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              CLOSED
                            </span>
                          )}
                        </label>
                      </div>

                      {/* Time Pickers (only active if not closed) */}
                      {!hour.isClosed ? (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-500 text-[11px]">Open:</span>
                            <input
                              type="time"
                              required
                              value={hour.openTime || "09:00"}
                              onChange={(e) => {
                                const newHours = [...form.openingHours];
                                newHours[index] = { ...hour, openTime: e.target.value };
                                setForm({ ...form, openingHours: newHours });
                              }}
                              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-hidden"
                            />
                          </div>

                          <span className="text-stone-400 font-bold">–</span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-500 text-[11px]">Close:</span>
                            <input
                              type="time"
                              required
                              value={hour.closeTime || "19:00"}
                              onChange={(e) => {
                                const newHours = [...form.openingHours];
                                newHours[index] = { ...hour, closeTime: e.target.value };
                                setForm({ ...form, openingHours: newHours });
                              }}
                              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-hidden"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 italic">Not in service</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Bottom Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleCloseForm}
                  disabled={formLoading}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={formLoading}
                >
                  {editingId ? "Save Changes" : "Create Branch"}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 6. CONFIRM DELETE MODAL                                    */}
      {/* ========================================================== */}
      <ConfirmModal
        isOpen={Boolean(branchToDelete)}
        onClose={() => setBranchToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Branch"
        message={`Are you sure you want to delete branch "${branchToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Branch"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default function AdminBranchesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500 text-sm">Loading branches...</div>}>
      <AdminBranchesPageContent />
    </Suspense>
  );
}
