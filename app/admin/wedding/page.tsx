"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import ImageUpload from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  SparklesIcon,
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
  StarIcon,
  CheckIcon,
} from "@/components/ui/icons";

// ==========================================
// TYPES
// ==========================================

interface WeddingService {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  imagePublicId?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface WeddingPackage {
  _id: string;
  name: string;
  description: string;
  image: string;
  imagePublicId?: string;
  includedItems: string[];
  price: number;
  durationText: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceFormState {
  name: string;
  description: string;
  price: string;
  duration: string;
  displayOrder: string;
  image: string;
  imagePublicId: string;
  isActive: boolean;
}

interface PackageFormState {
  name: string;
  description: string;
  price: string;
  durationText: string;
  displayOrder: string;
  includedItems: string[];
  image: string;
  imagePublicId: string;
  isFeatured: boolean;
  isActive: boolean;
}

const emptyServiceForm: ServiceFormState = {
  name: "",
  description: "",
  price: "",
  duration: "",
  displayOrder: "0",
  image: "",
  imagePublicId: "",
  isActive: true,
};

const emptyPackageForm: PackageFormState = {
  name: "",
  description: "",
  price: "",
  durationText: "",
  displayOrder: "0",
  includedItems: [],
  image: "",
  imagePublicId: "",
  isFeatured: false,
  isActive: true,
};

export default function AdminWeddingPage() {
  const [activeTab, setActiveTab] = useState<"services" | "packages">("services");

  // Services State
  const [services, setServices] = useState<WeddingService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<WeddingService | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);

  // Services Filters
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [serviceSortBy, setServiceSortBy] = useState<"order" | "newest" | "price-asc" | "price-desc">("order");

  // Packages State
  const [packages, setPackages] = useState<WeddingPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packageForm, setPackageForm] = useState<PackageFormState>(emptyPackageForm);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<WeddingPackage | null>(null);
  const [isDeletingPackage, setIsDeletingPackage] = useState(false);
  const [newIncludedItem, setNewIncludedItem] = useState("");

