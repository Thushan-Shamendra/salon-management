"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  EyeIcon,
  EyeOffIcon,
  ShieldCheckIcon,
  CheckIcon,
  AlertCircleIcon,
} from "@/components/ui/icons";

export default function AdminChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  // Check if admin currently has mustChangePassword active
  useEffect(() => {
    let isMounted = true;
    async function checkAdminStatus() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.success && data.user && isMounted) {
          setIsInitialSetup(!!data.user.mustChangePassword);
        }
      } catch {
        // Silently continue
      }
    }
    checkAdminStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("New password must contain at least one uppercase letter, one lowercase letter, and one number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to change password. Please verify current password.");
        return;
      }

      setSuccess("Your admin password has been updated successfully! Redirecting to Dashboard...");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to main Admin Dashboard and refresh server session
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Change password error:", err);
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
      {/* 1. Page Header */}
      <AdminPageHeader
        title={isInitialSetup ? "Initial Admin Password Setup" : "Change Admin Password"}
        description={
          isInitialSetup
            ? "Your account was bootstrapped with a temporary initial password. For salon security, please set your personal permanent password to unlock all operations."
            : "Update your administrator credentials to maintain operational security."
        }
        breadcrumbs={[
          { label: "Settings", href: "/admin/settings" },
          { label: "Change Password" },
        ]}
      />

      {/* Security Banner if initial setup */}
      {isInitialSetup && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 shadow-xs flex items-start gap-3 text-xs sm:text-sm text-amber-900">
          <AlertCircleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">Security Requirement</p>
            <p className="mt-1 leading-relaxed text-amber-800">
              You are currently authenticated with an initial bootstrap password. Access to Service Management, Customer Lists, and Settings will be automatically unlocked once you establish a strong custom password below.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 shadow-xs">
          <CheckIcon className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-2.5 shadow-xs">
          <AlertCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Password Form Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Current / Temporary Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 pr-11 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showCurrent ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars, uppercase, lowercase, number"
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 pr-11 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showNew ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 pr-11 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password Policy Hints */}
          <div className="rounded-xl border border-stone-100 bg-[#FAF7F2]/60 p-4 space-y-1.5 text-[11px] sm:text-xs text-stone-500">
            <p className="font-semibold text-stone-700">Password Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 text-stone-600">
              <li>Minimum 8 characters in length</li>
              <li>Contains at least one uppercase letter (A-Z)</li>
              <li>Contains at least one lowercase letter (a-z)</li>
              <li>Contains at least one numerical digit (0-9)</li>
              <li>Cannot match your current password</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-stone-900 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors border border-[#B7925A]/30 shadow-xs flex items-center justify-center gap-2"
          >
            <ShieldCheckIcon className="h-4 w-4 text-[#C5A46D]" />
            <span>{loading ? "Updating Password..." : "Update Password & Unlock Portal"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
