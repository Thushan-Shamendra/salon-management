"use client";

import React, { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import EmptyState from "@/components/admin/EmptyState";
import ImageUpload from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  ShoppingBagIcon,
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
  MapPinIcon,
  PackageIcon,
} from "@/components/ui/icons";
import {
  RETAIL_PRODUCT_CATEGORIES,
  RETAIL_CATEGORY_LABELS,
  RetailProductCategory,
  StockStatus,
} from "@/lib/retail-product-constants";

interface BranchSummary {
  _id: string;
  name: string;
  slug: string;
}

interface RetailProductItem {
  _id: string;
  name: string;
  slug: string;
  category: RetailProductCategory;
  brand?: string;
  image: string;
  imagePublicId: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  stockStatus: StockStatus;
  size?: string;
  sku?: string;
  branchIds?: BranchSummary[];
  isFeatured: boolean;
  isMostPopular?: boolean;
  isFastMoving?: boolean;
  isDiscountProduct?: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductFormState {
  name: string;
  category: RetailProductCategory;
  brand: string;
  image: string;
  imagePublicId: string;
  description: string;
  shortDescription: string;
  price: string;
  salePrice: string;
  stockStatus: StockStatus;
  size: string;
  sku: string;
  selectedBranchIds: string[];
  isFeatured: boolean;
  isMostPopular: boolean;
  isFastMoving: boolean;
  isDiscountProduct: boolean;
  isActive: boolean;
  displayOrder: string;
}

const emptyForm: ProductFormState = {
  name: "",
  category: "hair_care",
  brand: "Salvora",
  image: "",
  imagePublicId: "",
  description: "",
  shortDescription: "",
  price: "",
  salePrice: "",
  stockStatus: "in_stock",
  size: "",
  sku: "",
  selectedBranchIds: [],
  isFeatured: false,
  isMostPopular: false,
  isFastMoving: false,
  isDiscountProduct: false,
  isActive: true,
  displayOrder: "0",
};

export default function AdminRetailProductsPage() {
  const [products, setProducts] = useState<RetailProductItem[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Global Product Feature Sections state
  const [productFeatureSections, setProductFeatureSections] = useState({
    mostPopular: true,
    fastMoving: true,
    discounts: true,
  });
  const [savingDisplaySettings, setSavingDisplaySettings] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    hidden: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    featured: 0,
    mostPopular: 0,
    fastMoving: 0,
    discount: 0,
  });

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [featureFilter, setFeatureFilter] = useState<
    "all" | "most_popular" | "fast_moving" | "discount" | "featured"
  >("all");
  const [sortBy, setSortBy] = useState<"order" | "name" | "price_asc" | "price_desc" | "newest">("order");

