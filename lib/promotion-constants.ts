export const PROMOTION_TYPES = [
  "service_offer",
  "product_deal",
  "wedding_offer",
  "branch_offer",
  "limited_time",
  "general_offer",
] as const;

export type PromotionType = (typeof PROMOTION_TYPES)[number];

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  service_offer: "Service Offers",
  product_deal: "Product Deals",
  wedding_offer: "Wedding Offers",
  branch_offer: "Branch Offers",
  limited_time: "Limited Time",
  general_offer: "General Offers",
};

export const DISCOUNT_TYPES = [
  "percentage",
  "fixed_amount",
  "custom_text",
] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const CTA_TYPES = [
  "whatsapp",
  "booking",
  "service_link",
  "product_link",
  "wedding_link",
  "external_link",
] as const;

export type CtaType = (typeof CTA_TYPES)[number];
