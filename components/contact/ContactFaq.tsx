"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PlusIcon, MinusIcon } from "@/components/ui/icons";

interface ContactFaqProps {
  address?: string;
}

export default function ContactFaq({ address = "" }: ContactFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First open by default

  const faqs = [
    {
      question: "Do I need to book an appointment?",
      answer:
        "We recommend booking in advance to ensure availability with your preferred beautician and treatment time. You can easily book online through our booking portal or contact us directly.",
    },
    {
      question: "What services do you offer?",
      answer:
        "Invora provides a complete suite of salon treatments including hair cuts, styling, advanced hair spa treatments, coloring, facial therapies, and bridal beauty services.",
    },
    {
      question: "Where is the salon located?",
      answer: address?.trim()
        ? `Our salon is located at ${address}. You can find our exact pin location, interactive map, and Google Maps directions above.`
        : "Please reach out to our salon concierge team via phone or email for detailed location guidance.",
    },
    {
      question: "How can I contact Invora?",
      answer:
        "You can reach out to our team by phone, email, or through the message form on this page. We are always happy to answer your questions and assist with your visit.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24 border-b border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Modern Salon Interior Image (Matches Mockup) */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-stone-100 shadow-md group">
              <Image
                src="/images/contact-faq.jpg"
                alt="Invora Salon Styling Space and Interior"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5" />
            </div>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Label */}
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
                  FREQUENTLY ASKED
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
                Quick Information
              </h2>

              {/* Subtitle */}
              <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                Here are some common questions to help you get started. If you need
                further assistance, feel free to contact us.
              </p>
            </div>

            {/* Accordion List */}
            <div className="space-y-3 pt-2">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? "border-purple-300 bg-purple-50/30 shadow-xs"
                        : "border-stone-200/90 bg-white hover:border-purple-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-4 cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-stone-900">
                        {faq.question}
                      </span>
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors shrink-0 ${
                          isOpen
                            ? "bg-[#7C3AED] text-white"
                            : "bg-purple-50 text-[#7C3AED]"
                        }`}
                      >
                        {isOpen ? (
                          <MinusIcon className="h-4 w-4" />
                        ) : (
                          <PlusIcon className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-purple-100/60 mt-1">
                        <p className="pt-2">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
