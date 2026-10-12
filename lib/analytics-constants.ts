export const ANALYTICS_EVENT_TYPES = [
  "PAGE_VIEW",
  "CALL_CLICK",
  "WHATSAPP_CLICK",
  "BOOKING_CLICK",
  "GOOGLE_REVIEW_CLICK",
  "SERVICE_VIEW",
  "WEDDING_VIEW",
  "VENDOR_CLICK",
  "MAP_CLICK",
  "PRODUCT_CLICK",
  "PROMOTION_CLICK",
  "BRANCH_VIEW",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const DATE_RANGES = ["today", "7d", "30d"] as const;
export type AnalyticsDateRange = (typeof DATE_RANGES)[number];

export interface AnalyticsEventMetadata {
  label?: string;
  source?: string;
  category?: string;
}

export interface TrackEventPayload {
  eventType: AnalyticsEventType;
  page?: string;
  branchId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: AnalyticsEventMetadata;
}
