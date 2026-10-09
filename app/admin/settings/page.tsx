"use client";

import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  SettingsIcon,
  StoreIcon,
  ClockIcon,
  StarIcon,
  LinkIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  ExternalLinkIcon,
  UploadCloudIcon,
  TrashIcon,
  EditIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import ImageUpload, { UploadResult } from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

interface GoogleReviewsData {
  enabled: boolean;
  placeId: string;
  businessUrl: string;
  maxReviews: number;
}

interface ExternalSystemData {
  loginUrl: string;
  registerUrl: string;
  bookingUrl: string;
}

interface SalonBranch {
  _id?: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  mapUrl?: string;
  isMain?: boolean;
}

interface SalonSettingsData {
  salonName: string;
  logo: string;
  logoPublicId?: string;
  footerLogo?: string;
  footerLogoPublicId?: string;
  aboutDescription: string;
  phone: string;
  phoneSecondary: string;
  whatsapp: string;
  email: string;
  address: string;
  branches?: SalonBranch[];
  openingHours: OpeningHour[];
  socialMedia: {
    facebook: string;
    instagram: string;
    tiktok: string;
    whatsapp: string;
  };
  googleReviews?: GoogleReviewsData;
  externalSystem?: ExternalSystemData;
}

const DEFAULT_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SECTIONS = [
  { id: "salon-profile", label: "Salon Profile", icon: StoreIcon },
  { id: "branches", label: "Salon Branches", icon: MapPinIcon },
  { id: "opening-hours", label: "Opening Hours", icon: ClockIcon },
  { id: "social-media", label: "Social Media", icon: ExternalLinkIcon },
  { id: "google-reviews", label: "Google Reviews", icon: StarIcon },
  { id: "external-system", label: "External System", icon: LinkIcon },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SalonSettingsData>({
    salonName: "",
    logo: "",
    logoPublicId: "",
    footerLogo: "",
    footerLogoPublicId: "",
    aboutDescription: "",
    phone: "",
    phoneSecondary: "",
    whatsapp: "",
    email: "",
    address: "",
    branches: [],
    openingHours: DEFAULT_DAYS.map((day) => ({
      day,
      open: "09:00",
      close: day === "Sunday" ? "17:00" : "19:00",
      isClosed: false,
    })),
    socialMedia: {
      facebook: "",
      instagram: "",
      tiktok: "",
      whatsapp: "",
    },
    googleReviews: {
      enabled: false,
      placeId: "",
      businessUrl: "",
      maxReviews: 5,
    },
    externalSystem: {
      loginUrl: "",
      registerUrl: "",
      bookingUrl: "",
    },
  });

  const [initialData, setInitialData] = useState<SalonSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("salon-profile");

  // Header Logo state: "upload" or "url"
  const [logoTab, setLogoTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Footer Logo state: "upload" or "url"
  const [footerLogoTab, setFooterLogoTab] = useState<"upload" | "url">("upload");
  const [footerUrlInput, setFooterUrlInput] = useState<string>("");
  const [footerUrlError, setFooterUrlError] = useState<string | null>(null);

  // Toast feedback
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch real settings on mount
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();

        if (isMounted && res.ok && data.success && data.settings) {
          const s = data.settings;
          const hasPublicId = Boolean(s.logoPublicId && s.logoPublicId.trim());
          const hasLogo = Boolean(s.logo && s.logo.trim());

          if (hasPublicId) {
            setLogoTab("upload");
            setUrlInput("");
          } else if (hasLogo) {
            setLogoTab("url");
            setUrlInput(s.logo);
          } else {
            setLogoTab("upload");
            setUrlInput("");
          }

          const hasFooterPublicId = Boolean(s.footerLogoPublicId && s.footerLogoPublicId.trim());
          const hasFooterLogo = Boolean(s.footerLogo && s.footerLogo.trim());

          if (hasFooterPublicId) {
            setFooterLogoTab("upload");
            setFooterUrlInput("");
          } else if (hasFooterLogo) {
            setFooterLogoTab("url");
            setFooterUrlInput(s.footerLogo);
          } else {
            setFooterLogoTab("upload");
            setFooterUrlInput("");
          }

          const normalized: SalonSettingsData = {
            salonName: s.salonName || "",
            logo: s.logo || "",
            logoPublicId: s.logoPublicId || "",
            footerLogo: s.footerLogo || "",
            footerLogoPublicId: s.footerLogoPublicId || "",
            aboutDescription: s.aboutDescription || "",
            phone: s.phone || "",
            phoneSecondary: s.phoneSecondary || "",
            whatsapp: s.whatsapp || "",
            email: s.email || "",
            address: s.address || "",
            branches: Array.isArray(s.branches) ? s.branches : [],
            openingHours:
              Array.isArray(s.openingHours) && s.openingHours.length > 0
                ? s.openingHours
                : DEFAULT_DAYS.map((day) => ({
                    day,
                    open: "09:00",
                    close: day === "Sunday" ? "17:00" : "19:00",
                    isClosed: false,
                  })),
            socialMedia: {
              facebook: s.socialMedia?.facebook || "",
              instagram: s.socialMedia?.instagram || "",
              tiktok: s.socialMedia?.tiktok || "",
              whatsapp: s.socialMedia?.whatsapp || "",
            },
            googleReviews: {
              enabled: Boolean(s.googleReviews?.enabled),
              placeId: s.googleReviews?.placeId || "",
              businessUrl: s.googleReviews?.businessUrl || "",
              maxReviews: s.googleReviews?.maxReviews || 5,
            },
            externalSystem: {
              loginUrl: s.externalSystem?.loginUrl || "",
              registerUrl: s.externalSystem?.registerUrl || "",
              bookingUrl: s.externalSystem?.bookingUrl || "",
            },
          };

          setFormData(normalized);
          setInitialData(JSON.parse(JSON.stringify(normalized)));
        } else if (isMounted) {
          showNotification("error", data.message || "Failed to load website settings");
        }
      } catch {
        if (isMounted) showNotification("error", "Network error loading website settings");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Track unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Dynamic Website Setup Completeness
  const completeness = useMemo(() => {
    const checks = [
      {
        id: "profile",
        label: "Salon Profile",
        done: Boolean(formData.salonName?.trim() && formData.aboutDescription?.trim()),
      },
      {
        id: "logo",
        label: "Salon Logo",
        done: Boolean(formData.logo?.trim()),
      },
      {
        id: "contact",
        label: "Contact Information",
        done: Boolean(
          formData.phone?.trim() && formData.email?.trim() && formData.address?.trim()
        ),
      },
      {
        id: "hours",
        label: "Opening Hours",
        done: Boolean(
          formData.openingHours &&
            formData.openingHours.length > 0 &&
            formData.openingHours.some((d) => !d.isClosed)
        ),
      },
      {
        id: "social",
        label: "Social Media",
        done: Boolean(
          formData.socialMedia?.facebook?.trim() ||
            formData.socialMedia?.instagram?.trim() ||
            formData.socialMedia?.tiktok?.trim() ||
            formData.socialMedia?.whatsapp?.trim()
        ),
      },
      {
        id: "external",
        label: "External System Links",
        done: Boolean(
          formData.externalSystem?.bookingUrl?.trim() ||
            formData.externalSystem?.loginUrl?.trim()
        ),
      },
      {
        id: "google",
        label: "Google Reviews",
        done: Boolean(
          formData.googleReviews?.enabled && formData.googleReviews?.placeId?.trim()
        ),
        optional: true,
      },
    ];

    const coreChecks = checks.filter((c) => !c.optional);
    const coreDone = coreChecks.filter((c) => c.done).length;
    const percentage = Math.round((coreDone / coreChecks.length) * 100);

    return {
      checks,
      percentage,
      isFullyComplete: percentage === 100,
    };
  }, [formData]);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Logo handlers
  const validateImageUrl = (val: string): boolean => {
    if (!val.trim()) return true;
    const trimmed = val.trim();
    return trimmed.startsWith("https://") || (trimmed.startsWith("/") && !trimmed.startsWith("//"));
  };

  const saveSettingsPayload = async (
    dataToSave: SalonSettingsData,
    successMsg = "Website settings saved successfully."
  ) => {
    if (!dataToSave.salonName.trim()) {
      showNotification("error", "Salon Brand Name is required.");
      return false;
    }

    setSaving(true);
    try {
      const payload = {
        ...dataToSave,
        salonName: dataToSave.salonName.trim(),
        aboutDescription: dataToSave.aboutDescription.trim(),
        phone: dataToSave.phone.trim(),
        phoneSecondary: dataToSave.phoneSecondary.trim(),
        whatsapp: dataToSave.whatsapp.trim(),
        email: dataToSave.email.trim(),
        address: dataToSave.address.trim(),
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", successMsg);
        setInitialData(JSON.parse(JSON.stringify(dataToSave)));
        router.refresh();
        return true;
      } else {
        showNotification("error", data.message || "Failed to save website settings");
        return false;
      }
    } catch {
      showNotification("error", "Network error saving website settings");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    if (val.trim() && !validateImageUrl(val)) {
      setUrlError("Please enter a valid image URL (must begin with https:// or /)");
    } else {
      setUrlError(null);
      setFormData((prev) => ({
        ...prev,
        logo: val.trim(),
        logoPublicId: "",
      }));
    }
  };

  const handleLogoUpload = async (result: UploadResult) => {
    const updated: SalonSettingsData = {
      ...formData,
      logo: result.url,
      logoPublicId: result.publicId,
    };
    setFormData(updated);
    setUrlInput("");
    setUrlError(null);
    await saveSettingsPayload(updated, "Header logo uploaded and applied successfully!");
  };

  const handleRemoveLogo = async () => {
    const updated: SalonSettingsData = {
      ...formData,
      logo: "",
      logoPublicId: "",
    };
    setFormData(updated);
    setUrlInput("");
    setUrlError(null);
    await saveSettingsPayload(updated, "Header logo removed and saved.");
  };

  const handleFooterUrlChange = (val: string) => {
    setFooterUrlInput(val);
    if (val.trim() && !validateImageUrl(val)) {
      setFooterUrlError("Please enter a valid image URL (must begin with https:// or /)");
    } else {
      setFooterUrlError(null);
      setFormData((prev) => ({
        ...prev,
        footerLogo: val.trim(),
        footerLogoPublicId: "",
      }));
    }
  };

  const handleFooterLogoUpload = async (result: UploadResult) => {
    const updated: SalonSettingsData = {
      ...formData,
      footerLogo: result.url,
      footerLogoPublicId: result.publicId,
    };
    setFormData(updated);
    setFooterUrlInput("");
    setFooterUrlError(null);
    await saveSettingsPayload(updated, "Footer logo uploaded and applied successfully!");
  };

  const handleRemoveFooterLogo = async () => {
    const updated: SalonSettingsData = {
      ...formData,
      footerLogo: "",
      footerLogoPublicId: "",
    };
    setFormData(updated);
    setFooterUrlInput("");
    setFooterUrlError(null);
    await saveSettingsPayload(updated, "Footer logo removed and saved.");
  };

  // Branch handlers
  const handleAddBranch = () => {
    const isFirst = (!formData.branches || formData.branches.length === 0);
    const newBranch: SalonBranch = {
      name: "",
      address: "",
      phone: formData.phone || "",
      email: formData.email || "",
      mapUrl: "",
      isMain: isFirst,
    };
    setFormData((prev) => ({
      ...prev,
      branches: [...(prev.branches || []), newBranch],
    }));
  };

  const handleUpdateBranch = (
    index: number,
    field: keyof SalonBranch,
    val: string | boolean
  ) => {
    setFormData((prev) => {
      const list = [...(prev.branches || [])];
      list[index] = {
        ...list[index],
        [field]: val,
      };
      return { ...prev, branches: list };
    });
  };

  const handleRemoveBranch = (index: number) => {
    setFormData((prev) => {
      const list = [...(prev.branches || [])];
      list.splice(index, 1);
      if (list.length > 0 && !list.some((b) => b.isMain)) {
        list[0].isMain = true;
      }
      return { ...prev, branches: list };
    });
  };

  const handleSetMainBranch = (index: number) => {
    setFormData((prev) => {
      const list = (prev.branches || []).map((b, i) => ({
        ...b,
        isMain: i === index,
      }));
      return { ...prev, branches: list };
    });
  };

  const handleImportCurrentAddressAsBranch = () => {
    const defaultBranch: SalonBranch = {
      name: formData.salonName ? `${formData.salonName} Main Branch` : "Main Flagship Branch",
      address: formData.address || "123 Beauty Street, Colombo 07",
      phone: formData.phone || "+94 11 234 5678",
      email: formData.email || "",
      mapUrl: formData.googleReviews?.businessUrl || "",
      isMain: true,
    };
    setFormData((prev) => ({
      ...prev,
      branches: [defaultBranch],
    }));
    showNotification("success", "Imported current salon address as primary branch.");
  };

  // Opening Hours handlers
  const handleHourChange = (
    index: number,
    field: "open" | "close" | "isClosed",
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const updated = [...prev.openingHours];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, openingHours: updated };
    });
  };

  const handleCopyMondayHours = () => {
    const monday = formData.openingHours.find((h) => h.day === "Monday");
    if (!monday) return;
    setFormData((prev) => {
      const updated = prev.openingHours.map((h) => {
        if (["Tuesday", "Wednesday", "Thursday", "Friday"].includes(h.day)) {
          return {
            ...h,
            open: monday.open,
            close: monday.close,
            isClosed: monday.isClosed,
          };
        }
        return h;
      });
      return { ...prev, openingHours: updated };
    });
    showNotification("success", "Copied Monday hours to Tuesday through Friday.");
  };

  // Reset Changes
  const handleResetChanges = () => {
    if (!initialData) return;
    setFormData(JSON.parse(JSON.stringify(initialData)));
    if (initialData.logoPublicId) {
      setLogoTab("upload");
      setUrlInput("");
    } else if (initialData.logo) {
      setLogoTab("url");
      setUrlInput(initialData.logo);
    }
    setUrlError(null);

    if (initialData.footerLogoPublicId) {
      setFooterLogoTab("upload");
      setFooterUrlInput("");
    } else if (initialData.footerLogo) {
      setFooterLogoTab("url");
      setFooterUrlInput(initialData.footerLogo);
    } else {
      setFooterLogoTab("upload");
      setFooterUrlInput("");
    }
    setFooterUrlError(null);

    showNotification("success", "Restored last saved settings.");
  };

  // Save Settings
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    // Validation
    if (!formData.salonName.trim()) {
      showNotification("error", "Salon Brand Name is required.");
      return;
    }

    if (logoTab === "url" && urlInput.trim() && !validateImageUrl(urlInput)) {
      showNotification("error", "Please provide a valid https:// image URL for the logo.");
      return;
    }

    if (footerLogoTab === "url" && footerUrlInput.trim() && !validateImageUrl(footerUrlInput)) {
      showNotification("error", "Please provide a valid https:// image URL for the footer logo.");
      return;
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        showNotification("error", "Please provide a valid concierge email address.");
        return;
      }
    }

    // Validate branches if added
    if (formData.branches && formData.branches.length > 0) {
      for (let i = 0; i < formData.branches.length; i++) {
        const b = formData.branches[i];
        if (!b.name.trim()) {
          showNotification("error", `Branch #${i + 1} must have a name.`);
          return;
        }
        if (!b.phone.trim()) {
          showNotification("error", `Branch "${b.name || `#${i + 1}`}" must have a phone number.`);
          return;
        }
        if (!b.address.trim()) {
          showNotification("error", `Branch "${b.name || `#${i + 1}`}" must have an address.`);
          return;
        }
      }
    }

    // Validate social & external URLs
    const urlFields = [
      { label: "Facebook URL", val: formData.socialMedia.facebook },
      { label: "Instagram URL", val: formData.socialMedia.instagram },
      { label: "TikTok URL", val: formData.socialMedia.tiktok },
      { label: "WhatsApp Direct URL", val: formData.socialMedia.whatsapp },
      { label: "Google Maps URL", val: formData.googleReviews?.businessUrl },
      { label: "Customer Login URL", val: formData.externalSystem?.loginUrl },
      { label: "Customer Registration URL", val: formData.externalSystem?.registerUrl },
      { label: "Book Appointment URL", val: formData.externalSystem?.bookingUrl },
    ];

    for (const item of urlFields) {
      if (item.val && item.val.trim() && !item.val.trim().startsWith("https://")) {
        showNotification(
          "error",
          `${item.label} must be a valid https link (e.g. https://...)`
        );
        return;
      }
    }

    // Validate Google Reviews max count
    if (
      formData.googleReviews?.maxReviews &&
      (formData.googleReviews.maxReviews < 1 || formData.googleReviews.maxReviews > 5)
    ) {
      showNotification("error", "Reviews to Display must be between 1 and 5.");
      return;
    }

    await saveSettingsPayload(formData, "Website settings saved successfully.");
  };

  // Google Reviews status calculation
  const googleStatus = useMemo(() => {
    if (!formData.googleReviews?.enabled) return "disabled";
    if (formData.googleReviews?.placeId?.trim()) return "configured";
    return "incomplete";
  }, [formData.googleReviews]);

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* ========================================================== */}
      {/* 1. PAGE HEADER                                             */}
      {/* ========================================================== */}
      <AdminPageHeader
        title="Website Settings"
        description="Manage the information and integrations displayed across the INVORA website."
        breadcrumbs={[{ label: "Website Settings" }]}
        action={
          <button
            type="button"
            disabled={!hasUnsavedChanges || saving}
            onClick={() => handleSubmit()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#6D28D9] transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        }
      />

      {/* Floating Notification */}
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
      {/* 2. WEBSITE CONFIGURATION COMPLETENESS CARD (MATCHES MOCKUP)*/}
      {/* ========================================================== */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Icon & Title */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                Website Configuration
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Overview of your website setup status.
              </p>
            </div>
          </div>

          {/* Center: Circular Progress & Percentage */}
          <div className="lg:col-span-4 flex items-center justify-start lg:justify-center gap-4 border-y lg:border-y-0 lg:border-x border-stone-100 py-3 lg:py-0 px-0 lg:px-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-stone-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-700 ease-out"
                  strokeDasharray={`${completeness.percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-xs text-stone-900">
                {completeness.percentage}%
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-stone-900">
                {completeness.percentage}% Complete
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {completeness.isFullyComplete
                  ? "All core settings configured!"
                  : "Almost there! Complete the remaining items."}
              </p>
            </div>
          </div>

          {/* Right: Checklist Columns */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  completeness.checks.find((c) => c.id === "profile")?.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                ✓
              </span>
              <span className="text-stone-700 font-medium">Salon Profile</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  completeness.checks.find((c) => c.id === "social")?.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                ✓
              </span>
              <span className="text-stone-700 font-medium">Social Media</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  completeness.checks.find((c) => c.id === "contact")?.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                ✓
              </span>
              <span className="text-stone-700 font-medium">Contact Details</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  completeness.checks.find((c) => c.id === "external")?.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                ✓
              </span>
              <span className="text-stone-700 font-medium">External System</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  completeness.checks.find((c) => c.id === "hours")?.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                ✓
              </span>
              <span className="text-stone-700 font-medium">Opening Hours</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  completeness.checks.find((c) => c.id === "google")?.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                {completeness.checks.find((c) => c.id === "google")?.done ? "✓" : "–"}
              </span>
              <span className="text-stone-700 font-medium">Google Reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. SETTINGS MAIN CONTENT WITH SECTION NAVIGATION           */}
      {/* ========================================================== */}
      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-16 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-stone-200 border-t-[#7C3AED] mb-3" />
          <p className="text-sm font-semibold text-stone-600">Loading website configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ====================================================== */}
          {/* LEFT: SECTION NAVIGATION (STICKY ON DESKTOP)          */}
          {/* ====================================================== */}
          <div className="lg:col-span-3 sticky top-24 z-20">
            {/* Desktop Navigation */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-3 shadow-xs space-y-1 hidden lg:block">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-purple-50 text-[#7C3AED] border border-purple-200/60 shadow-2xs"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#7C3AED]" : "text-stone-400"}`} />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile / Tablet Horizontal Navigation */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-stone-200 rounded-xl shadow-xs scrollbar-none">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#7C3AED] text-white shadow-2xs"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ====================================================== */}
          {/* RIGHT: SETTINGS SECTIONS CONTENT                       */}
          {/* ====================================================== */}
          <div className="lg:col-span-9 space-y-8">
            {/* ---------------------------------------------------- */}
            {/* CARD 1: SALON PROFILE & CONTACT DETAILS              */}
            {/* ---------------------------------------------------- */}
            <div
              id="salon-profile"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              {/* Card Header */}
              <div className="flex items-start gap-3.5 border-b border-stone-100 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <StoreIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    Salon Profile & Contact Details
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Public salon information displayed across the footer, navigation, and contact page.
                  </p>
                </div>
              </div>

              {/* 2-Column Desktop Grid for Profile */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left Column: Brand Name & Logo Management */}
                <div className="xl:col-span-5 space-y-5">
                  {/* Salon Brand Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Salon Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.salonName}
                      onChange={(e) =>
                        setFormData({ ...formData, salonName: e.target.value })
                      }
                      placeholder="e.g. LUMINA Luxury Salon"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>

                  {/* Salon Logo (Header & Admin) */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-800">Salon Logo (Header & Admin)</h4>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                          Navbar & Admin
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Displayed on the website header navbar and admin dashboard sidebar.
                      </p>
                    </div>

                    {/* Mode Toggle Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLogoTab("upload")}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          logoTab === "upload"
                            ? "bg-[#7C3AED] text-white shadow-xs"
                            : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <UploadCloudIcon className="h-3.5 w-3.5" />
                        <span>Upload Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLogoTab("url")}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          logoTab === "url"
                            ? "bg-[#7C3AED] text-white shadow-xs"
                            : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>Use Image URL</span>
                      </button>
                    </div>

                    {/* Mode 1: Upload Logo */}
                    {logoTab === "upload" && (
                      <div className="space-y-3 w-full max-w-full">
                        {formData.logo ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                                Current Header Logo
                              </p>
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                <span>Remove Logo</span>
                              </button>
                            </div>

                            <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-2xs space-y-3 w-full">
                              {/* Logo preview with object-contain to preserve aspect ratio */}
                              <div className="h-24 w-full rounded-lg border border-stone-100 bg-stone-50/50 p-2.5 flex items-center justify-center overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={formData.logo}
                                  alt="Current Header Logo"
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>

                              {/* Footer with status label and Replace Image trigger */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                                <span className="text-[11px] text-stone-500 truncate max-w-[150px]">
                                  {formData.logo.split("/").pop()}
                                </span>

                                <ImageUpload
                                  folder={CLOUDINARY_FOLDERS.SALON}
                                  value={formData.logo}
                                  publicId={formData.logoPublicId}
                                  label=""
                                  onChange={handleLogoUpload}
                                  onRemove={handleRemoveLogo}
                                  renderTrigger={(open, isButtonDisabled) => (
                                    <button
                                      type="button"
                                      onClick={() => open()}
                                      disabled={isButtonDisabled}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:border-[#7C3AED] hover:text-[#7C3AED] disabled:opacity-50 transition cursor-pointer"
                                    >
                                      <EditIcon className="h-3.5 w-3.5" />
                                      <span>Replace Image</span>
                                    </button>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                              Upload Logo
                            </p>
                            <ImageUpload
                              folder={CLOUDINARY_FOLDERS.SALON}
                              value=""
                              publicId=""
                              label=""
                              description="Recommended: PNG or WebP with transparent background (Max 5MB)"
                              onChange={handleLogoUpload}
                              onRemove={handleRemoveLogo}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode 2: Use Image URL */}
                    {logoTab === "url" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-stone-700">
                          Logo Image URL
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                            <input
                              type="url"
                              value={urlInput}
                              onChange={(e) => handleUrlChange(e.target.value)}
                              placeholder="https://example.com/logo.png"
                              className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={!urlInput.trim() || saving || Boolean(urlError)}
                            onClick={() => handleSubmit()}
                            className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-40 transition cursor-pointer"
                          >
                            Apply URL
                          </button>
                        </div>

                        {urlError && (
                          <p className="text-xs text-rose-600 font-medium">{urlError}</p>
                        )}

                        {formData.logo && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-[11px] font-semibold text-stone-500">Live URL Preview</p>
                            <div className="h-16 w-36 rounded-xl border border-stone-200 bg-white p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={formData.logo}
                                alt="Logo URL Preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Logo (Dark Footer) */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-800">Footer Logo</h4>
                        <span className="text-[10px] font-semibold text-stone-300 bg-stone-900 px-2 py-0.5 rounded-full">
                          Dark Footer
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Displayed on the dark website footer. If not set, the header logo will be used.
                      </p>
                    </div>

                    {/* Mode Toggle Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFooterLogoTab("upload")}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          footerLogoTab === "upload"
                            ? "bg-[#7C3AED] text-white shadow-xs"
                            : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <UploadCloudIcon className="h-3.5 w-3.5" />
                        <span>Upload Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFooterLogoTab("url")}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          footerLogoTab === "url"
                            ? "bg-[#7C3AED] text-white shadow-xs"
                            : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>Use Image URL</span>
                      </button>
                    </div>

                    {/* Mode 1: Upload Footer Logo */}
                    {footerLogoTab === "upload" && (
                      <div className="space-y-3 w-full max-w-full">
                        {formData.footerLogo ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                                Current Footer Logo
                              </p>
                              <button
                                type="button"
                                onClick={handleRemoveFooterLogo}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                <span>Remove Logo</span>
                              </button>
                            </div>

                            <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-2xs space-y-3 w-full">
                              {/* Dark preview container for footer logo */}
                              <div className="h-24 w-full rounded-lg border border-stone-800 bg-[#0A0812] p-2.5 flex items-center justify-center overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={formData.footerLogo}
                                  alt="Current Footer Logo"
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>

                              {/* Footer with status label and Replace Image trigger */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                                <span className="text-[11px] text-stone-500 truncate max-w-[150px]">
                                  {formData.footerLogo.split("/").pop()}
                                </span>

                                <ImageUpload
                                  folder={CLOUDINARY_FOLDERS.SALON}
                                  value={formData.footerLogo}
                                  publicId={formData.footerLogoPublicId}
                                  label=""
                                  onChange={handleFooterLogoUpload}
                                  onRemove={handleRemoveFooterLogo}
                                  renderTrigger={(open, isButtonDisabled) => (
                                    <button
                                      type="button"
                                      onClick={() => open()}
                                      disabled={isButtonDisabled}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:border-[#7C3AED] hover:text-[#7C3AED] disabled:opacity-50 transition cursor-pointer"
                                    >
                                      <EditIcon className="h-3.5 w-3.5" />
                                      <span>Replace Image</span>
                                    </button>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                              Upload Logo
                            </p>
                            <ImageUpload
                              folder={CLOUDINARY_FOLDERS.SALON}
                              value=""
                              publicId=""
                              label=""
                              description="Recommended for dark footer: White/light PNG with transparent background (Max 5MB)"
                              onChange={handleFooterLogoUpload}
                              onRemove={handleRemoveFooterLogo}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode 2: Use Image URL for Footer Logo */}
                    {footerLogoTab === "url" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-stone-700">
                          Footer Logo Image URL
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                            <input
                              type="url"
                              value={footerUrlInput}
                              onChange={(e) => handleFooterUrlChange(e.target.value)}
                              placeholder="https://example.com/footer-logo-white.png"
                              className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={!footerUrlInput.trim() || saving || Boolean(footerUrlError)}
                            onClick={() => handleSubmit()}
                            className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-40 transition cursor-pointer"
                          >
                            Apply URL
                          </button>
                        </div>

                        {footerUrlError && (
                          <p className="text-xs text-rose-600 font-medium">{footerUrlError}</p>
                        )}

                        {formData.footerLogo && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-[11px] font-semibold text-stone-500">Live URL Preview (Dark Footer)</p>
                            <div className="h-16 w-36 rounded-xl border border-stone-800 bg-[#0A0812] p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={formData.footerLogo}
                                alt="Footer Logo URL Preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Contact Details, Address, About */}
                <div className="xl:col-span-7 space-y-4">
                  {/* Phone numbers in 2 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Primary Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+94 11 234 5678"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Secondary / Mobile Phone
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                        <input
                          type="tel"
                          value={formData.phoneSecondary}
                          onChange={(e) =>
                            setFormData({ ...formData, phoneSecondary: e.target.value })
                          }
                          placeholder="+94 77 123 4567"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp and Email in 2 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        WhatsApp Hotline
                      </label>
                      <div className="relative">
                        <WhatsAppIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                        <input
                          type="tel"
                          value={formData.whatsapp}
                          onChange={(e) =>
                            setFormData({ ...formData, whatsapp: e.target.value })
                          }
                          placeholder="+94 77 123 4567"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Concierge Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="concierge@salon.lk"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Physical Address */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Physical Salon Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="e.g. 42 Horton Place, Cinnamon Gardens, Colombo 07, Sri Lanka"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-stone-400">
                      Displayed on your footer and contact pages, and automatically updates the interactive Google Map location on the website.
                    </p>
                  </div>

                  {/* About Description */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      About Description
                    </label>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={formData.aboutDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, aboutDescription: e.target.value })
                      }
                      placeholder="Brief overview of salon sanctuary and philosophy..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                    />
                    <p className="mt-1 text-[11px] text-stone-400 text-right">
                      {formData.aboutDescription.length} / 500 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* CARD: SALON BRANCHES & LOCATIONS                     */}
            {/* ---------------------------------------------------- */}
            <div
              id="branches"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                    <MapPinIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                      Salon Branches & Locations
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Manage multiple branches for your salon. These will be displayed in the website footer.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(!formData.branches || formData.branches.length === 0) && (
                    <button
                      type="button"
                      onClick={handleImportCurrentAddressAsBranch}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                    >
                      <span>Import Profile Address</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 text-xs font-semibold text-[#7C3AED] hover:bg-purple-100 transition cursor-pointer"
                  >
                    <span>+ Add Branch</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSubmit()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] text-xs font-semibold text-white shadow-xs hover:bg-[#6D28D9] transition cursor-pointer disabled:opacity-50"
                  >
                    {saving && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>{saving ? "Saving..." : "Save Branches"}</span>
                  </button>
                </div>
              </div>

              {/* Branches List */}
              {(!formData.branches || formData.branches.length === 0) ? (
                <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED]">
                    <MapPinIcon className="h-6 w-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-stone-800">
                      No Branches Configured
                    </h4>
                    <p className="text-xs text-stone-500">
                      If you have multiple branches, add them here so customers can find each location and phone number in the footer.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleImportCurrentAddressAsBranch}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                    >
                      Use Profile Address as Branch 1
                    </button>
                    <button
                      type="button"
                      onClick={handleAddBranch}
                      className="px-4 py-2 rounded-xl bg-[#7C3AED] text-xs font-semibold text-white hover:bg-[#6D28D9] transition cursor-pointer"
                    >
                      + Add New Branch
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.branches.map((branch, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 sm:p-5 space-y-4 relative transition-all hover:border-purple-300"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-900">
                            {branch.name.trim() || `Branch #${index + 1}`}
                          </span>
                          {branch.isMain && (
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                              Main Branch
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="mainBranchSelection"
                              checked={Boolean(branch.isMain)}
                              onChange={() => handleSetMainBranch(index)}
                              className="text-[#7C3AED] focus:ring-[#7C3AED]"
                            />
                            <span>Set as Main Branch</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveBranch(index)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Branch Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Branch Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={branch.name}
                            onChange={(e) => handleUpdateBranch(index, "name", e.target.value)}
                            placeholder="e.g. Nugegoda Branch"
                            className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                            <input
                              type="tel"
                              required
                              value={branch.phone}
                              onChange={(e) => handleUpdateBranch(index, "phone", e.target.value)}
                              placeholder="+94 11 234 5678"
                              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Branch Email (Optional)
                          </label>
                          <div className="relative">
                            <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                            <input
                              type="email"
                              value={branch.email || ""}
                              onChange={(e) => handleUpdateBranch(index, "email", e.target.value)}
                              placeholder="nugegoda@salvora.lk"
                              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Physical Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={branch.address}
                              onChange={(e) => handleUpdateBranch(index, "address", e.target.value)}
                              placeholder="No 06 Pagoda Rd, Nugegoda 10250"
                              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Google Maps Link (Optional)
                          </label>
                          <div className="relative">
                            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                            <input
                              type="url"
                              value={branch.mapUrl || ""}
                              onChange={(e) => handleUpdateBranch(index, "mapUrl", e.target.value)}
                              placeholder="https://maps.google.com/..."
                              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80">
                    <button
                      type="button"
                      onClick={handleAddBranch}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-xs font-semibold text-[#7C3AED] transition cursor-pointer"
                    >
                      <span>+ Add Another Branch</span>
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSubmit()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {saving && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      <span>{saving ? "Saving..." : "Save Branches"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* CARD 3: SALON OPENING HOURS                          */}
            {/* ---------------------------------------------------- */}
            <div
              id="opening-hours"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              {/* Card Header & Copy Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                      Salon Opening Hours
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Define regular operational opening and closing hours for each day of the week.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyMondayHours}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 px-3 py-1.5 text-xs font-semibold text-[#7C3AED] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  <span>Copy Monday hours to weekdays</span>
                </button>
              </div>

              {/* 2 Columns: Monday-Thursday (Left) and Friday-Sunday (Right) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4">
                {/* Column 1: Mon, Tue, Wed, Thu */}
                <div className="space-y-3.5">
                  {formData.openingHours.slice(0, 4).map((h, idx) => {
                    return (
                      <div
                        key={h.day}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                          h.isClosed
                            ? "border-stone-200/70 bg-stone-50/50 opacity-70"
                            : "border-stone-200 bg-white shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center gap-3 w-36">
                          {/* Toggle switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!h.isClosed}
                            onClick={() => handleHourChange(idx, "isClosed", !h.isClosed)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              !h.isClosed ? "bg-[#7C3AED]" : "bg-stone-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                                !h.isClosed ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <div>
                            <p className="text-xs font-bold text-stone-900">{h.day}</p>
                            <p className={`text-[11px] font-medium ${!h.isClosed ? "text-emerald-600" : "text-stone-400"}`}>
                              {!h.isClosed ? "Open" : "Closed"}
                            </p>
                          </div>
                        </div>

                        {/* Time Inputs */}
                        <div
                          className={`flex items-center gap-2 text-xs font-semibold text-stone-500 ${
                            h.isClosed ? "pointer-events-none opacity-40" : ""
                          }`}
                        >
                          <input
                            type="time"
                            disabled={h.isClosed}
                            value={h.open}
                            onChange={(e) => handleHourChange(idx, "open", e.target.value)}
                            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED]"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            disabled={h.isClosed}
                            value={h.close}
                            onChange={(e) => handleHourChange(idx, "close", e.target.value)}
                            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Column 2: Fri, Sat, Sun */}
                <div className="space-y-3.5">
                  {formData.openingHours.slice(4).map((h, sliceIdx) => {
                    const actualIdx = sliceIdx + 4;
                    return (
                      <div
                        key={h.day}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                          h.isClosed
                            ? "border-stone-200/70 bg-stone-50/50 opacity-70"
                            : "border-stone-200 bg-white shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center gap-3 w-36">
                          {/* Toggle switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!h.isClosed}
                            onClick={() => handleHourChange(actualIdx, "isClosed", !h.isClosed)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              !h.isClosed ? "bg-[#7C3AED]" : "bg-stone-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                                !h.isClosed ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <div>
                            <p className="text-xs font-bold text-stone-900">{h.day}</p>
                            <p className={`text-[11px] font-medium ${!h.isClosed ? "text-emerald-600" : "text-stone-400"}`}>
                              {!h.isClosed ? "Open" : "Closed"}
                            </p>
                          </div>
                        </div>

                        {/* Time Inputs */}
                        <div
                          className={`flex items-center gap-2 text-xs font-semibold text-stone-500 ${
                            h.isClosed ? "pointer-events-none opacity-40" : ""
                          }`}
                        >
                          <input
                            type="time"
                            disabled={h.isClosed}
                            value={h.open}
                            onChange={(e) => handleHourChange(actualIdx, "open", e.target.value)}
                            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED]"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            disabled={h.isClosed}
                            value={h.close}
                            onChange={(e) => handleHourChange(actualIdx, "close", e.target.value)}
                            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* CARD 3: SOCIAL MEDIA & ONLINE CHANNELS               */}
            {/* ---------------------------------------------------- */}
            <div
              id="social-media"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex items-start gap-3.5 border-b border-stone-100 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <ExternalLinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    Social Media & Online Channels
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Links used across footer and social icons on the INVORA website.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Facebook */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Facebook URL
                  </label>
                  <div className="relative">
                    <FacebookIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 pointer-events-none" />
                    <input
                      type="url"
                      value={formData.socialMedia.facebook}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, facebook: e.target.value },
                        })
                      }
                      placeholder="https://facebook.com/invora"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Instagram URL
                  </label>
                  <div className="relative">
                    <InstagramIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500 pointer-events-none" />
                    <input
                      type="url"
                      value={formData.socialMedia.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, instagram: e.target.value },
                        })
                      }
                      placeholder="https://instagram.com/invora"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                {/* TikTok */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    TikTok URL
                  </label>
                  <div className="relative">
                    <TikTokIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-800 pointer-events-none" />
                    <input
                      type="url"
                      value={formData.socialMedia.tiktok}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, tiktok: e.target.value },
                        })
                      }
                      placeholder="https://tiktok.com/@invora"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                {/* WhatsApp Direct URL */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    WhatsApp Direct URL
                  </label>
                  <div className="relative">
                    <WhatsAppIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                    <input
                      type="url"
                      value={formData.socialMedia.whatsapp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, whatsapp: e.target.value },
                        })
                      }
                      placeholder="https://wa.me/94771234567"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* CARD 4: GOOGLE REVIEWS                               */}
            {/* ---------------------------------------------------- */}
            <div
              id="google-reviews"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                    <StarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                      Google Reviews
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Display reviews from the salon&apos;s Google Business Profile.
                    </p>
                  </div>
                </div>

                {/* Configuration status badge */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-2xs ${
                      googleStatus === "configured"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : googleStatus === "incomplete"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        googleStatus === "configured"
                          ? "bg-emerald-500"
                          : googleStatus === "incomplete"
                          ? "bg-amber-500"
                          : "bg-stone-400"
                      }`}
                    />
                    <span className="capitalize">{googleStatus}</span>
                  </span>
                </div>
              </div>

              {/* Toggle switch at top */}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/60 p-4">
                <div>
                  <p className="text-xs font-bold text-stone-900">Enable Google Reviews</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Fetch and display real reviews on the public Reviews page.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.googleReviews?.enabled}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      googleReviews: {
                        enabled: !formData.googleReviews?.enabled,
                        placeId: formData.googleReviews?.placeId || "",
                        businessUrl: formData.googleReviews?.businessUrl || "",
                        maxReviews: formData.googleReviews?.maxReviews || 5,
                      },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 ${
                    formData.googleReviews?.enabled ? "bg-[#7C3AED]" : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.googleReviews?.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Google Reviews Form Fields */}
              {formData.googleReviews?.enabled ? (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Google Place ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.googleReviews?.placeId || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            googleReviews: {
                              enabled: true,
                              placeId: e.target.value,
                              businessUrl: formData.googleReviews?.businessUrl || "",
                              maxReviews: formData.googleReviews?.maxReviews || 5,
                            },
                          })
                        }
                        placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                      <p className="mt-1 text-[11px] text-stone-400">
                        Obtain your unique Place ID from Google Place ID Finder.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Reviews to Display (1–5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.googleReviews?.maxReviews || 5}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            googleReviews: {
                              enabled: true,
                              placeId: formData.googleReviews?.placeId || "",
                              businessUrl: formData.googleReviews?.businessUrl || "",
                              maxReviews: Math.min(5, Math.max(1, Number(e.target.value) || 5)),
                            },
                          })
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                      <p className="mt-1 text-[11px] text-stone-400">
                        Top 5-star verified customer reviews shown.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Google Maps Business URL
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                      <input
                        type="url"
                        value={formData.googleReviews?.businessUrl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            googleReviews: {
                              enabled: true,
                              placeId: formData.googleReviews?.placeId || "",
                              businessUrl: e.target.value,
                              maxReviews: formData.googleReviews?.maxReviews || 5,
                            },
                          })
                        }
                        placeholder="https://maps.google.com/?cid=..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-xs text-purple-900">
                    <p className="font-semibold">Security Note:</p>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      The Google Places API key is securely managed on the server in environment variables (<code className="font-mono text-[10px] bg-purple-100 px-1 py-0.5 rounded">GOOGLE_PLACES_API_KEY</code>) and is never exposed in the browser.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-6 text-center">
                  <p className="text-xs text-stone-500 font-medium">
                    Google Reviews integration is currently disabled. Toggle the switch above to configure.
                  </p>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* CARD 5: EXTERNAL SALON MANAGEMENT SYSTEM LINKS       */}
            {/* ---------------------------------------------------- */}
            <div
              id="external-system"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex items-start gap-3.5 border-b border-stone-100 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    Salon Management System Links
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Connect the public INVORA website to the external Salon Management System.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* 1. Customer Login URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-700">
                      Customer Login URL
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          formData.externalSystem?.loginUrl?.trim()
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-stone-100 text-stone-500 border border-stone-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            formData.externalSystem?.loginUrl?.trim()
                              ? "bg-emerald-500"
                              : "bg-stone-400"
                          }`}
                        />
                        <span>
                          {formData.externalSystem?.loginUrl?.trim() ? "Connected" : "Not configured"}
                        </span>
                      </span>

                      {formData.externalSystem?.loginUrl?.trim() && (
                        <a
                          href={formData.externalSystem.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-800"
                        >
                          <ExternalLinkIcon className="h-3 w-3" />
                          <span>Test Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <input
                    type="url"
                    value={formData.externalSystem?.loginUrl || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        externalSystem: {
                          loginUrl: e.target.value,
                          registerUrl: formData.externalSystem?.registerUrl || "",
                          bookingUrl: formData.externalSystem?.bookingUrl || "",
                        },
                      })
                    }
                    placeholder="https://app.salonms.com/login"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  <p className="text-[11px] text-stone-400">
                    Used by the Login button in the public website header.
                  </p>
                </div>

                {/* 2. Customer Registration URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-700">
                      Customer Registration URL
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          formData.externalSystem?.registerUrl?.trim()
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-stone-100 text-stone-500 border border-stone-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            formData.externalSystem?.registerUrl?.trim()
                              ? "bg-emerald-500"
                              : "bg-stone-400"
                          }`}
                        />
                        <span>
                          {formData.externalSystem?.registerUrl?.trim() ? "Connected" : "Not configured"}
                        </span>
                      </span>

                      {formData.externalSystem?.registerUrl?.trim() && (
                        <a
                          href={formData.externalSystem.registerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-800"
                        >
                          <ExternalLinkIcon className="h-3 w-3" />
                          <span>Test Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <input
                    type="url"
                    value={formData.externalSystem?.registerUrl || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        externalSystem: {
                          loginUrl: formData.externalSystem?.loginUrl || "",
                          registerUrl: e.target.value,
                          bookingUrl: formData.externalSystem?.bookingUrl || "",
                        },
                      })
                    }
                    placeholder="https://app.salonms.com/register"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  <p className="text-[11px] text-stone-400">
                    Used by customer registration prompts and new client onboarding.
                  </p>
                </div>

                {/* 3. Book Appointment URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-700">
                      Book Appointment URL
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          formData.externalSystem?.bookingUrl?.trim()
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-stone-100 text-stone-500 border border-stone-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            formData.externalSystem?.bookingUrl?.trim()
                              ? "bg-emerald-500"
                              : "bg-stone-400"
                          }`}
                        />
                        <span>
                          {formData.externalSystem?.bookingUrl?.trim() ? "Connected" : "Not configured"}
                        </span>
                      </span>

                      {formData.externalSystem?.bookingUrl?.trim() && (
                        <a
                          href={formData.externalSystem.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-800"
                        >
                          <ExternalLinkIcon className="h-3 w-3" />
                          <span>Test Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <input
                    type="url"
                    value={formData.externalSystem?.bookingUrl || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        externalSystem: {
                          loginUrl: formData.externalSystem?.loginUrl || "",
                          registerUrl: formData.externalSystem?.registerUrl || "",
                          bookingUrl: e.target.value,
                        },
                      })
                    }
                    placeholder="https://app.salonms.com/book"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  <p className="text-[11px] text-stone-400">
                    Used by &quot;Book Appointment&quot; buttons and call-to-actions throughout the entire website.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. STICKY SAVE CHANGES BAR AT BOTTOM (MATCHES MOCKUP)      */}
      {/* ========================================================== */}
      <div className="sticky bottom-4 z-40 rounded-2xl border border-stone-200/90 bg-white/95 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${
                hasUnsavedChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900">
                {hasUnsavedChanges
                  ? "You have unsaved changes"
                  : "All changes saved to database"}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {hasUnsavedChanges
                  ? "Make sure to save your changes to update the website settings."
                  : "Your website settings are up to date."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!hasUnsavedChanges || saving}
              onClick={handleResetChanges}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Reset Changes
            </button>

            <button
              type="button"
              disabled={!hasUnsavedChanges || saving}
              onClick={() => handleSubmit()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#6D28D9] transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
