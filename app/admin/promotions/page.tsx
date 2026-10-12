"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import ImageUpload from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  TagIcon,
  SearchIcon,
  PlusIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  SparklesIcon,
  CalendarIcon,
  MapPinIcon,
} from "@/components/ui/icons";
import {
  PROMOTION_TYPES,
  PROMOTION_TYPE_LABELS,
  PromotionType,
  DiscountType,
  CtaType,
} from "@/lib/promotion-constants";
import { formatInColomboTimezone } from "@/lib/colombo-timezone";

interface BranchSummary {
  _id: string;
  name: string;
  slug: string;
}

interface ServiceOption {
  _id: string;
  name: string;
  price: number;
}

interface ProductOption {
  _id: string;
  name: string;
  price: number;
}

interface WeddingPackageOption {
  _id: string;
  name: string;
  price: number;
}

interface PromotionItem {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  promoType: PromotionType;
  badgeText: string;
  image: string;
  imagePublicId: string;
  discountType: DiscountType;
  discountValue?: number;
  originalPrice?: number;
  promotionalPrice?: number;
  validDaysText?: string;
  startDate: string;
  endDate: string;
  terms: string[];
  relatedServiceId?: { _id: string; name: string; price: number };
  relatedProductId?: { _id: string; name: string; price: number; image: string };
  relatedWeddingPackageId?: { _id: string; name: string; price: number };
  branchIds?: BranchSummary[];
  ctaType: CtaType;
  ctaCustomLabel?: string;
  ctaCustomUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PromotionFormState {
  title: string;
  subtitle: string;
  description: string;
  promoType: PromotionType;
  badgeText: string;
  image: string;
  imagePublicId: string;
  discountType: DiscountType;
  discountValue: string;
  originalPrice: string;
  promotionalPrice: string;
  validDaysText: string;
  startDate: string;
  endDate: string;
  termsText: string;
  relatedServiceId: string;
  relatedProductId: string;
  relatedWeddingPackageId: string;
  selectedBranchIds: string[];
  ctaType: CtaType;
  ctaCustomLabel: string;
  ctaCustomUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: string;
}

const getTodayString = () => formatInColomboTimezone(new Date());
const getFutureDateString = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatInColomboTimezone(d);
};

