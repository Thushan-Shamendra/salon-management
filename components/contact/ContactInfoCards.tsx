import React from "react";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
} from "@/components/ui/icons";

interface OpeningHourDay {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

interface ContactInfoCardsProps {
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: OpeningHourDay[];
}

export default function ContactInfoCards({
  phone = "",
  email = "",
  address = "",
  openingHours = [],
}: ContactInfoCardsProps) {
  // Format opening hours summary from real database settings
  const formatOpeningHoursSummary = () => {
    if (!openingHours || openingHours.length === 0) return "";
    const monFri = openingHours.find(
      (h) => h.day.toLowerCase() === "monday" || h.day.toLowerCase() === "tuesday"
    );
    const sun = openingHours.find((h) => h.day.toLowerCase() === "sunday");

    if (monFri && !monFri.isClosed) {
      const weekdaysText = `Mon – Sat: ${formatTime(monFri.open)} – ${formatTime(monFri.close)}`;
      const sunText =
        sun && !sun.isClosed
          ? `Sunday: ${formatTime(sun.open)} – ${formatTime(sun.close)}`
          : "Sunday: Closed";
      return `${weekdaysText}\n${sunText}`;
    }

    return "Mon – Sat: 9:00 AM – 8:00 PM\nSunday: 10:00 AM – 4:00 PM";
  };

  const hoursSummary = formatOpeningHoursSummary();

  const cards = [
    phone && {
      key: "phone",
      icon: PhoneIcon,
      title: "Phone",
      value: phone,
      href: `tel:${phone.replace(/\s+/g, "")}`,
      subtitle: "Call us for quick assistance",
    },
    email && {
      key: "email",
      icon: MailIcon,
      title: "Email",
      value: email,
      href: `mailto:${email}`,
      subtitle: "We'll respond as soon as possible",
    },
    address && {
      key: "location",
      icon: MapPinIcon,
      title: "Our Location",
      value: address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      target: "_blank",
      subtitle: "Visit our salon",
    },
    hoursSummary && {
      key: "hours",
      icon: ClockIcon,
      title: "Opening Hours",
      value: hoursSummary,
      subtitle: "We're here for you",
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
    href?: string;
    target?: string;
    subtitle: string;
  }>;

  if (cards.length === 0) return null;

  return (
    <section className="bg-white pt-16 pb-12 sm:pt-20 sm:pb-16 border-b border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7C3AED]">
              GET IN TOUCH
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Contact Information
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
            Reach out to us through any of the following channels. We&apos;re always
            happy to assist you.
          </p>
        </div>

        {/* 4 Cards Responsive Grid */}
        <div
          className={`grid gap-6 ${
            cards.length === 1
              ? "max-w-md mx-auto grid-cols-1"
              : cards.length === 2
              ? "max-w-3xl mx-auto grid-cols-1 sm:grid-cols-2"
              : cards.length === 3
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 min-h-[220px] shadow-xs transition-all duration-300 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  {/* Icon Badge */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] shadow-2xs mb-5 transition-colors duration-300 group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED]">
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-[#7C3AED] transition-colors">
                    {card.title}
                  </h3>

                  {/* Value */}
                  <div className="mt-2 text-sm font-semibold text-stone-800 leading-relaxed break-words">
                    {card.href ? (
                      <a
                        href={card.href}
                        target={card.target}
                        rel={card.target ? "noopener noreferrer" : undefined}
                        className="hover:text-[#7C3AED] transition-colors whitespace-pre-line"
                      >
                        {card.value}
                      </a>
                    ) : (
                      <p className="whitespace-pre-line">{card.value}</p>
                    )}
                  </div>
                </div>

                {/* Subtitle / Helper */}
                <p className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
                  {card.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatTime(t: string): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}
