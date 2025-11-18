import type { WalkSession } from "./types";

const WALK_SESSIONS_KEY = "gaia_health_walk_sessions";
const ACTIVE_WALK_KEY = "gaia_health_walk_active";

interface ActiveWalk {
  startTimestamp: string;
  day: string; // DayKey at start (Asia/Kuwait)
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getWalkSessions(): WalkSession[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(WALK_SESSIONS_KEY);
  const parsed = safeParseJson<WalkSession[]>(raw);
  if (!parsed) return [];
  return parsed;
}

export function saveWalkSessions(sessions: WalkSession[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WALK_SESSIONS_KEY, JSON.stringify(sessions));
}

export function getActiveWalk(): ActiveWalk | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ACTIVE_WALK_KEY);
  const parsed = safeParseJson<ActiveWalk>(raw);
  return parsed;
}

export function setActiveWalk(startTimestamp: string, day: string): void {
  if (typeof window === "undefined") return;
  const payload: ActiveWalk = { startTimestamp, day };
  window.localStorage.setItem(ACTIVE_WALK_KEY, JSON.stringify(payload));
}

export function clearActiveWalk(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_WALK_KEY);
}
