import type { WaterEntry, WaterContainer } from "./types";

const ENTRIES_KEY = "gaia_health_water_entries";
const CONTAINERS_KEY = "gaia_health_water_containers";

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function defaultContainers(): WaterContainer[] {
  return [
    {
      id: "cup-300ml",
      name: "Cup",
      sizeMl: 300,
      isDefault: true,
      isActive: true,
    },
    {
      id: "bottle-330ml",
      name: "Bottle 330",
      sizeMl: 330,
      isDefault: true,
      isActive: true,
    },
    {
      id: "bottle-500ml",
      name: "Bottle 500",
      sizeMl: 500,
      isDefault: true,
      isActive: true,
    },
  ];
}

export function getWaterContainers(): WaterContainer[] {
  if (typeof window === "undefined") {
    return defaultContainers();
  }
  const raw = window.localStorage.getItem(CONTAINERS_KEY);
  const parsed = safeParseJson<WaterContainer[]>(raw);
  if (!parsed || parsed.length === 0) {
    const defaults = defaultContainers();
    window.localStorage.setItem(CONTAINERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return parsed;
}

export function saveWaterContainers(containers: WaterContainer[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTAINERS_KEY, JSON.stringify(containers));
}

export function getWaterEntries(): WaterEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ENTRIES_KEY);
  const parsed = safeParseJson<WaterEntry[]>(raw);
  if (!parsed) return [];
  return parsed;
}

export function saveWaterEntries(entries: WaterEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}
