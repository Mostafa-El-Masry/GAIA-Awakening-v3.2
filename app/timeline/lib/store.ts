"use client";

import { readJSON, writeJSON } from "@/lib/user-storage";
import type { TimelineData, TimelinePrefs, TLEvent } from './types';

const DATA_KEY = 'gaia_timeline_v1_events';
const PREF_KEY = 'gaia_timeline_v1_prefs';

export function loadData(): TimelineData {
  return readJSON<TimelineData>(DATA_KEY, { events: [] });
}

export function saveData(d: TimelineData) {
  writeJSON(DATA_KEY, d);
}

export function loadPrefs(): TimelinePrefs {
  return readJSON<TimelinePrefs>(PREF_KEY, {
    zoom: "cosmic",
    showCosmic: true,
    showHuman: true,
    showPersonal: true,
    sort: "chronological",
  });
}

export function savePrefs(p: TimelinePrefs) {
  writeJSON(PREF_KEY, p);
}

export function addEvent(d: TimelineData, ev: Omit<TLEvent, "id" | "createdAt">): TLEvent {
  const id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const e: TLEvent = { ...ev, id, createdAt: new Date().toISOString() };
  d.events.push(e);
  saveData(d);
  return e;
}

export function removeEvent(d: TimelineData, id: string) {
  const i = d.events.findIndex(e => e.id === id);
  if (i >= 0) {
    d.events.splice(i, 1);
    saveData(d);
  }
}

export function exportJSON(d: TimelineData) {
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'gaia-timeline.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function importJSON(setter: (d: TimelineData)=>void) {
  return new Promise<void>((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = async () => {
      const f = inp.files?.[0]; if (!f) return resolve();
      const text = await f.text();
      try {
        const data = JSON.parse(text) as TimelineData;
        saveData(data); setter(data);
      } catch {}
      resolve();
    };
    inp.click();
  });
}
