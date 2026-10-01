"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "@/components/ui/icons";

interface LogoutButtonProps {
  className?: string;
  variant?: "sidebar" | "button";
}

export default function LogoutButton({
  className = "",
  variant = "sidebar",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        router.push("/login");
        router.refresh();
      } else {
        // Fallback redirect even if response code was unexpected
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ${className}`}
      >
        <LogOutIcon className="h-4 w-4" />
        <span>{loading ? "Logging out..." : "Log Out"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 ${className}`}
    >
      <LogOutIcon className="h-4 w-4 text-stone-500 group-hover:text-red-600" />
      <span>{loading ? "Logging out..." : "Log Out"}</span>
    </button>
  );
}
