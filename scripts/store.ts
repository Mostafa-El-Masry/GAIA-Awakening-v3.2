"use client";

import { readJSON, writeJSON } from "@/lib/user-storage";
import { shiftDate, todayKey } from "@/utils/dates";

export type Category = "life" | "programming" | "distraction";

export type DailyTask = {
  id: string;
  category: Category;
  date: string;
  title: string;
  notes?: string;
  done: boolean;
  doneAt?: string;
};

export type DailyTrioByDate = Partial<Record<Category, DailyTask>>;
export type DailyStore = Record<string, DailyTrioByDate>;

const STORAGE_KEY = "gaia.dailytrio.v1";
const UPDATE_EVENT = "gaia:dailytrio:update";
const categories: Category[] = ["life", "programming", "distraction"];

function hasWindow() {
  return typeof window !== "undefined";
}

function emitUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function getStore(): DailyStore {
  return readJSON<DailyStore>(STORAGE_KEY, {});
}

export function saveStore(store: DailyStore): void {
  writeJSON(STORAGE_KEY, store);
  emitUpdate();
}

export function ensureDate(date: string): void {
  if (!hasWindow()) return;
  const store = getStore();
  if (!store[date]) {
    store[date] = {};
    saveStore(store);
  }
}

export function upsertTask(task: DailyTask): void {
  if (!hasWindow()) return;
  const store = getStore();
  const day = store[task.date] ?? {};
  day[task.category] = { ...task, done: Boolean(task.done) };
  store[task.date] = day;
  saveStore(store);
}

export function toggleDone(
  date: string,
  category: Category,
  done: boolean
): void {
  if (!hasWindow()) return;
  const store = getStore();
  const day = store[date];
  if (!day || !day[category]) return;
  const doneAt = done ? todayKey() : undefined;
  day[category] = { ...day[category], done, doneAt };
  saveStore(store);
}

export function dayHasPending(date: string): boolean {
  const store = getStore();
  const day = store[date];
  if (!day) return true;
  return categories.some((category) => {
    const task = day[category];
    return !task || !task.done;
  });
}

export function getNextActionableDay(onOrAfterDate: string): string | null {
  let key = onOrAfterDate;
  for (let i = 0; i < 365; i += 1) {
    if (dayHasPending(key)) return key;
    key = shiftDate(key, 1);
  }
  return null;
}

export function getDay(date: string): DailyTrioByDate {
  const store = getStore();
  return store[date] ?? {};
}

export function updateTaskNotes(
  date: string,
  category: Category,
  notes?: string
): void {
  updateTaskDetails(date, category, { notes });
}

type EditableFields = {
  title?: string;
  notes?: string;
};

export function updateTaskDetails(
  date: string,
  category: Category,
  updates: EditableFields
): void {
  if (!hasWindow()) return;
  const store = getStore();
  const day = store[date];
  if (!day || !day[category]) return;

  const task = day[category]!;
  const hasTitle = Object.prototype.hasOwnProperty.call(updates, "title");
  const hasNotes = Object.prototype.hasOwnProperty.call(updates, "notes");

  if (!hasTitle && !hasNotes) return;

  let nextTitle = task.title;
  if (hasTitle) {
    const candidate = updates.title;
    if (typeof candidate !== "string") return;
    const trimmed = candidate.trim();
    if (!trimmed) return;
    nextTitle = trimmed;
  }

  let nextNotes = task.notes;
  if (hasNotes) {
    const trimmed = updates.notes?.trim();
    nextNotes = trimmed ? trimmed : undefined;
  }

  day[category] = {
    ...task,
    title: nextTitle,
    notes: nextNotes,
  };
  saveStore(store);
}

export function getPendingCount(date: string): number {
  const day = getDay(date);
  return categories.reduce((count, category) => {
    const task = day[category];
    if (!task || !task.done) return count + 1;
    return count;
  }, 0);
}

export function getCategories() {
  return categories.slice();
}

export function hasStoreSupport() {
  return hasWindow();
}

export const DailyStoreEvent = UPDATE_EVENT;
