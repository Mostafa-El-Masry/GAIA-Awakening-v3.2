"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CoreBrainState,
  DailyEntry,
  WeeklySummary,
  DAILY_HOOK_DEFINITIONS,
} from "../lib/types";
import {
  V3_WEEKS,
  labelForDay,
  longDate,
  shortRange,
  todayISO,
  weekForDate,
  weekMeta,
} from "../lib/weeks";
import { buildDailyVoice, buildWeeklyVoice } from "../lib/voice";

const STORAGE_KEY = "gaia_coreBrain_v30_daily";

function emptyState(): CoreBrainState {
  return {
    entries: [],
    weeks: [],
    metaNotes: "",
  };
}

function loadState(): CoreBrainState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<CoreBrainState>;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      weeks: Array.isArray(parsed.weeks) ? parsed.weeks : [],
      metaNotes: typeof parsed.metaNotes === "string" ? parsed.metaNotes : "",
    };
  } catch {
    return emptyState();
  }
}

function saveState(state: CoreBrainState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function ensureEntry(
  state: CoreBrainState,
  dateStr: string
): [CoreBrainState, DailyEntry] {
  const existing = state.entries.find((e) => e.id === dateStr);
  if (existing) {
    // backfill weekId if missing
    if (existing.weekId == null) {
      const updatedExisting: DailyEntry = {
        ...existing,
        weekId: weekForDate(existing.date),
      };
      const nextState: CoreBrainState = {
        ...state,
        entries: state.entries
          .map((e) => (e.id === updatedExisting.id ? updatedExisting : e))
          .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
      };
      return [nextState, updatedExisting];
    }
    return [state, existing];
  }

  const nowIso = new Date().toISOString();
  const fresh: DailyEntry = {
    id: dateStr,
    date: dateStr,
    createdAt: nowIso,
    updatedAt: nowIso,
    summary: "",
    slots: {},
    isClosed: false,
    weekId: weekForDate(dateStr),
  };

  const next: CoreBrainState = {
    ...state,
    entries: [fresh, ...(state.entries ?? [])].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    ),
  };
  return [next, fresh];
}

function ensureWeek(
  state: CoreBrainState,
  weekId: string | null
): [CoreBrainState, WeeklySummary | null] {
  if (!weekId) return [state, null];

  const existing = state.weeks.find((w) => w.id === weekId);
  if (existing) return [state, existing];

  const meta = weekMeta(weekId);
  if (!meta) return [state, null];

  const fresh: WeeklySummary = {
    id: meta.id,
    index: meta.index,
    label: meta.label,
    startDate: meta.startDate,
    endDate: meta.endDate,
    summary: "",
    wentWell: "",
    drained: "",
    improveNextWeek: "",
    signals: {},
  };

  const next: CoreBrainState = {
    ...state,
    weeks: [...state.weeks, fresh].sort((a, b) => a.index - b.index),
  };

  return [next, fresh];
}

