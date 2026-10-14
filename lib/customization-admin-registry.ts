import type { PageRegistration, SectionRegistration } from "./customization-types";

function page(
  key: string,
  label: string,
  heading: string,
  description: string,
  primaryButtonText?: string,
  sectionHeadings = true
): PageRegistration {
  const section: SectionRegistration = {
    key: "page",
    label: "Page presentation",
    content: { heading, description, ...(primaryButtonText ? { primaryButtonText } : {}) },
    styles: ["backgroundColor", "iconColor", "heading", "description", ...(primaryButtonText ? ["primaryButton" as const] : []), ...(sectionHeadings ? ["sectionHeading" as const] : [])],
  };
  return { key, label, sections: [section] };
}

// This registry describes existing presentation areas only. Tables, forms,
// analytics, content records and destructive/security controls are not registered.
export const adminPages: PageRegistration[] = [
  page("dashboard", "Dashboard", "SALVORA Salon Dashboard", "Executive overview of your salon content, branch operations, and customer analytics.", undefined, true),
  page("services", "Services", "Services", "Manage services displayed on the SALVORA website.", "Add Service"),
  page("beauticians", "Beauticians", "Beauticians", "Manage the beauty professionals displayed on the SALVORA website.", "Add Beautician"),
  page("gallery", "Gallery", "Gallery", "Manage photos displayed on the SALVORA website gallery.", "Add Photo"),
  // The Wedding action changes with the selected CRUD tab, so its wording is
  // preserved while its appearance can be customized.
  { ...page("wedding", "Wedding", "Wedding", "Manage wedding services and bridal beauty packages displayed on the website."), sections: [{ key: "page", label: "Page presentation", content: { heading: "Wedding", description: "Manage wedding services and bridal beauty packages displayed on the website." }, styles: ["backgroundColor", "iconColor", "heading", "description", "primaryButton", "sectionHeading"] }] },
  page("products", "Product Brands", "Products & Brands", "Manage the professional product lines and beauty brands showcased on the SALVORA website.", "Add Brand / Product"),
  page("retail-products", "Selling Products", "Selling Products", "Manage retail salon products available for customer purchase and WhatsApp enquiry.", "Add Product"),
  page("promotions", "Promotions", "Promotions", "Manage active seasonal discounts, package deals, branch specials, and promotional campaigns.", "Add Promotion"),
  page("vendors", "Vendors", "Vendors", "Manage trusted vendors and wedding service partners displayed on the SALVORA website.", "Add Vendor"),
  page("branches", "Branches", "Branches", "Manage SALVORA salon locations and contact details.", "Add Branch"),
  page("ai-assistant", "AI Assistant", "AI Website Assistant", "Use SALVORA's real website analytics and content data to understand performance, identify issues, and discover opportunities for improvement.", "Analyze Website", true),
  page("backup", "Backup & Restore", "Backup & Restore", "Protect SALVORA website content by downloading backups and safely restoring previous data.", "Download Backup", true),
  page("settings", "Website Settings", "Website Settings", "Manage global website branding, logos, social media, and your Main Branch configuration.", "Save Global Settings", true),
  page("customize", "Website Customizer", "Website Customizer", "Customize SALVORA website content, typography, colors, backgrounds and buttons without changing application structure.", "Save Changes", true),
  page("login", "Admin Login", "Admin Sign In", "Sign in to manage your salon website content, services, and gallery.", "Sign In to Admin Portal"),
  { key: "change-password", label: "Change Password", sections: [{ key: "page", label: "Page design (security text protected)", styles: ["backgroundColor", "iconColor", "heading", "description", "sectionHeading"] }] },
];

export function getAdminPageKey(pathname: string): string | undefined {
  const key = pathname.replace(/\/$/, "") === "/admin" ? "dashboard" : pathname.split("/")[2];
  return adminPages.some((item) => item.key === key) ? key : undefined;
}
