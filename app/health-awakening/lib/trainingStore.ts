import type { TrainingEntry } from "./types";

const TRAINING_ENTRIES_KEY = "gaia_health_training_entries";

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getTrainingEntries(): TrainingEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(TRAINING_ENTRIES_KEY);
  const parsed = safeParseJson<TrainingEntry[]>(raw);
  if (!parsed) return [];
  return parsed;
}

export function saveTrainingEntries(entries: TrainingEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRAINING_ENTRIES_KEY, JSON.stringify(entries));
}