  // Packages Filters
  const [packageSearch, setPackageSearch] = useState("");
  const [packageStatusFilter, setPackageStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [packageFeaturedFilter, setPackageFeaturedFilter] = useState<"all" | "featured" | "standard">("all");
  const [packageSortBy, setPackageSortBy] = useState<"order" | "newest" | "price-asc" | "price-desc">("order");

  // Shared state
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // ==========================================
  // FETCH SERVICES & PACKAGES
  // ==========================================

  const loadServices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/wedding/services");
      const data = await res.json();
      if (res.ok && data.success) {
        setServices(data.services || []);
      } else {
        showNotification("error", data.message || "Failed to load wedding services");
      }
    } catch {
      showNotification("error", "Network error loading wedding services");
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const loadPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/wedding/packages");
      const data = await res.json();
      if (res.ok && data.success) {
        setPackages(data.packages || []);
      } else {
        showNotification("error", data.message || "Failed to load wedding packages");
      }
    } catch {
      showNotification("error", "Network error loading wedding packages");
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [servicesRes, packagesRes] = await Promise.all([
          fetch("/api/admin/wedding/services"),
          fetch("/api/admin/wedding/packages"),
        ]);
        const [servicesData, packagesData] = await Promise.all([
          servicesRes.json(),
          packagesRes.json(),
        ]);

        if (isMounted && servicesRes.ok && servicesData.success) {
          setServices(servicesData.services || []);
        }
        if (isMounted && packagesRes.ok && packagesData.success) {
          setPackages(packagesData.packages || []);
        }
      } catch {
        if (isMounted) {
          showNotification("error", "Failed to load wedding content");
        }
      } finally {
        if (isMounted) {
          setServicesLoading(false);
          setPackagesLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // STATS CALCULATIONS
  // ==========================================

  const serviceStats = useMemo(() => {
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

  const packageStats = useMemo(() => {
    const total = packages.length;
    const active = packages.filter((p) => p.isActive).length;
    const hidden = packages.filter((p) => !p.isActive).length;
    const featured = packages.filter((p) => p.isFeatured).length;
    return { total, active, hidden, featured };
  }, [packages]);

  // ==========================================
  // FILTERED & SORTED DATA
  // ==========================================

  const filteredServices = useMemo(() => {
    return services
      .filter((service) => {
        if (serviceStatusFilter === "active" && !service.isActive) return false;
        if (serviceStatusFilter === "hidden" && service.isActive) return false;

        if (serviceSearch.trim()) {
          const q = serviceSearch.toLowerCase().trim();
          const nameMatch = service.name.toLowerCase().includes(q);
          const descMatch = (service.description || "").toLowerCase().includes(q);
          return nameMatch || descMatch;
        }
        return true;
      })
      .sort((a, b) => {
        if (serviceSortBy === "order") return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        if (serviceSortBy === "price-asc") return (a.price || 0) - (b.price || 0);
        if (serviceSortBy === "price-desc") return (b.price || 0) - (a.price || 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [services, serviceSearch, serviceStatusFilter, serviceSortBy]);

  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        if (packageStatusFilter === "active" && !pkg.isActive) return false;
        if (packageStatusFilter === "hidden" && pkg.isActive) return false;

        if (packageFeaturedFilter === "featured" && !pkg.isFeatured) return false;
        if (packageFeaturedFilter === "standard" && pkg.isFeatured) return false;

        if (packageSearch.trim()) {
          const q = packageSearch.toLowerCase().trim();
          const nameMatch = pkg.name.toLowerCase().includes(q);
          const descMatch = (pkg.description || "").toLowerCase().includes(q);
          const itemMatch = pkg.includedItems.some((it) => it.toLowerCase().includes(q));
          return nameMatch || descMatch || itemMatch;
        }
        return true;
      })
      .sort((a, b) => {
        if (packageSortBy === "order") return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        if (packageSortBy === "price-asc") return (a.price || 0) - (b.price || 0);
        if (packageSortBy === "price-desc") return (b.price || 0) - (a.price || 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [packages, packageSearch, packageStatusFilter, packageFeaturedFilter, packageSortBy]);

  // ==========================================
  // SERVICE HANDLERS
  // ==========================================

  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceForm(emptyServiceForm);
    setIsServiceFormOpen(true);
  };

  const handleOpenEditService = (service: WeddingService) => {
    setEditingServiceId(service._id);
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      displayOrder: (service.displayOrder ?? 0).toString(),
      image: service.image || "",
      imagePublicId: service.imagePublicId || "",
      isActive: service.isActive,
    });
    setIsServiceFormOpen(true);
  };

  const handleCloseServiceForm = () => {
    setIsServiceFormOpen(false);
    setEditingServiceId(null);
    setServiceForm(emptyServiceForm);
  };

  const handleSubmitServiceForm = async (e: FormEvent) => {
    e.preventDefault();

    if (!serviceForm.name.trim()) {
      showNotification("error", "Service name is required.");
      return;
    }
    if (!serviceForm.description.trim()) {
      showNotification("error", "Service description is required.");
      return;
    }
    if (!serviceForm.price || Number(serviceForm.price) < 0) {
      showNotification("error", "Please provide a valid price.");
      return;
    }
    if (!serviceForm.duration || Number(serviceForm.duration) < 1) {
      showNotification("error", "Please provide a valid duration in minutes.");
      return;
    }

    setFormLoading(true);

    try {
      const url = editingServiceId
        ? `/api/admin/wedding/services/${editingServiceId}`
        : "/api/admin/wedding/services";
      const method = editingServiceId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim(),
          price: Number(serviceForm.price),
          duration: Number(serviceForm.duration),
          displayOrder: Math.max(0, Number(serviceForm.displayOrder) || 0),
          image: serviceForm.image,
          imagePublicId: serviceForm.imagePublicId,
          isActive: serviceForm.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to save service");
        return;
      }

      showNotification(
        "success",
        editingServiceId
          ? "Wedding service updated successfully."
          : "Wedding service created successfully."
      );

      handleCloseServiceForm();
      await loadServices();
    } catch {
      showNotification("error", "An error occurred while saving the wedding service.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleServiceStatus = async (service: WeddingService) => {
    const nextStatus = !service.isActive;

    try {
      const res = await fetch(`/api/admin/wedding/services/${service._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to update status");
        return;
      }

      showNotification(
        "success",
        nextStatus
          ? "Wedding service published to website."
          : "Wedding service hidden from website."
      );

      setServices((prev) =>
        prev.map((s) => (s._id === service._id ? { ...s, isActive: nextStatus } : s))
      );
    } catch {
      showNotification("error", "Failed to update status");
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeletingService(true);

    try {
      const res = await fetch(`/api/admin/wedding/services/${serviceToDelete._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to delete wedding service");
        return;
      }

      showNotification("success", "Wedding service deleted successfully.");
      setServiceToDelete(null);
      await loadServices();
    } catch {
      showNotification("error", "Failed to delete wedding service");
    } finally {
      setIsDeletingService(false);
    }
  };

  // ==========================================
  // PACKAGE HANDLERS
  // ==========================================

  const handleOpenAddPackage = () => {
    setEditingPackageId(null);
    setPackageForm(emptyPackageForm);
    setNewIncludedItem("");
    setIsPackageFormOpen(true);
  };

  const handleOpenEditPackage = (pkg: WeddingPackage) => {
    setEditingPackageId(pkg._id);
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      durationText: pkg.durationText,
      displayOrder: (pkg.displayOrder ?? 0).toString(),
      includedItems: [...pkg.includedItems],
      image: pkg.image || "",
      imagePublicId: pkg.imagePublicId || "",
      isFeatured: pkg.isFeatured,
      isActive: pkg.isActive,
    });
    setNewIncludedItem("");
    setIsPackageFormOpen(true);
  };

  const handleClosePackageForm = () => {
    setIsPackageFormOpen(false);
    setEditingPackageId(null);
    setPackageForm(emptyPackageForm);
    setNewIncludedItem("");
  };

  const handleAddIncludedItem = () => {
    const trimmed = newIncludedItem.trim();
    if (!trimmed) return;
    if (packageForm.includedItems.includes(trimmed)) {
      showNotification("error", "Item is already in the list.");
      return;
    }
    setPackageForm((prev) => ({
      ...prev,
      includedItems: [...prev.includedItems, trimmed],
    }));
    setNewIncludedItem("");
  };

  const handleRemoveIncludedItem = (index: number) => {
    setPackageForm((prev) => ({
      ...prev,
      includedItems: prev.includedItems.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitPackageForm = async (e: FormEvent) => {
    e.preventDefault();

    if (!packageForm.name.trim()) {
      showNotification("error", "Package name is required.");
      return;
    }
    if (!packageForm.description.trim()) {
      showNotification("error", "Short description is required.");
      return;
    }
    if (!packageForm.price || Number(packageForm.price) < 0) {
      showNotification("error", "Please provide a valid price.");
      return;
    }
    if (!packageForm.durationText.trim()) {
      showNotification("error", "Estimated duration text is required.");
      return;
    }
    if (packageForm.includedItems.length === 0) {
      showNotification("error", "Please add at least one included service/item.");
      return;
    }

    setFormLoading(true);

    try {
      const url = editingPackageId
        ? `/api/admin/wedding/packages/${editingPackageId}`
        : "/api/admin/wedding/packages";
      const method = editingPackageId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: packageForm.name.trim(),
          description: packageForm.description.trim(),
          price: Number(packageForm.price),
          durationText: packageForm.durationText.trim(),
          displayOrder: Math.max(0, Number(packageForm.displayOrder) || 0),
          includedItems: packageForm.includedItems,
          image: packageForm.image,
          imagePublicId: packageForm.imagePublicId,
          isFeatured: packageForm.isFeatured,
          isActive: packageForm.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to save package");
        return;
      }

      showNotification(
        "success",
        editingPackageId
          ? "Wedding package updated successfully."
          : "Wedding package created successfully."
      );

      handleClosePackageForm();
      await loadPackages();
    } catch {
      showNotification("error", "An error occurred while saving the wedding package.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleTogglePackageStatus = async (pkg: WeddingPackage) => {
    const nextStatus = !pkg.isActive;

    try {
      const res = await fetch(`/api/admin/wedding/packages/${pkg._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to update package status");
        return;
      }

      showNotification(
        "success",
        nextStatus
          ? "Wedding package published to website."
          : "Wedding package hidden from website."
      );

      setPackages((prev) =>
        prev.map((p) => (p._id === pkg._id ? { ...p, isActive: nextStatus } : p))
      );
    } catch {
      showNotification("error", "Failed to update status");
    }
  };

  const handleTogglePackageFeatured = async (pkg: WeddingPackage) => {
    const nextFeatured = !pkg.isFeatured;

    try {
      const res = await fetch(`/api/admin/wedding/packages/${pkg._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: nextFeatured }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to update featured status");
        return;
      }

      showNotification(
        "success",
        nextFeatured
          ? "Wedding package marked as Most Popular."
          : "Wedding package unmarked as Most Popular."
      );

      setPackages((prev) =>
        prev.map((p) => (p._id === pkg._id ? { ...p, isFeatured: nextFeatured } : p))
      );
    } catch {
      showNotification("error", "Failed to update featured status");
    }
  };

  const handleDeletePackage = async () => {
    if (!packageToDelete) return;
    setIsDeletingPackage(true);

    try {
      const res = await fetch(`/api/admin/wedding/packages/${packageToDelete._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Failed to delete wedding package");
        return;
      }

      showNotification("success", "Wedding package deleted successfully.");
      setPackageToDelete(null);
      await loadPackages();
    } catch {
      showNotification("error", "Failed to delete wedding package");
    } finally {
      setIsDeletingPackage(false);
    }
  };

  return (
    <div className="space-y-7 animate-fadeIn pb-12">
      {/* ========================================================== */}
      {/* 1. PAGE HEADER                                             */}
      {/* ========================================================== */}
      <AdminPageHeader
        title="Wedding"
        description="Manage wedding services and bridal beauty packages displayed on the website."
        breadcrumbs={[{ label: "Wedding" }]}
        action={
          activeTab === "services" ? (
            <button
              type="button"
              onClick={handleOpenAddService}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] active:scale-[0.98] cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Wedding Service</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddPackage}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] active:scale-[0.98] cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Wedding Package</span>
            </button>
          )
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
      {/* 2. TAB NAVIGATION                                          */}
      {/* ========================================================== */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-0">
        <button
          type="button"
          onClick={() => {
            setActiveTab("services");
            setIsPackageFormOpen(false);
          }}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "services"
              ? "border-[#7C3AED] text-[#7C3AED]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <ScissorsIcon className="h-4 w-4" />
          <span>Wedding Services</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === "services"
                ? "bg-purple-100 text-[#7C3AED]"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {services.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("packages");
            setIsServiceFormOpen(false);
          }}
          className={`flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "packages"
              ? "border-[#7C3AED] text-[#7C3AED]"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <SparklesIcon className="h-4 w-4" />
          <span>Wedding Packages</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === "packages"
                ? "bg-purple-100 text-[#7C3AED]"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {packages.length}
          </span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* 3. TAB 1: WEDDING SERVICES                                 */}
      {/* ========================================================== */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                <ScissorsIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">Total Services</p>
                <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
                  {servicesLoading ? "..." : serviceStats.total}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Single wedding services</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">Active Services</p>
                <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
                  {servicesLoading ? "..." : serviceStats.active}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Visible on wedding page</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
                <EyeOffIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">Hidden Services</p>
                <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
                  {servicesLoading ? "..." : serviceStats.hidden}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Draft / unlisted</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                <TagIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">Average Price</p>
                <p className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-0.5">
                  {servicesLoading ? "..." : `LKR ${serviceStats.avgPrice.toLocaleString()}`}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Across wedding services</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search wedding services..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 hidden md:inline">Status</span>
                <select
                  value={serviceStatusFilter}
                  onChange={(e) =>
                    setServiceStatusFilter(e.target.value as "all" | "active" | "hidden")
                  }
                  className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white cursor-pointer"
                >
                  <option value="all">All Services</option>
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 hidden md:inline">Sort By</span>
                <select
                  value={serviceSortBy}
                  onChange={(e) =>
                    setServiceSortBy(
                      e.target.value as "order" | "newest" | "price-asc" | "price-desc"
                    )
                  }
                  className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white cursor-pointer"
                >
                  <option value="order">Display Order</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price Low → High</option>
                  <option value="price-desc">Price High → Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid + Drawer Area */}
          <div className={isServiceFormOpen ? "grid grid-cols-1 lg:grid-cols-12 gap-7 items-start" : "block"}>
            <div className={isServiceFormOpen ? "lg:col-span-7 xl:col-span-8" : "w-full"}>
              {servicesLoading ? (
                <div
                  className={`grid gap-5 ${
                    isServiceFormOpen
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  }`}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs space-y-3 animate-pulse"
                    >
                      <div className="aspect-[16/10] w-full rounded-xl bg-stone-200" />
                      <div className="h-4 w-3/4 rounded bg-stone-200" />
                      <div className="h-3 w-full rounded bg-stone-100" />
                      <div className="h-8 w-full rounded-xl bg-stone-100 mt-2" />
                    </div>
                  ))}
                </div>
              ) : filteredServices.length === 0 ? (
                services.length === 0 ? (
                  <EmptyState
                    icon={ScissorsIcon}
                    title="No wedding services yet"
                    description="Create your first wedding service to display it on the /wedding page."
                    actionText="+ Add Wedding Service"
                    onAction={handleOpenAddService}
                  />
                ) : (
                  <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
                    <p className="text-sm font-semibold text-stone-700">
                      No wedding services match your search or filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setServiceSearch("");
                        setServiceStatusFilter("all");
                      }}
                      className="mt-3 text-xs font-semibold text-[#7C3AED] hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )
              ) : (
                <div
                  className={`grid gap-5 ${
                    isServiceFormOpen
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  }`}
                >
                  {filteredServices.map((service) => (
                    <div
                      key={service._id}
                      className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        {/* Card Image */}
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

                          <div className="absolute top-3 right-3 z-10 shadow-xs">
                            <StatusBadge
                              status={service.isActive ? "active" : "hidden"}
                              label={service.isActive ? "Active" : "Hidden"}
                            />
                          </div>

                          {service.displayOrder !== undefined && service.displayOrder > 0 && (
                            <div className="absolute bottom-2 left-2 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Order #{service.displayOrder}
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4 sm:p-5">
                          <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight line-clamp-1">
                            {service.name}
                          </h3>

                          <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed min-h-[32px]">
                            {service.description || "No description provided."}
                          </p>

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

                      {/* Card Actions */}
                      <div className="p-4 sm:p-5 pt-0">
                        <div className="grid grid-cols-3 gap-2 text-xs font-semibold pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditService(service)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-stone-700 hover:bg-stone-50 hover:border-purple-300 hover:text-[#7C3AED] transition-all cursor-pointer"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleServiceStatus(service)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all cursor-pointer ${
                              service.isActive
                                ? "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                                : "border-purple-200 bg-purple-50 text-[#7C3AED] hover:bg-purple-100"
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

                          <button
                            type="button"
                            onClick={() => setServiceToDelete(service)}
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

            {/* Service Form Drawer / Panel */}
            {isServiceFormOpen && (
              <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                        {editingServiceId ? "Edit Wedding Service" : "Add Wedding Service"}
                      </h2>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {editingServiceId
                          ? "Update service details, pricing, and visibility."
                          : "Create a single wedding beauty service."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseServiceForm}
                      className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                      aria-label="Close form"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitServiceForm} className="mt-5 space-y-4">
                    <div>
                      <ImageUpload
                        folder={CLOUDINARY_FOLDERS.WEDDING_SERVICES}
                        value={serviceForm.image}
                        publicId={serviceForm.imagePublicId}
                        label="Service Image *"
                        description="Upload bridal service photo (PNG, JPG, WebP up to 5MB)"
                        onChange={({ url, publicId }) => {
                          setServiceForm((prev) => ({
                            ...prev,
                            image: url,
                            imagePublicId: publicId,
                          }));
                        }}
                        onRemove={() => {
                          setServiceForm((prev) => ({
                            ...prev,
                            image: "",
                            imagePublicId: "",
                          }));
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Service Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, name: e.target.value })
                        }
                        placeholder="e.g. Bridal Makeup"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={serviceForm.description}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, description: e.target.value })
                        }
                        placeholder="Complete bridal makeup service designed to create an elegant look..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Price (LKR) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={serviceForm.price}
                          onChange={(e) =>
                            setServiceForm({ ...serviceForm, price: e.target.value })
                          }
                          placeholder="e.g. 15000"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
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
                          value={serviceForm.duration}
                          onChange={(e) =>
                            setServiceForm({ ...serviceForm, duration: e.target.value })
                          }
                          placeholder="e.g. 120"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={serviceForm.displayOrder}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, displayOrder: e.target.value })
                        }
                        placeholder="0 (Lower shows first)"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5">
                      <div>
                        <p className="text-xs font-bold text-stone-900">Active Status</p>
                        <p className="text-[11px] text-stone-500">
                          Show this service on the website
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={serviceForm.isActive}
                        onClick={() =>
                          setServiceForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          serviceForm.isActive ? "bg-[#7C3AED]" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                            serviceForm.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={handleCloseServiceForm}
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
                            : editingServiceId
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
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. TAB 2: WEDDING PACKAGES                                 */}
      {/* ========================================================== */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">Total Packages</p>
                <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
                  {packagesLoading ? "..." : packageStats.total}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Curated wedding packages</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">Active Packages</p>
                <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
                  {packagesLoading ? "..." : packageStats.active}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Visible on wedding page</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
                <EyeOffIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">Hidden Packages</p>
                <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
                  {packagesLoading ? "..." : packageStats.hidden}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Draft / unlisted</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <StarIcon className="h-6 w-6" filled />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">Featured Packages</p>
                <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
                  {packagesLoading ? "..." : packageStats.featured}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Highlighted as Most Popular</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={packageSearch}
                onChange={(e) => setPackageSearch(e.target.value)}
                placeholder="Search packages..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 hidden md:inline">Status</span>
                <select
                  value={packageStatusFilter}
                  onChange={(e) =>
                    setPackageStatusFilter(e.target.value as "all" | "active" | "hidden")
                  }
                  className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white cursor-pointer"
                >
                  <option value="all">All Packages</option>
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 hidden md:inline">Featured</span>
                <select
                  value={packageFeaturedFilter}
                  onChange={(e) =>
                    setPackageFeaturedFilter(e.target.value as "all" | "featured" | "standard")
                  }
                  className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="featured">Featured (Most Popular)</option>
                  <option value="standard">Standard</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 hidden md:inline">Sort By</span>
                <select
                  value={packageSortBy}
                  onChange={(e) =>
                    setPackageSortBy(
                      e.target.value as "order" | "newest" | "price-asc" | "price-desc"
                    )
                  }
                  className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 outline-none transition-all focus:border-[#7C3AED] focus:bg-white cursor-pointer"
                >
                  <option value="order">Display Order</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price Low → High</option>
                  <option value="price-desc">Price High → Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid + Drawer Area */}
          <div className={isPackageFormOpen ? "grid grid-cols-1 lg:grid-cols-12 gap-7 items-start" : "block"}>
            <div className={isPackageFormOpen ? "lg:col-span-7 xl:col-span-8" : "w-full"}>
              {packagesLoading ? (
                <div
                  className={`grid gap-5 ${
                    isPackageFormOpen
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs space-y-3 animate-pulse"
                    >
                      <div className="aspect-[16/10] w-full rounded-xl bg-stone-200" />
                      <div className="h-4 w-3/4 rounded bg-stone-200" />
                      <div className="h-3 w-full rounded bg-stone-100" />
                      <div className="h-8 w-full rounded-xl bg-stone-100 mt-2" />
                    </div>
                  ))}
                </div>
              ) : filteredPackages.length === 0 ? (
                packages.length === 0 ? (
                  <EmptyState
                    icon={SparklesIcon}
                    title="No wedding packages yet"
                    description="Create your first curated wedding package to display it on the /wedding page."
                    actionText="+ Add Wedding Package"
                    onAction={handleOpenAddPackage}
                  />
                ) : (
                  <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
                    <p className="text-sm font-semibold text-stone-700">
                      No wedding packages match your search or filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPackageSearch("");
                        setPackageStatusFilter("all");
                        setPackageFeaturedFilter("all");
                      }}
                      className="mt-3 text-xs font-semibold text-[#7C3AED] hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )
              ) : (
                <div
                  className={`grid gap-5 ${
                    isPackageFormOpen
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {filteredPackages.map((pkg) => (
                    <div
                      key={pkg._id}
                      className={`group flex flex-col justify-between rounded-2xl bg-white overflow-hidden shadow-xs transition-all duration-200 ${
                        pkg.isFeatured
                          ? "border-2 border-[#7C3AED] shadow-purple-500/10"
                          : "border border-stone-200/90 hover:border-purple-300 hover:shadow-md"
                      }`}
                    >
                      <div>
                        {/* Package Image */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                          {pkg.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pkg.image}
                              alt={pkg.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-300">
                              <SparklesIcon className="h-10 w-10" />
                            </div>
                          )}

                          {/* Featured & Status Badges */}
                          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                            {pkg.isFeatured && (
                              <span className="rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                                Most Popular
                              </span>
                            )}
                          </div>

                          <div className="absolute top-3 right-3 z-10 shadow-xs">
                            <StatusBadge
                              status={pkg.isActive ? "active" : "hidden"}
                              label={pkg.isActive ? "Active" : "Hidden"}
                            />
                          </div>

                          {pkg.displayOrder !== undefined && pkg.displayOrder > 0 && (
                            <div className="absolute bottom-2 left-2 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Order #{pkg.displayOrder}
                            </div>
                          )}
                        </div>

                        {/* Package Body */}
                        <div className="p-4 sm:p-5">
                          <h3 className="text-base font-bold text-stone-900 tracking-tight line-clamp-1">
                            {pkg.name}
                          </h3>

                          <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed min-h-[32px]">
                            {pkg.description || "No description provided."}
                          </p>

                          {/* Included Services Preview */}
                          <div className="mt-3.5 pt-3 border-t border-stone-100">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                              Included ({pkg.includedItems.length})
                            </p>
                            <ul className="space-y-1.5 text-xs text-stone-700">
                              {pkg.includedItems.slice(0, 4).map((item, idx) => (
                                <li key={idx} className="flex items-center gap-1.5 line-clamp-1">
                                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED]">
                                    <CheckIcon className="h-2.5 w-2.5" />
                                  </span>
                                  <span className="truncate">{item}</span>
                                </li>
                              ))}
                              {pkg.includedItems.length > 4 && (
                                <li className="text-[11px] text-[#7C3AED] font-semibold pl-5.5">
                                  +{pkg.includedItems.length - 4} more items
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Price & Duration */}
                          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-stone-100">
                            <div className="font-extrabold text-sm sm:text-base text-stone-900">
                              LKR {Number(pkg.price).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                              <ClockIcon className="h-3.5 w-3.5 text-stone-400" />
                              <span>{pkg.durationText}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Package Actions */}
                      <div className="p-4 sm:p-5 pt-0">
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-stone-700 hover:bg-stone-50 hover:border-purple-300 hover:text-[#7C3AED] transition-all cursor-pointer"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePackageFeatured(pkg)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all cursor-pointer ${
                              pkg.isFeatured
                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                            }`}
                          >
                            <StarIcon className="h-3.5 w-3.5" filled={pkg.isFeatured} />
                            <span>{pkg.isFeatured ? "Popular" : "Feature"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePackageStatus(pkg)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all cursor-pointer ${
                              pkg.isActive
                                ? "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                                : "border-purple-200 bg-purple-50 text-[#7C3AED] hover:bg-purple-100"
                            }`}
                          >
                            {pkg.isActive ? (
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

                          <button
                            type="button"
                            onClick={() => setPackageToDelete(pkg)}
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

            {/* Package Form Drawer / Panel */}
            {isPackageFormOpen && (
              <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                        {editingPackageId ? "Edit Wedding Package" : "Add Wedding Package"}
                      </h2>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {editingPackageId
                          ? "Update package details, included items, and pricing."
                          : "Create a curated wedding beauty package."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClosePackageForm}
                      className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                      aria-label="Close form"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitPackageForm} className="mt-5 space-y-4">
                    <div>
                      <ImageUpload
                        folder={CLOUDINARY_FOLDERS.WEDDING_PACKAGES}
                        value={packageForm.image}
                        publicId={packageForm.imagePublicId}
                        label="Package Image *"
                        description="Upload bridal package photo (PNG, JPG, WebP up to 5MB)"
                        onChange={({ url, publicId }) => {
                          setPackageForm((prev) => ({
                            ...prev,
                            image: url,
                            imagePublicId: publicId,
                          }));
                        }}
                        onRemove={() => {
                          setPackageForm((prev) => ({
                            ...prev,
                            image: "",
                            imagePublicId: "",
                          }));
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Package Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={packageForm.name}
                        onChange={(e) =>
                          setPackageForm({ ...packageForm, name: e.target.value })
                        }
                        placeholder="e.g. Premium Wedding Package"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Short Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={packageForm.description}
                        onChange={(e) =>
                          setPackageForm({ ...packageForm, description: e.target.value })
                        }
                        placeholder="A complete bridal beauty experience for a truly memorable day."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                      />
                    </div>

                    {/* Included Items Section */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Included Services / Items <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newIncludedItem}
                          onChange={(e) => setNewIncludedItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddIncludedItem();
                            }
                          }}
                          placeholder="e.g. Bridal Makeup (HD)"
                          className="flex-1 rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                        />
                        <button
                          type="button"
                          onClick={handleAddIncludedItem}
                          className="rounded-xl bg-[#7C3AED] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9] transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Chips / Selected items */}
                      <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {packageForm.includedItems.length === 0 ? (
                          <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg p-2">
                            Please add at least one included item (e.g., Bridal Makeup, Nail Care).
                          </p>
                        ) : (
                          packageForm.includedItems.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 rounded-lg border border-purple-100 bg-purple-50/60 px-3 py-1.5 text-xs text-stone-800"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckIcon className="h-3.5 w-3.5 text-[#7C3AED] shrink-0" />
                                <span className="truncate">{item}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveIncludedItem(index)}
                                className="text-stone-400 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer"
                                aria-label={`Remove ${item}`}
                              >
                                <XIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Price (LKR) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={packageForm.price}
                          onChange={(e) =>
                            setPackageForm({ ...packageForm, price: e.target.value })
                          }
                          placeholder="e.g. 45000"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Estimated Duration <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={packageForm.durationText}
                          onChange={(e) =>
                            setPackageForm({ ...packageForm, durationText: e.target.value })
                          }
                          placeholder="e.g. 4–5 hours"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={packageForm.displayOrder}
                        onChange={(e) =>
                          setPackageForm({ ...packageForm, displayOrder: e.target.value })
                        }
                        placeholder="0 (Lower shows first)"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                    </div>

                    {/* Featured / Most Popular Toggle */}
                    <div className="pt-2 flex items-center justify-between rounded-xl border border-purple-200/80 bg-purple-50/40 p-3.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <StarIcon className="h-3.5 w-3.5 text-[#7C3AED]" filled />
                          <p className="text-xs font-bold text-stone-900">Featured (Most Popular)</p>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Highlight with MOST POPULAR badge on website
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={packageForm.isFeatured}
                        onClick={() =>
                          setPackageForm((prev) => ({ ...prev, isFeatured: !prev.isFeatured }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          packageForm.isFeatured ? "bg-[#7C3AED]" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                            packageForm.isFeatured ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5">
                      <div>
                        <p className="text-xs font-bold text-stone-900">Active Status</p>
                        <p className="text-[11px] text-stone-500">
                          Show this package on the website
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={packageForm.isActive}
                        onClick={() =>
                          setPackageForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          packageForm.isActive ? "bg-[#7C3AED]" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                            packageForm.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={handleClosePackageForm}
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
                            : editingPackageId
                            ? "Save Changes"
                            : "Add Package"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 5. CONFIRM DELETE MODALS                                   */}
      {/* ========================================================== */}
      <ConfirmModal
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDeleteService}
        title="Delete Wedding Service?"
        message="Are you sure you want to permanently delete this wedding service? This action cannot be undone."
        confirmText="Delete Wedding Service"
        cancelText="Cancel"
        variant="danger"
        loading={isDeletingService}
      />

      <ConfirmModal
        isOpen={Boolean(packageToDelete)}
        onClose={() => setPackageToDelete(null)}
        onConfirm={handleDeletePackage}
        title="Delete Wedding Package?"
        message="Are you sure you want to permanently delete this wedding package? This action cannot be undone."
        confirmText="Delete Wedding Package"
        cancelText="Cancel"
        variant="danger"
        loading={isDeletingPackage}
      />
    </div>
  );
}
