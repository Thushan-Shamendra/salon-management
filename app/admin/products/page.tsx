"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import ImageUpload from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  PackageIcon,
  MapPinIcon,
  ExternalLinkIcon,
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

interface BranchSummary {
  _id: string;
  name: string;
  slug: string;
}

interface ProductBrand {
  _id: string;
  name: string;
  logo: string;
  logoPublicId: string;
  description?: string;
  websiteUrl?: string;
  branchIds?: BranchSummary[];
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductFormState {
  name: string;
  logo: string;
  logoPublicId: string;
  description: string;
  websiteUrl: string;
  selectedBranchIds: string[];
  isActive: boolean;
  displayOrder: string;
}

const emptyForm: ProductFormState = {
  name: "",
  logo: "",
  logoPublicId: "",
  description: "",
  websiteUrl: "",
  selectedBranchIds: [],
  isActive: true,
  displayOrder: "0",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductBrand[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"order" | "name" | "newest">("order");

  // Toggle loading states
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  // Notification feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<ProductBrand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [prodRes, branchRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/branches"),
      ]);
      const prodData = await prodRes.json();
      const branchData = await branchRes.json();

      if (prodRes.ok && prodData.success) {
        setProducts(prodData.products || []);
      } else {
        showNotification("error", prodData.message || "Failed to load products");
      }

