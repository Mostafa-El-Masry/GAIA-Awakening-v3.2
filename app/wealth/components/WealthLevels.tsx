"use client";

import { useEffect, useState, useRef } from "react";
// NetWorthBox removed to avoid duplicating the main NetWorth panel
import { LevelsView } from "./LevelsCombined";
import { PlansTabView } from "./PlansCombined";
import WealthTopSummary from "./WealthTopSummary";
import { FinancialMetrics } from "../lib/wealthLevels";
import { loadNetItems } from "../lib/store";
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from "../lib/persistence";
import CombinedSettingsPanel from "./CombinedSettingsPanel";
import {
  principalForMonthlyPayout,
  simulateMonthsToMonthlyInterest,
} from "../lib/wealthCalculations";

type WealthView = "levels" | "plans";

const PANEL = "gaia-surface rounded-xl border gaia-border p-4 shadow-sm";

export default function WealthLevels() {
  const [view, setView] = useState<WealthView>("levels");
  const [settings, setSettings] = useState(() => {
    try {
      return loadSettings();
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // persist settings when changed
  useEffect(() => {
    try {
      saveSettings(settings);
    } catch (e) {
      // ignore
    }
  }, [settings]);

  // compute derived values
  const monthlyExpensesKD = settings.expenses.reduce(
    (s, e) => s + e.amountKD,
    0
  );
  const monthlySurplusKD = Math.max(
    0,
    settings.monthlyIncomeKD - monthlyExpensesKD
  );
  const monthlyEgpContribution = monthlySurplusKD * settings.fxEgpPerKd;
  const monthlyExpensesEGP = monthlyExpensesKD * settings.fxEgpPerKd;

  // APRs
  const aprSchedule = settings.aprSchedule;
  const currentAprPercent =
    aprSchedule[0]?.aprPercent ??
    aprSchedule[aprSchedule.length - 1]?.aprPercent ??
    0;
  const currentAprDecimal = currentAprPercent / 100;

  // Plan D targets (certificates)
  const planDMonthlyTargetEGP = settings.planDTargetMonthlyEgp;
  const livePrincipalTargetEGP = principalForMonthlyPayout(
    planDMonthlyTargetEGP,
    currentAprDecimal
  );

  // range across schedule
  const aprPercents = aprSchedule.map((r) => r.aprPercent);
  const minApr = Math.min(...aprPercents);
  const maxApr = Math.max(...aprPercents);
  const principalAtMaxApr = principalForMonthlyPayout(
    planDMonthlyTargetEGP,
    maxApr / 100
  );
  const principalAtMinApr = principalForMonthlyPayout(
    planDMonthlyTargetEGP,
    minApr / 100
  );

  // infer starting principal from net items if not set
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

  // simulate months to reach target assuming starting principal and reinvest fraction
  const sim = simulateMonthsToMonthlyInterest(
    startPrincipalEGP,
    monthlyEgpContribution,
    currentAprDecimal,
    planDMonthlyTargetEGP,
    reinvestFraction
  );

  // Compute real metrics in EGP: liquid savings = sum of non-certificate net items; netWorth = sum of all net items
  const { loadNetItems: _loadNetItems } = { loadNetItems };
  const allNetItems = loadNetItems();
  const liquidSavingsEGP = allNetItems
    .filter((i) => !i.isCertificate)
    .reduce((s, i) => s + i.amount, 0);
  const netWorthEGP = allNetItems.reduce((s, i) => s + i.amount, 0);
  const monthsOfBuffer =
    monthlyExpensesEGP > 0
      ? Number((liquidSavingsEGP / monthlyExpensesEGP).toFixed(1))
      : 0;

  const metrics: FinancialMetrics = {
    monthlyExpenses: monthlyExpensesEGP,
    liquidSavings: liquidSavingsEGP,
    netWorth: netWorthEGP,
    monthsOfBuffer,
  };

  const plansRef = useRef<HTMLDivElement | null>(null);

  const jumpToPlans = () => {
    if (plansRef.current)
      plansRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className={PANEL}>
      <h2 className="mb-6 text-lg font-extrabold tracking-wide gaia-strong">
        Wealth 2.0 — Progress & Plans
      </h2>

      {/* Top summary and Levels displayed at the top of the page */}
      <div className="mb-8">
        <WealthTopSummary metrics={metrics} />
        <div className="relative bg-card p-3 rounded-md shadow-sm">
          <LevelsView metrics={metrics} />
        </div>
      </div>

      {/* Plans rendered at the end of the page */}
      <div className="mt-10" ref={plansRef}>
        <h3 className="text-lg font-semibold mb-4">Plans</h3>
        <PlansTabView metrics={metrics} />

        {/* Combined Settings Panel */}
        <div className="my-8">
          <CombinedSettingsPanel
            settings={settings}
            setSettings={setSettings}
          />
        </div>
      </div>

      {/* Floating quick-jump removed to prevent overlap; use the Jump to Plans button above */}
    </section>
  );
}
