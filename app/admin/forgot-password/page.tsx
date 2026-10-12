"use client";

import { FormEvent, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailIcon, ArrowRightIcon, ChevronLeftIcon } from "@/components/ui/icons";

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 200) {
        setError(data.message || "Failed to process request. Please try again.");
        return;
      }

      setSuccessMessage(
        data.message ||
          "If an administrator account exists for this email, a verification code will be sent shortly."
      );

      // Navigate to OTP verification screen after brief toast
      setTimeout(() => {
        router.push(`/admin/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }, 1200);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
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
            src="/images/invora-logo-dark-trimmed.png"
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
          Forgot Password
        </h1>
        <p className="mt-1.5 text-stone-500 text-xs sm:text-sm max-w-xs leading-relaxed">
          Enter your administrator email address and we&apos;ll send you a 6-digit verification code.
        </p>
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-700 border border-emerald-200">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-700">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@salvora.lk"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 pl-10 text-sm text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
            <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || Boolean(successMessage)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-all shadow-md shadow-purple-600/20 active:scale-[0.99] cursor-pointer mt-2"
        >
          <span>{loading ? "Sending Code..." : "Send Reset Code"}</span>
          <ArrowRightIcon className="h-4 w-4" />
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

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center text-stone-500 text-sm">
            Loading...
          </div>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
