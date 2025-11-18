import type { DailyMood } from "./types";

const MOOD_KEY = "gaia_health_daily_mood";

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getDailyMoods(): DailyMood[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(MOOD_KEY);
  const parsed = safeParseJson<DailyMood[]>(raw);
  if (!parsed) return [];
  return parsed;
}

export function saveDailyMoods(moods: DailyMood[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOOD_KEY, JSON.stringify(moods));
}
