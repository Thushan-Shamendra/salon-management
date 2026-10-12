"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import ImageUpload from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import { VENDOR_CATEGORIES, VendorCategory } from "@/lib/vendor-constants";
import {
  StoreIcon,
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
  StarIcon,
  PhoneIcon,
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  MailIcon,
} from "@/components/ui/icons";

interface BranchSummary {
  _id: string;
  name: string;
  slug: string;
}

interface VendorItem {
  _id: string;
  name: string;
  category: VendorCategory;
  description?: string;
  image: string;
  imagePublicId?: string;
  logo?: string;
  logoPublicId?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  branchIds?: BranchSummary[];
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface VendorFormState {
  name: string;
  category: VendorCategory;
  description: string;
  image: string;
  imagePublicId: string;
  logo: string;
  logoPublicId: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  selectedBranchIds: string[];
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: string;
}

const emptyForm: VendorFormState = {
  name: "",
  category: "Wedding Cars",
  description: "",
  image: "",
  imagePublicId: "",
  logo: "",
  logoPublicId: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  instagram: "",
  facebook: "",
  selectedBranchIds: [],
  isFeatured: false,
  isActive: true,
  displayOrder: "0",
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<VendorFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not-featured">("all");
  const [sortBy, setSortBy] = useState<"order" | "newest" | "oldest" | "name">("order");

  // Toggle states
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // Notification feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete modal state
  const [vendorToDelete, setVendorToDelete] = useState<VendorItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [vendorRes, branchRes] = await Promise.all([
        fetch("/api/admin/vendors"),
        fetch("/api/admin/branches"),
      ]);
      const vendorData = await vendorRes.json();
      const branchData = await branchRes.json();

      if (vendorRes.ok && vendorData.success) {
        setVendors(vendorData.vendors || []);
      } else {
        showNotification("error", vendorData.message || "Failed to load vendors");
      }

      if (branchRes.ok && branchData.success) {
        setBranches(branchData.branches || []);
      }
    } catch {
      showNotification("error", "Network error loading vendor data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [vendorRes, branchRes] = await Promise.all([
          fetch("/api/admin/vendors"),
          fetch("/api/admin/branches"),
        ]);
        const vendorData = await vendorRes.json();
        const branchData = await branchRes.json();

        if (isMounted && vendorRes.ok && vendorData.success) {
          setVendors(vendorData.vendors || []);
        } else if (isMounted) {
          showNotification("error", vendorData.message || "Failed to load vendors");
        }

