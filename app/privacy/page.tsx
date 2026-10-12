import { PageCustomization } from "@/components/customization/PageCustomization";
import { CustomizationText } from "@/components/customization/CustomizationProvider";
import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Branch from "@/models/Branch";
import SalonSettings from "@/models/SalonSettings";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const LAST_UPDATED_DATE = "13 October 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | SALVORA",
  description:
    "Read the SALVORA Privacy Policy and learn how information is handled when you use our website and online services.",
};

interface PrivacyContactInfo {
  branchName: string;
  address: string;
  phone: string;
  email: string;
}

async function getPrivacyContactInfo(): Promise<PrivacyContactInfo> {
  try {
    await connectDB();
    const [mainBranch, settings] = await Promise.all([
      Branch.findOne({ isActive: true })
        .sort({ isMain: -1, displayOrder: 1, createdAt: 1 })
        .select("name address phone email isMain")
        .lean(),
      SalonSettings.findOne()
        .select("salonName address phone email")
        .lean(),
    ]);

    const branchName = mainBranch?.name
      ? `SALVORA ${mainBranch.name.replace(/^salvora\s*/i, "")}`
      : settings?.salonName || "SALVORA";

    const address = mainBranch?.address || settings?.address || "";
    const phone = mainBranch?.phone || settings?.phone || "";
    const email = mainBranch?.email || settings?.email || "";

    return {
      branchName,
      address,
      phone,
      email,
    };
  } catch {
    return {
      branchName: "SALVORA",
      address: "",
      phone: "",
      email: "",
    };
  }
}

const TOC_ITEMS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "information-provided", label: "2. Information Users May Provide" },
  { id: "information-automatic", label: "3. Information Collected Automatically" },
  { id: "branch-location", label: "4. Branch & Location Features" },
  { id: "google-services", label: "5. Google Services" },
  { id: "whatsapp", label: "6. WhatsApp" },
  { id: "external-booking", label: "7. External Booking System" },
  { id: "products-promotions", label: "8. Products & Promotions" },
  { id: "wedding-vendors", label: "9. Wedding Services & Vendors" },
  { id: "images-cloudinary", label: "10. Images & Cloudinary" },
  { id: "admin-portal", label: "11. Admin Portal" },
  { id: "ai-admin-features", label: "12. AI Admin Features" },
  { id: "how-used", label: "13. How Information Is Used" },
  { id: "sharing", label: "14. Sharing of Information" },
  { id: "data-security", label: "15. Data Security" },
  { id: "data-retention", label: "16. Data Retention" },
  { id: "third-party-links", label: "17. Third-Party Links" },
  { id: "childrens-privacy", label: "18. Children's Privacy" },
  { id: "privacy-choices", label: "19. Privacy Choices & Requests" },
  { id: "changes", label: "20. Changes to This Policy" },
  { id: "contact-salvora", label: "21. Contact SALVORA" },
];

