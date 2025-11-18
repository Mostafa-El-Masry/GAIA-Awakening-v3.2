import { supabase } from "./supabaseClient";
import type {
  SleepSession,
  WaterEntry,
  WalkSession,
  TrainingEntry,
  DailyMood,
} from "./types";

export interface RemoteHealthPayload {
  sleepSessions: SleepSession[];
  waterEntries: WaterEntry[];
  walkSessions: WalkSession[];
  trainingEntries: TrainingEntry[];
  moods: DailyMood[];
}

export function hasSupabaseConfig(): boolean {
  return Boolean(supabase);
}

function mapSleepRowToLocal(row: any): SleepSession {
  return {
    id: String(row.id),
    day: row.day,
    startTimestamp: row.start_timestamp,
    endTimestamp: row.end_timestamp,
    durationMinutes: row.duration_minutes ?? 0,
    note: row.note ?? undefined,
  };
}

function mapSleepLocalToRow(s: SleepSession) {
  return {
    id: s.id,
    day: s.day,
    start_timestamp: s.startTimestamp,
    end_timestamp: s.endTimestamp,
    duration_minutes: s.durationMinutes,
    note: s.note ?? null,
  };
}

function mapWaterRowToLocal(row: any): WaterEntry {
  return {
    id: String(row.id),
    day: row.day,
    timestamp: row.timestamp,
    containerId: row.container_id ?? undefined,
    rawMl: row.raw_ml ?? undefined,
    quantity: row.quantity ?? undefined,
    totalMl: row.total_ml ?? 0,
  };
}

function mapWaterLocalToRow(e: WaterEntry) {
  return {
    id: e.id,
    day: e.day,
    timestamp: e.timestamp,
    container_id: e.containerId ?? null,
    raw_ml: e.rawMl ?? null,
    quantity: e.quantity ?? null,
    total_ml: e.totalMl,
  };
}

function mapWalkRowToLocal(row: any): WalkSession {
  return {
    id: String(row.id),
    day: row.day,
    startTimestamp: row.start_timestamp,
    endTimestamp: row.end_timestamp,
    durationMinutes: row.duration_minutes ?? 0,
    distanceKm: row.distance_km ?? undefined,
    steps: row.steps ?? undefined,
  };
}

function mapWalkLocalToRow(w: WalkSession) {
  return {
    id: w.id,
    day: w.day,
    start_timestamp: w.startTimestamp,
    end_timestamp: w.endTimestamp,
    duration_minutes: w.durationMinutes,
    distance_km: w.distanceKm ?? null,
    steps: w.steps ?? null,
  };
}

function mapTrainingRowToLocal(row: any): TrainingEntry {
  return {
    id: String(row.id),
    day: row.day,
    routineId: row.routine_id,
    exerciseId: row.exercise_id,
    plannedValue: Number(row.planned_value ?? 0),
    actualValue: Number(row.actual_value ?? 0),
    note: row.note ?? undefined,
  };
}

function mapTrainingLocalToRow(t: TrainingEntry) {
  return {
    id: t.id,
    day: t.day,
    routine_id: t.routineId,
    exercise_id: t.exerciseId,
    planned_value: t.plannedValue,
    actual_value: t.actualValue,
    note: t.note ?? null,
  };
}

function mapMoodRowToLocal(row: any): DailyMood {
  return {
    day: row.day,
    rating: row.rating,
    note: row.note ?? undefined,
  };
}

function mapMoodLocalToRow(m: DailyMood) {
  return {
    day: m.day,
    rating: m.rating,
    note: m.note ?? null,
  };
}

/**
 * Fetch all Health data from Supabase.
 * Returns null if Supabase is not configured or if a network error occurs.
 */
export async function fetchRemoteHealthAll(): Promise<RemoteHealthPayload | null> {
  if (!supabase) return null;

  try {
    const [sleepRes, waterRes, walkRes, trainRes, moodRes] = await Promise.all([
      supabase.from("health_sleep_sessions").select("*"),
      supabase.from("health_water_entries").select("*"),
      supabase.from("health_walk_sessions").select("*"),
      supabase.from("health_training_entries").select("*"),
      supabase.from("health_daily_mood").select("*"),
    ]);

    if (
      sleepRes.error ||
      waterRes.error ||
      walkRes.error ||
      trainRes.error ||
      moodRes.error
    ) {
      console.warn("Health Supabase fetch errors:", {
        sleep: sleepRes.error,
        water: waterRes.error,
        walk: walkRes.error,
        train: trainRes.error,
        mood: moodRes.error,
      });
      return null;
    }

    return {
      sleepSessions: (sleepRes.data ?? []).map(mapSleepRowToLocal),
      waterEntries: (waterRes.data ?? []).map(mapWaterRowToLocal),
      walkSessions: (walkRes.data ?? []).map(mapWalkRowToLocal),
      trainingEntries: (trainRes.data ?? []).map(mapTrainingRowToLocal),
      moods: (moodRes.data ?? []).map(mapMoodRowToLocal),
    };
  } catch (err) {
    console.warn("Health Supabase fetch failed:", err);
    return null;
  }
}

/**
 * Push all Health data up to Supabase via upsert.
 * Returns "ok" if all tables succeed, otherwise "error".
 */
export async function pushRemoteHealthAll(payload: RemoteHealthPayload): Promise<"ok" | "error"> {
  if (!supabase) return "error";

  try {
    const { sleepSessions, waterEntries, walkSessions, trainingEntries, moods } =
      payload;

    const tasks: Promise<any>[] = [];

    if (sleepSessions.length > 0) {
      tasks.push(
        supabase
          .from("health_sleep_sessions")
          .upsert(sleepSessions.map(mapSleepLocalToRow))
      );
    }

    if (waterEntries.length > 0) {
      tasks.push(
        supabase
          .from("health_water_entries")
          .upsert(waterEntries.map(mapWaterLocalToRow))
      );
    }

    if (walkSessions.length > 0) {
      tasks.push(
        supabase
          .from("health_walk_sessions")
          .upsert(walkSessions.map(mapWalkLocalToRow))
      );
    }

    if (trainingEntries.length > 0) {
      tasks.push(
        supabase
          .from("health_training_entries")
          .upsert(trainingEntries.map(mapTrainingLocalToRow))
      );
    }

    if (moods.length > 0) {
      tasks.push(
        supabase
          .from("health_daily_mood")
          .upsert(moods.map(mapMoodLocalToRow))
      );
    }

    if (tasks.length === 0) {
      return "ok";
    }

    const results = await Promise.all(tasks);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      console.warn("Health Supabase upsert errors:", results);
      return "error";
    }

    return "ok";
  } catch (err) {
    console.warn("Health Supabase upsert failed:", err);
    return "error";
  }
}
