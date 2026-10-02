export const CLOUDINARY_FOLDERS = {
  SERVICES: "salon-management/services",
  PROFILES: "salon-management/profiles",
  COMMUNITY: "salon-management/community",
  SALON: "salon-management/salon",
} as const;

export type CloudinaryFolder =
  (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];
