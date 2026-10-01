import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ProfileView from "@/components/account/ProfileView";
import { UserProfile } from "@/types/account";

export const metadata = {
  title: "My Profile | Lumina Salon",
  description: "View and edit your salon customer account profile, contact details, and password.",
};

export default async function CustomerProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userProfile: UserProfile = {
    id: user._id.toString(),
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    profileImage: user.profileImage || "",
    role: (user.role as "customer" | "admin") || "customer",
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
  };

  return <ProfileView initialUser={userProfile} />;
}
