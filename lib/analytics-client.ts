import {
  TrackEventPayload,
  AnalyticsEventType,
  AnalyticsEventMetadata,
} from "./analytics-constants";

export type { TrackEventPayload, AnalyticsEventType, AnalyticsEventMetadata };

/**
 * Dispatches an analytics event asynchronously to the server.
 * Completely non-blocking and safe: failures are swallowed silently
 * to ensure that customer actions and UI flow are never hindered.
 */
export function trackEvent(payload: TrackEventPayload): void {
  if (typeof window === "undefined") return;

  try {
    const bodyString = JSON.stringify({
      eventType: payload.eventType,
      page: payload.page || window.location.pathname,
      branchId: payload.branchId || undefined,
      entityType: payload.entityType || undefined,
      entityId: payload.entityId || undefined,
      metadata: payload.metadata || undefined,
    });

    // Prefer fetch with keepalive: true so requests complete during navigation/external links
    if (typeof fetch === "function") {
      fetch("/api/analytics/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bodyString,
        keepalive: true,
      }).catch(() => {
        // Silently swallow network / client-side errors
      });
    }
  } catch {
    // Non-blocking safety
  }
}