      if (branchRes.ok && branchData.success) {
        setBranches(branchData.branches || []);
      }
    } catch {
      showNotification("error", "Network error loading data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [prodRes, branchRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/branches"),
        ]);
        const prodData = await prodRes.json();
        const branchData = await branchRes.json();

        if (isMounted && prodRes.ok && prodData.success) {
          setProducts(prodData.products || []);
        } else if (isMounted) {
          showNotification("error", prodData.message || "Failed to load products");
        }

        if (isMounted && branchRes.ok && branchData.success) {
          setBranches(branchData.branches || []);
        }
      } catch {
        if (isMounted) showNotification("error", "Network error loading data");
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
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const hidden = products.filter((p) => !p.isActive).length;
    return { total, active, hidden };
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Status filter
        if (statusFilter === "active" && !p.isActive) return false;
        if (statusFilter === "hidden" && p.isActive) return false;

        // Branch filter
        if (branchFilter !== "all") {
          const hasBranch =
            !p.branchIds ||
            p.branchIds.length === 0 ||
            p.branchIds.some((b) => b._id === branchFilter);
          if (!hasBranch) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = p.name.toLowerCase().includes(q);
          const descMatch = (p.description || "").toLowerCase().includes(q);
          return nameMatch || descMatch;
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
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }
        return 0;
      });
  }, [products, statusFilter, branchFilter, searchQuery, sortBy]);

  // Open Form for Create
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      displayOrder: String(products.length + 1),
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditForm = (p: ProductBrand) => {
    setEditingId(p._id);
    const branchIds = (p.branchIds || []).map((b) => b._id);
    setForm({
      name: p.name,
      logo: p.logo,
      logoPublicId: p.logoPublicId,
      description: p.description || "",
      websiteUrl: p.websiteUrl || "",
      selectedBranchIds: branchIds,
      isActive: p.isActive,
      displayOrder: String(p.displayOrder ?? 0),
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleToggleBranch = (branchId: string) => {
    setForm((prev) => {
      const exists = prev.selectedBranchIds.includes(branchId);
      return {
        ...prev,
        selectedBranchIds: exists
          ? prev.selectedBranchIds.filter((id) => id !== branchId)
          : [...prev.selectedBranchIds, branchId],
      };
    });
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showNotification("error", "Brand Name is required.");
      return;
    }
    if (!form.logo || !form.logoPublicId) {
      showNotification("error", "Brand Logo is required. Please upload an image.");
      return;
    }

    setFormLoading(true);

    try {
      const url = editingId
        ? `/api/admin/products/${editingId}`
        : "/api/admin/products";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        logo: form.logo,
        logoPublicId: form.logoPublicId,
        description: form.description.trim(),
        websiteUrl: form.websiteUrl.trim(),
        branchIds: form.selectedBranchIds,
        isActive: form.isActive,
        displayOrder: Number(form.displayOrder) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to save product brand");
        return;
      }

      showNotification(
        "success",
        editingId
          ? `Updated "${form.name}" successfully.`
          : `Added brand "${form.name}" successfully.`
      );

      handleCloseForm();
      await loadData();
    } catch {
      showNotification("error", "Network error saving product brand");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Active / Hidden Status
  const handleToggleStatus = async (p: ProductBrand) => {
    try {
      setTogglingStatusId(p._id);
      const res = await fetch(`/api/admin/products/${p._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          "success",
          `Brand "${p.name}" is now ${!p.isActive ? "visible on website" : "hidden"}.`
        );
        setProducts((prev) =>
          prev.map((item) =>
            item._id === p._id ? { ...item, isActive: !item.isActive } : item
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

  // Delete Action
  const handleExecuteDelete = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/products/${productToDelete._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification("success", `Deleted "${productToDelete.name}" successfully.`);
        setProducts((prev) => prev.filter((item) => item._id !== productToDelete._id));
        setProductToDelete(null);

        if (editingId === productToDelete._id) {
          handleCloseForm();
        }
      } else {
        showNotification("error", data.message || "Failed to delete product");
      }
    } catch {
      showNotification("error", "Network error deleting product");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Actions */}
      <AdminPageHeader
        title="Products & Brands"
        description="Manage the professional product lines and beauty brands showcased on the SALVORA website."
        breadcrumbs={[{ label: "Products" }]}
        action={
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Brand / Product</span>
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

      {/* 2. Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Products */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
            <PackageIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Total Brands</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.total}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              All brands in database
            </p>
          </div>
        </div>

        {/* Active Products */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Active Brands</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.active}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Visible on website
            </p>
          </div>
        </div>

        {/* Hidden Products */}
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
            <EyeOffIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Hidden Brands</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {loading ? "..." : stats.hidden}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Not visible on website
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands by name or description..."
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
              <option value="all">All Brands</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          {/* Branch Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 hidden lg:inline">
              Branch
            </span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="all">All Locations</option>
              {branches.map((br) => (
                <option key={br._id} value={br._id}>
                  {br.name}
                </option>
              ))}
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
                setSortBy(e.target.value as "order" | "name" | "newest")
              }
              className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              <option value="order">Display Order</option>
              <option value="name">Brand Name (A-Z)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Products Grid */}
      <div className="w-full">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="h-32 w-full rounded-xl bg-stone-200" />
                <div className="h-4 w-3/4 rounded bg-stone-200" />
                <div className="h-3 w-1/2 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title={
              searchQuery || statusFilter !== "all" || branchFilter !== "all"
                ? "No products found matching criteria"
                : "No product brands added yet"
            }
            description={
              searchQuery || statusFilter !== "all" || branchFilter !== "all"
                ? "Try clearing your search query or reset your filters."
                : "Add product and beauty brands used at SALVORA to feature them on the website."
            }
            actionText={
              searchQuery || statusFilter !== "all" || branchFilter !== "all"
                ? "Clear All Filters"
                : "+ Add Brand / Product"
            }
            onAction={
              searchQuery || statusFilter !== "all" || branchFilter !== "all"
                ? () => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setBranchFilter("all");
                  }
                : handleOpenCreateForm
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((p) => {
              const branchCount = p.branchIds?.length || 0;
              const branchLabel =
                branchCount === 0
                  ? "All Branches"
                  : branchCount === 1
                  ? p.branchIds![0].name
                  : `${branchCount} Branches`;

              return (
                <div
                  key={p._id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-all duration-200 hover:border-purple-200 hover:shadow-md"
                >
                  <div>
                    {/* Logo Section */}
                    <div className="relative h-40 w-full p-6 flex items-center justify-center bg-stone-50/70 border-b border-stone-100">
                      {p.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.logo}
                          alt={p.name}
                          className="max-h-24 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <PackageIcon className="h-12 w-12 text-stone-300" />
                      )}

                      {/* Status and Order Badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-2xs backdrop-blur-xs ${
                            p.isActive
                              ? "bg-white/95 text-emerald-700 border border-emerald-200/80"
                              : "bg-white/95 text-stone-600 border border-stone-200/80"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              p.isActive ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                          <span>{p.isActive ? "Active" : "Hidden"}</span>
                        </span>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span className="rounded-md bg-stone-200/70 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                          #{p.displayOrder ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight line-clamp-1">
                          {p.name}
                        </h3>
                        {p.description ? (
                          <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-stone-400 italic">
                            No description provided
                          </p>
                        )}
                      </div>

                      {/* Branch Scope */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                        <MapPinIcon className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span className="truncate">{branchLabel}</span>
                      </div>

                      {/* Website link */}
                      {p.websiteUrl && (
                        <a
                          href={p.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:underline"
                        >
                          <span>Visit Website</span>
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 sm:p-5 pt-0">
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100 text-xs font-semibold">
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(p)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50/50 px-2 py-1.5 text-purple-700 hover:bg-purple-100/70 transition-all cursor-pointer"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Hide / Publish */}
                      <button
                        type="button"
                        disabled={togglingStatusId === p._id}
                        onClick={() => handleToggleStatus(p)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {p.isActive ? (
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

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setProductToDelete(p)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={handleCloseForm}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xl transition-all z-10 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  {editingId ? "Edit Brand / Product" : "Add Brand / Product"}
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  {editingId
                    ? "Update brand details and logo displayed on the website."
                    : "Add a new brand or product line used at SALVORA."}
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

            <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
              {/* Brand Logo Upload */}
              <div>
                <ImageUpload
                  folder={CLOUDINARY_FOLDERS.PRODUCTS}
                  value={form.logo}
                  publicId={form.logoPublicId}
                  label="Brand Logo *"
                  description="PNG, SVG, or WebP with transparent background recommended (Max 5MB)"
                  onChange={({ url, publicId }) => {
                    setForm((prev) => ({
                      ...prev,
                      logo: url,
                      logoPublicId: publicId,
                    }));
                  }}
                  onRemove={() => {
                    setForm((prev) => ({
                      ...prev,
                      logo: "",
                      logoPublicId: "",
                    }));
                  }}
                />
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Brand / Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. L'Oréal Professionnel, Olaplex, Wella"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Description / Treatment Focus
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Premium hair repair and bonding treatments used during color and bleaching services."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://brandname.com"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              {/* Branch Availability */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Branch Availability
                </label>
                <p className="text-[11px] text-stone-500 mb-2">
                  Select specific branches where this product is used. If none selected, brand is available at all branches.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50/50 max-h-40 overflow-y-auto">
                  {branches.length === 0 ? (
                    <span className="text-xs text-stone-400 italic">
                      No branches configured yet
                    </span>
                  ) : (
                    branches.map((br) => {
                      const isChecked = form.selectedBranchIds.includes(br._id);
                      return (
                        <label
                          key={br._id}
                          className="flex items-center gap-2.5 text-xs font-medium text-stone-700 hover:text-stone-900 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBranch(br._id)}
                            className="h-4 w-4 rounded border-stone-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                          />
                          <span className="truncate">{br.name}</span>
                        </label>
                      );
                    })
                  )}
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

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-stone-800">
                    Active
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Show this brand in the Products We Use section
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
                    {editingId ? "Save Changes" : "Add Brand"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => !isDeleting && setProductToDelete(null)}
        onConfirm={handleExecuteDelete}
        title="Delete Product Brand"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This will permanently remove it from the website and delete the logo from Cloudinary.`}
        confirmText="Delete Brand"
        cancelText="Cancel"
        loading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
