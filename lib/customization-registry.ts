import { publicPages } from "./customization-public-registry";
import { adminPages } from "./customization-admin-registry";
import type { CustomizationScope, GlobalGroupKey, GlobalRegistration } from "./customization-types";
import type { CloudinaryFolder } from "./cloudinary-constants";

export { publicPages, adminPages };

export const globalGroups: GlobalRegistration[] = [
  { key: "publicHeader", label: "Public Header", scope: "public", styles: ["backgroundColor", "backgroundImage", "textColor", "activeLinkColor", "hoverColor", "primaryButton"] },
  { key: "publicWebsite", label: "Public Website", scope: "public", styles: ["backgroundColor", "textColor", "headingColor", "headingFont", "bodyFont"] },
  { key: "publicFooter", label: "Public Footer", scope: "public", styles: ["backgroundColor", "backgroundImage", "textColor", "headingColor", "linkColor", "accentColor"] },
  { key: "adminHeader", label: "Admin Header", scope: "admin", styles: ["backgroundColor", "textColor"] },
  { key: "adminSidebar", label: "Admin Sidebar", scope: "admin", styles: ["backgroundColor", "textColor", "activeItemBackground", "activeItemTextColor", "hoverBackground"] },
  { key: "adminWebsite", label: "Admin Website", scope: "admin", styles: ["backgroundColor", "textColor", "headingColor", "headingFont", "bodyFont", "primaryButton"] },
];

export function isCustomizationScope(scope: string): scope is CustomizationScope {
  return scope === "public" || scope === "admin";
}

export function getPageRegistration(scope: string, pageKey: string) {
  if (!isCustomizationScope(scope)) return undefined;
  return (scope === "public" ? publicPages : adminPages).find((page) => page.key === pageKey);
}

export function getSectionRegistration(scope: string, pageKey: string, sectionKey: string) {
  return getPageRegistration(scope, pageKey)?.sections.find((section) => section.key === sectionKey);
}

export function getGlobalRegistration(group: string) {
  return globalGroups.find((entry) => entry.key === group);
}

export function getCustomizationFolder(scope: CustomizationScope, pageKey: string, sectionKey: string): CloudinaryFolder {
  if (!getSectionRegistration(scope, pageKey, sectionKey)) throw new Error("Unknown customization section");
  return `salon-management/customization/${scope}/${pageKey}/${sectionKey}`;
}

export function isCustomizationFolder(folder: string): boolean {
  if (folder === "salon-management/customization/global") return true;
  const match = /^salon-management\/customization\/(public|admin)\/([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(folder);
  if (!match) return false;
  return Boolean(getSectionRegistration(match[1], match[2], match[3])?.styles.includes("backgroundImage"));
}

export function customizationPagePath(scope: CustomizationScope, pageKey: string) {
  if (scope === "admin") return pageKey === "dashboard" ? "/admin" : `/admin/${pageKey}`;
  return pageKey === "home" ? "/" : `/${pageKey}`;
}

export function isGlobalGroupKey(value: string): value is GlobalGroupKey {
  return Boolean(getGlobalRegistration(value));
}
