import React from "react";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";
import {
  ScissorsIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";

export default async function Footer() {
  const currentYear = new Date().getFullYear();

  let salonName = "LUMINA";
  let logo = "";

  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();
    if (settings) {
      if (settings.salonName) salonName = settings.salonName;
      if (settings.logo) logo = settings.logo;
    }
  } catch {
    // Graceful fallback
  }

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Gallery", href: "/gallery" },
    { name: "Community Hub", href: "/community" },
    { name: "Reviews", href: "/reviews" },
    { name: "Contact", href: "/contact" },
    { name: "Book Appointment", href: "/appointments" },
  ];

  const serviceLinks = [
    { name: "Hair Cut & Styling", href: "/services" },
    { name: "Balayage & Hair Coloring", href: "/services" },
    { name: "Rejuvenating Facials", href: "/services" },
    { name: "Bridal Makeup & Styling", href: "/services" },
    { name: "Luxury Manicure & Pedicure", href: "/services" },
    { name: "Keratin & Hair Spa", href: "/services" },
  ];

  return (
    <footer className="bg-[#1C1917] text-stone-300 border-t border-[#B7925A]/20">
      {/* Top Banner / Newsletter or Accent */}
      <div className="border-b border-stone-800/80 bg-stone-900/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#C5A46D]">
                Elevate Your Everyday Glow
              </p>
              <h3 className="text-xl font-serif text-white mt-1">
                Experience Luxury Hair & Beauty Care in Colombo
              </h3>
            </div>
            <Link
              href="/appointments"
              className="inline-flex items-center justify-center rounded-full bg-[#B7925A] px-6 py-2.5 text-sm font-medium text-stone-950 transition-all hover:bg-[#C5A46D] hover:shadow-lg hover:shadow-[#B7925A]/20 shrink-0"
            >
              Book Your Visit
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              {logo ? (
                <div className="relative h-10 max-w-[140px] flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo}
                    alt={salonName}
                    className="max-h-10 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-[#C5A46D] border border-[#B7925A]/40 group-hover:scale-105 transition-transform">
                  <ScissorsIcon className="h-5 w-5" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-wider text-white">
                  {salonName.toUpperCase()}
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A46D] font-medium -mt-1">
                  Luxury Salon
                </span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-stone-400">
              A serene luxury sanctuary in Colombo dedicated to tailored hair styling,
              rejuvenating skin therapies, and artisanal beauty rituals.
            </p>

            {/* Social Media Links */}
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                Follow Our Artistry
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Lumina Salon on Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800/80 text-stone-300 hover:bg-[#B7925A] hover:text-stone-950 transition-colors"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Lumina Salon on Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800/80 text-stone-300 hover:bg-[#B7925A] hover:text-stone-950 transition-colors"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Lumina Salon on TikTok"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800/80 text-stone-300 hover:bg-[#B7925A] hover:text-stone-950 transition-colors"
                >
                  <TikTokIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with Lumina Salon on WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800/80 text-stone-300 hover:bg-[#B7925A] hover:text-stone-950 transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C5A46D] mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-stone-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-[#B7925A] text-xs">›</span>
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Signature Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C5A46D] mb-4">
              Salon Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              {serviceLinks.map((service, idx) => (
                <li key={idx}>
                  <Link
                    href={service.href}
                    className="text-stone-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-[#B7925A] text-xs">›</span>
                    <span>{service.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Hours */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C5A46D] mb-4">
              Visit & Contact
            </h4>
            <div className="space-y-3 text-sm text-stone-400">
              <div className="flex items-start gap-2.5">
                <MapPinIcon className="h-5 w-5 text-[#C5A46D] shrink-0 mt-0.5" />
                <span>124 Flower Road, Colombo 07, Sri Lanka</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PhoneIcon className="h-4 w-4 text-[#C5A46D] shrink-0" />
                <a href="tel:+94112345678" className="hover:text-white transition-colors">
                  +94 11 234 5678
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <WhatsAppIcon className="h-4 w-4 text-[#C5A46D] shrink-0" />
                <a
                  href="https://wa.me/94771234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  +94 77 123 4567 (WhatsApp)
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MailIcon className="h-4 w-4 text-[#C5A46D] shrink-0" />
                <a href="mailto:hello@luminasalon.lk" className="hover:text-white transition-colors">
                  hello@luminasalon.lk
                </a>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <ClockIcon className="h-4 w-4 text-[#C5A46D] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="text-stone-300 font-medium">Mon - Sat: 9:00 AM - 7:00 PM</p>
                  <p>Sun: 10:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {currentYear} {salonName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-stone-300 transition-colors">
              About
            </Link>
            <Link href="/services" className="hover:text-stone-300 transition-colors">
              Services
            </Link>
            <Link href="/gallery" className="hover:text-stone-300 transition-colors">
              Gallery
            </Link>
            <Link href="/contact" className="hover:text-stone-300 transition-colors">
              Contact
            </Link>
            <span className="text-stone-700">•</span>
            <span className="text-stone-500">Crafted with care</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
