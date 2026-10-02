import { IOpeningHour } from "@/models/SalonSettings";

export const SLOT_INTERVAL_MINUTES = 30;
export const CANCELLATION_WINDOW_HOURS = 2;
export const SRI_LANKA_TIMEZONE = "Asia/Colombo";

/**
 * Convert "HH:mm" 24h string to minutes from start of day (0..1439).
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }
  return hours * 60 + minutes;
}

/**
 * Convert minutes from start of day to "HH:mm" 24h string.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Calculate end time string given start time and duration in minutes.
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const startMin = timeToMinutes(startTime);
  const endMin = startMin + durationMinutes;
  return minutesToTime(endMin);
}

/**
 * Check if two time intervals overlap.
 * (newStart < existingEnd && newEnd > existingStart)
 */
export function isOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Check if time string is in valid "HH:mm" format (24-hour).
 */
export function isValidTimeString(timeStr?: string | null): boolean {
  if (!timeStr || typeof timeStr !== "string") return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr.trim());
}

/**
 * Check if date string is in valid "YYYY-MM-DD" format.
 */
export function isValidDateString(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return false;
  const [y, m, d] = dateStr.trim().split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/**
 * Normalize "YYYY-MM-DD" or Date to a consistent UTC midnight Date object.
 * Prevents local timezone drift across server and database operations.
 */
export function normalizeAppointmentDate(dateInput: string | Date): Date {
  if (typeof dateInput === "string") {
    const parts = dateInput.trim().split("T")[0].split("-").map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
  }
  return new Date(
    Date.UTC(
      dateInput.getUTCFullYear(),
      dateInput.getUTCMonth(),
      dateInput.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}

/**
 * Formats a Date or string to "YYYY-MM-DD".
 */
export function formatDateToISOString(date: Date | string): string {
  if (typeof date === "string") {
    return date.trim().split("T")[0];
  }
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get date query range covering the full 24 hours of that calendar day in UTC.
 */
export function getDateQueryRange(dateStr: string): { $gte: Date; $lte: Date } {
  const base = normalizeAppointmentDate(dateStr);
  const start = new Date(base.getTime());
  const end = new Date(base.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { $gte: start, $lte: end };
}

/**
 * Get weekday name ("Sunday"..."Saturday") for "YYYY-MM-DD".
 * Calculates in UTC so it never drifts with server timezone.
 */
export function getDayOfWeekName(dateStr: string): string {
  const normalized = normalizeAppointmentDate(dateStr);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[normalized.getUTCDay()];
}

/**
 * Get current time context in Sri Lanka (UTC+05:30).
 */
export function getSriLankaNow(): {
  dateStr: string;
  minutes: number;
  nowDate: Date;
} {
  // Format current time into Sri Lanka ISO parts
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SRI_LANKA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = parseInt(getPart("hour"), 10) % 24;
  const minute = parseInt(getPart("minute"), 10);

  const dateStr = `${year}-${month}-${day}`;
  const minutes = hour * 60 + minute;

  return {
    dateStr,
    minutes,
    nowDate: now,
  };
}

/**
 * Check if a "YYYY-MM-DD" date is before today in Sri Lanka.
 */
export function isPastDateInSriLanka(dateStr: string): boolean {
  const { dateStr: todayStr } = getSriLankaNow();
  return dateStr < todayStr;
}

/**
 * Find opening hour configuration for a specific weekday.
 */
export function getOpeningHoursForDay(
  openingHours: IOpeningHour[] | undefined,
  dayName: string
): IOpeningHour | null {
  if (!Array.isArray(openingHours) || openingHours.length === 0) {
    return null;
  }
  return (
    openingHours.find(
      (h) => h.day.toLowerCase() === dayName.toLowerCase()
    ) || null
  );
}

export interface ExistingBooking {
  startTime: string;
  endTime: string;
}

/**
 * Generates all available slots given salon opening hours, service duration, and existing bookings.
 */
export function generateAvailableSlots({
  openTime,
  closeTime,
  isClosed,
  serviceDuration,
  existingBookings,
  dateStr,
  slotInterval = SLOT_INTERVAL_MINUTES,
}: {
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  serviceDuration: number;
  existingBookings: ExistingBooking[];
  dateStr: string;
  slotInterval?: number;
}): string[] {
  if (isClosed) {
    return [];
  }

  if (!isValidTimeString(openTime) || !isValidTimeString(closeTime)) {
    return [];
  }

  const openMin = timeToMinutes(openTime);
  const closeMin = timeToMinutes(closeTime);

  if (openMin >= closeMin) {
    return [];
  }

  const { dateStr: todayStr, minutes: currentMinutes } = getSriLankaNow();
  const isToday = dateStr === todayStr;

  // Convert existing bookings to intervals
  const bookedIntervals = existingBookings.map((b) => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));

  const slots: string[] = [];

  // Generate candidate slots: slotStart must allow serviceDuration to complete at or before closeMin (Rule 7)
  for (
    let slotStart = openMin;
    slotStart + serviceDuration <= closeMin;
    slotStart += slotInterval
  ) {
    const slotEnd = slotStart + serviceDuration;

    // RULE 1: If today, slots in the past are not available
    if (isToday && slotStart <= currentMinutes) {
      continue;
    }

    // RULE 6: Prevent overlap with existing bookings (newStart < existingEnd && newEnd > existingStart)
    const hasConflict = bookedIntervals.some((b) =>
      isOverlapping(slotStart, slotEnd, b.start, b.end)
    );

    if (!hasConflict) {
      slots.push(minutesToTime(slotStart));
    }
  }

  return slots;
}

/**
 * Validate customer cancellation eligibility (RULE: cannot cancel within CANCELLATION_WINDOW_HOURS).
 */
export function checkCancellationEligibility(
  appointmentDate: Date | string,
  startTime: string
): { eligible: boolean; message?: string } {
  const dateStr = formatDateToISOString(appointmentDate);
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = startTime.split(":").map(Number);

  // Sri Lanka time offset is UTC+5.5 (+330 minutes)
  // Appointment timestamp in UTC ms:
  const apptUtcTimestamp = Date.UTC(y, m - 1, d, h, min) - 5.5 * 60 * 60 * 1000;
  const nowUtcTimestamp = Date.now();

  if (apptUtcTimestamp <= nowUtcTimestamp) {
    return {
      eligible: false,
      message: "Past appointments cannot be cancelled.",
    };
  }

  const hoursUntilAppt = (apptUtcTimestamp - nowUtcTimestamp) / (1000 * 60 * 60);

  if (hoursUntilAppt < CANCELLATION_WINDOW_HOURS) {
    return {
      eligible: false,
      message: `Appointments cannot be cancelled within ${CANCELLATION_WINDOW_HOURS} hours of scheduled time. Please contact our salon concierge directly.`,
    };
  }

  return { eligible: true };
}

/**
 * Convert 24-hour time to 12-hour formatted string (e.g. "09:00" -> "9:00 AM", "14:30" -> "2:30 PM").
 */
export function formatTime12Hour(time24: string): string {
  if (!isValidTimeString(time24)) return time24;
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Format date into readable string, e.g. "Saturday, Oct 10, 2026"
 */
export function formatReadableDate(dateInput: string | Date): string {
  const normalized = normalizeAppointmentDate(dateInput);
  return normalized.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
