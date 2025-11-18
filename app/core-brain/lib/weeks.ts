import { V3WeekMeta } from "./types";

export const V3_WEEKS: V3WeekMeta[] = [
  {
    id: "v3.0-w1",
    index: 1,
    label: "Week 1 · Foundations & Skeleton",
    startDate: "2026-08-10",
    endDate: "2026-08-16",
  },
  {
    id: "v3.0-w2",
    index: 2,
    label: "Week 2 · Daily Thread UX & Time Awareness",
    startDate: "2026-08-17",
    endDate: "2026-08-23",
  },
  {
    id: "v3.0-w3",
    index: 3,
    label: "Week 3 · Weekly Rhythm & Reflection",
    startDate: "2026-08-24",
    endDate: "2026-08-30",
  },
  {
    id: "v3.0-w4",
    index: 4,
    label: "Week 4 · Cross-Component Hooks",
    startDate: "2026-08-31",
    endDate: "2026-09-06",
  },
  {
    id: "v3.0-w5",
    index: 5,
    label: "Week 5 · Narrative & Version Log",
    startDate: "2026-09-07",
    endDate: "2026-09-13",
  },
  {
    id: "v3.0-w6",
    index: 6,
    label: "Week 6 · Stabilisation & Closure",
    startDate: "2026-09-14",
    endDate: "2026-09-20",
  },
];

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function longDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function labelForDay(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";

  const base = new Date(today + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  const diffMs = target.getTime() - base.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";

  return longDate(dateStr);
}

export function weekForDate(dateStr: string): string | null {
  const target = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(target.getTime())) return null;

  for (const week of V3_WEEKS) {
    const start = new Date(week.startDate + "T00:00:00");
    const end = new Date(week.endDate + "T23:59:59");
    if (target >= start && target <= end) return week.id;
  }
  return null;
}

export function weekMeta(id: string | null): V3WeekMeta | null {
  if (!id) return null;
  return V3_WEEKS.find((w) => w.id === id) ?? null;
}

export function shortRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return `${start} → ${end}`;
  }

  const fmt = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });

  return `${fmt.format(s)} → ${fmt.format(e)}`;
}
