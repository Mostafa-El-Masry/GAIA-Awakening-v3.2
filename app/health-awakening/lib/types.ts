export type DayKey = string; // "YYYY-MM-DD" in Asia/Kuwait

export interface SleepSession {
  id: string;
  day: DayKey;
  startTimestamp: string; // ISO
  endTimestamp: string;   // ISO
  durationMinutes: number;
  note?: string;
}

export interface WaterEntry {
  id: string;
  day: DayKey;
  timestamp: string;
  containerId?: string;
  rawMl?: number;
  quantity?: number;
  totalMl: number;
}

export interface WaterContainer {
  id: string;
  name: string;
  sizeMl: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface WalkSession {
  id: string;
  day: DayKey;
  startTimestamp: string;
  endTimestamp: string;
  durationMinutes: number;
  distanceKm?: number;
  steps?: number;
}

export type TrainingUnit = "reps" | "minutes";

export interface TrainingRoutine {
  id: string;
  name: string;
  description?: string;
}

export interface TrainingExercise {
  id: string;
  routineId: string;
  name: string;
  unit: TrainingUnit;
  plannedValue: number;
}

export interface TrainingEntry {
  id: string;
  day: DayKey;
  routineId: string;
  exerciseId: string;
  plannedValue: number;
  actualValue: number;
  note?: string;
}

export interface DailyMood {
  day: DayKey;
  rating: number; // 1-5
  note?: string;
}

export interface HealthDaySnapshot {
  day: DayKey;
  sleepMinutes: number;
  waterMl: number;
  walkMinutes: number;
  trainingCompletionPercent: number | null;
  moodRating: number | null;
  moodNote?: string;
}
