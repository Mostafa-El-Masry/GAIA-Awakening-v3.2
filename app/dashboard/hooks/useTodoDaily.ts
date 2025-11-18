// app/Dashboard/hooks/useTodoDaily.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shiftDate } from "@/utils/dates";

export type Category = "life" | "work" | "distraction";

export type RepeatRule =
  | "none"
  | "daily"
  | "weekdays"
  | "weekends"
  | `weekly:Mon` | `weekly:Tue` | `weekly:Wed` | `weekly:Thu` | `weekly:Fri` | `weekly:Sat` | `weekly:Sun`;

export interface Task {
  id: string;
  category: Category;
  title: string;
  note?: string;
  priority: 1 | 2 | 3;
  pinned: boolean;
  due_date?: string; // YYYY-MM-DD
  repeat: RepeatRule;
  created_at: string; // ISO
  updated_at: string; // ISO
  status_by_date: Record<string, "done" | "skipped">;
}

export interface DailySelection {
  selected: Partial<Record<Category, string | null>>;
  date: string;
}

type StorageShape = { tasks: Task[] };

const STORAGE_KEY = "gaia.todo.v2.0.6";
const SELECTION_PREFIX = "gaia.todo.v2.0.6.selection.";
const KUWAIT_TZ = "Asia/Kuwait";

function safeNowISO() { return new Date().toISOString(); }
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  const r=(n:number)=>Math.floor(Math.random()*n).toString(16).padStart(4,"0");
  return `${Date.now().toString(16)}-${r(0xffff)}-${r(0xffff)}-${r(0xffff)}-${r(0xffff)}${r(0xffff)}`;
}
function getTodayInTZ(tz: string = KUWAIT_TZ): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const y = parts.find(p=>p.type==="year")?.value ?? "0000";
  const m = parts.find(p=>p.type==="month")?.value ?? "01";
  const d = parts.find(p=>p.type==="day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}
function weekdayNameInTZ(date: Date, tz: string = KUWAIT_TZ): "Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun" {
  const parts = new Intl.DateTimeFormat("en-US",{timeZone:tz,weekday:"short"}).formatToParts(date);
  return (parts.find(p=>p.type==="weekday")?.value ?? "Mon").slice(0,3) as any;
}
function matchesRepeat(rule: RepeatRule, dateStr: string, tz: string = KUWAIT_TZ): boolean {
  if (rule === "none") return false;
  const [y,m,d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y,m-1,d,12,0,0));
  const wd = weekdayNameInTZ(date,tz);
  if (rule === "daily") return true;
  if (rule === "weekdays") return !["Sat","Sun"].includes(wd);
  if (rule === "weekends") return ["Sat","Sun"].includes(wd);
  if (rule.startsWith("weekly:")) return wd === rule.split(":")[1];
  return false;
}
function loadStorage(): StorageShape {
  if (typeof window === "undefined") return { tasks: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tasks: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.tasks)) return { tasks: [] };
    return parsed as StorageShape;
  } catch { return { tasks: [] }; }
}
function saveStorage(data: StorageShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadSelection(date: string): DailySelection {
  if (typeof window === "undefined") return { date, selected: {} };
  const raw = window.localStorage.getItem(SELECTION_PREFIX + date);
  if (!raw) return { date, selected: {} };
  try { return JSON.parse(raw) as DailySelection; } catch { return { date, selected: {} }; }
}
function saveSelection(sel: DailySelection) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELECTION_PREFIX + sel.date, JSON.stringify(sel));
}
function compareDates(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : (a > b ? 1 : 0);
}
function rankCandidates(tasks: Task[]): Task[] {
  return tasks.slice().sort((a,b)=>{
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    const cd = compareDates(a.due_date, b.due_date); if (cd) return cd;
    return a.created_at.localeCompare(b.created_at);
  });
}
function taskMatchesToday(t: Task, today: string): boolean {
  const hasRepeatToday = matchesRepeat(t.repeat, today);
  const dueToday = !!t.due_date && t.due_date === today;
  return hasRepeatToday || dueToday;
}

export type SlotState = "pending" | "done" | "idle";

