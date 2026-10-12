/**
 * Timezone utilities for SALVORA (Asia/Colombo: UTC+05:30)
 */

export const COLOMBO_TIMEZONE = "Asia/Colombo";
export const COLOMBO_OFFSET = "+05:30";

/**
 * Formats a Date or ISO string into "YYYY-MM-DD" in Asia/Colombo timezone.
 * Used for calendar date extraction and admin date pickers.
 */
export function formatInColomboTimezone(dateInput: Date | string): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Converts a date-only string (e.g. "2026-10-31") or Date into a Date representing
 * 00:00:00.000 in Asia/Colombo time, converted to UTC for MongoDB storage.
 *
 * Example: "2026-10-01" -> 2026-10-01 00:00:00.000 +05:30 -> 2026-09-30T18:30:00.000Z
 */
export function parseColomboStartDate(input: string | Date): Date {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return input;
    const colomboDateStr = formatInColomboTimezone(input);
    return new Date(`${colomboDateStr}T00:00:00.000${COLOMBO_OFFSET}`);
  }

  const trimmed = typeof input === "string" ? input.trim() : "";
  if (!trimmed) return new Date(NaN);

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000${COLOMBO_OFFSET}`);
  }

  // If a string contains T but does not specify a timezone offset, treat date part as Colombo
  if (trimmed.includes("T") && !trimmed.includes("+") && !trimmed.endsWith("Z")) {
    const datePart = trimmed.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return new Date(`${datePart}T00:00:00.000${COLOMBO_OFFSET}`);
    }
  }

  const parsed = new Date(trimmed);
  return parsed;
}

/**
 * Converts a date-only string (e.g. "2026-10-31") or Date into a Date representing
 * 23:59:59.999 in Asia/Colombo time, converted to UTC for MongoDB storage.
 *
 * Example: "2026-10-31" -> 2026-10-31 23:59:59.999 +05:30 -> 2026-10-31T18:29:59.999Z
 */
export function parseColomboEndDate(input: string | Date): Date {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return input;
    const colomboDateStr = formatInColomboTimezone(input);
    return new Date(`${colomboDateStr}T23:59:59.999${COLOMBO_OFFSET}`);
  }

  const trimmed = typeof input === "string" ? input.trim() : "";
  if (!trimmed) return new Date(NaN);

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T23:59:59.999${COLOMBO_OFFSET}`);
  }

  // If a string contains T but was generated from a date-only boundary or lacks offset
  if (trimmed.includes("T") && !trimmed.includes("+") && !trimmed.endsWith("Z")) {
    const datePart = trimmed.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return new Date(`${datePart}T23:59:59.999${COLOMBO_OFFSET}`);
    }
  }

  const parsed = new Date(trimmed);
  return parsed;
}
