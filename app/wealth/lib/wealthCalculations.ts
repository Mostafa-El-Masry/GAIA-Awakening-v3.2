import {
  WealthLevel,
  WealthStage,
  FinancialMetrics,
  WEALTH_LEVEL_THRESHOLDS,
  Plan,
  PlanType,
  PLANS,
} from "./wealthLevels";

/**
 * Determine the active plan based on current metrics
 */
export function determineActivePlan(metrics: FinancialMetrics): Plan {
  const stage = determineWealthLevel(metrics);
  const nextPlanType: Record<WealthLevel, PlanType> = {
    "L0-Broke": "D",
    "L1-Poor": "D",
    "L2-GettingBy": "D",
    "L3-BasicSafety": "C",
    "L4-SolidSafety": "C",
    "L5-SecureBuffer": "B",
    "L6-StrongBuffer": "B",
    "L7-LaunchInvesting": "A",
    "L8-WealthBuilding": "A",
    "L9-Wealthy": "A",
  };
  const planType = nextPlanType[stage.level];
  const targetAmount =
    Math.ceil(
      (planType === "D"
        ? 1000 // 1,000 EGP/month
        : planType === "C"
        ? 3000 // 3,000 EGP/month
        : planType === "B"
        ? 5000 // 5,000 EGP/month
        : 10000) / // 10,000 EGP/month for Plan A
        1000
    ) * 1000; // Round up to nearest 1000
  // Use calculatePlanProgress to return the full Plan object (includes currentProgress/isComplete)
  return calculatePlanProgress(metrics, stage, planType as PlanType) as Plan;
}

/**
 * Calculate months of buffer (liquid savings divided by monthly expenses).
 * Returns a number rounded to 1 decimal place. If monthlyExpenses <= 0, returns 0.
 */
export function calculateMonthsOfBuffer(
  metrics: Pick<FinancialMetrics, "liquidSavings" | "monthlyExpenses">
): number {
  const e = Number(metrics.monthlyExpenses) || 0;
  const s = Number(metrics.liquidSavings) || 0;
  if (e <= 0) return 0;
  return Number((s / e).toFixed(1));
}

/**
 * Determine wealth stage by checking thresholds from highest to lowest and returning
 * the highest level for which either liquid savings meets the multiplier.
 */
export function determineWealthLevel(metrics: FinancialMetrics): WealthStage {
  const me = Number(metrics.monthlyExpenses) || 0;
  const ls = Number(metrics.liquidSavings) || 0;

  // Check each threshold from highest to lowest
  for (let i = WEALTH_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = WEALTH_LEVEL_THRESHOLDS[i];
    if (ls >= t.meMultiplier * me) {
      const nextLevel = WEALTH_LEVEL_THRESHOLDS[i + 1]?.level ?? null;
      const gapToNext = nextLevel
        ? WEALTH_LEVEL_THRESHOLDS[i + 1].meMultiplier * me - ls
        : null;
      return {
        level: t.level,
        isHighRisk: i <= 1, // L0 or L1
        nextStage: nextLevel,
        gapToNext: gapToNext && gapToNext > 0 ? gapToNext : null,
      };
    }
  }

  // Fallback: lowest level
  return {
    level: WEALTH_LEVEL_THRESHOLDS[0].level,
    isHighRisk: true,
    nextStage: WEALTH_LEVEL_THRESHOLDS[1]?.level ?? null,
    gapToNext:
      Math.max(WEALTH_LEVEL_THRESHOLDS[1].meMultiplier * me - ls, 0) || null,
  };
}

/**
 * Calculate the principal amount needed to generate a desired monthly payout
 * based on APR and reinvestment fraction.
 */
export function principalForMonthlyPayout(
  desiredMonthlyPayout: number,
  aprDecimal: number,
  reinvestFraction = 0
): number {
  if (aprDecimal <= 0 || aprDecimal >= 1) return Infinity;
  const monthlyRate = aprDecimal / 12;
  return desiredMonthlyPayout / (monthlyRate * (1 - reinvestFraction));
}

/**
 * Simulate number of months needed to reach a target monthly interest payout
 * given a starting principal, monthly contribution, APR, and reinvestment fraction.
 */
export function simulateMonthsToMonthlyInterest(
  startPrincipal: number,
  monthlyContribution: number,
  aprDecimal: number,
  targetMonthlyInterest: number,
  reinvestFraction = 0
): { months: number; principal: number; monthlyInterest: number } {
  if (aprDecimal <= 0)
    return { months: Infinity, principal: 1, monthlyInterest: 1 };

  const monthlyRate = aprDecimal / 12;
  let principal = startPrincipal;
  let months = 0;
  const maxMonths = 600; // 50 years limit
  const targetPrincipal =
    Math.min(
      70588, // Target 70,588 EGP per month cap
      targetMonthlyInterest
    ) /
    (monthlyRate * (1 - reinvestFraction));

  while (months < maxMonths) {
    const monthlyInterest = principal * monthlyRate;
    if (monthlyInterest * (1 - reinvestFraction) >= targetMonthlyInterest) {
      // Return exactly the target principal needed
      return {
        months,
        principal: targetPrincipal,
        monthlyInterest: targetMonthlyInterest,
      };
    }
    // If monthly contribution is too small to ever reach target, show maxMonths
    if (
      monthlyContribution <= 0 &&
      monthlyInterest * (1 - reinvestFraction) < targetMonthlyInterest
    ) {
      return {
        months: maxMonths,
        principal: targetPrincipal,
        monthlyInterest,
      };
    }
    principal += monthlyContribution + monthlyInterest * reinvestFraction;
    months++;
  }

  const finalMonthlyInterest = principal * monthlyRate;
  return { months: Infinity, principal, monthlyInterest: finalMonthlyInterest };
}

/**
 * Calculate plan progress and related derived fields.
 */
export function calculatePlanProgress(
  metrics: FinancialMetrics,
  _currentStage: WealthStage,
  planType: PlanType
): Plan & {
  currentAPR?: number | null;
  requiredInvestment?: number | null;
} {
  const plan = PLANS[planType];
  const targetAmount =
    Math.ceil(
      (planType === "D"
        ? 1000 // 1,000 EGP/month
        : planType === "C"
        ? 3000 // 3,000 EGP/month
        : planType === "B"
        ? 5000 // 5,000 EGP/month
        : 10000) / // 10,000 EGP/month for Plan A
        1000
    ) * 1000; // Round up to nearest 1000

  return {
    ...plan,
    targetAmount,
    currentProgress: metrics.liquidSavings
      ? (metrics.liquidSavings / targetAmount) * 100
      : 0,
    isComplete: (metrics.liquidSavings || 0) >= targetAmount,
  };
}

/**
 * Calculate wealth snapshot from a serialized storage snapshot.
 */
export function calculateWealthSnapshot(
  snapshot: Record<string, string | null>
): number {
  let wealthSnapshot = 0;
  for (const raw of Object.values(snapshot)) {
    if (!raw) continue;
    try {
      const v = JSON.parse(raw);
      if (typeof v === "number") wealthSnapshot += v;
      if (v && typeof v === "object" && typeof v.balance === "number") {
        wealthSnapshot += v.balance;
      }
      if (v && v.total) {
        wealthSnapshot += Number(v.total) || 0;
      }
    } catch {
      continue;
    }
  }
  return wealthSnapshot;
}
