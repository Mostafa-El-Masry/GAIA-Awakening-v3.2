import type { DayKey, MonthKey, WealthInstrument } from "./types";
import { getTodayInKuwait } from "./summary";

function parseDayKey(day: DayKey): { year: number; month: number; day: number } {
  const [y, m, d] = day.split("-").map((v) => parseInt(v, 10));
  return {
    year: Number.isFinite(y) ? y : 1970,
    month: Number.isFinite(m) ? m : 1,
    day: Number.isFinite(d) ? d : 1,
  };
}

function toMonthKeyFromDay(day: DayKey): MonthKey {
  return day.slice(0, 7);
}

function monthsBetween(start: DayKey, end: DayKey): number {
  const s = parseDayKey(start);
  const e = parseDayKey(end);
  return (e.year - s.year) * 12 + (e.month - s.month);
}

export function estimateMonthlyInterest(inst: WealthInstrument): number {
  if (!Number.isFinite(inst.principal) || !Number.isFinite(inst.annualRatePercent)) {
    return 0;
  }
  const annualRate = inst.annualRatePercent / 100;
  const monthlyRate = annualRate / 12;
  return inst.principal * monthlyRate;
}

export function remainingTermMonths(inst: WealthInstrument, today?: DayKey): number {
  const todayKey = today ?? getTodayInKuwait();
  const elapsed = Math.max(0, monthsBetween(inst.startDate, todayKey));
  const remaining = Math.max(0, inst.termMonths - elapsed);
  return remaining;
}

export function estimateTotalInterestOverHorizon(
  inst: WealthInstrument,
  horizonMonths: number,
  today?: DayKey,
): number {
  const remaining = remainingTermMonths(inst, today);
  const months = Math.max(0, Math.min(remaining || horizonMonths, horizonMonths));
  const monthly = estimateMonthlyInterest(inst);
  return monthly * months;
}

export function monthLabel(monthKey: MonthKey): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = parseInt(yearStr ?? "0", 10);
  const month = parseInt(monthStr ?? "0", 10);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function instrumentEndMonth(inst: WealthInstrument): MonthKey {
  const start = parseDayKey(inst.startDate);
  const totalMonths = start.year * 12 + (start.month - 1) + inst.termMonths;
  const endYear = Math.floor(totalMonths / 12);
  const endMonth = (totalMonths % 12) + 1;
  const y = String(endYear).padStart(4, "0");
  const m = String(endMonth).padStart(2, "0");
  return `${y}-${m}`;
}