export default function CoreBrainClient() {
  const [state, setState] = useState<CoreBrainState | null>(null);
  const [today] = useState<string>(todayISO());
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);

  // Initial load + make sure today + its week exist
  useEffect(() => {
    const initial = loadState();
    const [withToday, todayEntry] = ensureEntry(initial, today);
    const [withWeek, week] = ensureWeek(withToday, todayEntry.weekId);
    setState(withWeek);
    setActiveWeekId(week?.id ?? todayEntry.weekId ?? null);
  }, [today]);

  // Persist
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const todayEntry: DailyEntry | null = useMemo(() => {
    if (!state) return null;
    return state.entries.find((e) => e.id === today) ?? null;
  }, [state, today]);

  const recentEntries: DailyEntry[] = useMemo(() => {
    if (!state) return [];
    return [...state.entries]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 10);
  }, [state]);

  const activeWeek: WeeklySummary | null = useMemo(() => {
    if (!state || !activeWeekId) return null;
    return state.weeks.find((w) => w.id === activeWeekId) ?? null;
  }, [state, activeWeekId]);

  const metaNotes = state?.metaNotes ?? "";

  function updateToday(mutator: (entry: DailyEntry) => DailyEntry) {
    if (!state || !todayEntry) return;
    const updated = mutator(todayEntry);
    const next: CoreBrainState = {
      ...state,
      entries: state.entries
        .map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    };
    setState(next);
  }

  function updateWeek(mutator: (week: WeeklySummary) => WeeklySummary) {
    if (!state || !activeWeek) return;
    const updated = mutator(activeWeek);
    const next: CoreBrainState = {
      ...state,
      weeks: state.weeks
        .map((w) => (w.id === updated.id ? updated : w))
        .sort((a, b) => a.index - b.index),
    };
    setState(next);
  }

  function updateMetaNotes(value: string) {
    if (!state) return;
    const next: CoreBrainState = {
      ...state,
      metaNotes: value,
    };
    setState(next);
  }

  if (!state || !todayEntry) {
    return (
      <div className="rounded-xl bg-base-100 p-4 text-sm text-base-content/80 shadow">
        Booting the Daily Thread… if this message stays, refresh once.
      </div>
    );
  }

  const todayWeek = weekMeta(todayEntry.weekId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
      {/* Left column: Today + recent days */}
      <section className="space-y-4">
        {/* Today */}
        <div className="rounded-2xl bg-base-100 p-4 shadow">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                {labelForDay(todayEntry.date, today)}
              </div>
              <div className="text-sm text-base-content">
                {longDate(todayEntry.date)}
              </div>
              {todayWeek && (
                <div className="mt-1 text-[11px] text-base-content/70">
                  {todayWeek.label} ·{" "}
                  {shortRange(todayWeek.startDate, todayWeek.endDate)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                updateToday((entry) => ({
                  ...entry,
                  isClosed: !entry.isClosed,
                  updatedAt: new Date().toISOString(),
                }))
              }
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                todayEntry.isClosed
                  ? "bg-success text-success-content"
                  : "bg-base-200 text-base-content"
              }`}
            >
              {todayEntry.isClosed ? "Day closed" : "Mark day as closed"}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/70">
                Today&apos;s main note
              </label>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full"
                rows={3}
                placeholder="One honest sentence about today is enough."
                value={todayEntry.summary}
                onChange={(e) =>
                  updateToday((entry) => ({
                    ...entry,
                    summary: e.target.value,
                    updatedAt: new Date().toISOString(),
                  }))
                }
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {DAILY_HOOK_DEFINITIONS.map((hook) => {
                const value = todayEntry.slots[hook.key] ?? "";
                return (
                  <div key={hook.key} className="md:col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
                      {hook.shortLabel}
                    </label>
                    <textarea
                      className="textarea textarea-bordered textarea-xs w-full"
                      rows={2}
                      value={value}
                      onChange={(e) =>
                        updateToday((entry) => ({
                          ...entry,
                          slots: {
                            ...entry.slots,
                            [hook.key]: e.target.value,
                          },
                          updatedAt: new Date().toISOString(),
                        }))
                      }
                    />
                    <p className="mt-1 text-[10px] text-base-content/60">
                      {hook.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 rounded-xl bg-base-200 p-3 text-xs text-base-content/80">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                GAIA&apos;s voice · daily preview
              </div>
              <p>{buildDailyVoice(todayEntry)}</p>
            </div>
          </div>
        </div>

        {/* Recent days thread */}
        <div className="rounded-2xl bg-base-100 p-4 shadow">
          <h2 className="mb-2 text-sm font-semibold text-base-content">
            Recent days · Daily Thread
          </h2>
          <ol className="space-y-3 text-xs">
            {recentEntries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3">
                <div className="mt-[3px] h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-semibold text-base-content">
                      {labelForDay(entry.date, today)}
                    </span>
                    <span className="text-[11px] text-base-content/60">
                      {longDate(entry.date)}
                    </span>
                  </div>
                  {entry.summary?.trim() && (
                    <p className="mt-1 text-[11px] text-base-content/80">
                      {entry.summary}
                    </p>
                  )}
                  {entry.isClosed && (
                    <span className="mt-1 inline-flex rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      Closed
                    </span>
                  )}
                </div>
              </li>
            ))}
            {recentEntries.length === 0 && (
              <li className="text-base-content/70">
                When you start writing, the last few days will appear here as a
                vertical thread.
              </li>
            )}
          </ol>
        </div>
      </section>

      {/* Right column: Weekly overview + hooks map + meta-notes + version status */}
      <section className="space-y-4">
        <div className="rounded-2xl bg-base-100 p-4 shadow">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-base-content">
              Weekly overview & reflection
            </h2>
            <select
              className="select select-bordered select-xs"
              value={activeWeekId ?? ""}
              onChange={(e) => {
                if (!state) return;
                const value = e.target.value || null;
                const [nextState, week] = ensureWeek(state, value);
                setState(nextState);
                setActiveWeekId(week?.id ?? value);
              }}
            >
              <option value="">Pick a week</option>
              {V3_WEEKS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {activeWeek ? (
            <div className="space-y-3 text-xs">
              <p className="text-[11px] text-base-content/70">
                {shortRange(activeWeek.startDate, activeWeek.endDate)}
              </p>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                  Short summary
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-xs w-full"
                  rows={2}
                  placeholder="In one or two sentences, how did this week feel?"
                  value={activeWeek.summary}
                  onChange={(e) =>
                    updateWeek((w) => ({
                      ...w,
                      summary: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                  What went well this week?
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-xs w-full"
                  rows={2}
                  value={activeWeek.wentWell}
                  onChange={(e) =>
                    updateWeek((w) => ({
                      ...w,
                      wentWell: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                  What drained you?
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-xs w-full"
                  rows={2}
                  value={activeWeek.drained}
                  onChange={(e) =>
                    updateWeek((w) => ({
                      ...w,
                      drained: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                  One thing to improve next week
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-xs w-full"
                  rows={2}
                  value={activeWeek.improveNextWeek}
                  onChange={(e) =>
                    updateWeek((w) => ({
                      ...w,
                      improveNextWeek: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="rounded-xl bg-base-200 p-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                  Signals placeholders
                </div>
                <p className="text-[11px] text-base-content/80">
                  In v3.0 these are just concepts. Later, Health, Wealth,
                  Learning and Work can surface simple signals here, like
                  &ldquo;4 walks&rdquo;, &ldquo;saved 2k&rdquo;,
                  &ldquo;3 study sessions&rdquo; or &ldquo;heavy automation
                  day&rdquo;. For now, you can write them manually in the notes
                  above.
                </p>
              </div>

              <div className="rounded-xl bg-base-200 p-3 text-xs text-base-content/80">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                  GAIA&apos;s voice · weekly preview
                </div>
                <p>{buildWeeklyVoice(activeWeek)}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-base-content/70">
              Pick one of the six v3.0 weeks to give it a short summary and a
              reflection. Each week becomes a small story instead of just seven
              loose days.
            </p>
          )}
        </div>

        {/* Hooks map */}
        <div className="rounded-2xl bg-base-100 p-4 text-[11px] text-base-content/80 shadow">
          <h3 className="mb-1 text-sm font-semibold text-base-content">
            Daily hooks map
          </h3>
          <p className="mb-2">
            These are the hooks that other components will use when they talk to
            the Daily Thread. Names stay stable so future versions can plug in
            without redesigning this page.
          </p>
          <ul className="space-y-2">
            {DAILY_HOOK_DEFINITIONS.map((hook) => (
              <li key={hook.key}>
                <div className="text-[11px] font-semibold text-base-content">
                  {hook.key} — {hook.shortLabel}
                </div>
                <p className="text-[11px] text-base-content/80">
                  {hook.futureSource}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Meta-notes */}
        <div className="rounded-2xl bg-base-100 p-4 text-[11px] text-base-content/80 shadow">
          <h3 className="mb-1 text-sm font-semibold text-base-content">
            Meta-notes about using the Daily Thread (v3.0)
          </h3>
          <p className="mb-2">
            This is for you, not for data. Write what feels natural, what feels
            heavy, and what you want the next versions of GAIA to change or
            add. v3.1+ can look at this box when you redesign the Core Brain.
          </p>
          <textarea
            className="textarea textarea-bordered textarea-xs w-full"
            rows={3}
            placeholder="For example: “Writing short notes works; weekly reflection feels heavy; I want automatic prompts at night.”"
            value={metaNotes}
            onChange={(e) => updateMetaNotes(e.target.value)}
          />
        </div>

        {/* Version status card */}
        <div className="rounded-2xl bg-base-100 p-4 text-[11px] text-base-content/80 shadow">
          <h3 className="mb-1 text-sm font-semibold text-base-content">
            Version status · GAIA Awakening v3.0
          </h3>
          <p className="mb-2">
            v3.0 for the Core Brain / Daily Thread is considered complete and
            closes on <span className="font-semibold">Sun Sep 20, 2026</span>.
          </p>
          <p className="mb-1">
            This version gives you a stable foundation: daily notes, weekly
            reflection, clear hooks for Health / Wealth / Learning / Work /
            Memories, and a gentle local voice.
          </p>
          <p>
            Anything beyond that — real numbers, graphs, automatic prompts or AI
            guidance — belongs to v3.1+ so you can iterate without touching this
            layout or data model.
          </p>
        </div>
      </section>
    </div>
  );
}
