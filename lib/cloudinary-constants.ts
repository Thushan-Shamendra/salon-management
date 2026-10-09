export const CLOUDINARY_FOLDERS = {
  SERVICES: "salon-management/services",
  PROFILES: "salon-management/profiles",
  SALON: "salon-management/salon",
  GALLERY: "salon-management/gallery",
  BEAUTICIANS: "salon-management/beauticians",
  WEDDING_SERVICES: "salon-management/wedding/services",
  WEDDING_PACKAGES: "salon-management/wedding/packages",
} as const;

export type CloudinaryFolder =
  (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];
