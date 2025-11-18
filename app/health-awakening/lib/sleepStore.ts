import type { SleepSession } from "./types";

const SESSIONS_KEY = "gaia_health_sleep_sessions";
const ACTIVE_KEY = "gaia_health_sleep_active";

interface ActiveSleep {
  startTimestamp: string;
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getStoredSleepSessions(): SleepSession[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SESSIONS_KEY);
  const parsed = safeParseJson<SleepSession[]>(raw);
  if (!parsed) return [];
  return parsed;
}

export function saveStoredSleepSessions(sessions: SleepSession[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getActiveSleep(): ActiveSleep | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ACTIVE_KEY);
  const parsed = safeParseJson<ActiveSleep>(raw);
  return parsed;
}

export function setActiveSleep(startTimestamp: string): void {
  if (typeof window === "undefined") return;
  const payload: ActiveSleep = { startTimestamp };
  window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(payload));
}

export function clearActiveSleep(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_KEY);
}
