import FooterBackground from "@/components/layout/FooterBackground";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import SalvoraLogo from "@/components/ui/SalvoraLogo";
import { connectDB } from "@/lib/mongodb";
import SalonSettings, { normalizePageVisibility } from "@/models/SalonSettings";
import Branch from "@/models/Branch";
import Service from "@/models/Service";
import WeddingService from "@/models/WeddingService";
import WeddingPackage from "@/models/WeddingPackage";
import RetailProduct from "@/models/RetailProduct";
import {
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

function formatTime(t?: string): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export function summarizeBranchHours(
  hours?: Array<{ day: string; isClosed: boolean; openTime?: string; closeTime?: string }>
): Array<{ label: string; time: string }> | null {
  if (!Array.isArray(hours) || hours.length === 0) return null;

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const sorted = [...hours].sort((a, b) => {
    const idxA = dayOrder.indexOf(a.day);
    const idxB = dayOrder.indexOf(b.day);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return 0;
  });

  const formattedDays = sorted.map((h) => {
    const time = h.isClosed
      ? "Closed"
      : h.openTime && h.closeTime
      ? `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}`
      : "Open";
    return { day: h.day, time };
  });

  const groups: Array<{ startDay: string; endDay: string; count: number; time: string }> = [];
  for (const item of formattedDays) {
    const last = groups[groups.length - 1];
    if (last && last.time === item.time) {
      last.endDay = item.day;
      last.count += 1;
    } else {
      groups.push({ startDay: item.day, endDay: item.day, count: 1, time: item.time });
    }
  }

  if (groups.length <= 4) {
    return groups.map((g) => {
      let label = "";
      if (g.count === 1) {
        label = g.startDay === "Sunday" ? "Sunday" : g.startDay.slice(0, 3);
      } else {
        label = `${g.startDay.slice(0, 3)} – ${g.endDay.slice(0, 3)}`;
      }
      return { label, time: g.time };
    });
  }

  return groups.slice(0, 3).map((g) => {
    let label = "";
    if (g.count === 1) {
      label = g.startDay === "Sunday" ? "Sunday" : g.startDay.slice(0, 3);
    } else {
      label = `${g.startDay.slice(0, 3)} – ${g.endDay.slice(0, 3)}`;
    }
    return { label, time: g.time };
  });
}

export default async function Footer() {
  const currentYear = new Date().getFullYear();

  let salonName = "SALVORA";
  let instagramUrl = "https://instagram.com";
  let facebookUrl = "https://facebook.com";
  let tiktokUrl = "https://tiktok.com";
  const youtubeUrl = "https://youtube.com";

  let serviceLinks: Array<{ name: string; href: string }> = [];
  let weddingItems: Array<{ name: string; href: string }> = [];
  let productLinks: Array<{ name: string; href: string }> = [];
  let branches: Array<{
    _id: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    isMain?: boolean;
    openingHours?: Array<{
      day: string;
      isClosed: boolean;
      openTime?: string;
      closeTime?: string;
    }>;
  }> = [];

  let footerLogo = "";
  let pageVisibility = normalizePageVisibility(null);

  try {
    await connectDB();
    const [
      settings,
      branchDocs,
      serviceDocs,
      weddingServiceDocs,
      weddingPackageDocs,
      productDocs,
    ] = await Promise.all([
      SalonSettings.findOne()
        .select("salonName logo footerLogo socialMedia pageVisibility")
        .lean(),
      Branch.find({ isActive: true })
        .sort({ isMain: -1, displayOrder: 1, name: 1 })
        .limit(2)
        .select("name address phone email isMain openingHours")
        .lean(),
      Service.find({ isActive: { $ne: false } })
        .sort({ displayOrder: 1, createdAt: -1 })
        .limit(6)
        .select("name")
        .lean(),
      WeddingService.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .limit(6)
        .select("name")
        .lean(),
      WeddingPackage.find({ isActive: true })
        .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
        .limit(6)
        .select("name")
        .lean(),
      RetailProduct.find({ isActive: true })
        .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
        .limit(6)
        .select("name")
        .lean(),
    ]);

    if (settings) {
      if (settings.salonName) salonName = settings.salonName;
      if (settings.footerLogo || settings.logo) {
        footerLogo = settings.footerLogo || settings.logo;
      }
      pageVisibility = normalizePageVisibility(settings.pageVisibility);
      if (settings.socialMedia) {
        const isLegacyBrand = (val?: string) =>
          Boolean(val && val.toLowerCase().includes(String.fromCharCode(108, 117, 109, 105, 110, 97)));

        if (settings.socialMedia.instagram && !isLegacyBrand(settings.socialMedia.instagram)) {
          instagramUrl = settings.socialMedia.instagram;
        }
        if (settings.socialMedia.facebook && !isLegacyBrand(settings.socialMedia.facebook)) {
          facebookUrl = settings.socialMedia.facebook;
        }
        if (settings.socialMedia.tiktok && !isLegacyBrand(settings.socialMedia.tiktok)) {
          tiktokUrl = settings.socialMedia.tiktok;
        }
      }
    }

    // 1. Services (up to 6 active, keeping "View Services" within range of "View All Branches")
    if (Array.isArray(serviceDocs)) {
      serviceLinks = serviceDocs.slice(0, 6).map((s) => ({
        name: s.name,
        href: "/services",
      }));
    }

    // 2. Wedding (up to 3 services + up to 3 packages, max 6 combined)
    if (pageVisibility.wedding) {
      const combinedWedding: Array<{ name: string; href: string }> = [
        ...(Array.isArray(weddingServiceDocs) ? weddingServiceDocs.slice(0, 3) : []).map((w) => ({
          name: w.name,
          href: "/wedding",
        })),
        ...(Array.isArray(weddingPackageDocs) ? weddingPackageDocs.slice(0, 3) : []).map((p) => ({
          name: p.name,
          href: "/wedding",
        })),
      ];

      if (combinedWedding.length < 6) {
        const existingNames = new Set(combinedWedding.map((i) => i.name));
        if (Array.isArray(weddingServiceDocs)) {
          for (const w of weddingServiceDocs) {
            if (combinedWedding.length >= 6) break;
            if (!existingNames.has(w.name)) {
              combinedWedding.push({ name: w.name, href: "/wedding" });
              existingNames.add(w.name);
            }
          }
        }
        if (Array.isArray(weddingPackageDocs)) {
          for (const p of weddingPackageDocs) {
            if (combinedWedding.length >= 6) break;
            if (!existingNames.has(p.name)) {
              combinedWedding.push({ name: p.name, href: "/wedding" });
              existingNames.add(p.name);
            }
          }
        }
      }
      weddingItems = combinedWedding.slice(0, 6);
    }

    // 3. Products (up to 6 active products added on products page)
    if (pageVisibility.products && Array.isArray(productDocs) && productDocs.length > 0) {
      productLinks = productDocs.slice(0, 6).map((p) => ({
        name: p.name,
        href: "/products",
      }));
    }

    // 4. Branches (only ONE branch displayed: priority to active Main branch, else first active branch)
    if (Array.isArray(branchDocs) && branchDocs.length > 0) {
      const selectedBranch = branchDocs.find((b) => b.isMain) || branchDocs[0];
      if (selectedBranch) {
        branches = [
          {
            _id: String(selectedBranch._id),
            name: selectedBranch.name,
            address: selectedBranch.address,
            phone: selectedBranch.phone || "",
            email: selectedBranch.email,
            isMain: Boolean(selectedBranch.isMain),
            openingHours: Array.isArray(selectedBranch.openingHours)
              ? selectedBranch.openingHours.map((h) => ({
                  day: String(h.day),
                  isClosed: Boolean(h.isClosed),
                  openTime: h.openTime || "",
                  closeTime: h.closeTime || "",
                }))
              : [],
          },
        ];
      }
    }
  } catch {
    // Graceful error handling
  }

  return (
    <footer className="relative overflow-hidden bg-black text-stone-300 border-t border-white/10" data-customization-footer="public">
      <div className="absolute inset-0 pointer-events-none z-0">
        <FooterBackground />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-5 sm:pt-10 sm:pb-6 sm:px-6 lg:pt-12 lg:pb-6 lg:px-8">
        {/* Main Grid: Responsive 12-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-5 xl:gap-6 items-start">
          {/* COLUMN 1: SALVORA Logo, Description, Social Icons, Slogan */}
          <div
            className={`space-y-2.5 sm:col-span-1 ${
              weddingItems.length > 0 && productLinks.length > 0
                ? "lg:col-span-2 xl:col-span-2"
                : "lg:col-span-3 xl:col-span-3"
            } min-w-0 self-start`}
          >
            <Link
              href="/"
              className="inline-flex items-start focus:outline-hidden"
              aria-label={`${salonName} Home`}
            >
              {footerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={footerLogo}
                  alt={salonName}
                  className="h-9 sm:h-10 lg:h-10 w-auto max-w-[200px] object-contain object-left-top"
                />
              ) : (
                <SalvoraLogo
                  theme="dark"
                  className="h-9 sm:h-10 lg:h-10 w-auto max-w-[200px] object-contain"
                />
              )}
            </Link>

            <p className="text-xs leading-relaxed text-stone-300 max-w-xs" data-customization-role="footerText">
              Professional beauty care, modern treatments, and a relaxing salon
              environment at Salvora.
            </p>

            {/* Accent divider line */}
            <div className="h-0.5 w-6 rounded-full bg-[#03BF62]" data-customization-role="footerAccent" />

            {/* Social Media Links with Real Brand Logos */}
            <div className="flex items-center gap-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora Instagram"
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/[0.12] hover:scale-105 transition-all shadow-2xs"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <defs>
                    <radialGradient id="ig-footer-grad" r="150%" cx="30%" cy="107%">
                      <stop stopColor="#fdf497" offset="0" />
                      <stop stopColor="#fdf497" offset="0.05" />
                      <stop stopColor="#fd5949" offset="0.45" />
                      <stop stopColor="#d6249f" offset="0.6" />
                      <stop stopColor="#285AEB" offset="0.9" />
                    </radialGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-footer-grad)" />
                  <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="3.2" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
                  <circle cx="16.2" cy="7.8" r="1" fill="#FFFFFF" />
                </svg>
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora Facebook"
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/[0.12] hover:scale-105 transition-all shadow-2xs"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="#1877F2" />
                  <path
                    d="M15.36 15.5l.44-2.89h-2.77v-1.88c0-.79.39-1.56 1.63-1.56h1.26V6.71s-1.14-.2-2.24-.2c-2.28 0-3.77 1.38-3.77 3.89v2.21H7.37v2.89h2.54v6.38a10.08 10.08 0 003.12 0V15.5h2.33z"
                    fill="#FFFFFF"
                  />
                </svg>
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora TikTok"
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/[0.12] hover:scale-105 transition-all shadow-2xs"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
                    fill="#FE2C55"
                    transform="translate(0.75, 0.75)"
                  />
                  <path
                    d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
                    fill="#25F4EE"
                    transform="translate(-0.75, -0.75)"
                  />
                  <path
                    d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
                    fill="#FFFFFF"
                  />
                </svg>
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora YouTube"
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/[0.12] hover:scale-105 transition-all shadow-2xs"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                    fill="#FF0000"
                  />
                  <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF" />
                </svg>
              </a>
            </div>

            {/* Slogan */}
            <div className="pt-0.5 text-[10px] tracking-[0.18em] font-semibold text-[#03BF62] uppercase leading-tight">
              <p data-customization-role="footerText">BEAUTY • CARE • CONFIDENCE</p>
              <p className="text-emerald-400/90 text-[9px] tracking-[0.22em]" data-customization-role="footerText">ALL IN ONE PLACE</p>
            </div>
          </div>

          {/* COLUMN 2: Wedding */}
          {weddingItems.length > 0 && (
            <div className="sm:col-span-1 lg:col-span-2 xl:col-span-2 min-w-0 self-start">
              <h4 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white" data-customization-role="footerHeading">
                Wedding
              </h4>
              <div className="h-0.5 w-6 rounded-full bg-[#03BF62] mt-1 mb-2.5" data-customization-role="footerAccent" />
              <ul className="space-y-1.5 text-xs sm:text-[13px]">
                {weddingItems.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="group flex items-start justify-between gap-2 text-stone-300 hover:text-white transition-colors py-0.5"
                      data-customization-role="footerLink"
                    >
                      <span
                        className="flex-1 whitespace-normal break-words leading-snug group-hover:text-white transition-colors"
                        data-customization-role="footerText"
                      >
                        {item.name}
                      </span>
                      <ChevronRightIcon className="h-3 w-3 mt-0.5 text-stone-500 group-hover:text-[#03BF62] transition-colors shrink-0" />
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/wedding"
                    className="text-[#03BF62] hover:text-white transition-colors font-semibold text-xs inline-flex items-center gap-1"
                    data-customization-role="footerLink"
                  >
                    <span data-customization-role="footerText">View Wedding</span>
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* COLUMN 3: Our Services */}
          {serviceLinks.length > 0 && (
            <div
              className={`sm:col-span-1 ${
                weddingItems.length > 0 ? "lg:col-span-2 xl:col-span-2" : "lg:col-span-3 xl:col-span-3"
              } min-w-0 self-start`}
            >
              <h4 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white" data-customization-role="footerHeading">
                Our Services
              </h4>
              <div className="h-0.5 w-6 rounded-full bg-[#03BF62] mt-1 mb-2.5" data-customization-role="footerAccent" />
              <ul className="space-y-1.5 text-xs sm:text-[13px]">
                {serviceLinks.map((service, idx) => (
                  <li key={idx}>
                    <Link
                      href={service.href}
                      className="group flex items-start justify-between gap-2 text-stone-300 hover:text-white transition-colors py-0.5"
                      data-customization-role="footerLink"
                    >
                      <span
                        className="flex-1 whitespace-normal break-words leading-snug group-hover:text-white transition-colors"
                        data-customization-role="footerText"
                      >
                        {service.name}
                      </span>
                      <ChevronRightIcon className="h-3 w-3 mt-0.5 text-stone-500 group-hover:text-[#03BF62] transition-colors shrink-0" />
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/services"
                    className="text-[#03BF62] hover:text-white transition-colors font-semibold text-xs inline-flex items-center gap-1"
                    data-customization-role="footerLink"
                  >
                    <span data-customization-role="footerText">View Services</span>
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* COLUMN 4: Our Products */}
          {productLinks.length > 0 && (
            <div className="sm:col-span-1 lg:col-span-2 xl:col-span-2 min-w-0 self-start">
              <h4 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white" data-customization-role="footerHeading">
                Our Products
              </h4>
              <div className="h-0.5 w-6 rounded-full bg-[#03BF62] mt-1 mb-2.5" data-customization-role="footerAccent" />
              <ul className="space-y-1.5 text-xs sm:text-[13px]">
                {productLinks.map((product, idx) => (
                  <li key={idx}>
                    <Link
                      href={product.href}
                      className="group flex items-start justify-between gap-2 text-stone-300 hover:text-white transition-colors py-0.5"
                      data-customization-role="footerLink"
                    >
                      <span
                        className="flex-1 whitespace-normal break-words leading-snug group-hover:text-white transition-colors"
                        data-customization-role="footerText"
                      >
                        {product.name}
                      </span>
                      <ChevronRightIcon className="h-3 w-3 mt-0.5 text-stone-500 group-hover:text-[#03BF62] transition-colors shrink-0" />
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/products"
                    className="text-[#03BF62] hover:text-white transition-colors font-semibold text-xs inline-flex items-center gap-1"
                    data-customization-role="footerLink"
                  >
                    <span data-customization-role="footerText">View Products</span>
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* COLUMN 5: Our Branches */}
          {branches.length > 0 && (
            <div
              className={`space-y-2.5 sm:col-span-2 ${
                weddingItems.length > 0 && productLinks.length > 0
                  ? "lg:col-span-4 xl:col-span-4"
                  : weddingItems.length > 0 || productLinks.length > 0
                  ? "lg:col-span-5 xl:col-span-5"
                  : "lg:col-span-6 xl:col-span-6"
              } min-w-0 self-start`}
            >
              <div>
                <h4
                  className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white"
                  data-customization-role="footerHeading"
                >
                  Our Branches
                </h4>
                <div
                  className="h-0.5 w-6 rounded-full bg-[#03BF62] mt-1 mb-2.5"
                  data-customization-role="footerAccent"
                />
              </div>

              {/* Single Branch Card */}
              {branches.map((branch) => {
                const branchHours = summarizeBranchHours(branch.openingHours);

                return (
                  <div
                    key={branch._id}
                    className="w-full max-w-[400px] rounded-2xl bg-white/[0.025] border border-white/[0.12] p-5 hover:border-[#03BF62]/50 transition-colors"
                  >
                    {/* Branch Name & Main Badge */}
                    <div className="flex items-start justify-between gap-2.5 flex-wrap">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <MapPinIcon className="h-4 w-4 text-[#03BF62] shrink-0 mt-0.5" />
                        <p className="font-bold text-white text-sm sm:text-base leading-snug whitespace-normal break-words flex-1">
                          {branch.name}
                        </p>
                      </div>
                      {branch.isMain && (
                        <span className="shrink-0 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#03BF62]/[0.12] text-[#03BF62] border border-[#03BF62]/[0.35]">
                          MAIN
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    {branch.address && (
                      <p className="text-xs sm:text-[13px] text-stone-300 whitespace-normal break-words leading-relaxed pl-6 mt-3">
                        {branch.address}
                      </p>
                    )}

                    {/* Phone & Email */}
                    <div className="space-y-2 pl-6 mt-3">
                      {branch.phone && (
                        <a
                          href={`tel:${branch.phone.replace(/\s+/g, "")}`}
                          className="text-xs sm:text-[13px] text-stone-300 hover:text-white transition-colors flex items-center gap-2.5"
                        >
                          <PhoneIcon className="h-3.5 w-3.5 text-[#03BF62] shrink-0" />
                          <span className="whitespace-normal break-words">{branch.phone}</span>
                        </a>
                      )}

                      {branch.email && (
                        <a
                          href={`mailto:${branch.email}`}
                          className="text-xs sm:text-[13px] text-stone-300 hover:text-white transition-colors flex items-center gap-2.5 [overflow-wrap:anywhere]"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5 text-[#03BF62] shrink-0"
                            aria-hidden="true"
                          >
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          <span className="[overflow-wrap:anywhere]">{branch.email}</span>
                        </a>
                      )}
                    </div>

                    {/* Opening Hours */}
                    {branchHours && branchHours.length > 0 && (
                      <div className="pt-3.5 mt-4 border-t border-white/[0.12]">
                        <div className="flex items-center gap-2 text-xs font-semibold text-stone-200 mb-2.5">
                          <ClockIcon className="h-3.5 w-3.5 text-[#03BF62] shrink-0" />
                          <span>Opening Hours</span>
                        </div>
                        <div className="space-y-1.5 pl-5.5">
                          {branchHours.map((h, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-4 text-xs"
                            >
                              <span className="text-stone-400 shrink-0">{h.label}</span>
                              <span
                                className={
                                  h.time === "Closed"
                                    ? "text-amber-400 font-medium"
                                    : "text-stone-200 font-medium text-right"
                                }
                              >
                                {h.time}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* View All Branches link & Suite Logo on a single compact line */}
              <div className="mt-4.5 pt-0.5 flex items-center justify-between gap-3 flex-wrap max-w-[400px]">
                <Link
                  href="/contact"
                  className="text-[#03BF62] hover:text-white transition-colors font-semibold text-xs inline-flex items-center gap-1.5"
                  data-customization-role="footerLink"
                >
                  <span data-customization-role="footerText">View All Branches</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
                <a
                  href="https://raxwo.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Raxwo (Pvt) Ltd"
                  title="Raxwo (Pvt) Ltd"
                  className="inline-block transition-opacity hover:opacity-100 focus:outline-hidden shrink-0"
                >
                  <Image
                    src="/images/salvora-suite-logo.png"
                    alt="Salvora Salon Management Suite by Raxwo (Pvt) Ltd"
                    width={320}
                    height={128}
                    className="h-10 sm:h-11 lg:h-12 w-auto max-w-[200px] object-contain"
                  />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar - Ultra Compact */}
        <div className="mt-5 sm:mt-6 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-stone-500">
          <p data-customization-role="footerText">
            © {currentYear} Salvora. A Product of{" "}
            <a
              href="https://raxwo.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-300 font-medium hover:text-[#03BF62] hover:underline transition-colors" data-customization-role="footerLink"
            >
              Raxwo (Pvt) Ltd
            </a>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-stone-300 transition-colors" data-customization-role="footerLink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors" data-customization-role="footerLink">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
