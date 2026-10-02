export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  profileImagePublicId?: string;
  role: "customer" | "admin";
  isActive: boolean;
  createdAt?: string | Date;
}

export interface ProfileApiResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordApiResponse {
  success: boolean;
  message: string;
}
