"use client";

import { FormEvent, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/ui/icons";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");

  const getSafeRedirect = (url: string | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (
      trimmed.startsWith("/admin") &&
      !trimmed.startsWith("//") &&
      !trimmed.includes("://")
    ) {
      return trimmed;
    }
    return null;
  };

  const safeRedirect = getSafeRedirect(rawRedirect);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Admin login failed");
        return;
      }

      if (data.user.role !== "admin") {
        setError("Access denied. Admin portal is restricted to administrators.");
        return;
      }

      if (data.user.mustChangePassword) {
        router.push("/admin/change-password");
      } else {
        router.push(safeRedirect || "/admin");
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-stone-200/90">
      <div className="flex flex-col items-center text-center">
        {/* INVORA Branding */}
        <div className="relative h-10 w-36 mb-2">
          <Image
            src="/images/invora-logo-dark-trimmed.png"
            alt="INVORA Salon"
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#7C3AED] font-bold">
          WEBSITE ADMIN PORTAL
        </span>
        <h1 className="text-2xl font-extrabold text-stone-900 mt-3 tracking-tight">
          Admin Sign In
        </h1>
        <p className="mt-1.5 text-stone-500 text-xs sm:text-sm max-w-xs">
          Sign in to manage your salon website content, services, and gallery.
        </p>
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-700">
            Admin Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@invora.lk"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-stone-700">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 pr-11 text-sm text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 focus:outline-none transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-all shadow-md shadow-purple-600/20 active:scale-[0.99] cursor-pointer mt-2"
        >
          <LockIcon className="h-4 w-4 text-purple-200" />
          <span>{loading ? "Authenticating..." : "Sign In to Admin Portal"}</span>
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center text-stone-500 text-sm">
            Loading...
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
