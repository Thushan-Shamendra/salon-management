import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import CustomizationProvider from "@/components/customization/CustomizationProvider";
import { getGlobalCustomization, getPageCustomizations } from "@/lib/customization";
import { getAdminPageKey } from "@/lib/customization-admin-registry";
import type { GlobalOverrides } from "@/lib/customization-types";

export const metadata = {
  title: "Admin Portal | salvora",
  description: "Website content administration portal.",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const headersList = await headers();
  const rawPath = headersList.get("x-pathname") || "";
  const currentPath = rawPath.replace(/\/$/, "");

  const isAuthPage = [
    "/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
    "/admin/verify-otp",
  ].includes(currentPath);

  // If viewing an unauthenticated admin auth page
  if (isAuthPage) {
    if (user && user.role === "admin") {
      redirect("/admin");
    }
    const allGlobal = await getGlobalCustomization();
    const customizationGlobal: GlobalOverrides = {};
    for (const group of ["adminHeader", "adminSidebar", "adminWebsite"] as const) {
      if (allGlobal[group]) customizationGlobal[group] = allGlobal[group];
    }
    const authPageKey = currentPath === "/admin/login" ? "login" : currentPath.split("/")[2] || "login";
    const initialSections = await getPageCustomizations("admin", authPageKey);

    return (
      <CustomizationProvider
        scope="admin"
        pageKey={authPageKey}
        global={customizationGlobal}
        sections={initialSections}
      >
        {children}
      </CustomizationProvider>
    );
  }

  // Access rules:
  // 1. Logged out or non-admin -> redirect to /admin/login
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  // 2. Admin with mustChangePassword flag MUST change temporary password first
  if (user.mustChangePassword && currentPath !== "/admin/change-password") {
    redirect("/admin/change-password");
  }

  const initialPageKey = getAdminPageKey(currentPath) || "dashboard";
  const [allGlobal, initialSections] = await Promise.all([
    getGlobalCustomization(),
    getPageCustomizations("admin", initialPageKey),
  ]);
  // Keep admin presentation data inside the authenticated portal.
  const customizationGlobal: GlobalOverrides = {};
  for (const group of ["adminHeader", "adminSidebar", "adminWebsite"] as const) {
    if (allGlobal[group]) customizationGlobal[group] = allGlobal[group];
  }

  // 3. Render Admin Portal layout with sidebar & header
  return (
    <AdminLayoutClient
      customizationGlobal={customizationGlobal}
      initialPageKey={initialPageKey}
      initialSections={initialSections}
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword ?? false,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
