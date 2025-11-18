type Prefs = Record<string, any>;

const KEY = "gaia.preferences.v1";

export function saveLocalPreferences(prefs: Prefs) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch (e) {
    // ignore storage errors
  }
}

export function loadLocalPreferences(): Prefs | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function syncPreferencesToLocal(remotePrefs: Prefs | null) {
  // If remotePrefs provided (e.g., fetched from server), back it up locally.
  if (remotePrefs) saveLocalPreferences(remotePrefs);
}

export default {
  saveLocalPreferences,
  loadLocalPreferences,
  syncPreferencesToLocal,
};
