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
 * the highest level for which either liquid savings meets the multiplier or, when
 * checkNetWorth is true, net worth meets the multiplier.
 */
export function determineWealthLevel(metrics: FinancialMetrics): WealthStage {
  const me = Number(metrics.monthlyExpenses) || 0;
  const ls = Number(metrics.liquidSavings) || 0;
  const nw = Number(metrics.netWorth) || 0;

  // Special case: broke if net worth < 0 or liquidSavings < 1×ME
  if (nw < 0 || ls < me) {
    const gap = Math.max(me - ls, nw < 0 ? -nw : 0);
    return {
      level: "L0-Broke",
      isHighRisk: true,
      nextStage: "L1-Poor",
      gapToNext: gap || null,
    };
  }

  // Iterate thresholds descending to pick the highest satisfied level
  for (let i = WEALTH_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = WEALTH_LEVEL_THRESHOLDS[i];
    const required = t.meMultiplier * me;
    const satisfiedByLiquid = ls >= required;
    const satisfiedByNetWorth = t.checkNetWorth ? nw >= required : false;

    if (satisfiedByLiquid || satisfiedByNetWorth) {
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
 * Calculate plan progress and related derived fields.
 * Keeps the previous signature and returns a Plan-like object with extra fields.
 */
export function calculatePlanProgress(
  metrics: FinancialMetrics,
  _currentStage: WealthStage,
  planType: PlanType
): Plan & {
  currentAPR?: number | null;
  requiredInvestment?: number | null;
} {
  const baseInfo = PLANS[planType];
  const me = Number(metrics.monthlyExpenses) || 0;
  const ls = Number(metrics.liquidSavings) || 0;
  const nw = Number(metrics.netWorth) || 0;

  let targetAmount = 0;
  let currentProgress = 0;
  let currentAPR: number | null = null;
  let requiredInvestment: number | null = null;

  switch (planType) {
    case "D": {
      // Plan D: Leave "broke" state. Success criteria: Liquid ≥ 1×ME and Net Worth ≥ 0
      targetAmount = me; // 1×ME in liquid savings
      currentProgress = ls;

      // If the metrics provide monthlyInvestmentIncome/currentAPR/monthlyDeposit we may estimate time
      const monthlyIncome =
        Number((metrics as any).monthlyInvestmentIncome) || 0;
      const monthlyDeposit = Number((metrics as any).monthlyDeposit) || 0;
      currentAPR = Number((metrics as any).currentAPR) || null;

      // If APR is provided as percent (e.g. 16) convert to decimal when it's > 1
      if (currentAPR && currentAPR > 1) currentAPR = currentAPR / 100;

      // requiredInvestment is only meaningful for income-based plans (not D necessarily)
      if (currentAPR && currentAPR > 0) {
        requiredInvestment = principalForMonthlyPayout(
          monthlyIncome || 0,
          currentAPR
        );
      }

      // estimate months to reach 1×ME using simple linear model if monthlyDeposit provided
      if (monthlyDeposit > 0) {
        const remaining = Math.max(0, targetAmount - ls);
        // previously stored as estimatedMonthsToTarget; no longer surfaced to callers
        // kept here for historical trace but not returned
        /* const estimateMonths = Math.ceil(remaining / monthlyDeposit); */
      }

      break;
    }

    case "C": {
      // Plan C aims for the L5 threshold
      const t = WEALTH_LEVEL_THRESHOLDS.find(
        (x) => x.level === "L5-SecureBuffer"
      )!;
      targetAmount = t.meMultiplier * me;
      currentProgress = ls;
      break;
    }

    case "B": {
      const t = WEALTH_LEVEL_THRESHOLDS.find(
        (x) => x.level === "L7-LaunchInvesting"
      )!;
      targetAmount = t.meMultiplier * me;
      currentProgress = ls;
      break;
    }

    case "A": {
      const t = WEALTH_LEVEL_THRESHOLDS.find((x) => x.level === "L9-Wealthy")!;
      targetAmount = t.meMultiplier * me;
      currentProgress = nw;
      break;
    }
  }

  return {
    ...baseInfo,
    targetAmount,
    currentProgress,
    isComplete: currentProgress >= targetAmount,
    currentAPR,
    requiredInvestment,
  };
}

/**
 * Pick an active plan: returns the first incomplete plan in order D → C → B → A.
 */
export function determineActivePlan(metrics: FinancialMetrics): Plan {
  const currentStage = determineWealthLevel(metrics);
  const order: PlanType[] = ["D", "C", "B", "A"];
  for (const p of order) {
    const plan = calculatePlanProgress(metrics, currentStage, p);
    if (!plan.isComplete) return plan;
  }
  return calculatePlanProgress(metrics, currentStage, "A");
}

/**
 * Required principal to get a desired monthly payout at a given APR (decimal).
 * aprDecimal is expected as decimal (e.g. 0.16 for 16%).
 */
export function principalForMonthlyPayout(
  monthlyPayoutEGP: number,
  aprDecimal: number
): number {
  const payout = Number(monthlyPayoutEGP) || 0;
  const apr = Number(aprDecimal) || 0;
  if (payout <= 0 || apr <= 0) return 0;
  const monthlyRate = apr / 12;
  if (monthlyRate <= 0) return 0;
  return payout / monthlyRate;
}

/**
 * Simulate months until monthly interest reaches a target. Uses monthly compounding with
 * monthly contribution and an optional reinvest fraction (0..1). aprDecimal is annual decimal.
 */
export function simulateMonthsToMonthlyInterest(
  startPrincipalEGP: number,
  monthlyContributionEGP: number,
  aprDecimal: number,
  targetMonthlyInterestEGP: number,
  reinvestFraction = 1,
  maxMonths = 1200
): { months: number; principal: number; monthlyInterest: number } {
  let principal = Math.max(0, Number(startPrincipalEGP) || 0);
  const contrib = Math.max(0, Number(monthlyContributionEGP) || 0);
  const monthlyRate = (Number(aprDecimal) || 0) / 12;
  const target = Math.max(0, Number(targetMonthlyInterestEGP) || 0);
  const reinv = Math.min(1, Math.max(0, Number(reinvestFraction) || 0));

  for (let m = 0; m <= maxMonths; m++) {
    const monthlyInterest = principal * monthlyRate;

    if (monthlyInterest >= target) {
      return {
        months: m,
        principal: Number(principal.toFixed(0)),
        monthlyInterest: Number(monthlyInterest.toFixed(2)),
      };
    }

    // End-of-month updates: add contribution and reinvested part of interest
    principal += contrib + monthlyInterest * reinv;
  }

  const monthlyInterest = principal * monthlyRate;
  return {
    months: maxMonths,
    principal: Number(principal.toFixed(0)),
    monthlyInterest: Number(monthlyInterest.toFixed(2)),
  };
}
