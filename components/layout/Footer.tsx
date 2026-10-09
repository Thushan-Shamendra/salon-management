import React from "react";
import Link from "next/link";
import InvoraLogo from "@/components/ui/InvoraLogo";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YoutubeIcon,
} from "@/components/ui/icons";

export default async function Footer() {
  const currentYear = new Date().getFullYear();

  let address = "123 Beauty Street, Colombo 07, Sri Lanka";
  let phone = "+94 76 123 4567";
  let email = "info@invora.lk";

  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();
    if (settings) {
      if (settings.address) address = settings.address;
      if (settings.phone) phone = settings.phone;
      if (settings.email) email = settings.email;
    }
  } catch {
    // Graceful fallback
  }

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Wedding", href: "/wedding" },
    { name: "Gallery", href: "/gallery" },
    { name: "Reviews", href: "/reviews" },
    { name: "Contact", href: "/contact" },
  ];

  const serviceLinks = [
    { name: "Hair Styling", href: "/services" },
    { name: "Hair Coloring", href: "/services" },
    { name: "Facial Treatment", href: "/services" },
    { name: "Bridal Makeup", href: "/services" },
    { name: "Nail Care", href: "/services" },
  ];

  return (
    <footer className="bg-[#0A0812] text-stone-300 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="inline-block" aria-label="Invora Home">
              <InvoraLogo theme="dark" className="h-10 sm:h-11 w-auto" />
            </Link>

            <p className="text-xs leading-relaxed text-stone-400">
              Professional beauty care, modern treatments, and a relaxing salon
              environment at Invora.
            </p>

            {/* Social Media Links in Purple Badges */}
            <div className="pt-2 flex items-center gap-2.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Invora Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 text-[#C4B5FD] hover:bg-[#7C3AED] hover:text-white transition-colors"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Invora Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 text-[#C4B5FD] hover:bg-[#7C3AED] hover:text-white transition-colors"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Invora TikTok"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 text-[#C4B5FD] hover:bg-[#7C3AED] hover:text-white transition-colors"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Invora YouTube"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 text-[#C4B5FD] hover:bg-[#7C3AED] hover:text-white transition-colors"
              >
                <YoutubeIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-stone-400 hover:text-[#C4B5FD] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Our Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Our Services
            </h4>
            <ul className="space-y-2 text-xs">
              {serviceLinks.map((service) => (
                <li key={service.name}>
                  <Link
                    href={service.href}
                    className="text-stone-400 hover:text-[#C4B5FD] transition-colors"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="text-[#A78BFA] hover:text-white transition-colors font-medium"
                >
                  View All →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Contact
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <MapPinIcon className="h-4 w-4 text-[#A78BFA] shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-[#A78BFA] shrink-0" />
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="hover:text-white transition-colors"
                >
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-[#A78BFA] shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-white transition-colors truncate"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>

          {/* Col 5: Opening Hours */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Opening Hours
            </h4>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <ClockIcon className="h-4 w-4 text-[#A78BFA] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Mon – Sat</p>
                  <p>10:00 AM – 8:00 PM</p>
                </div>
              </div>
              <div className="pt-1">
                <p className="text-white font-medium">Sunday</p>
                <p>10:00 AM – 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {currentYear} Invora. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-stone-400 transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-stone-400 transition-colors cursor-pointer">
              Terms & Conditions
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