  // Notifications & modal state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [productToDelete, setProductToDelete] = useState<RetailProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/retail-products");
      const data = await res.json();
      if (data?.success) {
        setProducts(data.products || []);
        if (data.stats) {
          setStats((prev) => ({ ...prev, ...data.stats }));
        }
        if (data.productFeatureSections) {
          setProductFeatureSections(data.productFeatureSections);
        }
      }
    } catch {
      showNotification("error", "Error refreshing products");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [prodRes, branchRes] = await Promise.all([
          fetch("/api/admin/retail-products"),
          fetch("/api/branches"),
        ]);
        const prodData = await prodRes.json();
        const branchData = await branchRes.json();

        if (isMounted && prodData?.success) {
          setProducts(prodData.products || []);
          if (prodData.stats) setStats((prev) => ({ ...prev, ...prodData.stats }));
          if (prodData.productFeatureSections) {
            setProductFeatureSections(prodData.productFeatureSections);
          }
        }
        if (isMounted && branchData?.success && Array.isArray(branchData.branches)) {
          setBranches(branchData.branches);
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

  const handleSaveDisplaySettings = async () => {
    try {
      setSavingDisplaySettings(true);
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productFeatureSections }),
      });
      const data = await res.json();
      if (data?.success) {
        if (data.settings?.productFeatureSections) {
          setProductFeatureSections(data.settings.productFeatureSections);
        }
        showNotification("success", "Product display sections saved");
      } else {
        showNotification("error", data?.message || "Failed to save display settings");
      }
    } catch {
      showNotification("error", "Failed to save display settings");
    } finally {
      setSavingDisplaySettings(false);
    }
  };

  // Client-side filtering & sorting
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    if (stockFilter !== "all") {
      list = list.filter((p) => p.stockStatus === stockFilter);
    }

    if (statusFilter === "active") {
      list = list.filter((p) => p.isActive);
    } else if (statusFilter === "hidden") {
      list = list.filter((p) => !p.isActive);
    }

    if (featureFilter === "most_popular") {
      list = list.filter((p) => Boolean(p.isMostPopular));
    } else if (featureFilter === "fast_moving") {
      list = list.filter((p) => Boolean(p.isFastMoving));
    } else if (featureFilter === "discount") {
      list = list.filter((p) => Boolean(p.isDiscountProduct));
    } else if (featureFilter === "featured") {
      list = list.filter((p) => Boolean(p.isFeatured));
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
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "price_asc":
        return list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
      case "price_desc":
        return list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
      case "newest":
        return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case "order":
      default:
        return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
  }, [products, searchQuery, categoryFilter, stockFilter, statusFilter, featureFilter, branchFilter, sortBy]);

  const handleOpenAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: RetailProductItem) => {
    setEditingId(item._id);
    setFormError(null);
    setForm({
      name: item.name,
      category: item.category,
      brand: item.brand || "Salvora",
      image: item.image,
      imagePublicId: item.imagePublicId,
      description: item.description || "",
      shortDescription: item.shortDescription || "",
      price: item.price !== undefined && item.price !== null ? item.price.toString() : "",
      salePrice:
        item.salePrice !== undefined && item.salePrice !== null
          ? item.salePrice.toString()
          : "",
      stockStatus: item.stockStatus || "in_stock",
      size: item.size || "",
      sku: item.sku || "",
      selectedBranchIds: Array.isArray(item.branchIds)
        ? item.branchIds.map((b) => (typeof b === "object" ? b._id : b))
        : [],
      isFeatured: Boolean(item.isFeatured),
      isMostPopular: Boolean(item.isMostPopular),
      isFastMoving: Boolean(item.isFastMoving),
      isDiscountProduct: Boolean(item.isDiscountProduct),
      isActive: item.isActive !== undefined ? item.isActive : true,
      displayOrder: (item.displayOrder || 0).toString(),
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (formLoading) return;
    setIsFormOpen(false);
    setEditingId(null);
    setFormError(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Product name is required");
      showNotification("error", "Product name is required");
      return;
    }
    if (!form.image || !form.imagePublicId) {
      setFormError("Product image is required");
      showNotification("error", "Product image is required");
      return;
    }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Valid price is required");
      showNotification("error", "Valid price is required");
      return;
    }

    const salePriceNum = form.salePrice.trim() !== "" ? parseFloat(form.salePrice) : null;
    if (form.isDiscountProduct) {
      if (
        salePriceNum === null ||
        isNaN(salePriceNum) ||
        salePriceNum < 0 ||
        salePriceNum >= priceNum
      ) {
        const msg = "Add a valid sale price before marking this as a Discount Product.";
        setFormError(msg);
        showNotification("error", msg);
        return;
      }
    }

    try {
      setFormLoading(true);
      const payload = {
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim() || "Salvora",
        image: form.image,
        imagePublicId: form.imagePublicId,
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim(),
        price: priceNum,
        salePrice: salePriceNum,
        stockStatus: form.stockStatus,
        size: form.size.trim(),
        sku: form.sku.trim(),
        branchIds: form.selectedBranchIds,
        isFeatured: form.isFeatured,
        isMostPopular: form.isMostPopular,
        isFastMoving: form.isFastMoving,
        isDiscountProduct: form.isDiscountProduct,
        isActive: form.isActive,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
      };

      const url = editingId
        ? `/api/admin/retail-products/${editingId}`
        : "/api/admin/retail-products";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data?.success) {
        showNotification("success", editingId ? "Product updated successfully" : "Product created successfully");
        handleCloseForm();
        fetchProducts();
      } else {
        const errMsg = data?.message || "Failed to save product";
        setFormError(errMsg);
        showNotification("error", errMsg);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      showNotification("error", "Failed to save product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (item: RetailProductItem) => {
    try {
      setTogglingStatusId(item._id);
      const res = await fetch(`/api/admin/retail-products/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (data?.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === item._id ? { ...p, isActive: !item.isActive } : p))
        );
        showNotification("success", `Product ${item.isActive ? "hidden" : "activated"}`);
      } else {
        showNotification("error", data?.message || "Failed to toggle status");
      }
    } catch {
      showNotification("error", "Failed to update status");
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleToggleFeatured = async (item: RetailProductItem) => {
    try {
      const res = await fetch(`/api/admin/retail-products/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !item.isFeatured }),
      });
      const data = await res.json();
      if (data?.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === item._id ? { ...p, isFeatured: !item.isFeatured } : p))
        );
        showNotification("success", `Product ${!item.isFeatured ? "featured" : "unfeatured"}`);
      }
    } catch {
      showNotification("error", "Failed to update featured flag");
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/retail-products/${productToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data?.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productToDelete._id));
        showNotification("success", "Product deleted successfully");
        setProductToDelete(null);
        fetchProducts();
      } else {
        showNotification("error", data?.message || "Failed to delete product");
      }
    } catch {
      showNotification("error", "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStockBadge = (status: StockStatus) => {
    switch (status) {
      case "in_stock":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            In Stock
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Low Stock
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Out of Stock
          </span>
        );
    }
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
        title="Selling Products"
        description="Manage retail salon products available for customer purchase and WhatsApp enquiry."
        breadcrumbs={[{ label: "Selling Products" }]}
        action={
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-950/20 hover:from-[#6D28D9] hover:to-[#5B21B6] transition-all cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        }
      />

      {/* Product Display Sections - Global Enable / Disable Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-stone-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider">
              Product Display Sections
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
              Globally control which feature sections appear on the public /products page.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveDisplaySettings}
            disabled={savingDisplaySettings}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {savingDisplaySettings ? "Saving..." : "Save Display Settings"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Most Popular Products */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-stone-50/60 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-800 truncate">
                  Most Popular Products
                </span>
                <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                  {stats.mostPopular}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">Customer Favorites section</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setProductFeatureSections((prev) => ({
                  ...prev,
                  mostPopular: !prev.mostPopular,
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                productFeatureSections.mostPopular ? "bg-[#03BF62]" : "bg-stone-300"
              }`}
              role="switch"
              aria-checked={productFeatureSections.mostPopular}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  productFeatureSections.mostPopular ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Fast Moving Products */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-stone-50/60 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-800 truncate">
                  Fast Moving Products
                </span>
                <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                  {stats.fastMoving}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">Selling Fast section</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setProductFeatureSections((prev) => ({
                  ...prev,
                  fastMoving: !prev.fastMoving,
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                productFeatureSections.fastMoving ? "bg-[#03BF62]" : "bg-stone-300"
              }`}
              role="switch"
              aria-checked={productFeatureSections.fastMoving}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  productFeatureSections.fastMoving ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Discount Products */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-stone-50/60 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-800 truncate">
                  Discount Products
                </span>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                  {stats.discount}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">Special Savings section</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setProductFeatureSections((prev) => ({
                  ...prev,
                  discounts: !prev.discounts,
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                productFeatureSections.discounts ? "bg-[#03BF62]" : "bg-stone-300"
              }`}
              role="switch"
              aria-checked={productFeatureSections.discounts}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  productFeatureSections.discounts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Total</p>
          <p className="text-lg font-extrabold text-stone-900 mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 shadow-2xs">
          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">In Stock</p>
          <p className="text-lg font-extrabold text-emerald-900 mt-0.5">{stats.inStock}</p>
        </div>
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3 shadow-2xs">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Low Stock</p>
          <p className="text-lg font-extrabold text-amber-900 mt-0.5">{stats.lowStock}</p>
        </div>
        <div className="rounded-xl border border-red-200/70 bg-red-50/40 p-3 shadow-2xs">
          <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Out of Stock</p>
          <p className="text-lg font-extrabold text-red-900 mt-0.5">{stats.outOfStock}</p>
        </div>
        <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-3 shadow-2xs">
          <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Popular</p>
          <p className="text-lg font-extrabold text-blue-900 mt-0.5">{stats.mostPopular}</p>
        </div>
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3 shadow-2xs">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Fast Moving</p>
          <p className="text-lg font-extrabold text-amber-900 mt-0.5">{stats.fastMoving}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 shadow-2xs">
          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Discounts</p>
          <p className="text-lg font-extrabold text-emerald-900 mt-0.5">{stats.discount}</p>
        </div>
        <div className="rounded-xl border border-purple-200/70 bg-purple-50/40 p-3 shadow-2xs">
          <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">Featured</p>
          <p className="text-lg font-extrabold text-purple-900 mt-0.5">{stats.featured}</p>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-stone-200 pl-10 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Product Feature Filter */}
          <select
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value as typeof featureFilter)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="all">All Products</option>
            <option value="most_popular">Most Popular</option>
            <option value="fast_moving">Fast Moving</option>
            <option value="discount">Discount Products</option>
            <option value="featured">Featured Products</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="all">All Categories</option>
            {RETAIL_PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {RETAIL_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="hidden">Hidden Only</option>
          </select>

          {/* Sort By */}
          <div className="sm:col-span-2 lg:col-span-6 flex justify-end">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs text-stone-800 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              >
                <option value="order">Display Order</option>
                <option value="name">Name (A-Z)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-stone-100 animate-pulse border border-stone-200" />
          ))}
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <EmptyState
          icon={ShoppingBagIcon}
          title="No retail products found"
          description="Create your first retail product to make it available for customer purchase and WhatsApp enquiry."
          actionText="Add Product"
          onAction={handleOpenAddForm}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredAndSortedProducts.map((item) => (
            <div
              key={item._id}
              className={`group flex flex-col justify-between rounded-2xl border bg-white p-4 transition-all shadow-xs hover:shadow-md ${
                !item.isActive ? "opacity-60 border-dashed border-stone-300" : "border-stone-200/90"
              }`}
            >
              <div>
                {/* Product Image & Badges */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {getStockBadge(item.stockStatus)}
                    {item.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <SparklesIcon className="h-3 w-3" />
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="font-semibold text-purple-700 uppercase tracking-wider">
                      {RETAIL_CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    {item.brand && <span className="text-stone-400 font-medium">{item.brand}</span>}
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 line-clamp-1 leading-snug">
                    {item.name}
                  </h3>

                  {item.shortDescription && (
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {item.shortDescription}
                    </p>
                  )}

                  {/* Pricing */}
                  <div className="pt-2 flex items-baseline gap-2">
                    {item.salePrice && item.salePrice < item.price ? (
                      <>
                        <span className="text-base font-extrabold text-stone-900">
                          LKR {item.salePrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-stone-400 line-through">
                          LKR {item.price.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-extrabold text-stone-900">
                        LKR {item.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Feature Badges (Subtle Styling) */}
                  {(item.isMostPopular || item.isFastMoving || item.isDiscountProduct) && (
                    <div className="pt-2 flex flex-wrap gap-1">
                      {item.isMostPopular && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-blue-700 border border-blue-200/70 uppercase">
                          Most Popular
                        </span>
                      )}
                      {item.isFastMoving && (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 border border-amber-200/70 uppercase">
                          Fast Moving
                        </span>
                      )}
                      {item.isDiscountProduct && (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-700 border border-emerald-200/70 uppercase">
                          Discount
                        </span>
                      )}
                    </div>
                  )}

                  {/* Size & SKU */}
                  {(item.size || item.sku) && (
                    <div className="pt-1 flex items-center gap-3 text-[11px] text-stone-400">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.sku && <span>SKU: {item.sku}</span>}
                    </div>
                  )}

                  {/* Branch Availability */}
                  <div className="pt-1.5 flex items-center gap-1.5 text-[11px] text-stone-500">
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
                  title={item.isActive ? "Hide product from store" : "Activate product"}
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
                    title="Edit product"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductToDelete(item)}
                    className="rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete product"
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
                  <PackageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    {editingId ? "Edit Retail Product" : "Add New Retail Product"}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Product will be displayed on the public /products page with WhatsApp enquiry.
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

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800 border border-red-200">
                <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Product Image *
                </label>
                <ImageUpload
                  value={form.image}
                  publicId={form.imagePublicId}
                  folder={CLOUDINARY_FOLDERS.RETAIL_PRODUCTS}
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
                  description="High resolution product bottle or jar photo (1:1 square recommended)."
                />
              </div>

              {/* Product Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Hydrating Shampoo"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="Salvora"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Category & Stock Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value as RetailProductCategory }))
                    }
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    {RETAIL_PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {RETAIL_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Stock Availability
                  </label>
                  <select
                    value={form.stockStatus}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, stockStatus: e.target.value as StockStatus }))
                    }
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Price & Sale Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Regular Price (LKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="2800"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sale Price (LKR) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salePrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, salePrice: e.target.value }))}
                    placeholder="e.g. 2300"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                  {form.isDiscountProduct &&
                    (!form.salePrice ||
                      parseFloat(form.salePrice) >= parseFloat(form.price || "0") ||
                      parseFloat(form.salePrice) < 0) && (
                      <p className="mt-1 text-[11px] font-semibold text-amber-600">
                        * Add a valid sale price before marking this as a Discount Product.
                      </p>
                    )}
                </div>
              </div>

              {/* Product Features Section */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Product Features
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Choose where this product should be highlighted on the public Products page.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* Most Popular */}
                  <label className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white p-3 cursor-pointer hover:border-purple-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.isMostPopular}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, isMostPopular: e.target.checked }))
                      }
                      className="mt-0.5 h-4 w-4 rounded-sm text-purple-600 focus:ring-purple-500 border-stone-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900">Most Popular Product</span>
                      <p className="text-[11px] text-stone-500">
                        Highlight this product in the Most Popular section.
                      </p>
                    </div>
                  </label>

                  {/* Fast Moving */}
                  <label className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white p-3 cursor-pointer hover:border-purple-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.isFastMoving}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, isFastMoving: e.target.checked }))
                      }
                      className="mt-0.5 h-4 w-4 rounded-sm text-purple-600 focus:ring-purple-500 border-stone-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900">Fast Moving Product</span>
                      <p className="text-[11px] text-stone-500">
                        Highlight this product in the Fast Moving section.
                      </p>
                    </div>
                  </label>

                  {/* Discount Product */}
                  <label className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white p-3 cursor-pointer hover:border-purple-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.isDiscountProduct}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, isDiscountProduct: e.target.checked }))
                      }
                      className="mt-0.5 h-4 w-4 rounded-sm text-purple-600 focus:ring-purple-500 border-stone-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900">Discount Product</span>
                      <p className="text-[11px] text-stone-500">
                        Highlight this product in the Discount Products section.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Size & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Size / Volume (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.size}
                    onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
                    placeholder="e.g. 250ml or 100g"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    SKU Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                    placeholder="SAL-HC-001"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Card Short Summary
                </label>
                <input
                  type="text"
                  maxLength={250}
                  value={form.shortDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="e.g. Gentle, nourishing formula that cleanses and hydrates for healthier, shinier hair."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed benefits, ingredients, usage instructions..."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Branch Availability */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Branch Availability
                </label>
                <p className="text-[11px] text-stone-500 mb-2">
                  Select branches where this product is in stock. Leave unselected to make it available across all branches.
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
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="h-4 w-4 rounded-sm text-purple-600 focus:ring-purple-500 border-stone-300"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-semibold text-stone-800 cursor-pointer">
                    Featured Product
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded-sm text-purple-600 focus:ring-purple-500 border-stone-300"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-stone-800 cursor-pointer">
                    Visible on Store
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
                  {formLoading ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Retail Product"
        message={`Are you sure you want to permanently delete "${productToDelete?.name}"? Its image will also be removed from Cloudinary.`}
        confirmText="Delete Product"
        loading={isDeleting}
      />
    </div>
  );
}
