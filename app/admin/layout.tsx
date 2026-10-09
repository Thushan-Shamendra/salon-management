import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

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

  // 3. Render Admin Portal layout with sidebar & header
  return (
    <AdminLayoutClient
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