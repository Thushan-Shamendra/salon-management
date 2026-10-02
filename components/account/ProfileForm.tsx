"use client";

import React, { useState, FormEvent } from "react";
import { UserProfile } from "@/types/account";
import ImageUpload from "@/components/ui/ImageUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  CheckIcon,
  AlertCircleIcon,
} from "@/components/ui/icons";

interface ProfileFormProps {
  initialUser: UserProfile;
  onProfileUpdated?: (updatedUser: UserProfile) => void;
}

export default function ProfileForm({
  initialUser,
  onProfileUpdated,
}: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialUser.name || "",
    email: initialUser.email || "",
    phone: initialUser.phone || "",
    profileImage: initialUser.profileImage || "",
    profileImagePublicId: initialUser.profileImagePublicId || "",
  });

  const [initialState, setInitialState] = useState({
    name: initialUser.name || "",
    email: initialUser.email || "",
    phone: initialUser.phone || "",
    profileImage: initialUser.profileImage || "",
    profileImagePublicId: initialUser.profileImagePublicId || "",
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialState);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    // Client validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters).");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      setErrorMessage("Please enter a valid phone number (minimum 7 characters).");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          profileImage: formData.profileImage.trim(),
          profileImagePublicId: formData.profileImagePublicId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to update profile.");
        return;
      }

      setSuccessMessage(data.message || "Profile updated successfully!");
      if (data.user) {
        setInitialState({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          profileImage: data.user.profileImage || "",
          profileImagePublicId: data.user.profileImagePublicId || "",
        });
        if (onProfileUpdated) {
          onProfileUpdated(data.user);
        }
      }
    } catch (err) {
      console.error("Profile submit error:", err);
      setErrorMessage("Something went wrong. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const isFormDirty =
    formData.name !== initialState.name ||
    formData.email !== initialState.email ||
    formData.phone !== initialState.phone ||
    formData.profileImage !== initialState.profileImage ||
    formData.profileImagePublicId !== initialState.profileImagePublicId;

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-6 pb-4 border-b border-stone-100">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1C1917]">
          Personal Information
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#78716C]">
          Update your contact details and salon preferences.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs sm:text-sm text-emerald-800"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
            <CheckIcon className="h-3.5 w-3.5" />
          </div>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs sm:text-sm text-red-700"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shrink-0">
            <AlertCircleIcon className="h-3.5 w-3.5" />
          </div>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Upload with Circular Preview */}
        <div>
          <ImageUpload
            folder={CLOUDINARY_FOLDERS.PROFILES}
            value={formData.profileImage}
            publicId={formData.profileImagePublicId}
            label="Profile Photo"
            description="Upload a photo for your profile (JPG, JPEG, PNG, WEBP up to 5MB)"
            circular={true}
            disabled={saving}
            onChange={({ url, publicId }) => {
              setFormData((prev) => ({
                ...prev,
                profileImage: url,
                profileImagePublicId: publicId,
              }));
            }}
            onRemove={() => {
              setFormData((prev) => ({
                ...prev,
                profileImage: "",
                profileImagePublicId: "",
              }));
            }}
          />
        </div>

        {/* Full Name & Email Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <UserIcon className="h-4 w-4" />
              </div>
              <input
                id="name"
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2]/40 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-[#B7925A] focus:bg-white focus:ring-2 focus:ring-[#B7925A]/20"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <MailIcon className="h-4 w-4" />
              </div>
              <input
                id="email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2]/40 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-[#B7925A] focus:bg-white focus:ring-2 focus:ring-[#B7925A]/20"
              />
            </div>
          </div>
        </div>

        {/* Phone Number Field */}
        <div>
          <label
            htmlFor="phone"
            className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
          >
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
              <PhoneIcon className="h-4 w-4" />
            </div>
            <input
              id="phone"
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+94 77 123 4567"
              className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2]/40 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-[#B7925A] focus:bg-white focus:ring-2 focus:ring-[#B7925A]/20"
            />
          </div>
          <p className="mt-1 text-[11px] text-[#78716C]">
            Used for appointment SMS updates and booking reminders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || !isFormDirty}
            className="w-full sm:w-auto rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 disabled:opacity-40"
          >
            Cancel / Reset
          </button>

          <button
            type="submit"
            disabled={saving || !isFormDirty}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#FAF7F2] shadow-sm transition-all hover:bg-stone-800 disabled:opacity-50 border border-[#B7925A]/30"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-white" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
