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
  ImageIcon,
  GoogleIcon,
  LockIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeOffIcon,
  ShoppingBagIcon,
  TagIcon,
  HeartIcon,
  UsersIcon,
} from "@/components/ui/icons";
import ImageUpload, { UploadResult } from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import { useSectionCustomization } from "@/components/customization/CustomizationProvider";

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

export interface PageVisibilityState {
  products: boolean;
  promotions: boolean;
  wedding: boolean;
  vendors: boolean;
  gallery: boolean;
}

const DEFAULT_PAGE_VISIBILITY: PageVisibilityState = {
  products: true,
  promotions: true,
  wedding: true,
  vendors: true,
  gallery: true,
};

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

export interface IntegrationSafeInfo {
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecretConfigured: boolean;
    hasAdminOverride: boolean;
    source: "admin" | "environment" | "none";
    isConfigured: boolean;
  };
  googlePlaces: {
    apiKeyConfigured: boolean;
    hasAdminOverride: boolean;
    source: "admin" | "environment" | "none";
    isConfigured: boolean;
  };
  ai: {
    provider: string;
    model: string;
    baseUrl: string;
    apiKeyConfigured: boolean;
    hasAdminOverride: boolean;
    source: "admin" | "environment" | "none";
    isConfigured: boolean;
  };
}

const SECTIONS = [
  { id: "salon-branding", label: "Branding & Logo", icon: StoreIcon, group: "Global Website" },
  { id: "social-media", label: "Social Media", icon: ExternalLinkIcon, group: "Global Website" },
  { id: "external-system", label: "External System", icon: LinkIcon, group: "Global Website" },
  { id: "page-visibility", label: "Page Visibility", icon: EyeIcon, group: "Global Website" },
  { id: "main-branch-details", label: "Main Branch Details", icon: MapPinIcon, group: "Main Branch" },
  { id: "main-branch-hours", label: "Main Opening Hours", icon: ClockIcon, group: "Main Branch" },
  { id: "main-branch-reviews", label: "Main Google Reviews", icon: StarIcon, group: "Main Branch" },
  { id: "integration-cloudinary", label: "Cloudinary", icon: ImageIcon, group: "Integrations" },
  { id: "integration-google", label: "Google Places", icon: GoogleIcon, group: "Integrations" },
  { id: "integration-ai", label: "AI Provider", icon: SparklesIcon, group: "Integrations" },
];

