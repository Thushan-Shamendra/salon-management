export const CLOUDINARY_FOLDERS = {
  SERVICES: "salon-management/services",
  PROFILES: "salon-management/profiles",
  SALON: "salon-management/salon",
  GALLERY: "salon-management/gallery",
  BEAUTICIANS: "salon-management/beauticians",
  PRODUCTS: "salon-management/products",
  VENDORS: "salon-management/vendors",
  WEDDING_SERVICES: "salon-management/wedding/services",
  WEDDING_PACKAGES: "salon-management/wedding/packages",
  RETAIL_PRODUCTS: "salon-management/retail-products",
  PROMOTIONS: "salon-management/promotions",
  CUSTOMIZATION_GLOBAL: "salon-management/customization/global",
} as const;

export type CloudinaryFolder =
  | (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS]
  | `salon-management/customization/${"public" | "admin"}/${string}/${string}`;
