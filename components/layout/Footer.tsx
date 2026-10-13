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
import { RETAIL_CATEGORY_LABELS } from "@/lib/retail-product-constants";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  HomeIcon,
  UserIcon,
  SparklesIcon,
  ShoppingBagIcon,
  TagIcon,
  HeartIcon,
  UsersIcon,
  ImageIcon,
  StarIcon,
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

  if (groups.length <= 3) {
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

  return null;
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
  const productCategoryLinks: Array<{ name: string; href: string }> = [];
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
      activeCategories,
    ] = await Promise.all([
      SalonSettings.findOne()
        .select("salonName logo footerLogo socialMedia pageVisibility")
        .lean(),
      Branch.find({ isActive: true })
        .sort({ isMain: -1, displayOrder: 1, name: 1 })
        .limit(3)
        .select("name address phone email isMain openingHours")
        .lean(),
      Service.find({ isActive: { $ne: false } })
        .sort({ displayOrder: 1, name: 1, createdAt: -1 })
        .limit(5)
        .select("name")
        .lean(),
      WeddingService.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .limit(5)
        .select("name")
        .lean(),
      WeddingPackage.find({ isActive: true })
        .sort({ isFeatured: -1, displayOrder: 1, name: 1 })
        .limit(5)
        .select("name")
        .lean(),
      RetailProduct.distinct("category", { isActive: true }),
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

    // 1. Services (max 5 active)
    if (Array.isArray(serviceDocs)) {
      serviceLinks = serviceDocs.slice(0, 5).map((s) => ({
        name: s.name,
        href: "/services",
      }));
    }

    // 2. Wedding (preferred max 3 services + max 2 packages, up to 5 combined)
    if (pageVisibility.wedding) {
      const combinedWedding: Array<{ name: string; href: string }> = [
        ...(Array.isArray(weddingServiceDocs) ? weddingServiceDocs.slice(0, 3) : []).map((w) => ({
          name: w.name,
          href: "/wedding",
        })),
        ...(Array.isArray(weddingPackageDocs) ? weddingPackageDocs.slice(0, 2) : []).map((p) => ({
          name: p.name,
          href: "/wedding",
        })),
      ];

      if (combinedWedding.length < 5) {
        const existingNames = new Set(combinedWedding.map((i) => i.name));
        if (Array.isArray(weddingServiceDocs)) {
          for (const w of weddingServiceDocs) {
            if (combinedWedding.length >= 5) break;
            if (!existingNames.has(w.name)) {
              combinedWedding.push({ name: w.name, href: "/wedding" });
              existingNames.add(w.name);
            }
          }
        }
        if (Array.isArray(weddingPackageDocs)) {
          for (const p of weddingPackageDocs) {
            if (combinedWedding.length >= 5) break;
            if (!existingNames.has(p.name)) {
              combinedWedding.push({ name: p.name, href: "/wedding" });
              existingNames.add(p.name);
            }
          }
        }
      }
      weddingItems = combinedWedding.slice(0, 5);
    }

    // 3. Products Categories (unique active categories from RetailProduct)
    if (pageVisibility.products && Array.isArray(activeCategories) && activeCategories.length > 0) {
      const preferredCategoryOrder = [
        "hair_care",
        "skin_care",
        "nail_care",
        "styling",
        "makeup",
        "other",
      ];
      const sortedCategories = [...activeCategories].sort((a, b) => {
        const idxA = preferredCategoryOrder.indexOf(a);
        const idxB = preferredCategoryOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return String(a).localeCompare(String(b));
      });

      for (const cat of sortedCategories) {
        if (productCategoryLinks.length >= 5) break;
        const label =
          RETAIL_CATEGORY_LABELS[cat as keyof typeof RETAIL_CATEGORY_LABELS] || String(cat);
        productCategoryLinks.push({
          name: label,
          href: "/products",
        });
      }
    }

    // 4. Branches (max 3, Main Branch first, real data with branch-specific hours)
    if (Array.isArray(branchDocs) && branchDocs.length > 0) {
      branches = branchDocs.slice(0, 3).map((b) => ({
        _id: String(b._id),
        name: b.name,
        address: b.address,
        phone: b.phone || "",
        email: b.email,
        isMain: Boolean(b.isMain),
        openingHours: Array.isArray(b.openingHours)
          ? b.openingHours.map((h) => ({
              day: String(h.day),
              isClosed: Boolean(h.isClosed),
              openTime: h.openTime || "",
              closeTime: h.closeTime || "",
            }))
          : [],
      }));
    }
  } catch {
    // Graceful error handling
  }

  const allQuickLinks = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "About", href: "/about", icon: UserIcon },
    { name: "Services", href: "/services", icon: SparklesIcon },
    { name: "Products", href: "/products", icon: ShoppingBagIcon, visibilityKey: "products" as const },
    { name: "Promotions", href: "/promotions", icon: TagIcon, visibilityKey: "promotions" as const },
    { name: "Wedding", href: "/wedding", icon: HeartIcon, visibilityKey: "wedding" as const },
    { name: "Vendors", href: "/vendors", icon: UsersIcon, visibilityKey: "vendors" as const },
    { name: "Gallery", href: "/gallery", icon: ImageIcon, visibilityKey: "gallery" as const },
    { name: "Reviews", href: "/reviews", icon: StarIcon },
    { name: "Contact", href: "/contact", icon: MailIcon },
  ];

  const quickLinks = allQuickLinks.filter(
    (link) => !link.visibilityKey || pageVisibility[link.visibilityKey]
  );

  return (
    <footer className="relative overflow-hidden bg-black text-stone-300 border-t border-white/10" data-customization-footer="public">
      <div className="absolute inset-0 pointer-events-none z-0">
        <FooterBackground />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        {/* Main Grid: Responsive 12-column layout matching design mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-7 items-start">
          {/* COLUMN 1: SALVORA Logo, Description, Social Icons, Slogan */}
          <div className="space-y-4 lg:col-span-3 xl:col-span-2 min-w-0">
            <Link href="/" className="inline-block" aria-label={`${salonName} Home`}>
              {footerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={footerLogo}
                  alt={salonName}
                  className="h-12 sm:h-13 lg:h-14 w-auto max-w-[260px] object-contain"
                />
              ) : (
                <SalvoraLogo
                  theme="dark"
                  className="h-12 sm:h-13 lg:h-14 w-auto max-w-[260px] object-contain"
                />
              )}
            </Link>

            <p className="text-sm leading-relaxed text-stone-300 max-w-xs" data-customization-role="footerText">
              Professional beauty care, modern treatments, and a relaxing salon
              environment at Salvora.
            </p>

            {/* Accent divider line */}
            <div className="h-0.5 w-7 rounded-full bg-[#03BF62]" data-customization-role="footerAccent" />

            {/* Social Media Links with Real Brand Logos */}
            <div className="flex items-center gap-2.5">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/[0.12] hover:scale-105 transition-all shadow-2xs"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/[0.12] hover:scale-105 transition-all shadow-2xs"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/[0.12] hover:scale-105 transition-all shadow-2xs"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 hover:border-white/25 hover:bg-white/[0.12] hover:scale-105 transition-all shadow-2xs"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                    fill="#FF0000"
                  />
                  <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF" />
                </svg>
              </a>
            </div>

            {/* Slogan */}
            <div className="pt-2 text-xs tracking-[0.2em] font-semibold text-blue-400 uppercase leading-relaxed">
              <p data-customization-role="footerText">BEAUTY • CARE • CONFIDENCE</p>
              <p className="text-blue-500 text-[11px] tracking-[0.25em]" data-customization-role="footerText">ALL IN ONE PLACE</p>
            </div>
          </div>

          {/* COLUMN 2: Quick Links */}
          <div className="lg:col-span-2 xl:col-span-2 min-w-0">
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" data-customization-role="footerHeading">
              Quick Links
            </h4>
            <div className="h-0.5 w-7 rounded-full bg-[#03BF62] mt-2 mb-4" data-customization-role="footerAccent" />
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2.5 text-stone-300 hover:text-white transition-colors py-0.5" data-customization-role="footerLink"
                    >
                      <IconComponent className="h-4 w-4 text-[#03BF62] group-hover:text-white transition-colors shrink-0" />
                      <span className="truncate" data-customization-role="footerText">{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* COLUMN 3: Our Services & Wedding (Stacked vertically with needed space) */}
          {(serviceLinks.length > 0 || weddingItems.length > 0) && (
            <div className="space-y-6 sm:space-y-7 lg:col-span-3 xl:col-span-2 min-w-0">
              {/* Our Services */}
              {serviceLinks.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" data-customization-role="footerHeading">
                    Our Services
                  </h4>
                  <div className="h-0.5 w-7 rounded-full bg-[#03BF62] mt-2 mb-3.5" data-customization-role="footerAccent" />
                  <ul className="space-y-2.5 text-sm">
                    {serviceLinks.map((service, idx) => (
                      <li key={idx}>
                        <Link
                          href={service.href}
                          className="group flex items-center justify-between gap-1 text-stone-300 hover:text-white transition-colors py-0.5" data-customization-role="footerLink"
                        >
                          <span className="truncate group-hover:text-white transition-colors" data-customization-role="footerText">
                            {service.name}
                          </span>
                          <ChevronRightIcon className="h-3.5 w-3.5 text-stone-500 group-hover:text-[#03BF62] transition-colors shrink-0" />
                        </Link>
                      </li>
                    ))}
                    <li className="pt-2">
                      <Link
                        href="/services"
                        className="text-[#03BF62] hover:text-white transition-colors font-semibold text-sm inline-flex items-center gap-1.5" data-customization-role="footerLink"
                      >
                        <span data-customization-role="footerText">View All Services</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </li>
                  </ul>
                </div>
              )}

              {/* Wedding (Under Our Services) */}
              {weddingItems.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" data-customization-role="footerHeading">
                    Wedding
                  </h4>
                  <div className="h-0.5 w-7 rounded-full bg-[#03BF62] mt-2 mb-3.5" data-customization-role="footerAccent" />
                  <ul className="space-y-2.5 text-sm">
                    {weddingItems.map((item, idx) => (
                      <li key={idx}>
                        <Link
                          href={item.href}
                          className="group flex items-center justify-between gap-1 text-stone-300 hover:text-white transition-colors py-0.5" data-customization-role="footerLink"
                        >
                          <span className="truncate group-hover:text-white transition-colors" data-customization-role="footerText">
                            {item.name}
                          </span>
                          <ChevronRightIcon className="h-3.5 w-3.5 text-stone-500 group-hover:text-[#03BF62] transition-colors shrink-0" />
                        </Link>
                      </li>
                    ))}
                    <li className="pt-2">
                      <Link
                        href="/wedding"
                        className="text-[#03BF62] hover:text-white transition-colors font-semibold text-sm inline-flex items-center gap-1.5" data-customization-role="footerLink"
                      >
                        <span data-customization-role="footerText">View Wedding Services</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* COLUMN 4: Our Products */}
          {productCategoryLinks.length > 0 && (
            <div className="lg:col-span-2 xl:col-span-2 min-w-0">
              <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" data-customization-role="footerHeading">
                Our Products
              </h4>
              <div className="h-0.5 w-7 rounded-full bg-[#03BF62] mt-2 mb-4" data-customization-role="footerAccent" />
              <ul className="space-y-2.5 text-sm">
                {productCategoryLinks.map((product, idx) => (
                  <li key={idx}>
                    <Link
                      href={product.href}
                      className="group flex items-center justify-between gap-1 text-stone-300 hover:text-white transition-colors py-0.5" data-customization-role="footerLink"
                    >
                      <span className="truncate group-hover:text-white transition-colors" data-customization-role="footerText">
                        {product.name}
                      </span>
                      <ChevronRightIcon className="h-3.5 w-3.5 text-stone-500 group-hover:text-[#03BF62] transition-colors shrink-0" />
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    href="/products"
                    className="text-[#03BF62] hover:text-white transition-colors font-semibold text-sm inline-flex items-center gap-1.5" data-customization-role="footerLink"
                  >
                    <span data-customization-role="footerText">View All Products</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* COLUMN 6: Our Branches */}
          {branches.length > 0 && (
            <div className="space-y-4 lg:col-span-12 xl:col-span-4 min-w-0">
              <div>
                <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" data-customization-role="footerHeading">
                  Our Branches
                </h4>
                <div className="h-0.5 w-7 rounded-full bg-[#03BF62] mt-2 mb-4" data-customization-role="footerAccent" />
              </div>

              {/* Branch Cards: 2 cards side by side on desktop/tablet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {branches.map((branch) => {
                  const branchHours = summarizeBranchHours(branch.openingHours);

                  return (
                    <div
                      key={branch._id}
                      className="rounded-2xl bg-[#0A0A0A] border border-white/10 p-3.5 shadow-lg shadow-black/40 hover:border-[#03BF62]/40 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Branch Name & Pin */}
                        <div className="flex items-start gap-1.5">
                          <MapPinIcon className="h-4 w-4 text-[#03BF62] shrink-0 mt-0.5" />
                          <p className="font-bold text-white text-sm leading-tight">
                            {branch.name}
                          </p>
                        </div>

                        {/* Address */}
                        <p className="text-xs text-stone-300 leading-snug pl-5">
                          {branch.address}
                        </p>

                        {/* Phone */}
                        {branch.phone && (
                          <div className="flex items-center gap-1.5 pl-5 pt-0.5 text-xs">
                            <PhoneIcon className="h-3.5 w-3.5 text-[#03BF62] shrink-0" />
                            <a
                              href={`tel:${branch.phone.replace(/\s+/g, "")}`}
                              className="text-stone-300 hover:text-white transition-colors truncate"
                            >
                              {branch.phone}
                            </a>
                          </div>
                        )}

                        {/* Email */}
                        {branch.email && (
                          <div className="flex items-center gap-1.5 pl-5 text-xs text-stone-300">
                            <MailIcon className="h-3.5 w-3.5 text-[#03BF62] shrink-0" />
                            <a
                              href={`mailto:${branch.email}`}
                              className="hover:text-white transition-colors truncate"
                            >
                              {branch.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Branch-Specific Hours */}
                      <div className="pl-5 pt-2 mt-2 border-t border-white/10 space-y-1">
                        <div className="flex items-center gap-1 text-stone-200 font-semibold text-xs">
                          <ClockIcon className="h-3.5 w-3.5 text-[#03BF62] shrink-0" />
                          <span>Hours</span>
                        </div>
                        {branchHours && branchHours.length > 0 ? (
                          <div className="space-y-1 pt-0.5">
                            {branchHours.map((h, i) => (
                              <div key={i} className="flex justify-between gap-2 text-[11px] leading-tight">
                                <span className="text-stone-400 font-medium">{h.label}</span>
                                <span
                                  className={
                                    h.time === "Closed"
                                      ? "text-amber-400 font-medium"
                                      : "text-stone-200"
                                  }
                                >
                                  {h.time}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Link
                            href="/contact"
                            className="text-xs text-[#03BF62] hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            <span>View Opening Hours</span>
                            <span>→</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View All Branches link placed directly near the branch cards */}
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="text-[#03BF62] hover:text-white transition-colors font-semibold text-sm inline-flex items-center gap-1.5" data-customization-role="footerLink"
                >
                  <span data-customization-role="footerText">View All Branches</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              {/* Company Logo displayed AFTER View All Branches, on its own separate line */}
              <div className="pt-2 flex justify-end">
                <a
                  href="https://raxwo.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Raxwo (Pvt) Ltd"
                  title="Raxwo (Pvt) Ltd"
                  className="inline-block transition-opacity hover:opacity-85 focus:outline-hidden"
                >
                  <Image
                    src="/images/salvora-suite-logo.png"
                    alt="Salvora Salon Management Suite by Raxwo (Pvt) Ltd"
                    width={320}
                    height={128}
                    className="h-12 sm:h-13 lg:h-14 w-auto max-w-[260px] object-contain"
                  />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar - Unchanged */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-stone-500">
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
          <div className="flex items-center gap-6">
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
