"use client";

import React, { useState, FormEvent } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";

interface ContactFormAndMapProps {
  salonName?: string;
  address?: string;
  email?: string;
  phone?: string;
  businessUrl?: string;
}

export default function ContactFormAndMap({
  salonName = "Invora Salon",
  address = "",
  email = "info@invora.lk",
  businessUrl = "",
}: ContactFormAndMapProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!formData.subject.trim()) {
      setError("Please select a subject for your inquiry.");
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setError("Please provide a message of at least 10 characters.");
      return;
    }

    setSubmitting(true);

    try {
      // Direct email dispatch to verified salon concierge email
      const emailSubject = `[Invora Inquiry] ${formData.subject}: ${formData.name}`;
      const emailBody = `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${
        formData.phone || "Not provided"
      }\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}\n`;

      const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailBody)}`;

      // Trigger visitor's email client
      window.location.href = mailtoLink;
      setDispatched(true);
    } catch {
      setError("Unable to launch email client. Please email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasAddress = Boolean(address && address.trim());
  const isEmbedBusinessUrl = Boolean(businessUrl && businessUrl.includes("/maps/embed"));
  const mapDirectionsUrl =
    businessUrl && !isEmbedBusinessUrl
      ? businessUrl
      : hasAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : "";

  const mapEmbedUrl = isEmbedBusinessUrl
    ? businessUrl
    : `https://maps.google.com/maps?q=${encodeURIComponent(
        address
      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-b border-stone-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={
            hasAddress
              ? "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch"
              : "mx-auto max-w-2xl"
          }
        >
          {/* ========================================================== */}
          {/* LEFT COLUMN: CONTACT FORM (MATCHES MOCKUP)                 */}
          {/* ========================================================== */}
          <div
            className={
              hasAddress
                ? "lg:col-span-6 flex flex-col justify-between"
                : "flex flex-col"
            }
          >
            <div>
              {/* Label */}
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                  SEND US A MESSAGE
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
                We&apos;d Love to Hear From You
              </h2>

              {/* Description */}
              <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
                Have a question or need more information? Complete the details below
                to compose and send your inquiry directly via your email client.
              </p>

              {/* Email App Opened Notification */}
              {dispatched && (
                <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/70 p-5 text-stone-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] shrink-0 mt-0.5">
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    <div className="text-xs sm:text-sm">
                      <p className="font-bold text-stone-900">
                        Email Client Opened
                      </p>
                      <p className="mt-1 text-stone-600">
                        Your device&apos;s email application has been opened with your inquiry pre-filled to{" "}
                        <span className="font-semibold text-stone-900">{email}</span>. Please review and send the email from your application.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDispatched(false);
                          setFormData({
                            name: "",
                            email: "",
                            phone: "",
                            subject: "",
                            message: "",
                          });
                        }}
                        className="mt-3 text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                      >
                        Reset Form
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* The Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Your phone number (optional)"
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                {/* Subject Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    <option value="">Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Hair Styling & Treatments">Hair Styling & Treatments</option>
                    <option value="Facial & Skin Care">Facial & Skin Care</option>
                    <option value="Bridal Consultation">Bridal Consultation</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Type your message here..."
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 resize-y"
                  />
                </div>

                {/* Send Button & Helper Text */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-8 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/30 transition-all hover:bg-[#6D28D9] hover:gap-3 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    <span>{submitting ? "Opening Email..." : "Send via Email"}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                  <p className="mt-2.5 text-xs text-stone-500 leading-relaxed">
                    Note: Clicking &quot;Send via Email&quot; will open your default email application (such as Apple Mail, Outlook, or Gmail) with your message pre-filled to send directly to our team.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: GOOGLE MAP (ONLY RENDERED IF ADDRESS EXISTS) */}
          {/* ========================================================== */}
          {hasAddress && (
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden border border-stone-200/90 shadow-md bg-stone-100 flex flex-col">
                {/* Responsive Iframe Embed Centered on Salon Address */}
                <iframe
                  key={mapEmbedUrl}
                  title={`${salonName || "Invora Salon"} Location Map`}
                  src={mapEmbedUrl}
                  className="w-full h-full flex-1 border-0 min-h-[380px]"
                  loading="lazy"
                  allowFullScreen
                />

                {/* Floating Map Footer with Location Pin & Directions */}
                <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <MapPinIcon className="h-5 w-5 text-[#7C3AED] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                        {salonName || "Invora Salon"}
                      </h4>
                      <p className="text-xs text-stone-500 line-clamp-1">{address}</p>
                    </div>
                  </div>

                  <a
                    href={mapDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all shrink-0"
                  >
                    <span>Get Directions</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
