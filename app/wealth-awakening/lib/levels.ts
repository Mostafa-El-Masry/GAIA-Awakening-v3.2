import type {
  WealthLevelsSnapshot,
  WealthLevelDefinition,
  WealthOverview,
  WealthFlow,
  MonthKey,
} from "./types";
import { getTodayInKuwait } from "./summary";

const LEVELS: WealthLevelDefinition[] = [
  {
    id: "L1",
    name: "Thin buffer",
    shortLabel: "L1 · Thin buffer",
    order: 1,
    minMonthsOfExpenses: 0,
    minInterestCoveragePercent: 0,
    description:
      "You have some money, but it would not comfortably cover a full month of your typical expenses yet.",
  },
  {
    id: "L2",
    name: "First month",
    shortLabel: "L2 · First month",
    order: 2,
    minMonthsOfExpenses: 1,
    minInterestCoveragePercent: 0,
    description:
      "Your savings can roughly cover about one month of expenses. This is the first real breathing room.",
  },
  {
    id: "L3",
    name: "3-month runway",
    shortLabel: "L3 · 3-month runway",
    order: 3,
    minMonthsOfExpenses: 3,
    minInterestCoveragePercent: 0,
    description:
      "You could keep your current life running for around three months even with no new income.",
  },
  {
    id: "L4",
    name: "6-month runway",
    shortLabel: "L4 · 6-month runway",
    order: 4,
    minMonthsOfExpenses: 6,
    minInterestCoveragePercent: 0,
    description:
      "Your savings could cover about half a year of expenses. This is a strong stability zone.",
  },
  {
    id: "L5",
    name: "1-year runway",
    shortLabel: "L5 · 1-year runway",
    order: 5,
    minMonthsOfExpenses: 12,
    minInterestCoveragePercent: 0,
    description:
      "You have roughly one year of expenses parked. You are well into the \"Stable\" territory.",
  },
  {
    id: "L6",
    name: "Interest helper",
    shortLabel: "L6 · Interest helper",
    order: 6,
    minMonthsOfExpenses: 12,
    minInterestCoveragePercent: 20,
    description:
      "Your savings are strong and interest is starting to meaningfully cover a slice of your costs.",
  },
  {
    id: "L7",
    name: "Interest cover",
    shortLabel: "L7 · Interest cover",
    order: 7,
    minMonthsOfExpenses: 12,
    minInterestCoveragePercent: 100,
    description:
      "Based on today&apos;s numbers, interest income could roughly match or exceed your typical monthly expenses.",
  },
];

function toMonthKey(day: string): MonthKey {
  return day.slice(0, 7);
}

function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((acc, item) => acc + fn(item), 0);
}

function flowsForMonth(flows: WealthFlow[], monthKey: MonthKey): WealthFlow[] {
  return flows.filter((f) => toMonthKey(f.date) === monthKey);
}

export function buildLevelsSnapshot(
  overview: WealthOverview,
): WealthLevelsSnapshot {
  const today = getTodayInKuwait();
  const monthKey = toMonthKey(today);

  const flowsThisMonth = flowsForMonth(overview.flows, monthKey);

  // Estimate monthly expenses in primary currency
  const monthlyExpenses = sumBy(
    flowsThisMonth.filter(
      (f) => f.kind === "expense" && f.currency === overview.primaryCurrency,
    ),
    (f) => f.amount,
  );

  const monthlyPassiveIncome = sumBy(
    flowsThisMonth.filter(
      (f) => f.kind === "interest" && f.currency === overview.primaryCurrency,
    ),
    (f) => f.amount,
  );

  const totalPrimaryCurrencyStash = sumBy(
    overview.accounts.filter(
      (a) => a.currency === overview.primaryCurrency,
    ),
    (a) => a.currentBalance,
  );

  const monthsOfExpensesSaved =
    monthlyExpenses > 0
      ? totalPrimaryCurrencyStash / monthlyExpenses
      : null;

  const coveragePercent =
    monthlyExpenses > 0
      ? (monthlyPassiveIncome / monthlyExpenses) * 100
      : null;

  const snapshotBase: Omit<WealthLevelsSnapshot, "levels" | "currentLevelId" | "nextLevelId"> =
    {
      monthsOfExpensesSaved,
      monthlyPassiveIncome:
        monthlyPassiveIncome > 0 ? monthlyPassiveIncome : 0,
      estimatedMonthlyExpenses: monthlyExpenses > 0 ? monthlyExpenses : null,
      coveragePercent,
    };

  if (monthsOfExpensesSaved === null || !Number.isFinite(monthsOfExpensesSaved)) {
    return {
      ...snapshotBase,
      levels: LEVELS,
      currentLevelId: null,
      nextLevelId: LEVELS[0]?.id ?? null,
    };
  }

  // Determine current level by thresholds
  let current: WealthLevelDefinition | null = null;
  for (const level of LEVELS) {
    const meetsMonths =
      level.minMonthsOfExpenses == null ||
      monthsOfExpensesSaved >= level.minMonthsOfExpenses;
    const meetsCoverage =
      level.minInterestCoveragePercent == null ||
      (coveragePercent ?? 0) >= level.minInterestCoveragePercent;

    if (meetsMonths && meetsCoverage) {
      if (!current || level.order > current.order) {
        current = level;
      }
    }
  }

  // Next level: smallest level with higher order than current (or first one if none yet)
  let next: WealthLevelDefinition | null = null;
  if (!current) {
    next = LEVELS[0] ?? null;
  } else {
    next =
      LEVELS.find((lvl) => lvl.order === current!.order + 1) ?? null;
  }

  return {
    ...snapshotBase,
    levels: LEVELS,
    currentLevelId: current?.id ?? null,
    nextLevelId: next?.id ?? null,
  };
}
