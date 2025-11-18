"use client";

import { useEffect, useMemo, useState } from "react";
import TodayView from "./components/TodayView";
import HistoryList from "./components/HistoryList";
import { getHealthNow, chooseSleepDayKey } from "./lib/clock";
import { buildMockHealthHistory } from "./lib/mockData";
import type {
  HealthDaySnapshot,
  SleepSession,
  WaterEntry,
  WaterContainer,
  WalkSession,
  TrainingEntry,
  DailyMood,
} from "./lib/types";
import {
  getStoredSleepSessions,
  saveStoredSleepSessions,
  getActiveSleep,
  setActiveSleep,
  clearActiveSleep,
} from "./lib/sleepStore";
import {
  getWaterContainers,
  saveWaterContainers,
  getWaterEntries,
  saveWaterEntries,
} from "./lib/waterStore";
import {
  getWalkSessions,
  saveWalkSessions,
  getActiveWalk,
  setActiveWalk,
  clearActiveWalk,
} from "./lib/walkStore";
import {
  getTrainingEntries,
  saveTrainingEntries,
} from "./lib/trainingStore";
import {
  getDailyMoods,
  saveDailyMoods,
} from "./lib/moodStore";
import {
  hasSupabaseConfig,
  fetchRemoteHealthAll,
  pushRemoteHealthAll,
} from "./lib/remoteHealth";

function applySleepToHistory(
  base: HealthDaySnapshot[],
  sessions: SleepSession[]
): HealthDaySnapshot[] {
  const byDay = new Map<string, number>();

  for (const session of sessions) {
    const prev = byDay.get(session.day) ?? 0;
    byDay.set(session.day, prev + session.durationMinutes);
  }

  return base.map((day) => {
    const override = byDay.get(day.day);
    if (override == null) return day;
    return {
      ...day,
      sleepMinutes: override,
    };
  });
}

function applyWaterToHistory(
  base: HealthDaySnapshot[],
  entries: WaterEntry[]
): HealthDaySnapshot[] {
  const byDay = new Map<string, number>();

  for (const entry of entries) {
    const prev = byDay.get(entry.day) ?? 0;
    byDay.set(entry.day, prev + entry.totalMl);
  }

  return base.map((day) => {
    const override = byDay.get(day.day);
    if (override == null) return day;
    return {
      ...day,
      waterMl: override,
    };
  });
}

function applyWalkToHistory(
  base: HealthDaySnapshot[],
  sessions: WalkSession[]
): HealthDaySnapshot[] {
  const byDay = new Map<string, number>();

  for (const session of sessions) {
    const prev = byDay.get(session.day) ?? 0;
    byDay.set(session.day, prev + session.durationMinutes);
  }

  return base.map((day) => {
    const override = byDay.get(day.day);
    if (override == null) return day;
    return {
      ...day,
      walkMinutes: override,
    };
  });
}

function applyTrainingToHistory(
  base: HealthDaySnapshot[],
  entries: TrainingEntry[]
): HealthDaySnapshot[] {
  const byDay = new Map<
    string,
    { planned: number; actual: number }
  >();

  for (const entry of entries) {
    const bucket = byDay.get(entry.day) ?? { planned: 0, actual: 0 };
    bucket.planned += entry.plannedValue;
    bucket.actual += entry.actualValue;
    byDay.set(entry.day, bucket);
  }

  return base.map((day) => {
    const bucket = byDay.get(day.day);
    if (!bucket || bucket.planned <= 0) {
      return {
        ...day,
        trainingCompletionPercent: null,
      };
    }
    const pct = Math.max(
      0,
      Math.min(200, (bucket.actual / bucket.planned) * 100)
    );
    return {
      ...day,
      trainingCompletionPercent: pct,
    };
  });
}

function applyMoodToHistory(
  base: HealthDaySnapshot[],
  moods: DailyMood[]
): HealthDaySnapshot[] {
  const byDay = new Map<string, DailyMood>();
  for (const mood of moods) {
    byDay.set(mood.day, mood);
  }

  return base.map((day) => {
    const mood = byDay.get(day.day);
    if (!mood) return day;
    return {
      ...day,
      moodRating: mood.rating,
      moodNote: mood.note,
    };
  });
}

function mergeById<T extends { id: string }>(localArr: T[], remoteArr: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of localArr) {
    byId.set(item.id, item);
  }
  for (const item of remoteArr) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

