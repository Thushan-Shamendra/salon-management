"use client";

import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
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
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import ImageUpload, { UploadResult } from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";

// ============================================================================
// DATA INTERFACES
// ============================================================================

export interface GlobalSettingsData {
  salonName: string;
  logo: string;
  logoPublicId?: string;
  footerLogo?: string;
  footerLogoPublicId?: string;
  aboutDescription: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    tiktok: string;
    whatsapp: string;
  };
  externalSystem: {
    loginUrl: string;
    registerUrl: string;
    bookingUrl: string;
  };
}

export interface BranchOpeningHour {
  day: string;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
}

export interface BranchItem {
  _id: string;
  name: string;
  slug?: string;
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
  openingHours?: BranchOpeningHour[];
  isActive: boolean;
  displayOrder?: number;
  isMain?: boolean;
}

export interface MainBranchFormState {
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
  openingHours: BranchOpeningHour[];
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

const DEFAULT_BRANCH_HOURS: BranchOpeningHour[] = [
  { day: "Monday", isClosed: false, openTime: "09:00", closeTime: "19:00" },
  { day: "Tuesday", isClosed: false, openTime: "09:00", closeTime: "19:00" },
  { day: "Wednesday", isClosed: false, openTime: "09:00", closeTime: "19:00" },
  { day: "Thursday", isClosed: false, openTime: "09:00", closeTime: "19:00" },
  { day: "Friday", isClosed: false, openTime: "09:00", closeTime: "19:00" },
  { day: "Saturday", isClosed: false, openTime: "09:00", closeTime: "19:00" },
  { day: "Sunday", isClosed: false, openTime: "10:00", closeTime: "17:00" },
];

const emptyBranchForm: MainBranchFormState = {
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
  openingHours: DEFAULT_BRANCH_HOURS,
};

const SECTIONS = [
  { id: "salon-branding", label: "Branding & Logo", icon: StoreIcon, group: "Global Website" },
  { id: "social-media", label: "Social Media", icon: ExternalLinkIcon, group: "Global Website" },
  { id: "external-system", label: "External System", icon: LinkIcon, group: "Global Website" },
  { id: "main-branch-details", label: "Main Branch Details", icon: MapPinIcon, group: "Main Branch" },
  { id: "main-branch-hours", label: "Main Opening Hours", icon: ClockIcon, group: "Main Branch" },
  { id: "main-branch-reviews", label: "Main Google Reviews", icon: StarIcon, group: "Main Branch" },
];

export default function AdminSettingsPage() {
  const router = useRouter();

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingMainBranch, setSavingMainBranch] = useState(false);
  const [activeSection, setActiveSection] = useState("salon-branding");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Global Settings state
  const [globalData, setGlobalData] = useState<GlobalSettingsData>({
    salonName: "",
    logo: "",
    logoPublicId: "",
    footerLogo: "",
    footerLogoPublicId: "",
    aboutDescription: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      tiktok: "",
      whatsapp: "",
    },
    externalSystem: {
      loginUrl: "",
      registerUrl: "",
      bookingUrl: "",
    },
  });
  const [initialGlobalData, setInitialGlobalData] = useState<GlobalSettingsData | null>(null);

  // Logo input modes
  const [logoTab, setLogoTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const [footerLogoTab, setFooterLogoTab] = useState<"upload" | "url">("upload");
  const [footerUrlInput, setFooterUrlInput] = useState("");
  const [footerUrlError, setFooterUrlError] = useState<string | null>(null);

  // Branch states
  const [allBranches, setAllBranches] = useState<BranchItem[]>([]);
  const [mainBranch, setMainBranch] = useState<BranchItem | null>(null);
  const [mainBranchForm, setMainBranchForm] = useState<MainBranchFormState>(emptyBranchForm);
  const [initialBranchForm, setInitialBranchForm] = useState<MainBranchFormState | null>(null);

  // Branch assignment states
  const [selectedBranchIdToMakeMain, setSelectedBranchIdToMakeMain] = useState<string>("");
  const [isDesignatingMain, setIsDesignatingMain] = useState(false);
  const [showCreateMainForm, setShowCreateMainForm] = useState(false);

  // Helper to trigger toast notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Normalize branch hours to ensure 7 complete days
  const normalizeBranchHours = (rawHours?: BranchOpeningHour[]): BranchOpeningHour[] => {
    if (!Array.isArray(rawHours) || rawHours.length === 0) {
      return DEFAULT_BRANCH_HOURS;
    }
    return DEFAULT_DAYS.map((day) => {
      const match = rawHours.find((h) => h.day.toLowerCase() === day.toLowerCase());
      if (match) {
        return {
          day,
          isClosed: Boolean(match.isClosed),
          openTime: match.openTime || "09:00",
          closeTime: match.closeTime || (day === "Sunday" ? "17:00" : "19:00"),
        };
      }
      return {
        day,
        isClosed: false,
        openTime: "09:00",
        closeTime: day === "Sunday" ? "17:00" : "19:00",
      };
    });
  };

  // Reload branches from Branch API
  const reloadBranches = async () => {
    try {
      const res = await fetch("/api/admin/branches");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.branches)) {
          const list: BranchItem[] = data.branches;
          setAllBranches(list);

          const foundMain = list.find((b) => b.isMain);
          if (foundMain) {
            setMainBranch(foundMain);
            setSelectedBranchIdToMakeMain(foundMain._id);
            const populated: MainBranchFormState = {
              name: foundMain.name || "",
              phone: foundMain.phone || "",
              whatsappNumber: foundMain.whatsappNumber || "",
              email: foundMain.email || "",
              address: foundMain.address || "",
              latitude:
                foundMain.latitude !== undefined && foundMain.latitude !== null
                  ? String(foundMain.latitude)
                  : "",
              longitude:
                foundMain.longitude !== undefined && foundMain.longitude !== null
                  ? String(foundMain.longitude)
                  : "",
              googleMapsUrl: foundMain.googleMapsUrl || "",
              googlePlaceId: foundMain.googlePlaceId || "",
              googleReviewUrl: foundMain.googleReviewUrl || "",
              reviewsEnabled: Boolean(foundMain.reviewsEnabled),
              openingHours: normalizeBranchHours(foundMain.openingHours),
            };
            setMainBranchForm(populated);
            setInitialBranchForm(JSON.parse(JSON.stringify(populated)));
            setShowCreateMainForm(false);
          } else {
            setMainBranch(null);
            if (list.length > 0) {
              setSelectedBranchIdToMakeMain(list[0]._id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to reload branches:", err);
    }
  };

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setLoading(true);

        // 1. Fetch Global Settings
        const settingsRes = await fetch("/api/admin/settings");
        if (settingsRes.ok) {
          const settingsJson = await settingsRes.json();
          if (settingsJson.success && settingsJson.settings && isMounted) {
            const s = settingsJson.settings;

            // Logo tab selection
            if (s.logoPublicId && s.logoPublicId.trim()) {
              setLogoTab("upload");
              setUrlInput("");
            } else if (s.logo && s.logo.trim()) {
              setLogoTab("url");
              setUrlInput(s.logo);
            }

            // Footer logo tab selection
            if (s.footerLogoPublicId && s.footerLogoPublicId.trim()) {
              setFooterLogoTab("upload");
              setFooterUrlInput("");
            } else if (s.footerLogo && s.footerLogo.trim()) {
              setFooterLogoTab("url");
              setFooterUrlInput(s.footerLogo);
            }

            const normalizedGlobal: GlobalSettingsData = {
              salonName: s.salonName || "",
              logo: s.logo || "",
              logoPublicId: s.logoPublicId || "",
              footerLogo: s.footerLogo || "",
              footerLogoPublicId: s.footerLogoPublicId || "",
              aboutDescription: s.aboutDescription || "",
              socialMedia: {
                facebook: s.socialMedia?.facebook || "",
                instagram: s.socialMedia?.instagram || "",
                tiktok: s.socialMedia?.tiktok || "",
                whatsapp: s.socialMedia?.whatsapp || "",
              },
              externalSystem: {
                loginUrl: s.externalSystem?.loginUrl || "",
                registerUrl: s.externalSystem?.registerUrl || "",
                bookingUrl: s.externalSystem?.bookingUrl || "",
              },
            };

            setGlobalData(normalizedGlobal);
            setInitialGlobalData(JSON.parse(JSON.stringify(normalizedGlobal)));
          }
        }

        // 2. Fetch Branches
        const branchRes = await fetch("/api/admin/branches");
        if (branchRes.ok && isMounted) {
          const branchJson = await branchRes.json();
          if (branchJson.success && Array.isArray(branchJson.branches)) {
            const list: BranchItem[] = branchJson.branches;
            setAllBranches(list);

            const foundMain = list.find((b) => b.isMain);
            if (foundMain) {
              setMainBranch(foundMain);
              setSelectedBranchIdToMakeMain(foundMain._id);
              const populated: MainBranchFormState = {
                name: foundMain.name || "",
                phone: foundMain.phone || "",
                whatsappNumber: foundMain.whatsappNumber || "",
                email: foundMain.email || "",
                address: foundMain.address || "",
                latitude:
                  foundMain.latitude !== undefined && foundMain.latitude !== null
                    ? String(foundMain.latitude)
                    : "",
                longitude:
                  foundMain.longitude !== undefined && foundMain.longitude !== null
                    ? String(foundMain.longitude)
                    : "",
                googleMapsUrl: foundMain.googleMapsUrl || "",
                googlePlaceId: foundMain.googlePlaceId || "",
                googleReviewUrl: foundMain.googleReviewUrl || "",
                reviewsEnabled: Boolean(foundMain.reviewsEnabled),
                openingHours: normalizeBranchHours(foundMain.openingHours),
              };
              setMainBranchForm(populated);
              setInitialBranchForm(JSON.parse(JSON.stringify(populated)));
            } else {
              setMainBranch(null);
              if (list.length > 0) {
                setSelectedBranchIdToMakeMain(list[0]._id);
              }
            }
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
        if (isMounted) showNotification("error", "Network error loading settings.");
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
  const hasGlobalChanges = useMemo(() => {
    if (!initialGlobalData) return false;
    return JSON.stringify(globalData) !== JSON.stringify(initialGlobalData);
  }, [globalData, initialGlobalData]);

  const hasMainBranchChanges = useMemo(() => {
    if (!initialBranchForm) return false;
    return JSON.stringify(mainBranchForm) !== JSON.stringify(initialBranchForm);
  }, [mainBranchForm, initialBranchForm]);

  // Unload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGlobalChanges || hasMainBranchChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasGlobalChanges, hasMainBranchChanges]);

  // Smooth scroll
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Image URL validation
  const validateImageUrl = (val: string): boolean => {
    if (!val.trim()) return true;
    const trimmed = val.trim();
    return trimmed.startsWith("https://") || (trimmed.startsWith("/") && !trimmed.startsWith("//"));
  };

  // ============================================================================
  // GLOBAL SETTINGS ACTIONS
  // ============================================================================

  const saveGlobalSettingsPayload = async (
    dataToSave: GlobalSettingsData,
    successMsg = "Global website settings saved successfully."
  ) => {
    if (!dataToSave.salonName.trim()) {
      showNotification("error", "Salon Brand Name is required.");
      return false;
    }

    setSavingGlobal(true);
    try {
      const payload = {
        salonName: dataToSave.salonName.trim(),
        aboutDescription: dataToSave.aboutDescription.trim(),
        logo: dataToSave.logo.trim(),
        logoPublicId: dataToSave.logoPublicId?.trim() || "",
        footerLogo: dataToSave.footerLogo?.trim() || "",
        footerLogoPublicId: dataToSave.footerLogoPublicId?.trim() || "",
        socialMedia: dataToSave.socialMedia,
        externalSystem: dataToSave.externalSystem,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", successMsg);
        setInitialGlobalData(JSON.parse(JSON.stringify(dataToSave)));
        router.refresh();
        return true;
      } else {
        showNotification("error", data.message || "Failed to save global settings");
        return false;
      }
    } catch {
      showNotification("error", "Network error saving global settings");
      return false;
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleGlobalSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    await saveGlobalSettingsPayload(globalData);
  };

  // Logo handlers
  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    if (val.trim() && !validateImageUrl(val)) {
      setUrlError("Please enter a valid image URL (must begin with https:// or /)");
    } else {
      setUrlError(null);
      setGlobalData((prev) => ({
        ...prev,
        logo: val.trim(),
        logoPublicId: "",
      }));
    }
  };

  const handleLogoUpload = async (result: UploadResult) => {
    const updated: GlobalSettingsData = {
      ...globalData,
      logo: result.url,
      logoPublicId: result.publicId,
    };
    setGlobalData(updated);
    setUrlInput("");
    setUrlError(null);
    await saveGlobalSettingsPayload(updated, "Header logo uploaded and saved successfully!");
  };

  const handleRemoveLogo = async () => {
    const updated: GlobalSettingsData = {
      ...globalData,
      logo: "",
      logoPublicId: "",
    };
    setGlobalData(updated);
    setUrlInput("");
    setUrlError(null);
    await saveGlobalSettingsPayload(updated, "Header logo removed and saved.");
  };

  const handleFooterUrlChange = (val: string) => {
    setFooterUrlInput(val);
    if (val.trim() && !validateImageUrl(val)) {
      setFooterUrlError("Please enter a valid image URL (must begin with https:// or /)");
    } else {
      setFooterUrlError(null);
      setGlobalData((prev) => ({
        ...prev,
        footerLogo: val.trim(),
        footerLogoPublicId: "",
      }));
    }
  };

  const handleFooterLogoUpload = async (result: UploadResult) => {
    const updated: GlobalSettingsData = {
      ...globalData,
      footerLogo: result.url,
      footerLogoPublicId: result.publicId,
    };
    setGlobalData(updated);
    setFooterUrlInput("");
    setFooterUrlError(null);
    await saveGlobalSettingsPayload(updated, "Footer logo uploaded and saved successfully!");
  };

  const handleRemoveFooterLogo = async () => {
    const updated: GlobalSettingsData = {
      ...globalData,
      footerLogo: "",
      footerLogoPublicId: "",
    };
    setGlobalData(updated);
    setFooterUrlInput("");
    setFooterUrlError(null);
    await saveGlobalSettingsPayload(updated, "Footer logo removed and saved.");
  };

  // ============================================================================
  // MAIN BRANCH ACTIONS
  // ============================================================================

  const handleHourChange = (
    index: number,
    field: "openTime" | "closeTime" | "isClosed",
    value: string | boolean
  ) => {
    setMainBranchForm((prev) => {
      const updated = [...prev.openingHours];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, openingHours: updated };
    });
  };

  const handleCopyMondayHours = () => {
    const monday = mainBranchForm.openingHours.find((h) => h.day === "Monday");
    if (!monday) return;
    setMainBranchForm((prev) => {
      const updated = prev.openingHours.map((h) => {
        if (["Tuesday", "Wednesday", "Thursday", "Friday"].includes(h.day)) {
          return {
            ...h,
            openTime: monday.openTime,
            closeTime: monday.closeTime,
            isClosed: monday.isClosed,
          };
        }
        return h;
      });
      return { ...prev, openingHours: updated };
    });
    showNotification("success", "Copied Monday hours to Tuesday through Friday.");
  };

  // Save or Create Main Branch directly via Branch API
  const handleSaveMainBranch = async (isNew = false) => {
    if (!mainBranchForm.name.trim()) {
      showNotification("error", "Branch Name is required.");
      return;
    }
    if (!mainBranchForm.phone.trim()) {
      showNotification("error", "Branch Phone number is required.");
      return;
    }
    if (!mainBranchForm.address.trim()) {
      showNotification("error", "Branch Physical Address is required.");
      return;
    }

    setSavingMainBranch(true);
    try {
      const parsedLat =
        mainBranchForm.latitude !== "" && !isNaN(Number(mainBranchForm.latitude))
          ? Number(mainBranchForm.latitude)
          : undefined;
      const parsedLng =
        mainBranchForm.longitude !== "" && !isNaN(Number(mainBranchForm.longitude))
          ? Number(mainBranchForm.longitude)
          : undefined;

      const payload = {
        name: mainBranchForm.name.trim(),
        phone: mainBranchForm.phone.trim(),
        whatsappNumber: mainBranchForm.whatsappNumber.trim(),
        email: mainBranchForm.email.trim(),
        address: mainBranchForm.address.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        googleMapsUrl: mainBranchForm.googleMapsUrl.trim(),
        googlePlaceId: mainBranchForm.googlePlaceId.trim(),
        googleReviewUrl: mainBranchForm.googleReviewUrl.trim(),
        reviewsEnabled: Boolean(mainBranchForm.reviewsEnabled),
        openingHours: mainBranchForm.openingHours,
        isMain: true,
        isActive: true,
      };

      if (isNew || !mainBranch) {
        // Create new branch as Main Branch
        const res = await fetch("/api/admin/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showNotification("success", "Main Branch created successfully!");
          await reloadBranches();
          setShowCreateMainForm(false);
        } else {
          showNotification("error", data.message || "Failed to create Main Branch");
        }
      } else {
        // Update existing Main Branch document directly
        const res = await fetch(`/api/admin/branches/${mainBranch._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showNotification("success", "Main Branch updated successfully!");
          await reloadBranches();
        } else {
          showNotification("error", data.message || "Failed to update Main Branch");
        }
      }
    } catch {
      showNotification("error", "Network error saving Main Branch");
    } finally {
      setSavingMainBranch(false);
    }
  };

  // Set an existing branch as the Main Branch
  const handleDesignateExistingAsMain = async () => {
    if (!selectedBranchIdToMakeMain) {
      showNotification("error", "Please select a branch to designate as Main Branch.");
      return;
    }

    setIsDesignatingMain(true);
    try {
      const res = await fetch(`/api/admin/branches/${selectedBranchIdToMakeMain}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMain: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Selected branch is now designated as the Main Branch!");
        await reloadBranches();
      } else {
        showNotification("error", data.message || "Failed to designate branch as main");
      }
    } catch {
      showNotification("error", "Network error designating main branch");
    } finally {
      setIsDesignatingMain(false);
    }
  };

  // Google Reviews badge status
  const googleStatus = useMemo(() => {
    if (!mainBranchForm.reviewsEnabled) return "disabled";
    if (mainBranchForm.googlePlaceId?.trim()) return "configured";
    return "incomplete";
  }, [mainBranchForm.reviewsEnabled, mainBranchForm.googlePlaceId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Website Settings"
          description="Manage global website branding, logos, social media, and your Main Branch configuration."
        />
        <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#7C3AED] border-t-transparent" />
          <p className="text-xs text-stone-500 font-medium">Loading settings and branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all animate-in slide-in-from-bottom-5 ${
            notification.type === "success"
              ? "bg-emerald-900/90 text-white border-emerald-700 backdrop-blur-md"
              : "bg-rose-900/90 text-white border-rose-700 backdrop-blur-md"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span className="font-medium text-xs sm:text-sm">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-2 text-white/70 hover:text-white transition cursor-pointer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <AdminPageHeader
        title="Website Settings"
        description="Manage global website branding, logos, social media, and your Main Branch configuration."
        breadcrumbs={[{ label: "Settings" }]}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/admin/branches?action=new")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <span>+ Add Branch</span>
            </button>

            <button
              type="button"
              disabled={savingGlobal || !hasGlobalChanges}
              onClick={() => handleGlobalSubmit()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-2xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingGlobal && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{savingGlobal ? "Saving..." : "Save Global Settings"}</span>
            </button>

            {mainBranch && (
              <button
                type="button"
                disabled={savingMainBranch || !hasMainBranchChanges}
                onClick={() => handleSaveMainBranch(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white shadow-2xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingMainBranch && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>{savingMainBranch ? "Saving..." : "Save Main Branch"}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Main Grid: Left Nav + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ====================================================== */}
        {/* LEFT: SECTION NAVIGATION SIDEBAR                       */}
        {/* ====================================================== */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
          <nav className="rounded-2xl border border-stone-200/90 bg-white p-3 shadow-xs space-y-3">
            <div>
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Global Website Settings
              </p>
              <div className="space-y-1 mt-1">
                {SECTIONS.filter((s) => s.group === "Global Website").map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        isActive
                          ? "bg-purple-50 text-[#7C3AED] shadow-2xs"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#7C3AED]" : "text-stone-400"}`} />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-stone-100 pt-2">
              <div className="flex items-center justify-between px-3 py-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                  Main Branch Settings
                </p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  ★ Branch
                </span>
              </div>
              <div className="space-y-1 mt-1">
                {SECTIONS.filter((s) => s.group === "Main Branch").map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        isActive
                          ? "bg-purple-50 text-[#7C3AED] shadow-2xs"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#7C3AED]" : "text-stone-400"}`} />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-stone-100 pt-2 px-1">
              <button
                type="button"
                onClick={() => router.push("/admin/branches")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-stone-400" />
                  <span>Manage All Branches</span>
                </span>
                <span className="text-[11px] text-stone-400">&rarr;</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* ====================================================== */}
        {/* RIGHT: SETTINGS SECTIONS CONTENT                       */}
        {/* ====================================================== */}
        <div className="lg:col-span-9 space-y-8">
          {/* ==================================================== */}
          {/* GROUP 1: GLOBAL WEBSITE SETTINGS                     */}
          {/* ==================================================== */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  Global Website Settings
                </h2>
                <p className="text-xs text-stone-500">
                  Settings stored globally in SalonSettings (branding, logos, social links, booking system).
                </p>
              </div>
              <button
                type="button"
                disabled={savingGlobal || !hasGlobalChanges}
                onClick={() => handleGlobalSubmit()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7C3AED] text-xs font-semibold text-white shadow-2xs hover:bg-[#6D28D9] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingGlobal && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>Save Global Settings</span>
              </button>
            </div>

            {/* CARD 1: BRANDING & LOGOS */}
            <div
              id="salon-branding"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex items-start gap-3.5 border-b border-stone-100 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <StoreIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight">
                    Salon Branding & Logos
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Configure your salon brand identity, header navbar logo, and dark footer logo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Brand Name & About */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Salon Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={globalData.salonName}
                      onChange={(e) =>
                        setGlobalData({ ...globalData, salonName: e.target.value })
                      }
                      placeholder="e.g. SALVORA Salon"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      About Description / Sanctuary Bio
                    </label>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={globalData.aboutDescription}
                      onChange={(e) =>
                        setGlobalData({ ...globalData, aboutDescription: e.target.value })
                      }
                      placeholder="Brief overview of salon sanctuary and philosophy..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                    />
                    <p className="mt-1 text-[11px] text-stone-400 text-right">
                      {globalData.aboutDescription.length} / 500 characters
                    </p>
                  </div>
                </div>

                {/* Logos Column */}
                <div className="space-y-4">
                  {/* Header Logo */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-800">Header Navbar Logo</h4>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                        Navbar & Admin
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLogoTab("upload")}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          logoTab === "url"
                            ? "bg-[#7C3AED] text-white shadow-xs"
                            : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>Image URL</span>
                      </button>
                    </div>

                    {logoTab === "upload" ? (
                      <div className="space-y-2">
                        {globalData.logo ? (
                          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-stone-200 bg-white">
                            <div className="h-10 w-24 flex items-center justify-center overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={globalData.logo} alt="Header Logo" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="flex items-center gap-2">
                              <ImageUpload
                                folder={CLOUDINARY_FOLDERS.SALON}
                                value={globalData.logo}
                                publicId={globalData.logoPublicId}
                                label=""
                                onChange={handleLogoUpload}
                                onRemove={handleRemoveLogo}
                                renderTrigger={(open, disabled) => (
                                  <button
                                    type="button"
                                    onClick={() => open()}
                                    disabled={disabled}
                                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-300 text-stone-700 hover:text-[#7C3AED] cursor-pointer"
                                  >
                                    Replace
                                  </button>
                                )}
                              />
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ImageUpload
                            folder={CLOUDINARY_FOLDERS.SALON}
                            label="Upload Logo (PNG / JPG / SVG)"
                            onChange={handleLogoUpload}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={urlInput}
                          onChange={(e) => handleUrlChange(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#7C3AED]"
                        />
                        {urlError && <p className="text-xs text-red-500">{urlError}</p>}
                      </div>
                    )}
                  </div>

                  {/* Footer Logo */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-800">Footer Logo</h4>
                      <span className="text-[10px] font-semibold text-stone-300 bg-stone-900 px-2 py-0.5 rounded-full">
                        Dark Footer
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFooterLogoTab("upload")}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          footerLogoTab === "url"
                            ? "bg-[#7C3AED] text-white shadow-xs"
                            : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>Image URL</span>
                      </button>
                    </div>

                    {footerLogoTab === "upload" ? (
                      <div className="space-y-2">
                        {globalData.footerLogo ? (
                          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-stone-200 bg-stone-900">
                            <div className="h-10 w-24 flex items-center justify-center overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={globalData.footerLogo} alt="Footer Logo" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="flex items-center gap-2">
                              <ImageUpload
                                folder={CLOUDINARY_FOLDERS.SALON}
                                value={globalData.footerLogo}
                                publicId={globalData.footerLogoPublicId}
                                label=""
                                onChange={handleFooterLogoUpload}
                                onRemove={handleRemoveFooterLogo}
                                renderTrigger={(open, disabled) => (
                                  <button
                                    type="button"
                                    onClick={() => open()}
                                    disabled={disabled}
                                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-600 text-stone-200 hover:text-white cursor-pointer"
                                  >
                                    Replace
                                  </button>
                                )}
                              />
                              <button
                                type="button"
                                onClick={handleRemoveFooterLogo}
                                className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ImageUpload
                            folder={CLOUDINARY_FOLDERS.SALON}
                            label="Upload Footer Logo"
                            onChange={handleFooterLogoUpload}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={footerUrlInput}
                          onChange={(e) => handleFooterUrlChange(e.target.value)}
                          placeholder="https://example.com/footer-logo.png"
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#7C3AED]"
                        />
                        {footerUrlError && <p className="text-xs text-red-500">{footerUrlError}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: SOCIAL MEDIA LINKS */}
            <div
              id="social-media"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex items-start gap-3.5 border-b border-stone-100 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <ExternalLinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight">
                    Global Social Media Links
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Official channels displayed in the website header, footer, and brand cards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Facebook URL
                  </label>
                  <div className="relative">
                    <FacebookIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 pointer-events-none" />
                    <input
                      type="url"
                      value={globalData.socialMedia.facebook}
                      onChange={(e) =>
                        setGlobalData({
                          ...globalData,
                          socialMedia: { ...globalData.socialMedia, facebook: e.target.value },
                        })
                      }
                      placeholder="https://facebook.com/salvora"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Instagram URL
                  </label>
                  <div className="relative">
                    <InstagramIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-600 pointer-events-none" />
                    <input
                      type="url"
                      value={globalData.socialMedia.instagram}
                      onChange={(e) =>
                        setGlobalData({
                          ...globalData,
                          socialMedia: { ...globalData.socialMedia, instagram: e.target.value },
                        })
                      }
                      placeholder="https://instagram.com/salvora"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    TikTok URL
                  </label>
                  <div className="relative">
                    <TikTokIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-800 pointer-events-none" />
                    <input
                      type="url"
                      value={globalData.socialMedia.tiktok}
                      onChange={(e) =>
                        setGlobalData({
                          ...globalData,
                          socialMedia: { ...globalData.socialMedia, tiktok: e.target.value },
                        })
                      }
                      placeholder="https://tiktok.com/@salvora"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    WhatsApp Global Link
                  </label>
                  <div className="relative">
                    <WhatsAppIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                    <input
                      type="url"
                      value={globalData.socialMedia.whatsapp}
                      onChange={(e) =>
                        setGlobalData({
                          ...globalData,
                          socialMedia: { ...globalData.socialMedia, whatsapp: e.target.value },
                        })
                      }
                      placeholder="https://wa.me/94771234567"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: EXTERNAL SYSTEM LINKS */}
            <div
              id="external-system"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex items-start gap-3.5 border-b border-stone-100 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight">
                    External System Links
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Connect external software systems for customer booking, login, and registration.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Customer Login URL
                  </label>
                  <input
                    type="url"
                    value={globalData.externalSystem.loginUrl}
                    onChange={(e) =>
                      setGlobalData({
                        ...globalData,
                        externalSystem: { ...globalData.externalSystem, loginUrl: e.target.value },
                      })
                    }
                    placeholder="https://booking.salvora.lk/login"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Registration URL
                  </label>
                  <input
                    type="url"
                    value={globalData.externalSystem.registerUrl}
                    onChange={(e) =>
                      setGlobalData({
                        ...globalData,
                        externalSystem: { ...globalData.externalSystem, registerUrl: e.target.value },
                      })
                    }
                    placeholder="https://booking.salvora.lk/register"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Book Appointment URL
                  </label>
                  <input
                    type="url"
                    value={globalData.externalSystem.bookingUrl}
                    onChange={(e) =>
                      setGlobalData({
                        ...globalData,
                        externalSystem: { ...globalData.externalSystem, bookingUrl: e.target.value },
                      })
                    }
                    placeholder="https://booking.salvora.lk/book"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* GROUP 2: MAIN BRANCH DEDICATED AREA                  */}
          {/* ==================================================== */}
          <div className="space-y-6 pt-4 border-t-2 border-dashed border-purple-200">
            {/* Main Branch Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-50/70 p-4 sm:p-5 rounded-2xl border border-purple-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7C3AED] text-white text-xs font-bold">
                    ★
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    Main Branch Settings
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    Single Source of Truth
                  </span>
                </div>
                <p className="text-xs text-stone-600 max-w-xl">
                  Main Branch data is loaded and saved directly to the Branch collection.
                  Opening hours, contact numbers, address, and Google reviews here belong solely to the Main Branch document.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => router.push("/admin/branches?action=new")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                >
                  <span>+ Add Branch</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/admin/branches")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition cursor-pointer"
                >
                  <span>Manage All Branches &rarr;</span>
                </button>
              </div>
            </div>

            {/* CONDITIONAL BRANCH STATE RENDERING */}
            {!mainBranch && !showCreateMainForm ? (
              allBranches.length === 0 ? (
                // State 1: No branches exist in MongoDB
                <div className="rounded-2xl border border-dashed border-purple-300 bg-purple-50/40 p-8 sm:p-10 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                    <MapPinIcon className="h-7 w-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-base font-bold text-stone-900">
                      No main branch has been configured yet.
                    </h3>
                    <p className="text-xs text-stone-600">
                      The database currently has no branch records. Click below to create your salon&apos;s primary Main Branch.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMainBranchForm({
                        ...emptyBranchForm,
                        name: globalData.salonName ? `${globalData.salonName} Main Branch` : "Main Flagship Branch",
                      });
                      setShowCreateMainForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                  >
                    <span>+ Create Main Branch</span>
                  </button>
                </div>
              ) : (
                // State 2: Branches exist, but none is marked as main
                <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-6 sm:p-8 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <AlertCircleIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-stone-900">
                        No main branch is selected.
                      </h3>
                      <p className="text-xs text-stone-600 max-w-xl">
                        You have {allBranches.length} branch{allBranches.length === 1 ? "" : "es"} in the system, but none is designated as the Main Branch.
                        Choose one below to designate it as the primary salon location:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <select
                      value={selectedBranchIdToMakeMain}
                      onChange={(e) => setSelectedBranchIdToMakeMain(e.target.value)}
                      className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-900 outline-none focus:border-[#7C3AED]"
                    >
                      {allBranches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.address})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isDesignatingMain}
                      onClick={handleDesignateExistingAsMain}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isDesignatingMain && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      <span>Set as Main Branch</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              // State 3: Active Main Branch editing (or creating form)
              <div className="space-y-6">
                {/* CARD A: MAIN BRANCH DETAILS */}
                <div
                  id="main-branch-details"
                  className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                        <MapPinIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-stone-900 tracking-tight">
                            Main Branch Details
                          </h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            ★ Main Branch
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Edits save directly to the Branch document ({mainBranch?._id || "New Branch"}).
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={savingMainBranch}
                      onClick={() => handleSaveMainBranch(!mainBranch)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {savingMainBranch && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      <span>Save Main Branch</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Branch Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={mainBranchForm.name}
                        onChange={(e) =>
                          setMainBranchForm({ ...mainBranchForm, name: e.target.value })
                        }
                        placeholder="e.g. Flagship Colombo Branch"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Primary Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={mainBranchForm.phone}
                          onChange={(e) =>
                            setMainBranchForm({ ...mainBranchForm, phone: e.target.value })
                          }
                          placeholder="+94 11 234 5678"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        WhatsApp Number
                      </label>
                      <div className="relative">
                        <WhatsAppIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                        <input
                          type="tel"
                          value={mainBranchForm.whatsappNumber}
                          onChange={(e) =>
                            setMainBranchForm({ ...mainBranchForm, whatsappNumber: e.target.value })
                          }
                          placeholder="+94 77 123 4567"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Branch Physical Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={mainBranchForm.address}
                          onChange={(e) =>
                            setMainBranchForm({ ...mainBranchForm, address: e.target.value })
                          }
                          placeholder="42 Horton Place, Cinnamon Gardens, Colombo 07, Sri Lanka"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Branch Email
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                        <input
                          type="email"
                          value={mainBranchForm.email}
                          onChange={(e) =>
                            setMainBranchForm({ ...mainBranchForm, email: e.target.value })
                          }
                          placeholder="colombo@salvora.lk"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Google Maps URL
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                        <input
                          type="url"
                          value={mainBranchForm.googleMapsUrl}
                          onChange={(e) =>
                            setMainBranchForm({ ...mainBranchForm, googleMapsUrl: e.target.value })
                          }
                          placeholder="https://maps.google.com/..."
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Latitude (Optional)
                      </label>
                      <input
                        type="text"
                        value={mainBranchForm.latitude}
                        onChange={(e) =>
                          setMainBranchForm({ ...mainBranchForm, latitude: e.target.value })
                        }
                        placeholder="6.9271"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Longitude (Optional)
                      </label>
                      <input
                        type="text"
                        value={mainBranchForm.longitude}
                        onChange={(e) =>
                          setMainBranchForm({ ...mainBranchForm, longitude: e.target.value })
                        }
                        placeholder="79.8612"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD B: MAIN BRANCH OPENING HOURS */}
                <div
                  id="main-branch-hours"
                  className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                        <ClockIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-stone-900 tracking-tight">
                          Main Branch Opening Hours
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Directly modifies the Main Branch document&apos;s openingHours array (all 7 days).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyMondayHours}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 text-xs font-semibold text-[#7C3AED] transition cursor-pointer"
                      >
                        <SparklesIcon className="h-3.5 w-3.5" />
                        <span>Copy Mon &rarr; Weekdays</span>
                      </button>

                      <button
                        type="button"
                        disabled={savingMainBranch}
                        onClick={() => handleSaveMainBranch(!mainBranch)}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {savingMainBranch && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        <span>Save Hours</span>
                      </button>
                    </div>
                  </div>

                  {/* 7-Day Hours Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mainBranchForm.openingHours.map((h, idx) => (
                      <div
                        key={h.day}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition ${
                          h.isClosed
                            ? "border-stone-200 bg-stone-50/50 opacity-70"
                            : "border-stone-200 bg-white shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-32">
                          <span className="text-xs font-bold text-stone-800">{h.day}</span>
                          <button
                            type="button"
                            onClick={() => handleHourChange(idx, "isClosed", !h.isClosed)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition cursor-pointer ${
                              h.isClosed
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {h.isClosed ? "Closed" : "Open"}
                          </button>
                        </div>

                        {!h.isClosed && (
                          <div className="flex items-center gap-2 text-xs">
                            <input
                              type="time"
                              value={h.openTime}
                              onChange={(e) => handleHourChange(idx, "openTime", e.target.value)}
                              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-800 outline-none focus:border-[#7C3AED]"
                            />
                            <span className="text-stone-400">to</span>
                            <input
                              type="time"
                              value={h.closeTime}
                              onChange={(e) => handleHourChange(idx, "closeTime", e.target.value)}
                              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-800 outline-none focus:border-[#7C3AED]"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARD C: MAIN BRANCH GOOGLE REVIEWS */}
                <div
                  id="main-branch-reviews"
                  className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                        <StarIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-stone-900 tracking-tight">
                            Main Branch Google Reviews
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              googleStatus === "configured"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : googleStatus === "incomplete"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-stone-100 text-stone-600 border border-stone-200"
                            }`}
                          >
                            {googleStatus === "configured"
                              ? "Active"
                              : googleStatus === "incomplete"
                              ? "Needs Place ID"
                              : "Disabled"}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Google Place ID and Write a Review link for the Main Branch. Ratings and reviews are fetched live from Google Places API.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={savingMainBranch}
                      onClick={() => handleSaveMainBranch(!mainBranch)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {savingMainBranch && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      <span>Save Reviews</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mainBranchForm.reviewsEnabled}
                        onChange={(e) =>
                          setMainBranchForm({
                            ...mainBranchForm,
                            reviewsEnabled: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">
                          Enable Google Reviews for Main Branch
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Display customer reviews from your Google Business Profile on public pages.
                        </span>
                      </div>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Google Place ID
                        </label>
                        <input
                          type="text"
                          value={mainBranchForm.googlePlaceId}
                          onChange={(e) =>
                            setMainBranchForm({
                              ...mainBranchForm,
                              googlePlaceId: e.target.value,
                            })
                          }
                          placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                        />
                        <p className="mt-1 text-[11px] text-stone-400">
                          Find your Place ID via the Google Place ID Finder tool.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Write a Review URL / Business URL
                        </label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                          <input
                            type="url"
                            value={mainBranchForm.googleReviewUrl}
                            onChange={(e) =>
                              setMainBranchForm({
                                ...mainBranchForm,
                                googleReviewUrl: e.target.value,
                              })
                            }
                            placeholder="https://g.page/r/.../review"
                            className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-stone-400">
                          Direct link allowing customers to leave a Google review.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
