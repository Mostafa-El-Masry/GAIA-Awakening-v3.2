export type WealthLevel =
  | "L0-Broke"
  | "L1-Poor"
  | "L2-GettingBy"
  | "L3-BasicSafety"
  | "L4-SolidSafety"
  | "L5-SecureBuffer"
  | "L6-StrongBuffer"
  | "L7-LaunchInvesting"
  | "L8-WealthBuilding"
  | "L9-Wealthy";

export type PlanType = "A" | "B" | "C" | "D";

export interface FinancialMetrics {
  monthlyExpenses: number; // ME
  liquidSavings: number; // LSB
  netWorth: number; // NW
  monthsOfBuffer: number; // LSB ÷ ME (1 decimal)
  monthlyInvestmentIncome?: number; // estimated monthly income from certificates/investments (EGP)
}

export interface WealthStage {
  level: WealthLevel;
  isHighRisk: boolean;
  nextStage: WealthLevel | null;
  gapToNext: number | null;
}

export interface Plan {
  type: PlanType;
  title: string;
  objective: string;
  targetAmount: number;
  currentProgress: number;
  isComplete: boolean;
  successCriteria: string;
  importance: string;
}

export interface WealthLevelThreshold {
  level: WealthLevel;
  meMultiplier: number;
  checkNetWorth: boolean;
}

// Level thresholds configuration
export const WEALTH_LEVEL_THRESHOLDS: WealthLevelThreshold[] = [
  { level: "L0-Broke", meMultiplier: 1, checkNetWorth: true },
  { level: "L1-Poor", meMultiplier: 2, checkNetWorth: false },
  { level: "L2-GettingBy", meMultiplier: 3, checkNetWorth: false },
  { level: "L3-BasicSafety", meMultiplier: 4, checkNetWorth: false },
  { level: "L4-SolidSafety", meMultiplier: 6, checkNetWorth: false },
  { level: "L5-SecureBuffer", meMultiplier: 9, checkNetWorth: false },
  { level: "L6-StrongBuffer", meMultiplier: 12, checkNetWorth: false },
  { level: "L7-LaunchInvesting", meMultiplier: 12, checkNetWorth: false },
  { level: "L8-WealthBuilding", meMultiplier: 36, checkNetWorth: true },
  { level: "L9-Wealthy", meMultiplier: 60, checkNetWorth: true },
];

export const PLANS: Record<
  PlanType,
  Omit<Plan, "targetAmount" | "currentProgress" | "isComplete">
> = {
  D: {
    type: "D",
    title: "Catching my Breath",
    objective: 'Leave "Broke" and reach the next stage.',
    successCriteria: "Liquid ≥ 1×ME and Net Worth ≥ 0",
    importance: "This removes immediate risk and buys you time.",
  },
  C: {
    type: "C",
    title: "Stabilize",
    objective: "Build a 6-month safety buffer",
    successCriteria: "Reach Level 5 (6-month buffer)",
    importance: "Creates stability and reduces financial stress",
  },
  B: {
    type: "B",
    title: "Secure",
    objective: "Build a 12-month buffer and begin investing",
    successCriteria: "Reach Level 7 (12-month buffer)",
    importance: "Provides long-term security and growth potential",
  },
  A: {
    type: "A",
    title: "Grow",
    objective: "Build lasting wealth",
    successCriteria: "Reach Level 9 (Wealthy) or custom milestone",
    importance: "Achieve financial independence and security",
  },
};
