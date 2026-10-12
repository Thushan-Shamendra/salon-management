"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheckIcon, ChevronLeftIcon } from "@/components/ui/icons";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Handle single digit typing & auto-advance
  const handleDigitChange = (index: number, val: string) => {
    setError("");
    const cleaned = val.replace(/\D/g, "");

    // If pasted multiple digits
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleaned[i] || "";
      }
      setDigits(newDigits);
      const nextIndex = Math.min(cleaned.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpValue = digits.join("");

  // Submit OTP Verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpValue,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid or expired verification code.");
        return;
      }

      setSuccessMessage("Code verified! Redirecting to reset password...");

      // Store reset token securely in sessionStorage for the reset page
      if (typeof window !== "undefined" && data.resetToken) {
        sessionStorage.setItem("salvora_reset_token", data.resetToken);
        sessionStorage.setItem("salvora_reset_email", email.trim().toLowerCase());
      }

      setTimeout(() => {
        router.push(
          `/admin/reset-password?email=${encodeURIComponent(
            email.trim().toLowerCase()
          )}&token=${encodeURIComponent(data.resetToken || "")}`
        );
      }, 800);
    } catch {
      setError("Network error occurred during verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setError("");
    setResending(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to resend code.");
        return;
      }

      setSuccessMessage(
        data.message ||
          "If an administrator account exists for this email, a verification code will be sent shortly."
      );
      setCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend verification code. Please check your connection.");
    } finally {
      setResending(false);
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
          SECURITY VERIFICATION
        </span>
        <h1 className="text-2xl font-extrabold text-stone-900 mt-3 tracking-tight">
          Verify Your Email
        </h1>
        <p className="mt-1.5 text-stone-500 text-xs sm:text-sm max-w-xs leading-relaxed">
          Enter the 6-digit verification code sent to{" "}
          <span className="font-semibold text-stone-800 break-all">{email || "your email"}</span>.
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

      <form onSubmit={handleVerify} className="mt-6 space-y-6">
        {/* 6 Digit Input Boxes */}
        <div className="flex justify-center items-center gap-2 sm:gap-2.5">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-stone-300 text-center text-xl sm:text-2xl font-bold text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 focus:scale-105"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otpValue.length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-all shadow-md shadow-purple-600/20 active:scale-[0.99] cursor-pointer"
        >
          <ShieldCheckIcon className="h-4 w-4" />
          <span>{loading ? "Verifying..." : "Verify Code"}</span>
        </button>
      </form>

      {/* Resend Section */}
      <div className="mt-6 text-center text-xs text-stone-500">
        <p>Didn&apos;t receive the code?</p>
        {cooldown > 0 ? (
          <p className="mt-1 font-medium text-stone-400">
            Resend available in <span className="text-[#7C3AED] font-semibold">{cooldown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="mt-1 font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:underline cursor-pointer"
          >
            {resending ? "Dispatching..." : "Resend Code"}
          </button>
        )}
      </div>

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

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center text-stone-500 text-sm">
            Loading...
          </div>
        }
      >
        <VerifyOtpForm />
      </Suspense>
    </main>
  );
}
