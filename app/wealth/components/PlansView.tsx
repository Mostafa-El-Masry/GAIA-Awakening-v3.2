"use client";

import { FinancialMetrics, PLANS } from "../lib/wealthLevels";
import {
  principalForMonthlyPayout,
  simulateMonthsToMonthlyInterest,
} from "../lib/wealthCalculations";
import { loadSettings, saveSettings } from "../lib/persistence";
import { loadNetItems } from "../lib/store";
import { simulateUntilMonthlyTarget } from "../lib/sim";
import ProgressBarAnimated from "./ProgressBarAnimated";
import { MonthRow } from "../lib/types";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface PlansViewProps {
  metrics: FinancialMetrics;
}

// Helper function to format months display
function monthsDisplay(m: number | null): string {
  if (m === null) return "-";
  const years = Math.floor(m / 12);
  const months = m % 12;
  if (years === 0) return `${months} month${months === 1 ? "" : "s"}`;
  if (months === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years}y ${months}m`;
}

export function PlansView({ metrics }: PlansViewProps) {
  const settings = loadSettings();

  // Calculate metrics
  const monthlyExpensesKD = settings.expenses.reduce(
    (s, e) => s + e.amountKD,
    0
  );
  const monthlySurplusKD = Math.max(
    0,
    settings.monthlyIncomeKD - monthlyExpensesKD
  );
  const monthlyEgpContribution = monthlySurplusKD * settings.fxEgpPerKd;

  const aprSchedule = settings.aprSchedule;
  const currentAprPercent =
    aprSchedule[0]?.aprPercent ??
    aprSchedule[aprSchedule.length - 1]?.aprPercent ??
    0;
  const currentAprDecimal = currentAprPercent / 100;

  // Sum explicit certificate-like net items (new investments use isCertificate=true)
  const certificatePrincipal = (() => {
    try {
      const items = loadNetItems();
      return items
        .filter((i) => i.isCertificate && i.amount > 0)
        .reduce((s, i) => s + i.amount, 0);
    } catch (e) {
      return 0;
    }
  })();

  // Infer principal from net worth if no certificates explicitly tracked
  const inferredPrincipalFromNet = (() => {
    try {
      const items = loadNetItems();
      const re = /cert|certificate|cd|cdu|deposit/i;
      return items
        .filter((i) => i.amount > 0 && re.test(i.name))
        .reduce((s, i) => s + i.amount, 0);
    } catch (e) {
      return 0;
    }
  })();

  const startPrincipalEGP =
    settings.startingPrincipalEgp && settings.startingPrincipalEgp > 0
      ? settings.startingPrincipalEgp
      : inferredPrincipalFromNet;

  const reinvestFraction = settings.reinvest
    ? (settings.reinvestPercent ?? 100) / 100
    : 0;

  // Calculate plan metrics
  const planCalculations = {
    D: {
      title: "Catching my Breath",
      objective: PLANS.D.objective,
      targetEGP: settings.planDTargetMonthlyEgp,
      get targetPrincipalEGP() {
        return principalForMonthlyPayout(this.targetEGP, currentAprDecimal);
      },
      get currentMonthlyInterest() {
        // Sum monthly revenue from each certificate
        const items = loadNetItems();
        return items
          .filter((i) => i.isCertificate && i.monthlyRevenue)
          .reduce((sum, i) => sum + (i.monthlyRevenue || 0), 0);
      },
      get progressPct() {
        return Math.min(
          100,
          (this.currentMonthlyInterest / this.targetEGP) * 100
        );
      },
      get simulation() {
        // Use the actual current certificate principal
        const currentPrincipal = (() => {
          try {
            return loadNetItems()
              .filter((i) => i.isCertificate && i.amount > 0)
              .reduce((sum, i) => sum + i.amount, 0);
          } catch (e) {
            return startPrincipalEGP;
          }
        })();

        // Get current monthly interest
        const currentMonthlyInterest = this.currentMonthlyInterest;

        // If we're already at target, return 0 months
        if (currentMonthlyInterest >= this.targetEGP) {
          return {
            months: 0,
            principal: currentPrincipal,
            monthlyInterest: currentMonthlyInterest,
          };
        }

        return simulateMonthsToMonthlyInterest(
          currentPrincipal,
          monthlyEgpContribution,
          currentAprDecimal,
          this.targetEGP,
          reinvestFraction
        );
      },
      get isComplete() {
        return this.currentMonthlyInterest >= this.targetEGP;
      },
    },
    C: {
      title: "Stabilize",
      objective: PLANS.C.objective,
      targetEGP: settings.planCTargetMonthlyEgp ?? 10000,
      get targetPrincipalEGP() {
        return principalForMonthlyPayout(this.targetEGP, currentAprDecimal);
      },
      get currentMonthlyInterest() {
        return startPrincipalEGP * (currentAprDecimal / 12);
      },
      get progressPct() {
        return Math.min(
          100,
          (this.currentMonthlyInterest / this.targetEGP) * 100
        );
      },
      get simulation() {
        return simulateMonthsToMonthlyInterest(
          startPrincipalEGP,
          monthlyEgpContribution,
          currentAprDecimal,
          this.targetEGP,
          reinvestFraction
        );
      },
      get isComplete() {
        return this.currentMonthlyInterest >= this.targetEGP;
      },
    },
    B: {
      title: "Secure",
      objective: PLANS.B.objective,
      targetEGP: Math.max(
        1,
        Math.round(monthlyExpensesKD * settings.fxEgpPerKd)
      ),
      get targetPrincipalEGP() {
        return principalForMonthlyPayout(this.targetEGP, currentAprDecimal);
      },
      get currentMonthlyInterest() {
        return startPrincipalEGP * (currentAprDecimal / 12);
      },
      get progressPct() {
        return Math.min(
          100,
          (this.currentMonthlyInterest / this.targetEGP) * 100
        );
      },
      get simulation() {
        return simulateMonthsToMonthlyInterest(
          startPrincipalEGP,
          monthlyEgpContribution,
          currentAprDecimal,
          this.targetEGP,
          reinvestFraction
        );
      },
      get isComplete() {
        return this.currentMonthlyInterest >= this.targetEGP;
      },
    },
    A: {
      title: "Grow",
      objective: PLANS.A.objective,
      targetEGP: 1.5 * monthlyExpensesKD * settings.fxEgpPerKd,
      get targetPrincipalEGP() {
        return principalForMonthlyPayout(this.targetEGP, currentAprDecimal);
      },
      get currentMonthlyInterest() {
        return startPrincipalEGP * (currentAprDecimal / 12);
      },
      get progressPct() {
        return Math.min(
          100,
          (this.currentMonthlyInterest / this.targetEGP) * 100
        );
      },
      get simulation() {
        return simulateMonthsToMonthlyInterest(
          startPrincipalEGP,
          monthlyEgpContribution,
          currentAprDecimal,
          this.targetEGP,
          reinvestFraction
        );
      },
      get isComplete() {
        return this.currentMonthlyInterest >= this.targetEGP;
      },
    },
  };

  return (
    <div className="space-y-6">
      {Object.entries(planCalculations).map(([key, plan]) => (
        <div
          key={key}
          className="p-6 rounded-lg border transition-all duration-300 border-muted bg-card hover:border-muted/80 hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                {`Plan ${key} · ${plan.title}`}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.objective}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {plan.isComplete && (
                <div className="text-green-600 flex items-center gap-1">
                  <span>✓</span>
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-sm font-medium">
                {Math.round(plan.progressPct)}%
              </div>
            </div>
            <div>
              <ProgressBarAnimated
                percent={Math.min(100, plan.progressPct)}
                isComplete={plan.isComplete}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">
                Monthly payout (EGP):{" "}
              </span>
              <span className="font-medium">
                {Math.round(plan.targetEGP).toLocaleString()} EGP
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Target principal (EGP):{" "}
              </span>
              <span className="font-medium">
                {Math.round(plan.targetPrincipalEGP).toLocaleString()} EGP
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Current interest (EGP):{" "}
              </span>
              <span className="font-medium">
                {Math.round(plan.currentMonthlyInterest).toLocaleString()} EGP
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Months to target: </span>
              <span className="font-medium">
                {monthsDisplay(plan.simulation.months)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Monthly deposit</div>
              <div className="font-medium">
                {Math.round(monthlyEgpContribution).toLocaleString()} EGP
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
