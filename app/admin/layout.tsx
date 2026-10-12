import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
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

  // If viewing the admin login page
  if (currentPath === "/admin/login") {
    if (user && user.role === "admin") {
      redirect("/admin");
    }
    return <>{children}</>;
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
