"use client";

import React, { useState, useEffect, FormEvent } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  SettingsIcon,
  ClockIcon,
  SparklesIcon,
  CheckIcon,
  ImageIcon,
  UploadCloudIcon,
  ExternalLinkIcon,
  TrashIcon,
  AlertCircleIcon,
  StarIcon,
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

interface SalonSettingsData {
  salonName: string;
  logo: string;
  logoPublicId?: string;
  aboutDescription: string;
  phone: string;
  phoneSecondary: string;
  whatsapp: string;
  email: string;
  address: string;
  openingHours: OpeningHour[];
  socialMedia: {
    facebook: string;
    instagram: string;
    tiktok: string;
    whatsapp: string;
  };
  googleReviews?: GoogleReviewsData;
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

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<SalonSettingsData>({
    salonName: "LUMINA Luxury Salon",
    logo: "",
    aboutDescription:
      "Colombo's premier sanctuary for bespoke hair styling, aesthetic skin therapy, and luxury bridal services.",
    phone: "+94 11 234 5678",
    phoneSecondary: "+94 77 123 4567",
    whatsapp: "+94 77 123 4567",
    email: "concierge@luminasalon.lk",
    address: "42 Horton Place, Cinnamon Gardens, Colombo 07, Sri Lanka",
    openingHours: DEFAULT_DAYS.map((day) => ({
      day,
      open: "09:00",
      close: day === "Sunday" ? "17:00" : "19:00",
      isClosed: false,
    })),
    socialMedia: {
      facebook: "https://facebook.com/luminasalon",
      instagram: "https://instagram.com/luminasalon",
      tiktok: "https://tiktok.com/@luminasalon",
      whatsapp: "https://wa.me/94771234567",
    },
    googleReviews: {
      enabled: false,
      placeId: "",
      businessUrl: "",
      maxReviews: 5,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Logo state
  const [logoTab, setLogoTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<boolean>(false);

  // Fetch real settings on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        const data = await res.json();

        if (res.ok && data.success && data.settings && isMounted) {
          const hasPublicId = Boolean(
            data.settings.logoPublicId && data.settings.logoPublicId.trim()
          );
          const hasLogo = Boolean(
            data.settings.logo && data.settings.logo.trim()
          );

          if (hasPublicId) {
            setLogoTab("upload");
            setUrlInput("");
          } else if (hasLogo) {
            setLogoTab("url");
            setUrlInput(data.settings.logo);
          } else {
            setLogoTab("upload");
            setUrlInput("");
          }

          setFormData({
            salonName: data.settings.salonName || "LUMINA Luxury Salon",
            logo: data.settings.logo || "",
            logoPublicId: data.settings.logoPublicId || "",
            aboutDescription: data.settings.aboutDescription || "",
            phone: data.settings.phone || "",
            phoneSecondary: data.settings.phoneSecondary || "",
            whatsapp: data.settings.whatsapp || "",
            email: data.settings.email || "",
            address: data.settings.address || "",
            openingHours:
              Array.isArray(data.settings.openingHours) &&
              data.settings.openingHours.length > 0
                ? data.settings.openingHours
                : DEFAULT_DAYS.map((day) => ({
                    day,
                    open: "09:00",
                    close: day === "Sunday" ? "17:00" : "19:00",
                    isClosed: false,
                  })),
            socialMedia: {
              facebook: data.settings.socialMedia?.facebook || "",
              instagram: data.settings.socialMedia?.instagram || "",
              tiktok: data.settings.socialMedia?.tiktok || "",
              whatsapp: data.settings.socialMedia?.whatsapp || "",
            },
            googleReviews: {
              enabled: Boolean(data.settings.googleReviews?.enabled),
              placeId: data.settings.googleReviews?.placeId || "",
              businessUrl: data.settings.googleReviews?.businessUrl || "",
              maxReviews: data.settings.googleReviews?.maxReviews || 5,
            },
          });
        }
      } catch (err) {
        console.error("Load settings error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const validateUrl = (val: string): boolean => {
    if (!val.trim()) return true;
    const trimmed = val.trim();
    if (trimmed.startsWith("https://")) return true;
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
    return false;
  };

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setPreviewError(false);
    if (val.trim() && !validateUrl(val)) {
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

  const handleLogoUpload = (result: UploadResult) => {
    setFormData((prev) => ({
      ...prev,
      logo: result.url,
      logoPublicId: result.publicId,
    }));
    setUrlInput("");
    setUrlError(null);
    setPreviewError(false);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo: "",
      logoPublicId: "",
    }));
    setUrlInput("");
    setUrlError(null);
    setPreviewError(false);
  };

  const handleHourChange = (
    index: number,
    field: "open" | "close" | "isClosed",
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const updatedHours = [...prev.openingHours];
      updatedHours[index] = {
        ...updatedHours[index],
        [field]: value,
      };
      return { ...prev, openingHours: updatedHours };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validate URL if in URL tab
    let finalLogo = formData.logo;
    let finalLogoPublicId = formData.logoPublicId || "";

    if (logoTab === "url") {
      const trimmedUrl = urlInput.trim();
      if (trimmedUrl) {
        if (!validateUrl(trimmedUrl)) {
          setUrlError("Please enter a valid image URL (must begin with https:// or /)");
          setStatusMessage({
            type: "error",
            text: "Please enter a valid image URL.",
          });
          return;
        }
        finalLogo = trimmedUrl;
        finalLogoPublicId = "";
      } else {
        finalLogo = "";
        finalLogoPublicId = "";
      }
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        logo: finalLogo,
        logoPublicId: finalLogoPublicId,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: "Website settings saved successfully to MongoDB!",
        });
        setFormData((prev) => ({
          ...prev,
          logo: data.settings.logo || "",
          logoPublicId: data.settings.logoPublicId || "",
          googleReviews: data.settings.googleReviews
            ? {
                enabled: Boolean(data.settings.googleReviews.enabled),
                placeId: data.settings.googleReviews.placeId || "",
                businessUrl: data.settings.googleReviews.businessUrl || "",
                maxReviews: data.settings.googleReviews.maxReviews || 5,
              }
            : prev.googleReviews,
        }));
        if (data.settings.logoPublicId) {
          setLogoTab("upload");
          setUrlInput("");
        } else if (data.settings.logo) {
          setLogoTab("url");
          setUrlInput(data.settings.logo);
        }
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "Failed to update settings",
        });
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setStatusMessage({
        type: "error",
        text: "Network error saving settings",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Website Settings"
        description="Configure salon contact information, weekly opening hours, and official social media handles."
        breadcrumbs={[{ label: "Website Settings" }]}
      />

      {statusMessage && (
        <div
          className={`rounded-xl border p-4 text-xs sm:text-sm flex items-center justify-between ${
            statusMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-xs sm:text-sm text-stone-500">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[#B7925A] mb-3" />
          <p>Loading salon configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Salon Information */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-[#B7925A]" />
                <span>Salon Profile & Contact Details</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Public details displayed across the footer, navigation, and contact page.
              </p>
            </div>

            {/* Salon Brand Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Salon Brand Name
              </label>
              <input
                type="text"
                required
                value={formData.salonName}
                onChange={(e) =>
                  setFormData({ ...formData, salonName: e.target.value })
                }
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
              />
            </div>

            {/* Dedicated Professional SALON LOGO Section */}
            <div className="rounded-2xl border border-stone-200 bg-[#FAF7F2]/60 p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200/80 pb-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#B7925A]" />
                    <span>SALON LOGO</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Choose how you want to add the salon logo.
                  </p>
                </div>

                {formData.logo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition self-start sm:self-auto"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>

              {/* Selectable Options / Tabs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1 rounded-xl bg-stone-200/70 w-full sm:w-fit">
                <button
                  type="button"
                  onClick={() => setLogoTab("upload")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    logoTab === "upload"
                      ? "bg-[#1C1917] text-white shadow-xs"
                      : "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                  }`}
                >
                  <UploadCloudIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>Upload Logo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLogoTab("url");
                    if (!urlInput && formData.logo && !formData.logoPublicId) {
                      setUrlInput(formData.logo);
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    logoTab === "url"
                      ? "bg-[#1C1917] text-white shadow-xs"
                      : "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                  }`}
                >
                  <ExternalLinkIcon className="h-4 w-4 text-[#B7925A]" />
                  <span>Use Image URL</span>
                </button>
              </div>

              {/* 1. Upload Logo Option */}
              {logoTab === "upload" && (
                <div className="space-y-4">
                  {/* Logo Live Preview */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                      Logo Preview
                    </span>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative h-24 w-44 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white p-2.5 shadow-xs flex items-center justify-center">
                        {formData.logo && !previewError ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={formData.logo}
                            alt="Salon Logo Preview"
                            onError={() => setPreviewError(true)}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                            <ImageIcon className="h-6 w-6 text-stone-300 mb-1" />
                            <span className="text-[10px] uppercase tracking-wider font-medium text-stone-400">
                              {previewError ? "Failed to load logo" : "No Logo Set"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 space-y-1">
                        <p className="font-medium text-stone-700">
                          {formData.logo
                            ? "Active Logo"
                            : "No logo uploaded yet."}
                        </p>
                        <p className="text-[11px] text-stone-400 max-w-sm">
                          Rendered using object-contain in a white frame to ensure your salon emblem is never cropped.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cloudinary ImageUpload component */}
                  <div className="pt-1">
                    <ImageUpload
                      folder={CLOUDINARY_FOLDERS.SALON}
                      value={formData.logoPublicId ? formData.logo : ""}
                      publicId={formData.logoPublicId}
                      onChange={handleLogoUpload}
                      onRemove={handleRemoveLogo}
                      label="Upload or Replace Logo Image"
                      description="Supports PNG, JPG, JPEG, WEBP up to 5MB (transparent PNG recommended)"
                    />
                  </div>
                </div>
              )}

              {/* 2. Use Image URL Option */}
              {logoTab === "url" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Logo Image URL
                    </label>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] bg-white ${
                        urlError ? "border-red-300 bg-red-50/40" : "border-stone-300"
                      }`}
                    />
                    {urlError ? (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{urlError}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-stone-400">
                        Supports secure external HTTPS URLs or existing local paths beginning with / (e.g. /images/about-salon.svg).
                      </p>
                    )}
                  </div>

                  {/* Live Preview for URL */}
                  <div className="space-y-1.5 pt-1">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                      Logo Preview
                    </span>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative h-24 w-44 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white p-2.5 shadow-xs flex items-center justify-center">
                        {urlInput.trim() && !previewError && !urlError ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={urlInput.trim()}
                            alt="Logo preview"
                            onError={() => setPreviewError(true)}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                            <ImageIcon className="h-6 w-6 text-stone-300 mb-1" />
                            <span className="text-[10px] uppercase tracking-wider font-medium text-stone-400">
                              {previewError ? "Failed to load URL" : "Preview will appear here"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 space-y-1">
                        {previewError ? (
                          <p className="text-red-600 font-medium text-xs">
                            Please enter a valid image URL.
                          </p>
                        ) : (
                          <p className="text-[11px] text-stone-400 max-w-sm">
                            Logo preview updates in real time. Remember to click &quot;Save Settings&quot; below to persist changes.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Primary Phone
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Secondary / Mobile Phone
                </label>
                <input
                  type="text"
                  value={formData.phoneSecondary}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneSecondary: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  WhatsApp Hotline
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Concierge Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Physical Salon Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  About Description
                </label>
                <textarea
                  rows={3}
                  value={formData.aboutDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aboutDescription: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Opening Hours */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-[#B7925A]" />
                <span>Salon Opening Hours</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Define regular operational opening and closing hours for each day of the week.
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {formData.openingHours.map((schedule, idx) => (
                <div
                  key={schedule.day}
                  className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="w-32 font-medium text-stone-900">
                    {schedule.day}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-stone-600">
                      <input
                        type="checkbox"
                        checked={schedule.isClosed}
                        onChange={(e) =>
                          handleHourChange(idx, "isClosed", e.target.checked)
                        }
                        className="rounded text-[#B7925A] focus:ring-[#B7925A]"
                      />
                      <span>Closed</span>
                    </label>

                    {!schedule.isClosed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={schedule.open}
                          onChange={(e) =>
                            handleHourChange(idx, "open", e.target.value)
                          }
                          className="rounded-xl border border-stone-200 px-2.5 py-1 text-xs text-stone-800 outline-none focus:border-[#B7925A]"
                        />
                        <span className="text-stone-400">to</span>
                        <input
                          type="time"
                          value={schedule.close}
                          onChange={(e) =>
                            handleHourChange(idx, "close", e.target.value)
                          }
                          className="rounded-xl border border-stone-200 px-2.5 py-1 text-xs text-stone-800 outline-none focus:border-[#B7925A]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Social Media Channels */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-[#B7925A]" />
                <span>Social Media & Online Channels</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Official handles linked in the website header and footer.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.facebook}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        facebook: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        instagram: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  TikTok URL
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.tiktok}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        tiktok: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  WhatsApp Direct URL
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        whatsapp: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Google Reviews */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <StarIcon className="h-5 w-5 text-[#B7925A]" />
                <span>GOOGLE REVIEWS</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Display reviews from your salon&apos;s Google Business Profile.
              </p>
            </div>

            {/* Incomplete Configuration Alert */}
            {formData.googleReviews?.enabled && !formData.googleReviews?.placeId?.trim() && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800">
                <AlertCircleIcon className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Configuration Incomplete:</strong> Google Reviews is enabled, but a Google Place ID is missing. Public reviews will remain hidden until a valid Place ID is configured.
                </span>
              </div>
            )}

            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.googleReviews?.enabled || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      googleReviews: {
                        enabled: e.target.checked,
                        placeId: prev.googleReviews?.placeId || "",
                        businessUrl: prev.googleReviews?.businessUrl || "",
                        maxReviews: prev.googleReviews?.maxReviews || 5,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded-sm text-[#B7925A] focus:ring-[#B7925A]"
                />
                <div>
                  <span className="text-xs font-semibold text-stone-800">
                    Display Google Reviews
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Show verified Google reviews on the public Reviews page.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Google Place ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Google Place ID
                </label>
                <input
                  type="text"
                  value={formData.googleReviews?.placeId || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      googleReviews: {
                        enabled: prev.googleReviews?.enabled || false,
                        placeId: e.target.value,
                        businessUrl: prev.googleReviews?.businessUrl || "",
                        maxReviews: prev.googleReviews?.maxReviews || 5,
                      },
                    }))
                  }
                  placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  Find your Place ID via Google&apos;s Place ID Finder tool.
                </p>
              </div>

              {/* Reviews to Display */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Reviews to Display (1–5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={formData.googleReviews?.maxReviews ?? 5}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      googleReviews: {
                        enabled: prev.googleReviews?.enabled || false,
                        placeId: prev.googleReviews?.placeId || "",
                        businessUrl: prev.googleReviews?.businessUrl || "",
                        maxReviews: Math.min(5, Math.max(1, Number(e.target.value) || 5)),
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  Google Places API returns up to 5 top reviews per request.
                </p>
              </div>

              {/* Google Maps Business URL */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Google Maps Business URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.googleReviews?.businessUrl || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      googleReviews: {
                        enabled: prev.googleReviews?.enabled || false,
                        placeId: prev.googleReviews?.placeId || "",
                        businessUrl: e.target.value,
                        maxReviews: prev.googleReviews?.maxReviews || 5,
                      },
                    }))
                  }
                  placeholder="https://maps.google.com/..."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  Direct link opened when visitors click &ldquo;View All Reviews on Google&rdquo;.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-8 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors border border-[#B7925A]/30 shadow-xs"
            >
              <CheckIcon className="h-4 w-4 text-[#C5A46D]" />
              <span>{saving ? "Saving Changes..." : "Save Website Settings"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
