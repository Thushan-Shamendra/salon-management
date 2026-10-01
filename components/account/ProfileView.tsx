"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserProfile } from "@/types/account";
import ProfileHeader from "@/components/account/ProfileHeader";
import ProfileForm from "@/components/account/ProfileForm";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import { ChevronRightIcon, HomeIcon } from "@/components/ui/icons";

interface ProfileViewProps {
  initialUser: UserProfile;
}

export default function ProfileView({ initialUser }: ProfileViewProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);

  const handleProfileUpdated = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78716C]">
        <Link href="/account" className="hover:text-stone-900 transition-colors flex items-center gap-1">
          <HomeIcon className="h-3.5 w-3.5" />
          <span>Account</span>
        </Link>
        <ChevronRightIcon className="h-3 w-3 opacity-60" />
        <span className="font-semibold text-stone-900">My Profile</span>
      </nav>

      {/* Profile Header Card */}
      <ProfileHeader user={currentUser} showEditButton={false} />

      {/* Personal Information Form */}
      <ProfileForm
        initialUser={currentUser}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Change Password Form */}
      <ChangePasswordForm />
    </div>
  );
}
