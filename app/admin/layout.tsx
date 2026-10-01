import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata = {
  title: "Admin Portal | LUMINA Luxury Salon",
  description: "Operations and administration management portal.",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // Access rules:
  // 1. Logged out -> redirect to /login
  if (!user) {
    redirect("/login");
  }

  // 2. Logged in customer -> redirect to /
  if (user.role !== "admin") {
    redirect("/");
  }

  // 3. Admin with mustChangePassword flag MUST change temporary password first
  const headersList = await headers();
  const rawPath = headersList.get("x-pathname") || "";
  const currentPath = rawPath.replace(/\/$/, "");

  if (user.mustChangePassword && currentPath !== "/admin/change-password") {
    redirect("/admin/change-password");
  }

  // 4. Render Admin Portal layout
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