export const RETAIL_PRODUCT_CATEGORIES = [
  "hair_care",
  "skin_care",
  "nail_care",
  "styling",
  "makeup",
  "other",
] as const;

export type RetailProductCategory = (typeof RETAIL_PRODUCT_CATEGORIES)[number];

export const RETAIL_CATEGORY_LABELS: Record<RetailProductCategory, string> = {
  hair_care: "Hair Care",
  skin_care: "Skin Care",
  nail_care: "Nail Care",
  styling: "Styling",
  makeup: "Makeup",
  other: "Other",
};

export const STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];
