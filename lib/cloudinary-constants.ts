export const CLOUDINARY_FOLDERS = {
  SERVICES: "salon-management/services",
  PROFILES: "salon-management/profiles",
  SALON: "salon-management/salon",
  GALLERY: "salon-management/gallery",
  BEAUTICIANS: "salon-management/beauticians",
} as const;

export type CloudinaryFolder =
  (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];