export default function AdminSettingsPage() {
  const router = useRouter();

  // Loading & notification states
  const customization = useSectionCustomization("page");
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

  // Page Visibility state
  const [pageVisibility, setPageVisibility] = useState<PageVisibilityState>(DEFAULT_PAGE_VISIBILITY);
  const [initialPageVisibility, setInitialPageVisibility] = useState<PageVisibilityState | null>(null);
  const [savingPageVisibility, setSavingPageVisibility] = useState(false);

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

  // Integrations state
  const [integrationsStatus, setIntegrationsStatus] = useState<IntegrationSafeInfo | null>(null);

  // Cloudinary form state
  const [cldCloudName, setCldCloudName] = useState("");
  const [cldApiKey, setCldApiKey] = useState("");
  const [cldApiSecret, setCldApiSecret] = useState("");
  const [cldPassword, setCldPassword] = useState("");
  const [showCldPassword, setShowCldPassword] = useState(false);
  const [savingCld, setSavingCld] = useState(false);
  const [clearingCld, setClearingCld] = useState(false);

  // Google Places form state
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);
  const [clearingGoogle, setClearingGoogle] = useState(false);

  // AI Provider form state
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiPassword, setAiPassword] = useState("");
  const [showAiPassword, setShowAiPassword] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [clearingAi, setClearingAi] = useState(false);

  // Clear confirmation modal state
  const [confirmClearModal, setConfirmClearModal] = useState<{
    target: "cloudinary" | "google" | "ai";
    title: string;
    message: string;
  } | null>(null);

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

  // Reload integrations from Integrations API
  const loadIntegrations = async (isMounted = true) => {
    try {
      const res = await fetch("/api/admin/integrations");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.integrations && isMounted) {
          const info: IntegrationSafeInfo = data.integrations;
          setIntegrationsStatus(info);
          setCldCloudName(info.cloudinary.cloudName || "");
          setCldApiKey(info.cloudinary.apiKey || "");
          setAiProvider(info.ai.provider || "openai");
          setAiModel(info.ai.model || "gpt-4o-mini");
          setAiBaseUrl(info.ai.baseUrl || "");
        }
      }
    } catch (err) {
      console.error("Failed to load integrations:", err);
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

            const normalizedVisibility: PageVisibilityState = {
              products:
                s.pageVisibility?.products !== undefined
                  ? Boolean(s.pageVisibility.products)
                  : true,
              promotions:
                s.pageVisibility?.promotions !== undefined
                  ? Boolean(s.pageVisibility.promotions)
                  : true,
              wedding:
                s.pageVisibility?.wedding !== undefined
                  ? Boolean(s.pageVisibility.wedding)
                  : true,
              vendors:
                s.pageVisibility?.vendors !== undefined
                  ? Boolean(s.pageVisibility.vendors)
                  : true,
              gallery:
                s.pageVisibility?.gallery !== undefined
                  ? Boolean(s.pageVisibility.gallery)
                  : true,
            };
            setPageVisibility(normalizedVisibility);
            setInitialPageVisibility({ ...normalizedVisibility });
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

        // 3. Fetch Integrations
        await loadIntegrations(isMounted);
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

  const hasPageVisibilityChanges = useMemo(() => {
    if (!initialPageVisibility) return false;
    return JSON.stringify(pageVisibility) !== JSON.stringify(initialPageVisibility);
  }, [pageVisibility, initialPageVisibility]);

  const hasMainBranchChanges = useMemo(() => {
    if (!initialBranchForm) return false;
    return JSON.stringify(mainBranchForm) !== JSON.stringify(initialBranchForm);
  }, [mainBranchForm, initialBranchForm]);

  // Unload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGlobalChanges || hasPageVisibilityChanges || hasMainBranchChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasGlobalChanges, hasPageVisibilityChanges, hasMainBranchChanges]);

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

  const handleSavePageVisibility = async () => {
    setSavingPageVisibility(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageVisibility }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", "Page visibility updated successfully.");
        setInitialPageVisibility({ ...pageVisibility });
        router.refresh();
      } else {
        showNotification("error", "Unable to update page visibility.");
      }
    } catch {
      showNotification("error", "Unable to update page visibility.");
    } finally {
      setSavingPageVisibility(false);
    }
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

  // ============================================================================
  // INTEGRATION SETTINGS ACTIONS
  // ============================================================================

  const handleSaveCloudinary = async (e: FormEvent) => {
    e.preventDefault();
    if (cldApiSecret.trim() && !cldPassword.trim()) {
      showNotification("error", "Current admin password is required to update the Cloudinary API secret.");
      return;
    }
    setSavingCld(true);
    try {
      const res = await fetch("/api/admin/integrations/cloudinary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloudName: cldCloudName.trim(),
          apiKey: cldApiKey.trim(),
          apiSecret: cldApiSecret.trim() || undefined,
          currentPassword: cldPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update Cloudinary settings");
      }
      setCldApiSecret("");
      setCldPassword("");
      showNotification("success", "Cloudinary settings saved successfully.");
      await loadIntegrations();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Unable to save Cloudinary settings.");
    } finally {
      setSavingCld(false);
    }
  };

  const handleSaveGoogle = async (e: FormEvent) => {
    e.preventDefault();
    if (!googleApiKey.trim()) {
      showNotification("error", "Please enter a new Google Places API key to save.");
      return;
    }
    if (!googlePassword.trim()) {
      showNotification("error", "Current admin password is required to update the Google Places API key.");
      return;
    }
    setSavingGoogle(true);
    try {
      const res = await fetch("/api/admin/integrations/google", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: googleApiKey.trim(),
          currentPassword: googlePassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update Google Places settings");
      }
      setGoogleApiKey("");
      setGooglePassword("");
      showNotification("success", "Google Places API key saved successfully.");
      await loadIntegrations();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Unable to save Google Places settings.");
    } finally {
      setSavingGoogle(false);
    }
  };

  const handleSaveAi = async (e: FormEvent) => {
    e.preventDefault();
    if (aiApiKey.trim() && !aiPassword.trim()) {
      showNotification("error", "Current admin password is required to update the AI API key.");
      return;
    }
    setSavingAi(true);
    try {
      const res = await fetch("/api/admin/integrations/ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider.trim(),
          model: aiModel.trim(),
          baseUrl: aiBaseUrl.trim() || undefined,
          apiKey: aiApiKey.trim() || undefined,
          currentPassword: aiPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update AI configuration");
      }
      setAiApiKey("");
      setAiPassword("");
      showNotification("success", "AI configuration saved successfully.");
      await loadIntegrations();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Unable to save AI configuration.");
    } finally {
      setSavingAi(false);
    }
  };

  const handleClearOverride = async (target: "cloudinary" | "google" | "ai") => {
    const isClearing =
      target === "cloudinary"
        ? setClearingCld
        : target === "google"
        ? setClearingGoogle
        : setClearingAi;
    isClearing(true);
    try {
      const res = await fetch(`/api/admin/integrations/${target}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to clear ${target} override`);
      }
      showNotification("success", data.message || "Admin override cleared. Reverted to environment defaults.");
      setConfirmClearModal(null);
      await loadIntegrations();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Unable to clear override.");
    } finally {
      isClearing(false);
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
              data-customization-role="primaryButton"
              data-customization-admin-primary="true"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-2xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingGlobal && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{savingGlobal ? "Saving..." : customization.text("primaryButtonText", "Save Global Settings")}</span>
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

            <div className="border-t border-stone-100 pt-2">
              <div className="flex items-center justify-between px-3 py-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Integrations
                </p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  API Keys
                </span>
              </div>
              <div className="space-y-1 mt-1">
                {SECTIONS.filter((s) => s.group === "Integrations").map((sec) => {
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
                <h2 data-customization-role="sectionHeading" className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
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
                        Public Navbar
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

            {/* CARD 4: PUBLIC PAGE VISIBILITY */}
            <div
              id="page-visibility"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                    <EyeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 tracking-tight">
                      Public Page Visibility
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Choose which optional pages are available on the public SALVORA website.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSavePageVisibility}
                  disabled={savingPageVisibility}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer shrink-0"
                >
                  <span>{savingPageVisibility ? "Saving..." : "Save Page Visibility"}</span>
                </button>
              </div>

              <div className="space-y-3">
                {(
                  [
                    {
                      key: "products" as const,
                      name: "Products",
                      description: "Show SALVORA selling products on the public website.",
                      icon: ShoppingBagIcon,
                    },
                    {
                      key: "promotions" as const,
                      name: "Promotions",
                      description: "Show active promotions and special offers on the public website.",
                      icon: TagIcon,
                    },
                    {
                      key: "wedding" as const,
                      name: "Wedding",
                      description: "Show Wedding services and wedding packages on the public website.",
                      icon: HeartIcon,
                    },
                    {
                      key: "vendors" as const,
                      name: "Vendors",
                      description: "Show trusted vendors and partner services on the public website.",
                      icon: UsersIcon,
                    },
                    {
                      key: "gallery" as const,
                      name: "Gallery",
                      description: "Show the salon photo gallery on the public website.",
                      icon: ImageIcon,
                    },
                  ] as const
                ).map((item) => {
                  const IconComp = item.icon;
                  const isEnabled = pageVisibility[item.key];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-stone-200/80 bg-stone-50/50 px-4 py-3.5 transition-colors hover:border-stone-300/80"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                            isEnabled
                              ? "bg-purple-50 text-[#7C3AED] border-purple-100"
                              : "bg-stone-100 text-stone-400 border-stone-200"
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-stone-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-semibold ${
                            isEnabled ? "text-[#7C3AED]" : "text-stone-400"
                          }`}
                        >
                          {isEnabled ? "Enabled" : "Hidden"}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          aria-label={`Toggle ${item.name} page visibility`}
                          onClick={() =>
                            setPageVisibility((prev) => ({
                              ...prev,
                              [item.key]: !prev[item.key],
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 ${
                            isEnabled ? "bg-[#7C3AED]" : "bg-stone-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                              isEnabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 px-4 py-3 text-xs text-stone-600">
                Hiding a page removes it from the public website only. Admin management pages and saved data remain available.
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
                  <h2 data-customization-role="sectionHeading" className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
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

          {/* ==================================================== */}
          {/* GROUP 3: INTEGRATIONS & API CONFIGURATION            */}
          {/* ==================================================== */}
          <div className="space-y-6 pt-6 border-t border-stone-200/80">
            <div>
              <h2 data-customization-role="sectionHeading" className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                Integrations & API Configuration
              </h2>
              <p className="text-xs text-stone-500">
                Server-side API keys and cloud storage configuration. Secret keys are encrypted with AES-256-GCM and never returned in plaintext.
              </p>
            </div>

            {/* CARD 1: CLOUDINARY IMAGE MANAGEMENT */}
            <div
              id="integration-cloudinary"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 tracking-tight">
                      Cloudinary Image Management
                    </h3>
                    <p className="text-xs text-stone-500">
                      Configure Cloudinary for signed image uploads used by SALVORA.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {integrationsStatus?.cloudinary.isConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircleIcon className="h-3.5 w-3.5" />
                      Not Configured
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                    Source:{" "}
                    <strong className="font-semibold text-stone-900">
                      {integrationsStatus?.cloudinary.source === "admin"
                        ? "Admin Override"
                        : integrationsStatus?.cloudinary.source === "environment"
                        ? "Environment Default"
                        : "None"}
                    </strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveCloudinary} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Cloud Name
                    </label>
                    <input
                      type="text"
                      value={cldCloudName}
                      onChange={(e) => setCldCloudName(e.target.value)}
                      placeholder="e.g. salvora-cloud"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={cldApiKey}
                      onChange={(e) => setCldApiKey(e.target.value)}
                      placeholder="e.g. 123456789012345"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      API Secret
                    </label>
                    {integrationsStatus?.cloudinary.apiSecretConfigured && (
                      <span className="text-[11px] font-medium text-emerald-600 inline-flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3" />
                        Secret Configured & Encrypted
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      type="password"
                      value={cldApiSecret}
                      onChange={(e) => setCldApiSecret(e.target.value)}
                      placeholder="Enter a new API secret to replace the current value"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white placeholder:text-stone-400"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Existing secrets are never displayed. Leave empty to preserve your current secret.
                  </p>
                </div>

                {/* Password confirmation when changing secret */}
                {cldApiSecret.trim().length > 0 && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                      <ShieldCheckIcon className="h-4 w-4 text-[#7C3AED]" />
                      <span>Admin Password Confirmation Required</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showCldPassword ? "text" : "password"}
                        value={cldPassword}
                        onChange={(e) => setCldPassword(e.target.value)}
                        placeholder="Enter your current admin password"
                        className="w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCldPassword(!showCldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showCldPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingCld}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white shadow-2xs transition cursor-pointer disabled:opacity-40"
                  >
                    {savingCld && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>{savingCld ? "Saving..." : "Save Cloudinary Settings"}</span>
                  </button>

                  {integrationsStatus?.cloudinary.hasAdminOverride && (
                    <button
                      type="button"
                      disabled={clearingCld}
                      onClick={() =>
                        setConfirmClearModal({
                          target: "cloudinary",
                          title: "Clear Cloudinary Override",
                          message:
                            "Remove the saved override and return to the server environment configuration?",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Clear Admin Override</span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* CARD 2: GOOGLE PLACES & REVIEWS */}
            <div
              id="integration-google"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <GoogleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 tracking-tight">
                      Google Places & Reviews
                    </h3>
                    <p className="text-xs text-stone-500">
                      Server-side API configuration used to display Google Business reviews.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {integrationsStatus?.googlePlaces.isConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircleIcon className="h-3.5 w-3.5" />
                      Not Configured
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                    Source:{" "}
                    <strong className="font-semibold text-stone-900">
                      {integrationsStatus?.googlePlaces.source === "admin"
                        ? "Admin Override"
                        : integrationsStatus?.googlePlaces.source === "environment"
                        ? "Environment Default"
                        : "None"}
                    </strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveGoogle} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Google Places API Key
                    </label>
                    {integrationsStatus?.googlePlaces.apiKeyConfigured && (
                      <span className="text-[11px] font-medium text-emerald-600 inline-flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3" />
                        API Key Configured
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      type="password"
                      value={googleApiKey}
                      onChange={(e) => setGoogleApiKey(e.target.value)}
                      placeholder="Enter a new API key to replace the current key"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white placeholder:text-stone-400"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Used strictly server-side by SALVORA to fetch customer reviews. Branch Place IDs and review links are configured separately in Branch Settings.
                  </p>
                </div>

                {/* Password confirmation */}
                {googleApiKey.trim().length > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                      <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
                      <span>Admin Password Confirmation Required</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showGooglePassword ? "text" : "password"}
                        value={googlePassword}
                        onChange={(e) => setGooglePassword(e.target.value)}
                        placeholder="Enter your current admin password"
                        className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGooglePassword(!showGooglePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showGooglePassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingGoogle || !googleApiKey.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-2xs transition cursor-pointer disabled:opacity-40"
                  >
                    {savingGoogle && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>{savingGoogle ? "Saving..." : "Save Google Settings"}</span>
                  </button>

                  {integrationsStatus?.googlePlaces.hasAdminOverride && (
                    <button
                      type="button"
                      disabled={clearingGoogle}
                      onClick={() =>
                        setConfirmClearModal({
                          target: "google",
                          title: "Clear Google Places Override",
                          message:
                            "Remove the saved override and return to the server environment configuration?",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Clear Admin Override</span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* CARD 3: AI PROVIDER */}
            <div
              id="integration-ai"
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 tracking-tight">
                      AI Provider
                    </h3>
                    <p className="text-xs text-stone-500">
                      Configure your AI provider for the SALVORA AI Website Assistant.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {integrationsStatus?.ai.isConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircleIcon className="h-3.5 w-3.5" />
                      Not Configured
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                    Source:{" "}
                    <strong className="font-semibold text-stone-900">
                      {integrationsStatus?.ai.source === "admin"
                        ? "Admin Override"
                        : integrationsStatus?.ai.source === "environment"
                        ? "Environment Default"
                        : "None"}
                    </strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveAi} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Provider
                    </label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    >
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Model
                    </label>
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="e.g. gpt-4o-mini"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Base URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={aiBaseUrl}
                      onChange={(e) => setAiBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      API Key
                    </label>
                    {integrationsStatus?.ai.apiKeyConfigured && (
                      <span className="text-[11px] font-medium text-emerald-600 inline-flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3" />
                        API Key Configured
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder="Enter a new AI API key to replace the current key"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#7C3AED] focus:bg-white placeholder:text-stone-400"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Existing AI keys are never displayed. Leave empty to preserve your existing key.
                  </p>
                </div>

                {/* Password confirmation */}
                {aiApiKey.trim().length > 0 && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-900">
                      <ShieldCheckIcon className="h-4 w-4 text-violet-600" />
                      <span>Admin Password Confirmation Required</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showAiPassword ? "text" : "password"}
                        value={aiPassword}
                        onChange={(e) => setAiPassword(e.target.value)}
                        placeholder="Enter your current admin password"
                        className="w-full rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-violet-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAiPassword(!showAiPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showAiPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingAi}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white shadow-2xs transition cursor-pointer disabled:opacity-40"
                  >
                    {savingAi && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>{savingAi ? "Saving..." : "Save AI Configuration"}</span>
                  </button>

                  {integrationsStatus?.ai.hasAdminOverride && (
                    <button
                      type="button"
                      disabled={clearingAi}
                      onClick={() =>
                        setConfirmClearModal({
                          target: "ai",
                          title: "Clear AI Provider Override",
                          message:
                            "Remove the saved override and return to the server environment configuration?",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Clear Admin Override</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Clear Override Modal */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">{confirmClearModal.title}</h3>
                <p className="mt-1 text-xs text-stone-600">{confirmClearModal.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConfirmClearModal(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleClearOverride(confirmClearModal.target)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition cursor-pointer"
              >
                Clear Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
