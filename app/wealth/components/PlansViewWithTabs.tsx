"use client";

import { useState } from "react";
import { Plan, FinancialMetrics, PLANS } from "../lib/wealthLevels";
import { TabNav } from "./TabNav";
import {
  determineWealthLevel,
  calculatePlanProgress,
  principalForMonthlyPayout,
  simulateMonthsToMonthlyInterest,
} from "../lib/wealthCalculations";
import { loadSettings, saveSettings } from "../lib/persistence";
import { loadNetItems } from "../lib/store";
import ProgressBarAnimated from "./ProgressBarAnimated";

interface PlansViewProps {
  metrics: FinancialMetrics;
}

const TAB_BUTTON =
  "px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200";

export function PlansViewWithTabs({ metrics }: PlansViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<"D" | "C" | "B" | "A">("D");
  const settings = loadSettings();

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

  const inferredPrincipalFromNet = (() => {
    try {
      const items = loadNetItems();
      console.log("Loading certificates from net items:", items);
      const re = /cert|certificate|cd|cdu|deposit/i;
      const certificates = items.filter((i) => i.amount > 0 && re.test(i.name));
      console.log("Filtered certificates:", certificates);
      const total = certificates.reduce((s, i) => s + i.amount, 0);
      console.log("Total certificate principal:", total);
      return total;
    } catch (e) {
      console.error("Error loading certificates:", e);
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

  // Calculate all plan metrics
  const planCalculations = {
    D: {
      targetEGP: settings.planDTargetMonthlyEgp,
      get targetPrincipalEGP() {
        return principalForMonthlyPayout(this.targetEGP, currentAprDecimal);
      },
      get currentMonthlyInterest() {
        // Calculate total monthly interest from all active certificates
        try {
          const items = loadNetItems();
          console.log("Loaded net items:", items);
          const certificates = items.filter(
            (i) => i.isCertificate && i.monthlyRevenue
          );
          console.log("Found certificates:", certificates);
          const total = certificates.reduce(
            (sum, i) => sum + (i.monthlyRevenue || 0),
            0
          );
          console.log("Total monthly interest:", total);
          return total;
        } catch (e) {
          console.error("Error loading net items:", e);
          return 0;
        }
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
    },
    C: {
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
    },
    B: {
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
    },
    A: {
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
    },
  };

  // Build plan display objects
  const planDisplays = [
    {
      type: "D" as const,
      title: "Catching my Breath",
      objective: PLANS.D.objective,
      targetMonthlyEGP: planCalculations.D.targetEGP,
      targetPrincipalEGP: planCalculations.D.targetPrincipalEGP,
      currentMonthlyInterestEGP: planCalculations.D.currentMonthlyInterest,
      progressPct: planCalculations.D.progressPct,
      isComplete:
        planCalculations.D.currentMonthlyInterest >=
        planCalculations.D.targetEGP,
    },
    {
      type: "C" as const,
      title: "Stabilize",
      objective: PLANS.C.objective,
      targetMonthlyEGP: planCalculations.C.targetEGP,
      targetPrincipalEGP: planCalculations.C.targetPrincipalEGP,
      currentMonthlyInterestEGP: planCalculations.C.currentMonthlyInterest,
      progressPct: planCalculations.C.progressPct,
      isComplete:
        planCalculations.C.currentMonthlyInterest >=
        planCalculations.C.targetEGP,
    },
    {
      type: "B" as const,
      title: "Secure",
      objective: PLANS.B.objective,
      targetMonthlyEGP: planCalculations.B.targetEGP,
      targetPrincipalEGP: planCalculations.B.targetPrincipalEGP,
      currentMonthlyInterestEGP: planCalculations.B.currentMonthlyInterest,
      progressPct: planCalculations.B.progressPct,
      isComplete:
        planCalculations.B.currentMonthlyInterest >=
        planCalculations.B.targetEGP,
    },
    {
      type: "A" as const,
      title: "Grow",
      objective: PLANS.A.objective,
      targetMonthlyEGP: planCalculations.A.targetEGP,
      targetPrincipalEGP: planCalculations.A.targetPrincipalEGP,
      currentMonthlyInterestEGP: planCalculations.A.currentMonthlyInterest,
      progressPct: planCalculations.A.progressPct,
      isComplete:
        planCalculations.A.currentMonthlyInterest >=
        planCalculations.A.targetEGP,
    },
  ];

  const activePlan = settings.activePlan ?? "D";
  const selectedPlanData = planDisplays.find((p) => p.type === selectedPlan)!;

  return (
    <div className="space-y-6">
      {/* Plan selection tabs */}
      <div className="grid grid-cols-4 gap-2 w-full mb-6">
        {planDisplays.map((plan) => (
          <TabNav
            key={plan.type}
            tabKey={plan.type}
            title={`Plan ${plan.type}`}
            isSelected={selectedPlan === plan.type}
            isActive={plan.type === activePlan}
            isComplete={plan.isComplete}
            onClick={() => setSelectedPlan(plan.type)}
          />
        ))}
      </div>

      {/* Selected plan display */}
      <div
        className={`p-6 rounded-lg border transition-all duration-300 ${
          activePlan === selectedPlan
            ? "border-primary bg-primary/8 scale-[1.03] ring-2 ring-primary/30 shadow-lg hover:shadow-xl hover:scale-[1.04]"
            : selectedPlanData.isComplete
            ? "border-green-300 bg-green-50/70 shadow-sm hover:shadow hover:scale-[1.01]"
            : "border-muted bg-card hover:border-muted/80 hover:shadow-sm"
        }`}
      >
        {selectedPlan !== "D" && (
          <div className="mb-3 text-xs text-muted-foreground">
            Your savings from Plan D continue to carry forward into this plan.
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              {`Plan ${selectedPlanData.type} · ${selectedPlanData.title}`}
            </h3>
            {activePlan === selectedPlan && (
              <div className="mt-1 text-sm px-3 py-1 rounded-full bg-primary text-primary-foreground inline-block shadow-sm">
                Active plan
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {selectedPlanData.objective}
            </p>
          </div>
          {selectedPlanData.isComplete && (
            <div className="text-green-600 flex items-center gap-1">
              <span>✓</span>
              <span className="text-sm font-medium">Complete</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-sm font-medium">
              {Math.round(selectedPlanData.progressPct)}%
            </div>
          </div>
          <ProgressBarAnimated
            percent={Math.min(100, selectedPlanData.progressPct)}
            isComplete={selectedPlanData.isComplete}
          />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">
              Target monthly (EGP):{" "}
            </span>
            <span className="font-medium">
              {Math.round(selectedPlanData.targetMonthlyEGP).toLocaleString()}{" "}
              EGP
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">
              Target principal (EGP):{" "}
            </span>
            <span className="font-medium">
              {Math.round(selectedPlanData.targetPrincipalEGP).toLocaleString()}{" "}
              EGP
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">
              Current monthly interest (EGP):{" "}
            </span>
            <span className="font-medium">
              {Math.round(
                selectedPlanData.currentMonthlyInterestEGP
              ).toLocaleString()}{" "}
              EGP
            </span>
          </div>
          {/* removed estimated months display per request */}
        </div>

        {/* Simulation Stats */}
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Monthly deposit</div>
            <div className="font-medium">
              {Math.round(monthlyEgpContribution).toLocaleString()} EGP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
