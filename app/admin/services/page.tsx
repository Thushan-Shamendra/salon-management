"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import ImageUpload from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  ScissorsIcon,
  TagIcon,
  ClockIcon,
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

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  imagePublicId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceFormState {
  name: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  imagePublicId: string;
  isActive: boolean;
}

const emptyForm: ServiceFormState = {
  name: "",
  description: "",
  price: "",
  duration: "",
  image: "",
  imagePublicId: "",
  isActive: true,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-asc" | "price-desc" | "duration">("newest");

  // Notification feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete modal state
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadServices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (res.ok && data.success) {
        setServices(data.services || []);
      } else {
        showNotification("error", data.message || "Failed to load services");
      }
    } catch {
      showNotification("error", "Network error loading services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch("/api/admin/services");
        const data = await res.json();
        if (isMounted && res.ok && data.success) {
          setServices(data.services || []);
        } else if (isMounted) {
          showNotification("error", data.message || "Failed to load services");
        }
      } catch {
        if (isMounted) showNotification("error", "Network error loading services");
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
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    const hidden = services.filter((s) => !s.isActive).length;
    const avgPrice =
      total > 0
        ? Math.round(
            services.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0) / total
          )
        : 0;

    return { total, active, hidden, avgPrice };
  }, [services]);

  // Filtered and sorted services
  const filteredServices = useMemo(() => {
    return services
      .filter((service) => {
        // Status filter
        if (statusFilter === "active" && !service.isActive) return false;
        if (statusFilter === "hidden" && service.isActive) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = service.name.toLowerCase().includes(q);
          const descMatch = (service.description || "").toLowerCase().includes(q);
          return nameMatch || descMatch;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
        if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
        if (sortBy === "duration") return (a.duration || 0) - (b.duration || 0);
        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        }
        // Default: newest first
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
  }, [services, searchQuery, statusFilter, sortBy]);

  // Open add modal/drawer
  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  // Open edit modal/drawer
  const handleOpenEdit = (service: Service) => {
    setEditingId(service._id);
    setForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      image: service.image || "",
      imagePublicId: service.imagePublicId || "",
      isActive: service.isActive,
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

    if (!form.name.trim()) {
      showNotification("error", "Service name is required.");
      return;
    }
    if (!form.price || Number(form.price) < 0) {
      showNotification("error", "Please provide a valid price.");
      return;
    }
    if (!form.duration || Number(form.duration) < 1) {
      showNotification("error", "Please provide a valid duration in minutes.");
      return;
    }

    setFormLoading(true);

    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          duration: Number(form.duration),
          image: form.image,
          imagePublicId: form.imagePublicId,
          isActive: form.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to save service");
        return;
      }

      showNotification(
        "success",
        editingId ? "Service updated successfully." : "Service added successfully."
      );

      handleCloseForm();
      await loadServices();
    } catch {
      showNotification("error", "An error occurred while saving the service.");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle active/hidden
  const handleToggleStatus = async (service: Service) => {
    const nextStatus = !service.isActive;

    try {
      const res = await fetch(`/api/services/${service._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to update service status");
        return;
      }

      showNotification(
        "success",
        nextStatus ? "Service published to website." : "Service hidden from website."
      );

      // Local optimistic update
      setServices((prev) =>
        prev.map((s) => (s._id === service._id ? { ...s, isActive: nextStatus } : s))
      );
    } catch {
      showNotification("error", "Failed to update status");
    }
  };

  // Trigger delete modal
  const handleConfirmDelete = (service: Service) => {
    setServiceToDelete(service);
  };

  // Execute delete
  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/services/${serviceToDelete._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to delete service");
        return;
      }

      showNotification("success", "Service deleted successfully.");
      setServiceToDelete(null);
      await loadServices();
    } catch {
      showNotification("error", "Failed to delete service");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-7 animate-fadeIn pb-12">
      {/* ========================================================== */}
      {/* 1. PAGE HEADER                                             */}
      {/* ========================================================== */}
      <AdminPageHeader
        title="Services"
        description="Manage services displayed on the INVORA website."
        breadcrumbs={[{ label: "Services" }]}
        action={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] active:scale-[0.98] cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Service</span>
          </button>
        }
      />

      {/* Notification Toast */}
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
            className="text-stone-400 hover:text-stone-700"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. STATS ROW (MATCHES MOCKUP)                              */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Services */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <ScissorsIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Total Services</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.total}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              All services in database
            </p>
          </div>
        </div>

        {/* Active Services */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Active Services</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.active}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Currently visible on website
            </p>
          </div>
        </div>

        {/* Hidden Services */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
            <EyeOffIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Hidden Services</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.hidden}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Not visible on website
            </p>
          </div>
        </div>

        {/* Average Price */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <TagIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Average Price</p>
            <p className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : `LKR ${stats.avgPrice.toLocaleString()}`}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Across all services
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. SEARCH & FILTER TOOLBAR (MATCHES MOCKUP)                */}
      {/* ========================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by name or description..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden md:inline">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "hidden")
              }
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="all">All Services</option>
              <option value="active">Active Only</option>
              <option value="hidden">Hidden Only</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden md:inline">
              Sort By
            </span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "newest"
                    | "oldest"
                    | "price-asc"
                    | "price-desc"
                    | "duration"
                )
              }
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 4. MAIN CONTENT AREA: SERVICES GRID                        */}
      {/* ========================================================== */}
      <div className="w-full">
        <div className="w-full">
          {loading ? (
            /* Loading skeletons */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs space-y-3 animate-pulse"
                >
                  <div className="aspect-[16/10] w-full rounded-xl bg-stone-200" />
                  <div className="h-4 w-3/4 rounded bg-stone-200" />
                  <div className="h-3 w-full rounded bg-stone-100" />
                  <div className="h-3 w-1/2 rounded bg-stone-100" />
                  <div className="h-8 w-full rounded-xl bg-stone-100 mt-2" />
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            /* Empty state */
            services.length === 0 ? (
              <EmptyState
                icon={ScissorsIcon}
                title="No services yet"
                description="Add your first salon service to display it on the INVORA website."
                actionText="Add First Service"
                onAction={handleOpenAdd}
              />
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
                <p className="text-sm font-semibold text-stone-700">
                  No services match your search or filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-3 text-xs font-semibold text-[#7C3AED] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )
          ) : (
            /* Services Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredServices.map((service) => (
                <div
                  key={service._id}
                  className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-200"
                >
                  {/* Card Image with Floating Status Badge */}
                  <div>
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                      {service.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={service.image}
                          alt={service.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-300">
                          <ScissorsIcon className="h-10 w-10" />
                        </div>
                      )}

                      {/* Floating Status Badge on top-right */}
                      <div className="absolute top-3 right-3 z-10 shadow-xs">
                        <StatusBadge
                          status={service.isActive ? "active" : "hidden"}
                          label={service.isActive ? "Active" : "Hidden"}
                        />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5">
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight line-clamp-1">
                        {service.name}
                      </h3>

                      <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed min-h-[32px]">
                        {service.description || "No description provided."}
                      </p>

                      {/* Price & Duration */}
                      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-stone-100">
                        <div className="flex items-center gap-1.5 font-bold text-stone-900">
                          <TagIcon className="h-3.5 w-3.5 text-[#7C3AED]" />
                          <span>LKR {Number(service.price).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                          <ClockIcon className="h-3.5 w-3.5 text-stone-400" />
                          <span>{service.duration} mins</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions (Edit, Hide/Publish, Delete) */}
                  <div className="p-4 sm:p-5 pt-0">
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold pt-1">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(service)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-stone-700 hover:bg-stone-50 hover:border-purple-300 hover:text-[#7C3AED] transition-all cursor-pointer"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Hide / Publish Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(service)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all cursor-pointer ${
                          service.isActive
                            ? "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300"
                            : "border-purple-200 bg-purple-50 text-[#7C3AED] hover:bg-purple-100 hover:border-purple-300"
                        }`}
                      >
                        {service.isActive ? (
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

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(service)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
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
        {/* POPUP MODAL: ADD / EDIT SERVICE (CENTERED IN MIDDLE)     */}
        {/* ======================================================== */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
            {/* Backdrop click to close */}
            <div
              className="fixed inset-0"
              onClick={handleCloseForm}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xl transition-all z-10 my-auto">
              {/* Panel Header */}
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    {editingId ? "Edit Service" : "Add New Service"}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {editingId
                      ? "Update service details, pricing, and visibility."
                      : "Create a new service to display on your website."}
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
                {/* Service Image Upload */}
                <div>
                  <ImageUpload
                    folder={CLOUDINARY_FOLDERS.SERVICES}
                    value={form.image}
                    publicId={form.imagePublicId}
                    label="Service Image *"
                    description="Upload PNG, JPG, or WebP up to 5MB"
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

                {/* Service Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Luxury Hair Spa Treatment"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe the service, benefits and what customers can expect..."
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                  />
                </div>

                {/* Price and Duration in 2 Columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Price (LKR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      placeholder="e.g. 4500"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Duration (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.duration}
                      onChange={(e) =>
                        setForm({ ...form, duration: e.target.value })
                      }
                      placeholder="e.g. 60"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                {/* Active Toggle Switch */}
                <div className="pt-2 flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5">
                  <div>
                    <p className="text-xs font-bold text-stone-900">Active</p>
                    <p className="text-[11px] text-stone-500">
                      Show this service on the website
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 ${
                      form.isActive ? "bg-[#7C3AED]" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        form.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={formLoading}
                    className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#6D28D9] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {formLoading && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>
                      {formLoading
                        ? "Saving..."
                        : editingId
                        ? "Save Changes"
                        : "Add Service"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* 5. DELETE CONFIRMATION MODAL                               */}
      {/* ========================================================== */}
      <ConfirmModal
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDeleteService}
        title="Delete Service?"
        message="Are you sure you want to permanently delete this service? This action cannot be undone."
        confirmText="Delete Service"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}