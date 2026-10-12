"use client";

import { FormEvent, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeOffIcon, LockIcon, CheckCircleIcon, ChevronLeftIcon } from "@/components/ui/icons";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryEmail = searchParams.get("email") || "";
  const queryToken = searchParams.get("token") || "";

  const [email] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return queryEmail || sessionStorage.getItem("salvora_reset_email") || "";
    }
    return queryEmail;
  });

  const [resetToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return queryToken || sessionStorage.getItem("salvora_reset_token") || "";
    }
    return queryToken;
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(() => {
    const hasInitialToken =
      queryToken ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("salvora_reset_token")
        : null);
    if (!hasInitialToken) {
      return "No verified reset authorization found. Please request a new verification code.";
    }
    return "";
  });
  const [successMessage, setSuccessMessage] = useState("");

  // Validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && isMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError("Missing authorization token. Please verify your OTP again.");
      return;
    }

    if (!isFormValid) {
      setError("Please ensure your password meets all required criteria.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to update password. Please try again.");
        return;
      }

      setSuccessMessage("Password updated successfully. Redirecting to login...");

      // Clear session token
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("salvora_reset_token");
        sessionStorage.removeItem("salvora_reset_email");
      }

      setTimeout(() => {
        router.push("/admin/login");
      }, 1500);
    } catch {
      setError("Network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-stone-200/90">
      <div className="flex flex-col items-center text-center">
        {/* SALVORA Branding */}
        <div className="relative h-10 w-36 mb-2">
          <Image
            src="/images/salvora-logo-light.png"
            alt="SALVORA Salon"
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#7C3AED] font-bold">
          SECURITY PORTAL
        </span>
        <h1 className="text-2xl font-extrabold text-stone-900 mt-3 tracking-tight">
          Set New Password
        </h1>
        <p className="mt-1.5 text-stone-500 text-xs sm:text-sm max-w-xs leading-relaxed">
          Create a new strong password for your administrator account.
        </p>
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* New Password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-700">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 pr-11 text-sm text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 focus:outline-none transition-colors cursor-pointer"
            >
              {showNewPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-700">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 pr-11 text-sm text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 focus:outline-none transition-colors cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Password Strength Checklist */}
        <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200/80 space-y-1.5 text-xs text-stone-600">
          <p className="font-semibold text-stone-700 mb-1">Password Requirements:</p>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                hasMinLength ? "bg-emerald-500" : "bg-stone-300"
              }`}
            />
            <span className={hasMinLength ? "text-emerald-700 font-medium" : ""}>
              Minimum 8 characters
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                hasUpper ? "bg-emerald-500" : "bg-stone-300"
              }`}
            />
            <span className={hasUpper ? "text-emerald-700 font-medium" : ""}>
              At least one uppercase letter (A-Z)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                hasLower ? "bg-emerald-500" : "bg-stone-300"
              }`}
            />
            <span className={hasLower ? "text-emerald-700 font-medium" : ""}>
              At least one lowercase letter (a-z)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                hasNumber ? "bg-emerald-500" : "bg-stone-300"
              }`}
            />
            <span className={hasNumber ? "text-emerald-700 font-medium" : ""}>
              At least one number (0-9)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isMatch ? "bg-emerald-500" : "bg-stone-300"
              }`}
            />
            <span className={isMatch ? "text-emerald-700 font-medium" : ""}>
              Passwords match
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid || !resetToken || Boolean(successMessage)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-all shadow-md shadow-purple-600/20 active:scale-[0.99] cursor-pointer mt-2"
        >
          <LockIcon className="h-4 w-4 text-purple-200" />
          <span>{loading ? "Updating Password..." : "Reset Password"}</span>
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-center">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#7C3AED] transition-colors"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          <span>Back to Login</span>
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center text-stone-500 text-sm">
            Loading...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
