import React from "react";
import Link from "next/link";
import Image from "next/image";
import SalvoraLogo from "@/components/ui/SalvoraLogo";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";
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
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YoutubeIcon,
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
        .select("salonName logo footerLogo socialMedia")
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

    // 3. Products Categories (unique active categories from RetailProduct)
    if (Array.isArray(activeCategories) && activeCategories.length > 0) {
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

  const quickLinks = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "About", href: "/about", icon: UserIcon },
    { name: "Services", href: "/services", icon: SparklesIcon },
    { name: "Products", href: "/products", icon: ShoppingBagIcon },
    { name: "Promotions", href: "/promotions", icon: TagIcon },
    { name: "Wedding", href: "/wedding", icon: HeartIcon },
    { name: "Vendors", href: "/vendors", icon: UsersIcon },
    { name: "Gallery", href: "/gallery", icon: ImageIcon },
    { name: "Reviews", href: "/reviews", icon: StarIcon },
    { name: "Contact", href: "/contact", icon: MailIcon },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#07040E] text-stone-300 border-t border-purple-900/30">
      {/* Background Graphic: Luxury Silk Satin Ribbon Petals in Lower Left Corner */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src="/images/footer-bg.jpg"
          alt="Footer background decoration"
          fill
          sizes="100vw"
          className="object-cover object-left-bottom opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07040E]/60 via-transparent to-[#07040E]/40" />
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

            <p className="text-xs leading-relaxed text-stone-300 max-w-xs">
              Professional beauty care, modern treatments, and a relaxing salon
              environment at Salvora.
            </p>

            {/* Accent divider line */}
            <div className="h-0.5 w-7 rounded-full bg-[#8B5CF6]" />

            {/* Social Media Links in Purple Badges */}
            <div className="flex items-center gap-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-200 hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] transition-colors shadow-2xs"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-200 hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] transition-colors shadow-2xs"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-200 hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] transition-colors shadow-2xs"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Salvora YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-200 hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] transition-colors shadow-2xs"
              >
                <YoutubeIcon className="h-4 w-4" />
              </a>
            </div>

            {/* Slogan */}
            <div className="pt-2 text-[10px] tracking-[0.2em] font-semibold text-purple-300/80 uppercase leading-relaxed">
              <p>BEAUTY • CARE • CONFIDENCE</p>
              <p className="text-purple-400 text-[9px] tracking-[0.25em]">ALL IN ONE PLACE</p>
            </div>
          </div>

          {/* COLUMN 2: Quick Links */}
          <div className="lg:col-span-2 xl:col-span-2 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <div className="h-0.5 w-7 rounded-full bg-[#8B5CF6] mt-2 mb-4" />
            <ul className="space-y-2 text-xs">
              {quickLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2.5 text-stone-300 hover:text-white transition-colors py-0.5"
                    >
                      <IconComponent className="h-3.5 w-3.5 text-[#C4B5FD] group-hover:text-white transition-colors shrink-0" />
                      <span className="truncate">{link.name}</span>
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
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                    Our Services
                  </h4>
                  <div className="h-0.5 w-7 rounded-full bg-[#8B5CF6] mt-2 mb-3.5" />
                  <ul className="space-y-2 text-xs">
                    {serviceLinks.map((service, idx) => (
                      <li key={idx}>
                        <Link
                          href={service.href}
                          className="group flex items-center justify-between gap-1 text-stone-300 hover:text-white transition-colors py-0.5"
                        >
                          <span className="truncate group-hover:text-white transition-colors">
                            {service.name}
                          </span>
                          <ChevronRightIcon className="h-3 w-3 text-stone-500 group-hover:text-[#C4B5FD] transition-colors shrink-0" />
                        </Link>
                      </li>
                    ))}
                    <li className="pt-2">
                      <Link
                        href="/services"
                        className="text-[#C084FC] hover:text-white transition-colors font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5"
                      >
                        <span>View All Services</span>
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                  </ul>
                </div>
              )}

              {/* Wedding (Under Our Services) */}
              {weddingItems.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                    Wedding
                  </h4>
                  <div className="h-0.5 w-7 rounded-full bg-[#8B5CF6] mt-2 mb-3.5" />
                  <ul className="space-y-2 text-xs">
                    {weddingItems.map((item, idx) => (
                      <li key={idx}>
                        <Link
                          href={item.href}
                          className="group flex items-center justify-between gap-1 text-stone-300 hover:text-white transition-colors py-0.5"
                        >
                          <span className="truncate group-hover:text-white transition-colors">
                            {item.name}
                          </span>
                          <ChevronRightIcon className="h-3 w-3 text-stone-500 group-hover:text-[#C4B5FD] transition-colors shrink-0" />
                        </Link>
                      </li>
                    ))}
                    <li className="pt-2">
                      <Link
                        href="/wedding"
                        className="text-[#C084FC] hover:text-white transition-colors font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5"
                      >
                        <span>View Wedding Services</span>
                        <ArrowRightIcon className="h-3.5 w-3.5" />
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
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                Our Products
              </h4>
              <div className="h-0.5 w-7 rounded-full bg-[#8B5CF6] mt-2 mb-4" />
              <ul className="space-y-2 text-xs">
                {productCategoryLinks.map((product, idx) => (
                  <li key={idx}>
                    <Link
                      href={product.href}
                      className="group flex items-center justify-between gap-1 text-stone-300 hover:text-white transition-colors py-0.5"
                    >
                      <span className="truncate group-hover:text-white transition-colors">
                        {product.name}
                      </span>
                      <ChevronRightIcon className="h-3 w-3 text-stone-500 group-hover:text-[#C4B5FD] transition-colors shrink-0" />
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    href="/products"
                    className="text-[#C084FC] hover:text-white transition-colors font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5"
                  >
                    <span>View All Products</span>
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* COLUMN 6: Our Branches */}
          {branches.length > 0 && (
            <div className="space-y-4 lg:col-span-12 xl:col-span-4 min-w-0">
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Our Branches
                </h4>
                <div className="h-0.5 w-7 rounded-full bg-[#8B5CF6] mt-2 mb-4" />
              </div>

              {/* Branch Cards: 2 cards side by side on desktop/tablet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {branches.map((branch) => {
                  const branchHours = summarizeBranchHours(branch.openingHours);

                  return (
                    <div
                      key={branch._id}
                      className="rounded-2xl bg-[#130B24]/80 border border-purple-500/25 p-3.5 shadow-lg shadow-purple-950/25 backdrop-blur-sm hover:border-purple-400/50 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Branch Name & Pin */}
                        <div className="flex items-start gap-1.5">
                          <MapPinIcon className="h-3.5 w-3.5 text-[#C084FC] shrink-0 mt-0.5" />
                          <p className="font-bold text-white text-xs sm:text-sm leading-tight">
                            {branch.name}
                          </p>
                        </div>

                        {/* Address */}
                        <p className="text-[11px] text-stone-300 leading-snug pl-5">
                          {branch.address}
                        </p>

                        {/* Phone */}
                        {branch.phone && (
                          <div className="flex items-center gap-1.5 pl-5 pt-0.5 text-[11px]">
                            <PhoneIcon className="h-3 w-3 text-[#C084FC] shrink-0" />
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
                          <div className="flex items-center gap-1.5 pl-5 text-[11px] text-stone-300">
                            <MailIcon className="h-3 w-3 text-[#C084FC] shrink-0" />
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
                        <div className="flex items-center gap-1 text-stone-200 font-semibold text-[11px]">
                          <ClockIcon className="h-3 w-3 text-[#C084FC] shrink-0" />
                          <span>Hours</span>
                        </div>
                        {branchHours && branchHours.length > 0 ? (
                          <div className="space-y-1 pt-0.5">
                            {branchHours.map((h, i) => (
                              <div key={i} className="flex justify-between gap-2 text-[10px] leading-tight">
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
                            className="text-[10px] text-[#C084FC] hover:text-white transition-colors inline-flex items-center gap-1"
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
                  className="text-[#C084FC] hover:text-white transition-colors font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5"
                >
                  <span>View All Branches</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
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
                    width={220}
                    height={88}
                    className="w-[170px] sm:w-[195px] lg:w-[215px] h-auto object-contain"
                  />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar - Unchanged */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {currentYear} Salvora. A Product of{" "}
            <a
              href="https://raxwo.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-300 font-medium hover:text-[#C4B5FD] hover:underline transition-colors"
            >
              Raxwo (Pvt) Ltd
            </a>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
