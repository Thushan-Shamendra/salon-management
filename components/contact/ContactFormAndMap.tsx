"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";


import React, { useState, FormEvent } from "react";
import Image from "next/image";
import {
  ArrowRightIcon,
  CheckIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/ui/icons";

interface ContactFormAndMapProps {
  salonName?: string;
  address?: string;
  email?: string;
  phone?: string;
  businessUrl?: string;
}

export default function ContactFormAndMap({
  salonName = "SALVORA Salon",
  email = "info@salvora.lk",
}: ContactFormAndMapProps) {
  const custom = useSectionCustomization("message");

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
      const emailSubject = `[SALVORA Inquiry] ${formData.subject}: ${formData.name}`;
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

  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20 border-b border-stone-100" data-customization-section="message">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* ========================================================== */}
          {/* LEFT COLUMN: CONTACT FORM CARD                             */}
          {/* ========================================================== */}
          <div className="md:col-span-6 flex flex-col">
            <div className="h-full rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 lg:p-9 shadow-sm flex flex-col justify-between">
              <div>
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#7C3AED]" data-customization-role="eyebrow">{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
                    SEND US A MESSAGE
                  </>}</span>
                </div>

                {/* Heading */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight" data-customization-role="heading">{custom.has("heading") ? custom.text("heading", "") : <>
                  We&apos;d Love to Hear From You
                </>}</h2>

                {/* Description */}
                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl" data-customization-role="description">{custom.has("description") ? custom.text("description", "") : <>
                  Have a question or need more information? Complete the details below
                  and we&apos;ll get back to you as soon as possible.
                </>}</p>

                {/* Success Notification */}
                {dispatched && (
                  <div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 text-stone-800">
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] shrink-0 mt-0.5">
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold text-stone-900">
                          Email Client Opened
                        </p>
                        <p className="mt-1 text-stone-600">
                          Your email application has been opened with your inquiry pre-filled to{" "}
                          <span className="font-semibold text-stone-900">{email}</span>. Please review and send the message from your application.
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
                          className="mt-2.5 text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer"
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

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {/* Row 1: Full Name & Email Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Full Name <span className="text-[#7C3AED]">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Your full name"
                          className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Email Address <span className="text-[#7C3AED]">*</span>
                      </label>
                      <div className="relative">
                        <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Phone Number & Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+94 77 123 4567"
                          className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        Subject <span className="text-[#7C3AED]">*</span>
                      </label>
                      <div className="relative">
                        <CheckCircleIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <select
                          required
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({ ...formData, subject: e.target.value })
                          }
                          className="w-full appearance-none rounded-xl border border-stone-200 bg-white pl-10 pr-9 py-2.5 text-xs sm:text-sm text-stone-900 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                        >
                          <option value="">Select a subject</option>
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Hair Styling & Treatments">
                            Hair Styling & Treatments
                          </option>
                          <option value="Facial & Skin Care">
                            Facial & Skin Care
                          </option>
                          <option value="Bridal Consultation">
                            Bridal Consultation
                          </option>
                          <option value="Feedback">Feedback</option>
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Message */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Message <span className="text-[#7C3AED]">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Type your message here..."
                      className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15 resize-y"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/25 transition-all hover:from-[#6D28D9] hover:to-[#5B21B6] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                      <span>{submitting ? "Sending..." : "Send Message"}</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: SALON INTERIOR IMAGE                         */}
          {/* ========================================================== */}
          <div className="md:col-span-6 flex flex-col">
            <div className="relative w-full h-full min-h-[300px] sm:min-h-[380px] md:min-h-full rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm bg-stone-100">
              <Image
                src="/images/contact/contact-message-salon.webp"
                alt={`${salonName} Modern Salon Interior`}
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
