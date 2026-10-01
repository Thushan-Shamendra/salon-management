"use client";

import React, { useState, FormEvent } from "react";
import { CheckIcon } from "@/components/ui/icons";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate inquiry dispatch
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center animate-fadeIn">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-3">
          <CheckIcon className="h-6 w-6" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-stone-900">
          Message Received!
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
          Thank you for reaching out, <span className="font-semibold text-stone-900">{formData.name}</span>. Our concierge team will get back to you shortly via {formData.email}.
        </p>
        <button
          type="button"
          onClick={() => {
            setFormData({
              name: "",
              email: "",
              phone: "",
              subject: "General Inquiry",
              message: "",
            });
            setSubmitted(false);
          }}
          className="mt-6 rounded-xl border border-stone-300 bg-white px-5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-700">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Maya Fernando"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. maya@example.com"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-700">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+94 77 123 4567"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-700">
            Subject
          </label>
          <select
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20 bg-white"
          >
            <option value="General Inquiry">General Inquiry</option>
            <option value="Bridal Packages">Bridal & Event Consultation</option>
            <option value="Hair Treatments">Hair Coloring & Treatments</option>
            <option value="Skin & Aesthetics">Aesthetic Skin Therapy</option>
            <option value="Feedback">Feedback</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-700">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="How can our salon concierges help you?"
          className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#B7925A] focus:ring-2 focus:ring-[#B7925A]/20"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto rounded-xl bg-stone-900 px-8 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors border border-[#B7925A]/30"
      >
        {submitting ? "Sending..." : "Submit Inquiry"}
      </button>
    </form>
  );
}
