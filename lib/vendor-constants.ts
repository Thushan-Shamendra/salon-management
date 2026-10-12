export const VENDOR_CATEGORIES = [
  "Wedding Cars",
  "Hotels & Venues",
  "Photographers",
  "Videographers",
  "Florists",
  "Wedding Planners",
  "Bridal Wear",
  "Jewellery",
  "Cakes",
  "Decorations",
  "Other",
] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];