const emptyForm: PromotionFormState = {
  title: "",
  subtitle: "",
  description: "",
  promoType: "service_offer",
  badgeText: "20% OFF",
  image: "",
  imagePublicId: "",
  discountType: "percentage",
  discountValue: "",
  originalPrice: "",
  promotionalPrice: "",
  validDaysText: "",
  startDate: getTodayString(),
  endDate: getFutureDateString(30),
  termsText: "",
  relatedServiceId: "",
  relatedProductId: "",
  relatedWeddingPackageId: "",
  selectedBranchIds: [],
  ctaType: "whatsapp",
  ctaCustomLabel: "Book Offer",
  ctaCustomUrl: "",
  isFeatured: false,
  isActive: true,
  displayOrder: "0",
};

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [weddingPackages, setWeddingPackages] = useState<WeddingPackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<PromotionFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    expired: 0,
    featured: 0,
  });

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming" | "expired" | "hidden">("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"order" | "title" | "startDate" | "endDate" | "newest">("order");

  // Notifications & modal
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<PromotionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promotions");
      const data = await res.json();
      if (data?.success) {
        setPromotions(data.promotions || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      showNotification("error", "Error refreshing promotions");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [promoRes, branchRes, servRes, prodRes, wedRes] = await Promise.all([
          fetch("/api/admin/promotions"),
          fetch("/api/branches"),
          fetch("/api/services"),
          fetch("/api/admin/retail-products"),
          fetch("/api/wedding/packages"),
        ]);
        const promoData = await promoRes.json();
        const branchData = await branchRes.json();
        const servData = await servRes.json();
        const prodData = await prodRes.json();
        const wedData = await wedRes.json();

        if (isMounted && promoData?.success) {
          setPromotions(promoData.promotions || []);
          if (promoData.stats) setStats(promoData.stats);
        }
        if (isMounted && branchData?.success && Array.isArray(branchData.branches)) {
          setBranches(branchData.branches);
        }
        if (isMounted && servData?.success && Array.isArray(servData.services)) {
          setServices(servData.services);
        }
        if (isMounted && prodData?.success && Array.isArray(prodData.products)) {
          setProducts(prodData.products);
        }
        if (isMounted && wedData?.success && Array.isArray(wedData.packages)) {
          setWeddingPackages(wedData.packages);
        }
      } catch {
        if (isMounted) showNotification("error", "Error connecting to server");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Client-side filtering & sorting
  const filteredAndSortedPromotions = useMemo(() => {
    let list = [...promotions];
    const now = new Date();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
          (p.badgeText && p.badgeText.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== "all") {
      list = list.filter((p) => p.promoType === typeFilter);
    }

    if (statusFilter === "active") {
      list = list.filter(
        (p) => p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now
      );
    } else if (statusFilter === "upcoming") {
      list = list.filter((p) => p.isActive && new Date(p.startDate) > now);
    } else if (statusFilter === "expired") {
      list = list.filter((p) => new Date(p.endDate) < now);
    } else if (statusFilter === "hidden") {
      list = list.filter((p) => !p.isActive);
    }

    if (branchFilter !== "all") {
      list = list.filter(
        (p) =>
          !p.branchIds ||
          p.branchIds.length === 0 ||
          p.branchIds.some((b) => (typeof b === "object" ? b._id === branchFilter : b === branchFilter))
      );
    }

    switch (sortBy) {
      case "title":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "startDate":
        return list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      case "endDate":
        return list.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
      case "newest":
        return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case "order":
      default:
        return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
  }, [promotions, searchQuery, typeFilter, statusFilter, branchFilter, sortBy]);

  const handleOpenAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: PromotionItem) => {
    setEditingId(item._id);
    const startIso = item.startDate ? formatInColomboTimezone(item.startDate) : getTodayString();
    const endIso = item.endDate ? formatInColomboTimezone(item.endDate) : getFutureDateString(30);

    setForm({
      title: item.title,
      subtitle: item.subtitle || "",
      description: item.description,
      promoType: item.promoType,
      badgeText: item.badgeText || "Special Offer",
      image: item.image,
      imagePublicId: item.imagePublicId,
      discountType: item.discountType || "percentage",
      discountValue: item.discountValue !== undefined && item.discountValue !== null ? item.discountValue.toString() : "",
      originalPrice: item.originalPrice !== undefined && item.originalPrice !== null ? item.originalPrice.toString() : "",
      promotionalPrice: item.promotionalPrice !== undefined && item.promotionalPrice !== null ? item.promotionalPrice.toString() : "",
      validDaysText: item.validDaysText || "",
      startDate: startIso,
      endDate: endIso,
      termsText: Array.isArray(item.terms) ? item.terms.join("\n") : "",
      relatedServiceId: item.relatedServiceId ? (typeof item.relatedServiceId === "object" ? item.relatedServiceId._id : item.relatedServiceId) : "",
      relatedProductId: item.relatedProductId ? (typeof item.relatedProductId === "object" ? item.relatedProductId._id : item.relatedProductId) : "",
      relatedWeddingPackageId: item.relatedWeddingPackageId ? (typeof item.relatedWeddingPackageId === "object" ? item.relatedWeddingPackageId._id : item.relatedWeddingPackageId) : "",
      selectedBranchIds: Array.isArray(item.branchIds)
        ? item.branchIds.map((b) => (typeof b === "object" ? b._id : b))
        : [],
      ctaType: item.ctaType || "whatsapp",
      ctaCustomLabel: item.ctaCustomLabel || "Book Offer",
      ctaCustomUrl: item.ctaCustomUrl || "",
      isFeatured: Boolean(item.isFeatured),
      isActive: item.isActive !== undefined ? item.isActive : true,
      displayOrder: (item.displayOrder || 0).toString(),
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (formLoading) return;
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showNotification("error", "Promotion title is required");
      return;
    }
    if (!form.description.trim()) {
      showNotification("error", "Promotion description is required");
      return;
    }
    if (!form.image || !form.imagePublicId) {
      showNotification("error", "Promotion banner image is required");
      return;
    }
    if (!form.startDate || !form.endDate) {
      showNotification("error", "Start and End dates are required");
      return;
    }

    try {
      setFormLoading(true);
      const termsArray = form.termsText
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        promoType: form.promoType,
        badgeText: form.badgeText.trim() || "Special Offer",
        image: form.image,
        imagePublicId: form.imagePublicId,
        discountType: form.discountType,
        discountValue: form.discountValue.trim() ? parseFloat(form.discountValue) : null,
        originalPrice: form.originalPrice.trim() ? parseFloat(form.originalPrice) : null,
        promotionalPrice: form.promotionalPrice.trim() ? parseFloat(form.promotionalPrice) : null,
        validDaysText: form.validDaysText.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        terms: termsArray,
        relatedServiceId: form.relatedServiceId || null,
        relatedProductId: form.relatedProductId || null,
        relatedWeddingPackageId: form.relatedWeddingPackageId || null,
        branchIds: form.selectedBranchIds,
        ctaType: form.ctaType,
        ctaCustomLabel: form.ctaCustomLabel.trim() || "Book Offer",
        ctaCustomUrl: form.ctaCustomUrl.trim(),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
      };

      const url = editingId
        ? `/api/admin/promotions/${editingId}`
        : "/api/admin/promotions";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data?.success) {
        showNotification("success", editingId ? "Promotion updated successfully" : "Promotion created successfully");
        handleCloseForm();
        fetchPromotions();
      } else {
        showNotification("error", data?.message || "Failed to save promotion");
      }
    } catch (err) {
      console.error("Error saving promotion:", err);
      showNotification("error", "Failed to save promotion");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (item: PromotionItem) => {
    try {
      setTogglingStatusId(item._id);
      const res = await fetch(`/api/admin/promotions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (data?.success) {
        setPromotions((prev) =>
          prev.map((p) => (p._id === item._id ? { ...p, isActive: !item.isActive } : p))
        );
        showNotification("success", `Promotion ${item.isActive ? "hidden" : "activated"}`);
      } else {
        showNotification("error", data?.message || "Failed to toggle status");
      }
    } catch {
      showNotification("error", "Failed to update status");
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleToggleFeatured = async (item: PromotionItem) => {
    try {
      const res = await fetch(`/api/admin/promotions/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !item.isFeatured }),
      });
      const data = await res.json();
      if (data?.success) {
        setPromotions((prev) =>
          prev.map((p) => (p._id === item._id ? { ...p, isFeatured: !item.isFeatured } : p))
        );
        showNotification("success", `Promotion ${!item.isFeatured ? "featured" : "unfeatured"}`);
      }
    } catch {
      showNotification("error", "Failed to update featured flag");
    }
  };

  const handleDelete = async () => {
    if (!promoToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/promotions/${promoToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data?.success) {
        setPromotions((prev) => prev.filter((p) => p._id !== promoToDelete._id));
        showNotification("success", "Promotion deleted successfully");
        setPromoToDelete(null);
        fetchPromotions();
      } else {
        showNotification("error", data?.message || "Failed to delete promotion");
      }
    } catch {
      showNotification("error", "Failed to delete promotion");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (item: PromotionItem) => {
    const now = new Date();
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    if (!item.isActive) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 border border-stone-200">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
          Hidden
        </span>
      );
    }

    if (now > end) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Expired
        </span>
      );
    }

    if (now < start) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Upcoming
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold shadow-xl border animate-slideDown ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
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

      {/* Page Header */}
      <AdminPageHeader
        title="Promotions"
        description="Manage active seasonal discounts, package deals, branch specials, and promotional campaigns."
        breadcrumbs={[{ label: "Promotions" }]}
        action={
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-950/20 hover:from-[#6D28D9] hover:to-[#5B21B6] transition-all cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Promotion</span>
          </button>
        }
      />

      {/* Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total</p>
          <p className="text-xl font-extrabold text-stone-900 mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Active Now</p>
          <p className="text-xl font-extrabold text-emerald-900 mt-0.5">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Upcoming</p>
          <p className="text-xl font-extrabold text-blue-900 mt-0.5">{stats.upcoming}</p>
        </div>
        <div className="rounded-xl border border-red-200/70 bg-red-50/40 p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">Expired</p>
          <p className="text-xl font-extrabold text-red-900 mt-0.5">{stats.expired}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-purple-200/70 bg-purple-50/40 p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Featured</p>
          <p className="text-xl font-extrabold text-purple-900 mt-0.5">{stats.featured}</p>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search promotions..."
              className="w-full rounded-xl border border-stone-200 pl-10 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="all">All Offer Types</option>
            {PROMOTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROMOTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Now</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
            <option value="hidden">Hidden</option>
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="order">Display Order</option>
            <option value="title">Title (A-Z)</option>
            <option value="startDate">Start Date</option>
            <option value="endDate">End Date</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Promotions Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-stone-100 animate-pulse border border-stone-200" />
          ))}
        </div>
      ) : filteredAndSortedPromotions.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No promotions found"
          description="Create your first promotional offer to display seasonal packages and discounts on the website."
          actionText="Add Promotion"
          onAction={handleOpenAddForm}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPromotions.map((item) => (
            <div
              key={item._id}
              className={`group flex flex-col justify-between rounded-2xl border bg-white p-4 transition-all shadow-xs hover:shadow-md ${
                !item.isActive ? "opacity-60 border-dashed border-stone-300" : "border-stone-200/90"
              }`}
            >
              <div>
                {/* Banner with Floating Badge */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Floating Purple Badge on Top-Left (Matches Mockup) */}
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-[#7C3AED] px-3 py-1 text-xs font-bold text-white shadow-md shadow-purple-950/30">
                      {item.badgeText}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {getStatusBadge(item)}
                    {item.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <SparklesIcon className="h-3 w-3" />
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="font-semibold text-purple-700 uppercase tracking-wider">
                      {PROMOTION_TYPE_LABELS[item.promoType] || item.promoType}
                    </span>
                    {item.ctaCustomLabel && (
                      <span className="text-stone-400 font-medium">CTA: {item.ctaCustomLabel}</span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-stone-900 line-clamp-1 leading-snug">
                    {item.title}
                  </h3>

                  {item.subtitle && (
                    <p className="text-xs font-medium text-stone-600 line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Validity / Condition Row */}
                  <div className="pt-2 flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                    <CalendarIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>
                      {item.validDaysText ||
                        `Valid until ${new Date(item.endDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}`}
                    </span>
                  </div>

                  {/* Pricing row if available */}
                  {(item.promotionalPrice || item.originalPrice) && (
                    <div className="pt-1 flex items-baseline gap-2">
                      {item.promotionalPrice && (
                        <span className="text-sm font-bold text-stone-900">
                          Now LKR {item.promotionalPrice.toLocaleString()}
                        </span>
                      )}
                      {item.originalPrice && (
                        <span className="text-xs text-stone-400 line-through">
                          LKR {item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Branch Availability */}
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-stone-500">
                    <MapPinIcon className="h-3 w-3 text-stone-400 shrink-0" />
                    <span className="truncate">
                      {Array.isArray(item.branchIds) && item.branchIds.length > 0
                        ? item.branchIds.map((b) => (typeof b === "object" ? b.name : b)).join(", ")
                        : "All Branches"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item)}
                  disabled={togglingStatusId === item._id}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                    item.isActive
                      ? "text-stone-600 hover:bg-stone-100"
                      : "text-purple-700 bg-purple-50 hover:bg-purple-100"
                  }`}
                  title={item.isActive ? "Hide promotion" : "Activate promotion"}
                >
                  {item.isActive ? (
                    <>
                      <EyeOffIcon className="h-3.5 w-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-3.5 w-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(item)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      item.isFeatured
                        ? "text-purple-600 bg-purple-50 hover:bg-purple-100"
                        : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                    }`}
                    title="Toggle featured flag"
                  >
                    <SparklesIcon className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditForm(item)}
                    className="rounded-lg p-1.5 text-stone-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Edit promotion"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPromoToDelete(item)}
                    className="rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete promotion"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={handleCloseForm} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED]">
                  <TagIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    {editingId ? "Edit Promotion" : "Create New Promotion"}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Promotion will be displayed on the public /promotions page with validity tracking.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Promotion Banner Image *
                </label>
                <ImageUpload
                  value={form.image}
                  publicId={form.imagePublicId}
                  folder={CLOUDINARY_FOLDERS.PROMOTIONS}
                  onChange={(res) =>
                    setForm((prev) => ({
                      ...prev,
                      image: res.url,
                      imagePublicId: res.publicId,
                    }))
                  }
                  onRemove={() =>
                    setForm((prev) => ({
                      ...prev,
                      image: "",
                      imagePublicId: "",
                    }))
                  }
                  description="Attractive banner or treatment photo (16:10 or 16:9 ratio recommended)."
                />
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Promotion Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Hair Spa Refresh Offer"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Floating Badge Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.badgeText}
                    onChange={(e) => setForm((prev) => ({ ...prev, badgeText: e.target.value }))}
                    placeholder="20% OFF or Wedding"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Offer Type & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Offer Type *
                  </label>
                  <select
                    value={form.promoType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, promoType: e.target.value as PromotionType }))
                    }
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    {PROMOTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PROMOTION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g. Complimentary consultation included"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enjoy a relaxing hair spa treatment with premium products and a complete hair care combo..."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Dates & Validity Text */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Validity Label (Shown on Card)
                  </label>
                  <input
                    type="text"
                    value={form.validDaysText}
                    onChange={(e) => setForm((prev) => ({ ...prev, validDaysText: e.target.value }))}
                    placeholder="e.g. Valid until 31 Oct, Mon – Thu"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Pricing & Discounts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, discountType: e.target.value as DiscountType }))
                    }
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (LKR)</option>
                    <option value="custom_text">Custom / Package</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Original Price (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="4500"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Offer Price (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.promotionalPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, promotionalPrice: e.target.value }))}
                    placeholder="3600"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* CTA Action Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Button Action (CTA)
                  </label>
                  <select
                    value={form.ctaType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ctaType: e.target.value as CtaType }))
                    }
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    <option value="whatsapp">WhatsApp Enquiry</option>
                    <option value="booking">Online Booking System</option>
                    <option value="service_link">View Service Page</option>
                    <option value="product_link">View Products Page</option>
                    <option value="wedding_link">View Wedding Page</option>
                    <option value="external_link">Custom Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={form.ctaCustomLabel}
                    onChange={(e) => setForm((prev) => ({ ...prev, ctaCustomLabel: e.target.value }))}
                    placeholder="e.g. Book Offer, View Offer, Shop Now"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Link to Entity (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Link to Service (Optional)
                  </label>
                  <select
                    value={form.relatedServiceId}
                    onChange={(e) => setForm((prev) => ({ ...prev, relatedServiceId: e.target.value }))}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="">None</option>
                    {services.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} (LKR {s.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Link to Product (Optional)
                  </label>
                  <select
                    value={form.relatedProductId}
                    onChange={(e) => setForm((prev) => ({ ...prev, relatedProductId: e.target.value }))}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="">None</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Link to Wedding (Optional)
                  </label>
                  <select
                    value={form.relatedWeddingPackageId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, relatedWeddingPackageId: e.target.value }))
                    }
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="">None</option>
                    {weddingPackages.map((wp) => (
                      <option key={wp._id} value={wp._id}>
                        {wp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch Availability */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Branch Availability
                </label>
                <p className="text-[11px] text-stone-500 mb-2">
                  Select branches where this offer is valid. Leave unselected to apply across all branches.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {branches.map((b) => {
                    const isChecked = form.selectedBranchIds.includes(b._id);
                    return (
                      <label
                        key={b._id}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                          isChecked
                            ? "border-purple-300 bg-purple-50 text-purple-900"
                            : "border-stone-200 text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm((prev) => ({
                                ...prev,
                                selectedBranchIds: [...prev.selectedBranchIds, b._id],
                              }));
                            } else {
                              setForm((prev) => ({
                                ...prev,
                                selectedBranchIds: prev.selectedBranchIds.filter((id) => id !== b._id),
                              }));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded-sm text-purple-600 focus:ring-purple-500 border-stone-300"
                        />
                        <span className="truncate">{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Terms & Conditions (One per line)
                </label>
                <textarea
                  rows={2}
                  value={form.termsText}
                  onChange={(e) => setForm((prev) => ({ ...prev, termsText: e.target.value }))}
                  placeholder="Valid for prior appointments only&#10;Cannot be combined with other offers"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Display Order & Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPromoFeatured"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="h-4 w-4 rounded-sm text-purple-600 focus:ring-purple-500 border-stone-300"
                  />
                  <label htmlFor="isPromoFeatured" className="text-xs font-semibold text-stone-800 cursor-pointer">
                    Featured Offer
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPromoActive"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded-sm text-purple-600 focus:ring-purple-500 border-stone-300"
                  />
                  <label htmlFor="isPromoActive" className="text-xs font-semibold text-stone-800 cursor-pointer">
                    Visible on Site
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={formLoading}
                  className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-950/20 hover:from-[#6D28D9] hover:to-[#5B21B6] transition-all disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : editingId ? "Update Promotion" : "Create Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(promoToDelete)}
        onClose={() => setPromoToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Promotion"
        message={`Are you sure you want to permanently delete "${promoToDelete?.title}"? Its banner image will also be removed from Cloudinary.`}
        confirmText="Delete Promotion"
        loading={isDeleting}
      />
    </div>
  );
}