function mergeMoodByDay(localArr: DailyMood[], remoteArr: DailyMood[]): DailyMood[] {
  const byDay = new Map<string, DailyMood>();
  for (const m of localArr) {
    byDay.set(m.day, m);
  }
  for (const m of remoteArr) {
    byDay.set(m.day, m);
  }
  return Array.from(byDay.values());
}

export default function HealthAwakeningClientPage() {
  const [nowDisplay, setNowDisplay] = useState<string>("");
  const [todayKey, setTodayKey] = useState<string>("");
  const [history, setHistory] = useState<HealthDaySnapshot[]>([]);
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [waterContainers, setWaterContainers] = useState<WaterContainer[]>([]);
  const [walkSessions, setWalkSessions] = useState<WalkSession[]>([]);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);
  const [dailyMoods, setDailyMoods] = useState<DailyMood[]>([]);
  const [storageStatus, setStorageStatus] = useState<string>("Local cache only");

  useEffect(() => {
    const updateClock = () => {
      const now = getHealthNow();
      setNowDisplay(`${now.displayTime} · ${now.dayKey} (Asia/Kuwait)`);
      setTodayKey(now.dayKey);
    };

    const boot = () => {
      const now = getHealthNow();
      setNowDisplay(`${now.displayTime} · ${now.dayKey} (Asia/Kuwait)`);
      setTodayKey(now.dayKey);

      const base = buildMockHealthHistory(now.dayKey);

      const storedSleep = getStoredSleepSessions();
      const activeSleep = getActiveSleep();
      setSleepSessions(storedSleep);
      setIsSleeping(Boolean(activeSleep));

      const containers = getWaterContainers();
      const entries = getWaterEntries();
      setWaterContainers(containers);
      setWaterEntries(entries);

      const storedWalk = getWalkSessions();
      const activeWalk = getActiveWalk();
      setWalkSessions(storedWalk);
      setIsWalking(Boolean(activeWalk));

      const storedTraining = getTrainingEntries();
      setTrainingEntries(storedTraining);

      const storedMoods = getDailyMoods();
      setDailyMoods(storedMoods);

      let shaped = applySleepToHistory(base, storedSleep);
      shaped = applyWaterToHistory(shaped, entries);
      shaped = applyWalkToHistory(shaped, storedWalk);
      shaped = applyTrainingToHistory(shaped, storedTraining);
      shaped = applyMoodToHistory(shaped, storedMoods);

      setHistory(shaped);

      if (hasSupabaseConfig()) {
        setStorageStatus("Syncing with Supabase...");
        fetchRemoteHealthAll()
          .then((remote) => {
            if (!remote) {
              setStorageStatus("Local cache · Supabase unreachable");
              return;
            }

            const mergedSleep = mergeById(storedSleep, remote.sleepSessions);
            const mergedWater = mergeById(entries, remote.waterEntries);
            const mergedWalk = mergeById(storedWalk, remote.walkSessions);
            const mergedTraining = mergeById(
              storedTraining,
              remote.trainingEntries
            );
            const mergedMoods = mergeMoodByDay(storedMoods, remote.moods);

            setSleepSessions(mergedSleep);
            setWaterEntries(mergedWater);
            setWalkSessions(mergedWalk);
            setTrainingEntries(mergedTraining);
            setDailyMoods(mergedMoods);

            saveStoredSleepSessions(mergedSleep);
            saveWaterEntries(mergedWater);
            saveWalkSessions(mergedWalk);
            saveTrainingEntries(mergedTraining);
            saveDailyMoods(mergedMoods);

            let h = buildMockHealthHistory(now.dayKey);
            h = applySleepToHistory(h, mergedSleep);
            h = applyWaterToHistory(h, mergedWater);
            h = applyWalkToHistory(h, mergedWalk);
            h = applyTrainingToHistory(h, mergedTraining);
            h = applyMoodToHistory(h, mergedMoods);
            setHistory(h);

            return pushRemoteHealthAll({
              sleepSessions: mergedSleep,
              waterEntries: mergedWater,
              walkSessions: mergedWalk,
              trainingEntries: mergedTraining,
              moods: mergedMoods,
            });
          })
          .then((result) => {
            if (!result) return;
            if (result === "ok") {
              setStorageStatus("Supabase + local cache");
            } else {
              setStorageStatus("Local cache · Supabase unreachable");
            }
          })
          .catch(() => {
            setStorageStatus("Local cache · Supabase unreachable");
          });
      }
    };

    boot();
    const id = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const today =
    history.find((d) => d.day === todayKey) ?? history[0] ?? null;

  const todayTraining = useMemo(() => {
    if (!todayKey) return { planned: 0, actual: 0 };
    const entries = trainingEntries.filter((e) => e.day === todayKey);
    let planned = 0;
    let actual = 0;
    for (const e of entries) {
      planned += e.plannedValue;
      actual += e.actualValue;
    }
    return { planned, actual };
  }, [trainingEntries, todayKey]);

  const todayMood = useMemo(() => {
    if (!todayKey) return null;
    return dailyMoods.find((m) => m.day === todayKey) ?? null;
  }, [dailyMoods, todayKey]);

  const syncOutAll = (
    nextSleep: SleepSession[],
    nextWater: WaterEntry[],
    nextWalk: WalkSession[],
    nextTraining: TrainingEntry[],
    nextMoods: DailyMood[]
  ) => {
    if (!hasSupabaseConfig()) return;
    setStorageStatus("Syncing with Supabase...");
    pushRemoteHealthAll({
      sleepSessions: nextSleep,
      waterEntries: nextWater,
      walkSessions: nextWalk,
      trainingEntries: nextTraining,
      moods: nextMoods,
    })
      .then((result) => {
        if (result === "ok") {
          setStorageStatus("Supabase + local cache");
        } else {
          setStorageStatus("Local cache · Supabase unreachable");
        }
      })
      .catch(() => {
        setStorageStatus("Local cache · Supabase unreachable");
      });
  };

  const handleSleepStart = () => {
    if (isSleeping) return;
    const now = getHealthNow();
    setActiveSleep(now.iso);
    setIsSleeping(true);
  };

  const handleWake = () => {
    if (!isSleeping) return;
    const active = getActiveSleep();
    if (!active) {
      setIsSleeping(false);
      return;
    }

    const now = getHealthNow();
    const start = new Date(active.startTimestamp);
    const end = new Date(now.iso);
    const diffMinutes = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / 60000)
    );

    const dayKey = chooseSleepDayKey(active.startTimestamp, now.iso);

    const newSession: SleepSession = {
      id: `${Date.now()}`,
      day: dayKey,
      startTimestamp: active.startTimestamp,
      endTimestamp: now.iso,
      durationMinutes: diffMinutes,
    };

    const nextSessions = [...sleepSessions, newSession];
    setSleepSessions(nextSessions);
    saveStoredSleepSessions(nextSessions);
    clearActiveSleep();
    setIsSleeping(false);

    setHistory((prev) => applySleepToHistory(prev, nextSessions));

    syncOutAll(
      nextSessions,
      waterEntries,
      walkSessions,
      trainingEntries,
      dailyMoods
    );
  };

  const handleAddWaterByContainer = (containerId: string, quantity: number) => {
    if (!quantity || quantity <= 0) return;
    const container = waterContainers.find((c) => c.id === containerId);
    if (!container) return;

    const now = getHealthNow();
    const totalMl = container.sizeMl * quantity;

    const newEntry: WaterEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      day: now.dayKey,
      timestamp: now.iso,
      containerId: container.id,
      quantity,
      totalMl,
    };

    const nextEntries = [...waterEntries, newEntry];
    setWaterEntries(nextEntries);
    saveWaterEntries(nextEntries);

    setHistory((prev) => applyWaterToHistory(prev, nextEntries));

    syncOutAll(
      sleepSessions,
      nextEntries,
      walkSessions,
      trainingEntries,
      dailyMoods
    );
  };

  const handleAddWaterMl = (ml: number) => {
    if (!ml || ml <= 0) return;
    const now = getHealthNow();

    const newEntry: WaterEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      day: now.dayKey,
      timestamp: now.iso,
      rawMl: ml,
      totalMl: ml,
    };

    const nextEntries = [...waterEntries, newEntry];
    setWaterEntries(nextEntries);
    saveWaterEntries(nextEntries);

    setHistory((prev) => applyWaterToHistory(prev, nextEntries));

    syncOutAll(
      sleepSessions,
      nextEntries,
      walkSessions,
      trainingEntries,
      dailyMoods
    );
  };

  const handleAddCustomContainer = (name: string, sizeMl: number) => {
    if (!name || !sizeMl || sizeMl <= 0) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const newContainer: WaterContainer = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: trimmed,
      sizeMl,
      isDefault: false,
      isActive: true,
    };

    const nextContainers = [...waterContainers, newContainer];
    setWaterContainers(nextContainers);
    saveWaterContainers(nextContainers);
  };

  const handleWalkStart = () => {
    if (isWalking) return;
    const now = getHealthNow();
    setActiveWalk(now.iso, now.dayKey);
    setIsWalking(true);
  };

  const handleWalkStop = () => {
    if (!isWalking) return;
    const active = getActiveWalk();
    if (!active) {
      setIsWalking(false);
      return;
    }

    const now = getHealthNow();
    const start = new Date(active.startTimestamp);
    const end = new Date(now.iso);
    const diffMinutes = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / 60000)
    );

    const newSession: WalkSession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      day: active.day,
      startTimestamp: active.startTimestamp,
      endTimestamp: now.iso,
      durationMinutes: diffMinutes,
    };

    const nextSessions = [...walkSessions, newSession];
    setWalkSessions(nextSessions);
    saveWalkSessions(nextSessions);
    clearActiveWalk();
    setIsWalking(false);

    setHistory((prev) => applyWalkToHistory(prev, nextSessions));

    syncOutAll(
      sleepSessions,
      waterEntries,
      nextSessions,
      trainingEntries,
      dailyMoods
    );
  };

  const handleSaveTraining = (planned: number, actual: number) => {
    if (!todayKey) return;
    const nextEntries: TrainingEntry[] = [
      ...trainingEntries.filter((e) => e.day !== todayKey),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        day: todayKey,
        routineId: "aggregate",
        exerciseId: "aggregate",
        plannedValue: planned,
        actualValue: actual,
      },
    ];
    setTrainingEntries(nextEntries);
    saveTrainingEntries(nextEntries);
    setHistory((prev) => applyTrainingToHistory(prev, nextEntries));

    syncOutAll(
      sleepSessions,
      waterEntries,
      walkSessions,
      nextEntries,
      dailyMoods
    );
  };

  const handleSaveMood = (rating: number, note: string) => {
    if (!todayKey) return;
    const nextMoods: DailyMood[] = [
      ...dailyMoods.filter((m) => m.day !== todayKey),
      {
        day: todayKey,
        rating,
        note: note || undefined,
      },
    ];
    setDailyMoods(nextMoods);
    saveDailyMoods(nextMoods);
    setHistory((prev) => applyMoodToHistory(prev, nextMoods));

    syncOutAll(
      sleepSessions,
      waterEntries,
      walkSessions,
      trainingEntries,
      nextMoods
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-base-200 via-base-200/70 to-base-300 text-base-content">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 md:px-6 space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100/90 p-5 md:p-7 shadow-2xl shadow-primary/10">
          <div className="absolute right-10 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80">
                Health Awakening
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-base-content">
                Body Awakening - Health Core
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Health Awakening is wired to GAIA's time-aware core. Sleep, Water, Walking, Training, and Mood stay in sync with Supabase while remaining offline-first.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary-content">
                  <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                  Live data
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] text-accent-content">
                  Offline cache ready
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-200 px-3 py-1 text-[11px] text-base-content/90">
                  Supabase sync
                </span>
              </div>
            </div>
            <div className="min-w-[230px] w-full sm:w-auto rounded-2xl border border-base-300 bg-base-200/70 p-4 text-right shadow-inner shadow-primary/10 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                Health clock
              </div>
              <div className="text-lg md:text-xl font-semibold">
                {nowDisplay || "Loading Asia/Kuwait time..."}
              </div>
              <div className="text-[11px] text-muted-foreground">{storageStatus}</div>
              <div className="text-[11px] text-muted-foreground">
                Today: {today ? new Date(`${today.day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Pending..."}
              </div>
            </div>
          </div>
        </header>

        {today ? (
          <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1.35fr_0.9fr]">
            <TodayView
              today={today}
              isSleeping={isSleeping}
              onSleepStart={handleSleepStart}
              onWake={handleWake}
              waterContainers={waterContainers}
              onAddWaterByContainer={handleAddWaterByContainer}
              onAddWaterMl={handleAddWaterMl}
              onAddCustomWaterContainer={handleAddCustomContainer}
              isWalking={isWalking}
              onWalkStart={handleWalkStart}
              onWalkStop={handleWalkStop}
              todayTrainingPlanned={todayTraining.planned}
              todayTrainingActual={todayTraining.actual}
              onSaveTraining={handleSaveTraining}
              onSaveMood={handleSaveMood}
            />
            <HistoryList days={history} todayKey={todayKey} />
          </div>
        ) : (
          <p className="text-xs md:text-sm text-muted-foreground">
            Preparing Health Day model...
          </p>
        )}
      </div>
    </main>
  );
}
