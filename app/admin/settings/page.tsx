"use client";

import React, { useState, useEffect, FormEvent } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  SettingsIcon,
  ClockIcon,
  SparklesIcon,
  CheckIcon,
} from "@/components/ui/icons";

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

interface SalonSettingsData {
  salonName: string;
  logo: string;
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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch real settings on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        const data = await res.json();

        if (res.ok && data.success && data.settings && isMounted) {
          setFormData({
            salonName: data.settings.salonName || "LUMINA Luxury Salon",
            logo: data.settings.logo || "",
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
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: "Website settings saved successfully to MongoDB!",
        });
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Logo URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                  placeholder="/images/logo.svg"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A]"
                />
              </div>

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