        if (isMounted && branchRes.ok && branchData.success) {
          setBranches(branchData.branches || []);
        }
      } catch {
        if (isMounted) {
          showNotification("error", "Network error loading vendor data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real database counts
  const counts = useMemo(() => {
    return {
      total: vendors.length,
      active: vendors.filter((v) => v.isActive).length,
      hidden: vendors.filter((v) => !v.isActive).length,
      featured: vendors.filter((v) => v.isFeatured).length,
    };
  }, [vendors]);

  // Combined Filtering & Sorting
  const filteredVendors = useMemo(() => {
    return vendors
      .filter((vendor) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = vendor.name.toLowerCase().includes(q);
          const matchesCategory = vendor.category.toLowerCase().includes(q);
          const matchesDesc = (vendor.description || "").toLowerCase().includes(q);
          if (!matchesName && !matchesCategory && !matchesDesc) return false;
        }

        // Category filter
        if (categoryFilter !== "all") {
          if (vendor.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
        }

        // Branch filter
        if (branchFilter !== "all") {
          if (branchFilter === "unassigned") {
            if (vendor.branchIds && vendor.branchIds.length > 0) return false;
          } else {
            const hasBranch = vendor.branchIds?.some((b) => b._id === branchFilter);
            if (!hasBranch) return false;
          }
        }

        // Status filter
        if (statusFilter === "active" && !vendor.isActive) return false;
        if (statusFilter === "hidden" && vendor.isActive) return false;

        // Featured filter
        if (featuredFilter === "featured" && !vendor.isFeatured) return false;
        if (featuredFilter === "not-featured" && vendor.isFeatured) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "order") {
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
          }
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "newest") {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        if (sortBy === "oldest") {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [vendors, searchQuery, categoryFilter, branchFilter, statusFilter, featuredFilter, sortBy]);

  // Modal Handlers
  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      displayOrder: String(vendors.length * 10),
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vendor: VendorItem) => {
    setEditingId(vendor._id);
    const branchIds = vendor.branchIds?.map((b) => b._id) || [];
    setForm({
      name: vendor.name,
      category: vendor.category,
      description: vendor.description || "",
      image: vendor.image || "",
      imagePublicId: vendor.imagePublicId || "",
      logo: vendor.logo || "",
      logoPublicId: vendor.logoPublicId || "",
      phone: vendor.phone || "",
      whatsapp: vendor.whatsapp || "",
      email: vendor.email || "",
      website: vendor.website || "",
      instagram: vendor.instagram || "",
      facebook: vendor.facebook || "",
      selectedBranchIds: branchIds,
      isFeatured: vendor.isFeatured,
      isActive: vendor.isActive,
      displayOrder: String(vendor.displayOrder ?? 0),
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const toggleBranchSelection = (branchId: string) => {
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

  // Form Submit (Create / Edit)
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showNotification("error", "Vendor name is required");
      return;
    }

    if (!form.image.trim()) {
      showNotification("error", "Main vendor image is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      image: form.image.trim(),
      imagePublicId: form.imagePublicId.trim(),
      logo: form.logo.trim(),
      logoPublicId: form.logoPublicId.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      instagram: form.instagram.trim(),
      facebook: form.facebook.trim(),
      branchIds: form.selectedBranchIds,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      displayOrder: parseInt(form.displayOrder, 10) || 0,
    };

    setFormLoading(true);

    try {
      const url = editingId
        ? `/api/admin/vendors/${editingId}`
        : "/api/admin/vendors";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification(
          "success",
          editingId
            ? "Vendor updated successfully"
            : "Vendor created successfully"
        );
        handleCloseForm();
        loadData();
      } else {
        showNotification("error", data.message || "Failed to save vendor");
      }
    } catch {
      showNotification("error", "Network error saving vendor");
    } finally {
      setFormLoading(false);
    }
  };

  // Quick Toggle Status (Active / Hidden)
  const handleToggleStatus = async (vendor: VendorItem) => {
    setTogglingStatusId(vendor._id);
    const nextState = !vendor.isActive;

    try {
      const res = await fetch(`/api/admin/vendors/${vendor._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVendors((prev) =>
          prev.map((v) => (v._id === vendor._id ? { ...v, isActive: nextState } : v))
        );
        showNotification(
          "success",
          `Vendor ${nextState ? "published" : "hidden"} successfully`
        );
      } else {
        showNotification("error", data.message || "Failed to update vendor status");
      }
    } catch {
      showNotification("error", "Network error toggling status");
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Quick Toggle Featured
  const handleToggleFeatured = async (vendor: VendorItem) => {
    setTogglingFeaturedId(vendor._id);
    const nextState = !vendor.isFeatured;

    try {
      const res = await fetch(`/api/admin/vendors/${vendor._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: nextState }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVendors((prev) =>
          prev.map((v) => (v._id === vendor._id ? { ...v, isFeatured: nextState } : v))
        );
        showNotification(
          "success",
          `Vendor ${nextState ? "marked as featured" : "unfeatured"} successfully`
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

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!vendorToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/vendors/${vendorToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification("success", "Vendor deleted successfully");
        setVendors((prev) => prev.filter((v) => v._id !== vendorToDelete._id));
        setVendorToDelete(null);
      } else {
        showNotification("error", data.message || "Failed to delete vendor");
      }
    } catch {
      showNotification("error", "Network error deleting vendor");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header */}
      <AdminPageHeader
        title="Vendors"
        description="Manage trusted vendors and wedding service partners displayed on the SALVORA website."
        action={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-[#6D28D9] transition-all cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Vendor</span>
          </button>
        }
      />

      {/* 2. Notification Toast */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-semibold shadow-md animate-fadeIn ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 3. Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Vendors
          </p>
          <p className="mt-2 text-2xl font-bold text-stone-900">{counts.total}</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Active
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{counts.active}</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-stone-50 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Hidden
          </p>
          <p className="mt-2 text-2xl font-bold text-stone-700">{counts.hidden}</p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
            Featured
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-900">{counts.featured}</p>
        </div>
      </div>

      {/* 4. Filters & Search Toolbar */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 pl-9.5 pr-4 py-2 text-xs sm:text-sm text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter vendors by category"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs sm:text-sm text-stone-700 outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All Categories</option>
          {VENDOR_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Branch Filter */}
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          aria-label="Filter vendors by branch location"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs sm:text-sm text-stone-700 outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
          <option value="unassigned">General / Unassigned</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "hidden")}
          aria-label="Filter vendors by active status"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs sm:text-sm text-stone-700 outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="hidden">Hidden Only</option>
        </select>

        {/* Featured Filter */}
        <select
          value={featuredFilter}
          onChange={(e) =>
            setFeaturedFilter(e.target.value as "all" | "featured" | "not-featured")
          }
          aria-label="Filter vendors by featured state"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs sm:text-sm text-stone-700 outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All Featured</option>
          <option value="featured">Featured Only</option>
          <option value="not-featured">Not Featured</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "order" | "newest" | "oldest" | "name")
          }
          aria-label="Sort vendors by order, date, or name"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs sm:text-sm text-stone-700 outline-none focus:border-[#7C3AED]"
        >
          <option value="order">Display Order</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* 5. Vendor Cards Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-stone-100 border border-stone-200/60"
            />
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title={
            vendors.length === 0
              ? "No vendors have been added yet."
              : "No vendors match your search filters."
          }
          description={
            vendors.length === 0
              ? "Start adding trusted partners for wedding cars, venues, photographers, and event services."
              : "Try clearing or adjusting your search criteria."
          }
          actionText={vendors.length === 0 ? "Add First Vendor" : undefined}
          onAction={vendors.length === 0 ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => {
            const isAssigned = vendor.branchIds && vendor.branchIds.length > 0;

            return (
              <div
                key={vendor._id}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Top Image & Badges */}
                  <div className="relative h-44 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200/70 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />

                    {/* Logo Overlay Badge if available */}
                    {vendor.logo && (
                      <div className="absolute bottom-2.5 left-2.5 h-10 w-10 rounded-xl bg-white/95 p-1 shadow-md border border-stone-200/80 backdrop-blur-xs flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={vendor.logo}
                          alt={`${vendor.name} logo`}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}

                    {/* Badges on image */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                        {vendor.category}
                      </span>
                      {vendor.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-stone-950 shadow-2xs">
                          <StarIcon className="h-3 w-3 fill-stone-950" />
                          <span>Featured</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-2xs backdrop-blur-xs ${
                          vendor.isActive
                            ? "bg-emerald-500/90 text-white"
                            : "bg-stone-500/90 text-white"
                        }`}
                      >
                        {vendor.isActive ? "Active" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  {/* Vendor Details */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-stone-900 line-clamp-1">
                        {vendor.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 rounded-md px-1.5 py-0.5 shrink-0">
                        #{vendor.displayOrder}
                      </span>
                    </div>

                    {vendor.description ? (
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {vendor.description}
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400 italic">No description provided</p>
                    )}

                    {/* Branch Availability */}
                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                      <MapPinIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      {isAssigned ? (
                        vendor.branchIds!.map((b) => (
                          <span
                            key={b._id}
                            className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-[#7C3AED]"
                          >
                            {b.name}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          General (All Branches)
                        </span>
                      )}
                    </div>

                    {/* Contact Badges Row */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-stone-400 text-xs">
                      {vendor.phone && (
                        <span title={`Phone: ${vendor.phone}`} className="inline-flex items-center gap-1 text-stone-500">
                          <PhoneIcon className="h-3 w-3" />
                        </span>
                      )}
                      {vendor.whatsapp && (
                        <span title={`WhatsApp: ${vendor.whatsapp}`} className="inline-flex items-center gap-1 text-emerald-600">
                          <WhatsAppIcon className="h-3 w-3" />
                        </span>
                      )}
                      {vendor.email && (
                        <span title={`Email: ${vendor.email}`} className="inline-flex items-center gap-1 text-stone-500">
                          <MailIcon className="h-3 w-3" />
                        </span>
                      )}
                      {vendor.website && (
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visit Website"
                          className="hover:text-[#7C3AED] transition-colors"
                        >
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      )}
                      {vendor.instagram && (
                        <a
                          href={vendor.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Instagram"
                          className="hover:text-pink-600 transition-colors"
                        >
                          <InstagramIcon className="h-3 w-3" />
                        </a>
                      )}
                      {vendor.facebook && (
                        <a
                          href={vendor.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Facebook"
                          className="hover:text-blue-600 transition-colors"
                        >
                          <FacebookIcon className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Feature / Unfeature */}
                    <button
                      type="button"
                      disabled={togglingFeaturedId === vendor._id}
                      onClick={() => handleToggleFeatured(vendor)}
                      title={vendor.isFeatured ? "Remove Featured" : "Mark as Featured"}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        vendor.isFeatured
                          ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                          : "text-stone-400 hover:text-amber-500 hover:bg-stone-100"
                      }`}
                    >
                      <StarIcon className={`h-4 w-4 ${vendor.isFeatured ? "fill-amber-400" : ""}`} />
                    </button>

                    {/* Publish / Hide */}
                    <button
                      type="button"
                      disabled={togglingStatusId === vendor._id}
                      onClick={() => handleToggleStatus(vendor)}
                      title={vendor.isActive ? "Hide Vendor" : "Publish Vendor"}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        vendor.isActive
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {vendor.isActive ? (
                        <EyeIcon className="h-4 w-4" />
                      ) : (
                        <EyeOffIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(vendor)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-purple-300 transition-all cursor-pointer"
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setVendorToDelete(vendor)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      title="Delete Vendor"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Add / Edit Vendor Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  {editingId ? "Edit Vendor" : "Add New Vendor"}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure wedding partner and event service provider details.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="mt-6 space-y-5">
              {/* Row: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Royal Wedding Cars"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as VendorCategory })
                    }
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] bg-white"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short overview of services, specialities, or fleet..."
                  className="w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Row: Main Image & Logo Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Main Showcase Image <span className="text-red-500">*</span>
                  </label>
                  <ImageUpload
                    folder={CLOUDINARY_FOLDERS.VENDORS}
                    value={form.image}
                    publicId={form.imagePublicId}
                    onChange={(res) =>
                      setForm({
                        ...form,
                        image: res.url,
                        imagePublicId: res.publicId,
                      })
                    }
                    onRemove={() =>
                      setForm({
                        ...form,
                        image: "",
                        imagePublicId: "",
                      })
                    }
                    label="Upload Image"
                    description="JPG, PNG, WEBP (16:9 / 4:3)"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Vendor Logo (Optional)
                  </label>
                  <ImageUpload
                    folder={CLOUDINARY_FOLDERS.VENDORS}
                    value={form.logo}
                    publicId={form.logoPublicId}
                    onChange={(res) =>
                      setForm({
                        ...form,
                        logo: res.url,
                        logoPublicId: res.publicId,
                      })
                    }
                    onRemove={() =>
                      setForm({
                        ...form,
                        logo: "",
                        logoPublicId: "",
                      })
                    }
                    label="Upload Logo"
                    description="Transparent PNG / Square logo"
                  />
                </div>
              </div>

              {/* Row: Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Row: Email & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@vendor.com"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://vendorwebsite.com"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Row: Instagram & Facebook */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    placeholder="https://instagram.com/vendor"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={form.facebook}
                    onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                    placeholder="https://facebook.com/vendor"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Branch Multi-Select Assignment */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                  Branch Locations
                </label>
                <p className="text-[11px] text-stone-500 mb-2">
                  Select branches where this vendor operates. Leaving all unchecked marks the vendor as <strong>General (All Branches)</strong>.
                </p>
                {branches.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No branches available yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50/50">
                    {branches.map((branch) => {
                      const isChecked = form.selectedBranchIds.includes(branch._id);
                      return (
                        <label
                          key={branch._id}
                          className="flex items-center gap-2.5 text-xs text-stone-800 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBranchSelection(branch._id)}
                            className="h-4 w-4 rounded text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                          />
                          <span className="font-medium">{branch.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Row: Display Order, Active, Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      className="h-4 w-4 rounded text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                    />
                    <span>Featured Partner</span>
                  </label>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="h-4 w-4 rounded text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                    />
                    <span>Active (Visible on Website)</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-xl border border-stone-300 px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-[#7C3AED] px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-[#6D28D9] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading
                    ? "Saving..."
                    : editingId
                    ? "Update Vendor"
                    : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(vendorToDelete)}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${vendorToDelete?.name}"? Associated image assets will be removed.`}
        confirmText="Delete Vendor"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setVendorToDelete(null)}
      />
    </div>
  );
}
