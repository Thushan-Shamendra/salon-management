"use client";

import React, { useState, FormEvent } from "react";
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  AlertCircleIcon,
} from "@/components/ui/icons";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    // Client-side validations
    if (!currentPassword) {
      setErrorMessage("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("New password must be different from current password.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/account/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to update password.");
        return;
      }

      setSuccessMessage(data.message || "Password updated successfully!");
      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password submit error:", err);
      setErrorMessage("Something went wrong. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-6 pb-4 border-b border-stone-100">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#1C1917]">
          Change Password
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#78716C]">
          Ensure your account stays protected by choosing a strong, unique password.
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
          >
            Current Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
              <LockIcon className="h-4 w-4" />
            </div>
            <input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2]/40 pl-10 pr-11 py-2.5 text-xs sm:text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-[#B7925A] focus:bg-white focus:ring-2 focus:ring-[#B7925A]/20"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-700"
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New Password & Confirm Password Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <LockIcon className="h-4 w-4" />
              </div>
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2]/40 pl-10 pr-11 py-2.5 text-xs sm:text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-[#B7925A] focus:bg-white focus:ring-2 focus:ring-[#B7925A]/20"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-700"
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
            >
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <LockIcon className="h-4 w-4" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-stone-300 bg-[#FAF7F2]/40 pl-10 pr-11 py-2.5 text-xs sm:text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-[#B7925A] focus:bg-white focus:ring-2 focus:ring-[#B7925A]/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-700"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#FAF7F2] shadow-sm transition-all hover:bg-stone-800 disabled:opacity-50 border border-[#B7925A]/30"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-white" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
