"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import {
  UserIcon,
  SearchIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
} from "@/components/ui/icons";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCustomers(data.customers || []);
      } else {
        setError(data.message || "Failed to load customers");
      }
    } catch (err) {
      console.error("Fetch customers error:", err);
      setError("Network error loading customer records");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const toggleCustomerStatus = async (customer: Customer) => {
    if (updatingId) return;
    setUpdatingId(customer.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !customer.isActive }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customer.id ? { ...c, isActive: !customer.isActive } : c
          )
        );
        setFeedback(
          `${customer.name}'s account has been ${!customer.isActive ? "enabled" : "disabled"}`
        );
      } else {
        setFeedback(data.message || "Failed to update account status");
      }
    } catch (err) {
      console.error("Update customer error:", err);
      setFeedback("Failed to update customer status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Customer Management"
        description="Inspect registered salon clients, verify account statuses, and moderate customer permissions."
        breadcrumbs={[{ label: "Customers" }]}
      />

      {feedback && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-xs sm:text-sm text-stone-800 shadow-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 2. Search & Filter Controls */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {["all", "active", "disabled"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-stone-900 text-white font-semibold"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Customer Records Table / List */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm text-stone-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[#B7925A] mb-3" />
            <p>Loading customer accounts from database...</p>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={UserIcon}
            title="No customers found"
            description={
              search || statusFilter !== "all"
                ? "No customer accounts match your current search and filter criteria."
                : "No registered customers in the database yet."
            }
            actionText={search || statusFilter !== "all" ? "Reset Filters" : undefined}
            onAction={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF7F2] text-stone-600 font-semibold border-b border-stone-200/80">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Member Since</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customers.map((customer) => {
                  const initials = customer.name
                    ? customer.name
                        .trim()
                        .split(/\s+/)
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "CU";

                  const joinDate = customer.createdAt
                    ? new Date(customer.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAF7F2] font-serif text-xs font-bold text-stone-900 border border-[#B7925A]/30">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-stone-400 capitalize">
                              {customer.role}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-stone-700">
                          <MailIcon className="h-3.5 w-3.5 text-stone-400" />
                          <span className="truncate max-w-[200px]">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-stone-500 text-xs">
                            <PhoneIcon className="h-3.5 w-3.5 text-stone-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={customer.isActive ? "active" : "disabled"}
                        />
                      </td>

                      {/* Member Since */}
                      <td className="px-6 py-4 text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5 text-stone-400" />
                          <span>{joinDate}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCustomerStatus(customer)}
                            disabled={updatingId === customer.id}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                              customer.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            } disabled:opacity-50`}
                          >
                            {updatingId === customer.id
                              ? "Updating..."
                              : customer.isActive
                              ? "Disable"
                              : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
