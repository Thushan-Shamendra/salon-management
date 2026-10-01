import { redirect } from "next/navigation";
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

  // 3. Logged in admin -> render Admin Portal layout
  return (
    <AdminLayoutClient
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}