export type SlotInfo = {
  task: Task | null;
  hasAlternate: boolean;
  candidatesCount: number;
  state: SlotState;
  completedTitle?: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function useTodoDaily() {
  const [today, setToday] = useState<string>(() => getTodayInTZ(KUWAIT_TZ));
  const [storage, setStorage] = useState<StorageShape>(() => loadStorage());
  const [selection, setSelection] = useState<DailySelection>(() => loadSelection(getTodayInTZ(KUWAIT_TZ)));
  const tasks = storage.tasks;
  const autoAdvanceRef = useRef<string | null>(null);

  // DB hydrate on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload = await api<{tasks:any[]; statuses:any[]}>("/api/todo");
        if (!mounted) return;
        // Merge: convert DB rows -> Task shape + status_by_date map
        const byId: Record<string, Task> = {};
        for (const t of payload.tasks) {
          byId[t.id] = {
            id: t.id,
            category: t.category,
            title: t.title,
            note: t.note ?? undefined,
            priority: t.priority,
            pinned: !!t.pinned,
            due_date: t.due_date ?? undefined,
            repeat: t.repeat,
            created_at: t.created_at,
            updated_at: t.updated_at,
            status_by_date: {},
          };
        }
        for (const s of payload.statuses) {
          const task = byId[s.task_id];
          if (task) task.status_by_date[s.date] = s.status;
        }
        const merged = Object.values(byId);
        setStorage(prev => {
          const next = { ...prev, tasks: merged };
          saveStorage(next);
          return next;
        });
      } catch (e) {
        // If API fails, remain local-only.
        console.warn("TODO DB hydrate failed; staying local-first.", e);
      }
    })();

    const onVis = () => {
      const t = getTodayInTZ(KUWAIT_TZ);
      setToday(t);
      setSelection(loadSelection(t));
    };
    document.addEventListener("visibilitychange", onVis);
    const timer = setInterval(onVis, 60*60*1000);
    return () => { mounted = false; document.removeEventListener("visibilitychange", onVis); clearInterval(timer); }
  }, []);

  const byCategory = useMemo(() => {
    const map: Record<Category, Task[]> = { life:[], work:[], distraction:[] };
    for (const t of tasks) map[t.category].push(t);
    return map;
  }, [tasks]);

  const candidatesByCat = useMemo(() => {
    const cats: Category[] = ["life","work","distraction"];
    const out: Record<Category, Task[]> = { life:[], work:[], distraction:[] };
    for (const c of cats) {
      const cands = byCategory[c].filter(t => {
        const status = t.status_by_date?.[today];
        const notDoneOrSkipped = status !== "done" && status !== "skipped";
        return notDoneOrSkipped && taskMatchesToday(t, today);
      });
      out[c] = rankCandidates(cands);
    }
    return out;
  }, [byCategory, today]);

  const completedByCat = useMemo(() => {
    const cats: Category[] = ["life", "work", "distraction"];
    const map: Record<Category, Task | null> = { life: null, work: null, distraction: null };
    cats.forEach((c) => {
      map[c] = byCategory[c].find((t) => t.status_by_date?.[today] === "done") ?? null;
    });
    return map;
  }, [byCategory, today]);

  const slotInfo = useMemo<Record<Category, SlotInfo>>(() => {
    const info: Record<Category, SlotInfo> = {
      life: { task: null, hasAlternate: false, candidatesCount: 0, state: "idle" },
      work: { task: null, hasAlternate: false, candidatesCount: 0, state: "idle" },
      distraction: { task: null, hasAlternate: false, candidatesCount: 0, state: "idle" },
    };
    (["life", "work", "distraction"] as Category[]).forEach((c) => {
      const cands = candidatesByCat[c];
      const preferredId = selection.selected[c] ?? null;
      const preferred = cands.find((t) => t.id === preferredId) ?? cands[0] ?? null;
      const completed = completedByCat[c];
      const state: SlotState = preferred ? "pending" : completed ? "done" : "idle";
      info[c] = {
        task: preferred ?? null,
        hasAlternate: preferred ? cands.some((t) => t.id !== preferred.id) : false,
        candidatesCount: cands.length,
        state,
        completedTitle: completed?.title,
      };
    });
    return info;
  }, [candidatesByCat, selection, completedByCat]);

  const refresh = useCallback(()=>{
    setStorage(loadStorage());
    setSelection(loadSelection(getTodayInTZ(KUWAIT_TZ)));
  }, []);

  const replaceTask = useCallback((t: Task) => {
    setStorage(prev => {
      const idx = prev.tasks.findIndex(x => x.id === t.id);
      let tasks = prev.tasks.slice();
      if (idx >= 0) tasks[idx] = t; else tasks.push(t);
      const next = { ...prev, tasks };
      saveStorage(next); return next;
    });
  }, []);

  const addQuickTask = useCallback(async (category: Category, title: string, note?: string, priority: 1|2|3 = 2, pinned=false) => {
    const today = getTodayInTZ(KUWAIT_TZ);
    // find the next date (starting tomorrow) that has no task for this category
    let targetDate = shiftDate(today, 1);
    for (let i = 1; i < 365; i += 1) {
      const candidate = shiftDate(today, i);
      const exists = storage.tasks.some(
        (t) => t.category === category && t.due_date === candidate
      );
      if (!exists) {
        targetDate = candidate;
        break;
      }
    }

    const base: Task = {
      id: uuid(),
      category,
      title: title.trim(),
      note: note?.trim() || undefined,
      priority,
      pinned,
      due_date: targetDate,
      repeat: "none",
      created_at: safeNowISO(),
      updated_at: safeNowISO(),
      status_by_date: {},
    };
    // optimistic local insert
    setStorage((prev) => {
      const next = { ...prev, tasks: [...prev.tasks, base] };
      saveStorage(next);
      return next;
    });
    setSelection((prev) => {
      const s: DailySelection = {
        date: targetDate,
        selected: { ...prev.selected, [category]: base.id },
      };
      saveSelection(s);
      return s;
    });
    // server insert
    try {
      const res = await api<{ task: any }>("/api/todo", {
        method: "POST",
        body: JSON.stringify({
          category,
          title: base.title,
          note: base.note,
          priority,
          pinned,
          due_date: base.due_date,
          repeat: base.repeat,
        }),
      });
      // replace with server copy
      replaceTask({
        ...base,
        id: res.task.id,
        created_at: res.task.created_at,
        updated_at: res.task.updated_at,
      });
    } catch (e) {
      console.warn("DB insert failed; staying local.", e);
    }
  }, [replaceTask, storage.tasks]);

  const markDone = useCallback(async (category: Category) => {
    const t = slotInfo[category].task; if (!t) return;
    // optimistic
    replaceTask({ ...t, status_by_date: { ...(t.status_by_date||{}), [today]: "done" }, updated_at: safeNowISO() });
    try { await api("/api/todo/status", { method:"POST", body: JSON.stringify({ task_id: t.id, date: today, status: "done" })}); }
    catch(e){ console.warn("DB status failed", e); }
  }, [slotInfo, today, replaceTask]);

  const skipTask = useCallback( async (category: Category) => {
    const t = slotInfo[category].task; if (!t) return;
    replaceTask({ ...t, status_by_date: { ...(t.status_by_date||{}), [today]: "skipped" }, updated_at: safeNowISO() });
    try { await api("/api/todo/status", { method:"POST", body: JSON.stringify({ task_id: t.id, date: today, status: "skipped" })}); }
    catch(e){ console.warn("DB status failed", e); }
  }, [slotInfo, today, replaceTask]);

  const showNext = useCallback((category: Category) => {
    const cands = candidatesByCat[category];
    const curId = slotInfo[category].task?.id;
    const next = cands.find(t => t.id !== curId);
    setSelection(prev => { const s: DailySelection = { date: today, selected: { ...prev.selected, [category]: next?.id ?? null } }; saveSelection(s); return s; });
  }, [candidatesByCat, slotInfo, today]);

  const deleteTask = useCallback(async (taskId: string) => {
    setStorage(prev => { const next = { ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }; saveStorage(next); return next; });
    setSelection(prev => { const sel = { ...prev.selected }; (["life","work","distraction"] as Category[]).forEach(c => { if (sel[c] === taskId) sel[c] = null; }); const s: DailySelection = { date: prev.date, selected: sel }; saveSelection(s); return s; });
    try { await api(`/api/todo?id=${encodeURIComponent(taskId)}`, { method: "DELETE" }); } catch(e){ console.warn("DB delete failed", e); }
  }, []);

  const editTask = useCallback(async (taskId: string, patch: Partial<Pick<Task,"title"|"note"|"priority"|"pinned"|"due_date"|"repeat">>) => {
    // optimistic local mutate
    setStorage(prev => {
      const idx = prev.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) return prev;
      const tasks = prev.tasks.slice();
      tasks[idx] = { ...tasks[idx], ...patch, updated_at: safeNowISO() };
      const next = { ...prev, tasks }; saveStorage(next); return next;
    });
    try { await api(`/api/todo?id=${encodeURIComponent(taskId)}`, { method:"PATCH", body: JSON.stringify(patch) }); }
    catch(e){ console.warn("DB patch failed", e); }
  }, []);

  useEffect(() => {
    const cats: Category[] = ["life", "work", "distraction"];
    const hasPending = cats.some((c) => slotInfo[c]?.state === "pending" && slotInfo[c]?.task);
    if (hasPending) {
      autoAdvanceRef.current = null;
      return;
    }
    const hasCompleted = cats.some((c) => slotInfo[c]?.state === "done");
    if (!hasCompleted) return;
    if (autoAdvanceRef.current === today) return;
    autoAdvanceRef.current = today;
    const nextDay = shiftDate(today, 1);
    setToday(nextDay);
    setSelection(loadSelection(nextDay));
  }, [slotInfo, today, setSelection, setToday]);

  return {
    today,
    slotInfo,
    selection,
    tasks,
    refresh,
    addQuickTask,
    markDone,
    skipTask,
    showNext,
    deleteTask,
    editTask,
  };
}
