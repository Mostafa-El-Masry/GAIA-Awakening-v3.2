"use client";

import { readJSON, writeJSON } from "@/lib/user-storage";

export interface ExpenseItem {
  id: string;
  name: string;
  amountKD: number;
}

export interface AppSettings {
  monthlyIncomeKD: number;
  fxEgpPerKd: number;
  expenses: ExpenseItem[];
  reinvest: boolean;
  aprSchedule: { monthIndex: number; aprPercent: number }[]; // monthIndex relative to now
  planDTargetMonthlyEgp: number; // default 5000
  startingPrincipalEgp?: number; // existing certificates principal in EGP
  planCTargetMonthlyEgp?: number; // Plan C monthly certificate income target (EGP)
  activePlan?: "A" | "B" | "C" | "D";
  reinvestPercent?: number; // 0..100 percent of interest to reinvest
  plansCollapsed?: boolean; // persist Plans collapsed state
}

const STORAGE_KEY = "gaia_wealth_settings_v2";

export const DEFAULT_SETTINGS: AppSettings = {
  monthlyIncomeKD: 400,
  fxEgpPerKd: 23.5,
  expenses: [
    { id: "rent", name: "Rent", amountKD: 40 },
    { id: "mobile", name: "Mobile", amountKD: 27 },
    { id: "bus", name: "Bus", amountKD: 15 },
    { id: "wife", name: "Wife", amountKD: 80 },
    { id: "food", name: "Food", amountKD: 50 },
  ],
  reinvest: true,
  // start with a simple flat 17% APR schedule by default
  aprSchedule: [{ monthIndex: 0, aprPercent: 17 }],
  planDTargetMonthlyEgp: 1000, // Plan D: Basic stability (1,000 EGP/month)
  startingPrincipalEgp: 0,
  planCTargetMonthlyEgp: 3000, // Plan C: Comfortable buffer (3,000 EGP/month)
  activePlan: "D",
  reinvestPercent: 100,
  plansCollapsed: true,
};

export function loadSettings(): AppSettings {
  try {
    return readJSON<AppSettings>(STORAGE_KEY, DEFAULT_SETTINGS);
  } catch (e) {
    console.error("Failed to load settings, using defaults", e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings) {
  try {
    writeJSON(STORAGE_KEY, s);
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}