export default async function PrivacyPolicyPage() {
  const contact = await getPrivacyContactInfo();

  return (
    <PageCustomization scope="public" pageKey="privacy">
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* Main Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0C0A14] text-white py-14 sm:py-16 lg:py-20 border-b border-white/10" data-customization-section="hero">
        {/* Ambient subtle glow for luxury aesthetic */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(124,58,237,0.22),rgba(255,255,255,0))]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-3.5 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C4B5FD]">
                LEGAL & PRIVACY
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight" data-customization-role="heading"><CustomizationText sectionKey="hero" field="heading">
              Privacy Policy
            </CustomizationText></h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-normal max-w-2xl" data-customization-role="description"><CustomizationText sectionKey="hero" field="description">
              Learn how SALVORA handles information when you use our website and interact
              with our online services.
            </CustomizationText></p>

            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              className="pt-2 flex items-center gap-2 text-xs font-medium"
            >
              <Link
                href="/"
                className="text-stone-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <span className="text-stone-600">/</span>
              <span className="text-[#C4B5FD] font-semibold">Privacy Policy</span>
            </nav>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Optional Sticky Side TOC on Large Desktop */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-24">
              <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED] mb-3">
                  On This Page
                </p>
                <nav aria-label="Table of Contents" className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                  {TOC_ITEMS.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-xs text-stone-600 hover:text-[#7C3AED] py-1 transition-colors leading-snug"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Legal Article Container (~850-900px width) */}
            <div className="lg:col-span-9 max-w-[900px]">
              <article className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-10 lg:p-12 shadow-xs space-y-8" data-customization-section="document">
                {/* Page Header Metadata Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-5 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                      Privacy Policy
                    </span>
                  </div>
                  <span className="font-medium text-stone-500">
                    Last Updated: {LAST_UPDATED_DATE}
                  </span>
                </div>

                {/* Privacy Summary Card */}
                <div className="rounded-2xl border border-purple-100 bg-[#F8F5FF] p-5 sm:p-6">
                  <div className="flex items-center gap-2.5 mb-3">
                    <ShieldCheckIcon className="h-5 w-5 text-[#7C3AED] shrink-0" />
                    <h2 className="text-sm sm:text-base font-bold text-stone-900" data-customization-role="sectionHeading">
                      Our Approach to Privacy
                    </h2>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircleIcon className="h-4 w-4 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span>We collect only information needed for website functions.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircleIcon className="h-4 w-4 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span>We use first-party analytics to understand website interactions.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircleIcon className="h-4 w-4 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span>
                        External services such as Google and WhatsApp have their own privacy terms.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircleIcon className="h-4 w-4 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span>
                        Contact SALVORA if you have questions about information you submitted.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* 1. Introduction */}
                <section id="introduction" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      1
                    </span>
                    <span>Introduction</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    SALVORA operates this public salon website to share information about our beauty services, salon branches, products, promotions, wedding offerings, and featured partners. This Privacy Policy describes how information may be handled when visitors:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-stone-600 pl-2">
                    <li>Browse pages across the website</li>
                    <li>Contact SALVORA using our enquiry options</li>
                    <li>Interact with salon branch information and schedules</li>
                    <li>Click appointment booking, login, or registration links</li>
                    <li>Use WhatsApp, telephone, or email contact links</li>
                    <li>View retail products, promotions, wedding services, and featured vendors</li>
                  </ul>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Please note that appointment scheduling and customer account features are operated through a separate connected Salon Management System rather than directly on this public informational website.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 2. Information Users May Provide */}
                <section id="information-provided" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      2
                    </span>
                    <span>Information Users May Provide</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    When you use the enquiry form on our Contact page, you may enter the following details:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-stone-600 pl-2">
                    <li>Full Name</li>
                    <li>Email Address</li>
                    <li>Phone Number (optional)</li>
                    <li>Subject</li>
                    <li>Message</li>
                  </ul>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    When you submit the Contact page form, the website prepares your message and opens your device&apos;s default email application (`mailto:`) so that you can transmit your enquiry directly to SALVORA for a response. The public website does not store Contact form submissions in a website database prior to you sending the email from your email client.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 3. Information Collected Automatically */}
                <section id="information-automatic" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      3
                    </span>
                    <span>Information Collected Automatically</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    SALVORA uses lightweight first-party analytics to understand how visitors use the website and to improve our online experience. When you browse or interact with website elements, the system may record non-personal interaction events in our database, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-stone-600 pl-2">
                    <li>Page path visited (`PAGE_VIEW`)</li>
                    <li>General interaction or event type</li>
                    <li>Branch selection or branch view interactions (`BRANCH_VIEW`)</li>
                    <li>Service, wedding, product, and promotion interactions (`SERVICE_VIEW`, `WEDDING_VIEW`, `PRODUCT_CLICK`, `PROMOTION_CLICK`)</li>
                    <li>Telephone call button clicks (`CALL_CLICK`)</li>
                    <li>WhatsApp enquiry clicks (`WHATSAPP_CLICK`)</li>
                    <li>External booking link clicks (`BOOKING_CLICK`)</li>
                    <li>Map, directions, and Google review link clicks (`MAP_CLICK`, `GOOGLE_REVIEW_CLICK`)</li>
                    <li>Partner vendor link clicks (`VENDOR_CLICK`)</li>
                    <li>Event timestamp and basic interaction labels (such as item category or button source)</li>
                  </ul>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Our first-party analytics system does <strong>not</strong> collect visitor names, email addresses, message contents, precise GPS coordinates, or payment details.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 4. Branch and Location Features */}
                <section id="branch-location" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      4
                    </span>
                    <span>Branch and Location Features</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    The website displays salon branch details including physical addresses, telephone numbers, WhatsApp contact numbers, email addresses, weekly opening hours, and embedded Google Maps or direction links. You can select a branch on the website to view location-specific details.
                  </p>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    SALVORA does not request or receive your device&apos;s exact GPS location through this website. When you view embedded maps or click links to open Google Maps or directions, you interact directly with Google&apos;s mapping services.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 5. Google Services */}
                <section id="google-services" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      5
                    </span>
                    <span>Google Services</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Our website integrates with Google Maps (to display branch location maps and directions) and Google Places / Google Reviews (to display public customer ratings and reviews for our salon locations).
                  </p>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    When you view embedded Google Maps, click map links, or follow links to read or write Google Reviews, Google may process technical information in accordance with Google&apos;s own terms of service and privacy policy.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 6. WhatsApp */}
                <section id="whatsapp" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      6
                    </span>
                    <span>WhatsApp</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Certain buttons on the website—including the floating WhatsApp button, branch contact buttons, and product or promotion enquiry buttons—open WhatsApp (`wa.me`) using the relevant SALVORA branch contact number and an optional pre-filled enquiry message.
                  </p>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    When you continue to WhatsApp and send a message, that communication takes place through the WhatsApp platform. SALVORA does not control WhatsApp&apos;s platform operations, and your use of WhatsApp is governed by WhatsApp&apos;s own privacy policy and terms.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 7. External Booking System */}
                <section id="external-booking" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      7
                    </span>
                    <span>External Booking System</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    The SALVORA website links to an external salon management and appointment booking system. When you click <strong>Book Appointment</strong>, <strong>Login</strong>, or <strong>Register</strong>, you may leave this public website and be directed to that external connected system.
                  </p>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    This public website does not store customer booking credentials or client login accounts. Any personal details, account registration information, or appointment records you submit within the external booking platform are handled under that system&apos;s applicable data handling and privacy rules.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 8. Products and Promotions */}
                <section id="products-promotions" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      8
                    </span>
                    <span>Products and Promotions</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    The Products and Promotions pages display salon retail products, brands, and seasonal or promotional offers. Clicking product or promotion action buttons may direct you to WhatsApp, our Contact page, or a configured external booking/offer destination.
                  </p>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    This public website does not perform online shopping cart checkout or process credit card or digital payment transactions.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 9. Wedding Services and Vendors */}
                <section id="wedding-vendors" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      9
                    </span>
                    <span>Wedding Services and Vendors</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Our Wedding page displays SALVORA bridal beauty services and packages, while our Vendors page showcases third-party wedding and event service providers (such as photographers, florists, venues, and transport providers).
                  </p>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    If you choose to visit a third-party vendor&apos;s website, social media profile, WhatsApp link, telephone number, or email address, your interaction is directly with that independent provider and is governed by the third party&apos;s own privacy practices. SALVORA is not responsible for the privacy practices of third-party vendors.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 10. Images and Cloudinary */}
                <section id="images-cloudinary" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      10
                    </span>
                    <span>Images and Cloudinary</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Visual media and photographs displayed across the SALVORA website—such as gallery photos, service imagery, product images, and branch or team visuals—may be hosted and delivered through Cloudinary&apos;s content delivery infrastructure when you load pages on the website.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 11. Admin Portal */}
                <section id="admin-portal" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      11
                    </span>
                    <span>Admin Portal</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Authorized SALVORA administrators use a restricted Admin Portal to manage website content, branch details, services, gallery items, products, promotions, and settings. Administrative sign-in sessions use essential authentication cookies solely for authorized administrators.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 12. AI Admin Features */}
                <section id="ai-admin-features" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      12
                    </span>
                    <span>AI Admin Features</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    The website includes an AI Assistant feature that is strictly restricted to authenticated administrators inside the Admin Portal. When used by administrators, this feature processes aggregated website analytics summaries, content counts, and website health indicators to generate operational insights. Secret integration credentials are excluded from AI context processing, and there is no public-facing AI chat on the visitor website.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 13. How Information Is Used */}
                <section id="how-used" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      13
                    </span>
                    <span>How Information Is Used</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Information handled through the SALVORA website is used only for operational purposes supported by the application, including to:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-stone-600 pl-2">
                    <li>Respond to visitor enquiries and communications</li>
                    <li>Operate and display website features and salon content</li>
                    <li>Provide accurate branch locations, opening hours, and contact options</li>
                    <li>Understand general website usage and popular services or pages</li>
                    <li>Improve website navigation, content completeness, and user experience</li>
                    <li>Maintain the security and reliability of the website and Admin Portal</li>
                  </ul>
                </section>

                <hr className="border-stone-100" />

                {/* 14. Sharing of Information */}
                <section id="sharing" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      14
                    </span>
                    <span>Sharing of Information</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    SALVORA does not sell personal information to advertisers. Information may interact with technical infrastructure and service providers strictly as necessary to operate the website and its administrative features, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-stone-600 pl-2">
                    <li>Database hosting (MongoDB) for storing website content and first-party interaction events</li>
                    <li>Media hosting and delivery (Cloudinary) for serving website images</li>
                    <li>Google services (Google Maps and Google Places / Reviews) when map or review features are used</li>
                    <li>Email / SMTP services for administrative notifications</li>
                    <li>Configured AI providers strictly for admin-only website insights</li>
                  </ul>
                </section>

                <hr className="border-stone-100" />

                {/* 15. Data Security */}
                <section id="data-security" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      15
                    </span>
                    <span>Data Security</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    SALVORA uses reasonable technical and administrative measures designed to protect website and administrative information against unauthorized access, alteration, or misuse. However, no internet transmission or electronic storage method can be guaranteed to be completely secure at all times.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 16. Data Retention */}
                <section id="data-retention" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      16
                    </span>
                    <span>Data Retention</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    Information is retained only as reasonably necessary for the purpose for which it was collected, ongoing website operational requirements, or applicable obligations.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 17. Third-Party Links */}
                <section id="third-party-links" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      17
                    </span>
                    <span>Third-Party Links</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    This website contains links to external platforms and third-party services, including Google Maps, WhatsApp, the external booking system, salon social media profiles, and partner vendor websites or social channels. SALVORA is not responsible for the content, security, or privacy practices of any third-party websites or services.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 18. Children's Privacy */}
                <section id="childrens-privacy" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      18
                    </span>
                    <span>Children&apos;s Privacy</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    This website is not designed to intentionally collect personal information from children without appropriate involvement from a parent or guardian.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 19. Privacy Choices / Contact Requests */}
                <section id="privacy-choices" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      19
                    </span>
                    <span>Privacy Choices &amp; Contact Requests</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    You may contact SALVORA if you have questions about information you have submitted through this website or if you wish to follow up on a previous communication sent to our team.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 20. Changes to This Policy */}
                <section id="changes" className="scroll-mt-24 space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      20
                    </span>
                    <span>Changes to This Policy</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    SALVORA may update this Privacy Policy from time to time when website features, integrations, or operational practices change. When material updates are made, the Last Updated date displayed on this page will be revised accordingly.
                  </p>
                </section>

                <hr className="border-stone-100" />

                {/* 21. Contact SALVORA */}
                <section id="contact-salvora" className="scroll-mt-24 space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5" data-customization-role="sectionHeading">
                    <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      21
                    </span>
                    <span>Contact SALVORA</span>
                  </h2>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed" data-customization-role="description">
                    If you have any questions regarding this Privacy Policy or how information is handled on our website, please reach out to SALVORA:
                  </p>

                  {/* Dynamic Main Branch / Global Contact Card */}
                  <div className="rounded-xl border border-stone-200 bg-[#FAF8F5]/80 p-5 sm:p-6 space-y-3.5 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="h-4 w-4 text-[#7C3AED] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-stone-900" data-customization-role="description">{contact.branchName}</p>
                        {contact.address && (
                          <p className="text-stone-600 text-xs sm:text-sm mt-0.5" data-customization-role="description">
                            {contact.address}
                          </p>
                        )}
                      </div>
                    </div>

                    {contact.phone && (
                      <div className="flex items-center gap-3 text-stone-700">
                        <PhoneIcon className="h-4 w-4 text-[#7C3AED] shrink-0" />
                        <a
                          href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                          className="text-stone-700 hover:text-[#7C3AED] transition-colors font-medium text-xs sm:text-sm"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    )}

                    {contact.email && (
                      <div className="flex items-center gap-3 text-stone-700">
                        <MailIcon className="h-4 w-4 text-[#7C3AED] shrink-0" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-stone-700 hover:text-[#7C3AED] transition-colors font-medium text-xs sm:text-sm"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}

                    <div className="pt-2">
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#6D28D9] transition-all"
                      >
                        <span>Contact Us</span>
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </section>
              </article>
            </div>
          </div>
        </div>
      </main>

      {/* Main Footer */}
      <Footer />
    </div>
    </PageCustomization>
  );
}
