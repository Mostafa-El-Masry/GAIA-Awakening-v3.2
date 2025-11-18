import type { DayKey } from "./types";

const KUWAIT_TZ = "Asia/Kuwait";

export interface HealthClockNow {
  now: Date;
  iso: string;
  displayTime: string;
  dayKey: DayKey;
}

/**
 * Returns the "now" information for the Health system using Asia/Kuwait time.
 * This is intentionally simple and client-side only.
 */
export function getHealthNow(): HealthClockNow {
  const now = new Date();

  const kuwaitFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: KUWAIT_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = kuwaitFormatter.formatToParts(now);
  const lookup: Record<string, string> = Object.fromEntries(
    parts.map((p) => [p.type, p.value])
  );

  const year = lookup.year;
  const month = lookup.month;
  const day = lookup.day;
  const hour = lookup.hour;
  const minute = lookup.minute;

  const dayKey: DayKey = `${year}-${month}-${day}`;
  const displayTime = `${hour}:${minute}`;
  const iso = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    )
  ).toISOString();

  return {
    now,
    iso,
    displayTime,
    dayKey,
  };
}

/**
 * Utility: given an ISO timestamp, return the corresponding DayKey in Asia/Kuwait.
 */
export function getKuwaitDayKeyFromIso(iso: string): DayKey {
  const date = new Date(iso);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: KUWAIT_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = Object.fromEntries(
    parts.map((p) => [p.type, p.value])
  );

  const year = lookup.year;
  const month = lookup.month;
  const day = lookup.day;

  return `${year}-${month}-${day}`;
}

/**
 * Decide which Health day a sleep session belongs to, given its start and end ISO timestamps.
 * Rule:
 * - If start and end fall on the same Kuwait calendar day → that day.
 * - If they span midnight:
 *   - If the start hour (Kuwait) is after 18:00 → assign to the end day.
 *   - Otherwise → assign to the start day.
 */
export function chooseSleepDayKey(startIso: string, endIso: string): DayKey {
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: KUWAIT_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const startParts = formatter.formatToParts(startDate);
  const endParts = formatter.formatToParts(endDate);

  const sLookup: Record<string, string> = Object.fromEntries(
    startParts.map((p) => [p.type, p.value])
  );
  const eLookup: Record<string, string> = Object.fromEntries(
    endParts.map((p) => [p.type, p.value])
  );

  const startYear = sLookup.year;
  const startMonth = sLookup.month;
  const startDay = sLookup.day;
  const startHour = Number(sLookup.hour);

  const endYear = eLookup.year;
  const endMonth = eLookup.month;
  const endDay = eLookup.day;

  const startKey: DayKey = `${startYear}-${startMonth}-${startDay}`;
  const endKey: DayKey = `${endYear}-${endMonth}-${endDay}`;

  if (startKey === endKey) {
    return startKey;
  }

  if (startHour >= 18) {
    return endKey;
  }

  return startKey;
}
