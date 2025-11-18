import type { DayKey, HealthDaySnapshot } from "./types";

function addDays(base: Date, delta: number): Date {
  const copy = new Date(base.getTime());
  copy.setDate(copy.getDate() + delta);
  return copy;
}

function formatDayKey(d: Date): DayKey {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * For Weeks 1–5 we don't have Supabase wired yet.
 * This helper fabricates a small recent history so the UI feels alive,
 * and will be gradually overridden by real tracked data (Sleep, Water, Walking, Training, Mood).
 */
export function buildMockHealthHistory(todayKey: DayKey): HealthDaySnapshot[] {
  const [year, month, day] = todayKey.split("-").map((v) => Number(v));
  const today = new Date(year, month - 1, day);

  const days: HealthDaySnapshot[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    const key = formatDayKey(d);
    const factor = Math.max(0, 6 - i);
    const sleepMinutes = 300 + factor * 15; // between ~5h and ~7.5h
    const waterMl = 1200 + factor * 150; // between 1.2L and ~2.1L
    const walkMinutes = factor * 5; // simple ramp
    const trainingCompletionPercent = factor === 0 ? null : 40 + factor * 10;
    const moodRating = 2 + Math.floor(factor / 2);

    days.push({
      day: key,
      sleepMinutes,
      waterMl,
      walkMinutes,
      trainingCompletionPercent,
      moodRating,
      moodNote:
        i === 0 ? "Mocked data – real tracking coming soon." : undefined,
    });
  }

  return days;
}
