"use client";

import { useEffect, useState } from "react";
import { LevelsViewWithTabs as LevelsView } from "./LevelsViewWithTabs";
import { PlansViewWithTabs as PlansView } from "./PlansViewWithTabs";
import WealthTopSummary from "./WealthTopSummary";
import { FinancialMetrics } from "../lib/wealthLevels";
import { loadNetItems } from "../lib/store";
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from "../lib/persistence";
import SettingsBar from "./SettingsBar";
import APRScheduleEditor from "./APRScheduleEditor";
import {
  principalForMonthlyPayout,
  simulateMonthsToMonthlyInterest,
} from "../lib/wealthCalculations";
import Simulator from "./Simulator";

type TabType = "plans" | "levels";

const PANEL = "gaia-surface rounded-xl border gaia-border p-4 shadow-sm";
const TAB_BUTTON = "px-4 py-2 text-sm font-medium transition-colors";
const ACTIVE_TAB = `${TAB_BUTTON} bg-primary text-primary-foreground rounded-lg shadow-sm`;
const INACTIVE_TAB = `${TAB_BUTTON} text-muted-foreground hover:text-foreground`;

export default function WealthLevels() {
  const [activeTab, setActiveTab] = useState<TabType>("plans");
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

  // Friendly display for months: if simulator returned the max cap (e.g. 1200)
  // show a clearer message like "600+" or "—" instead of the raw large cap.
  const simMonthsDisplay = (() => {
    const m = (sim as any)?.months;
    if (m == null || !isFinite(m) || m <= 0) return "—";
    if (m > 600) return "600+"; // match PlansView behaviour
    return String(Math.round(m));
  })();

  // Compute metrics
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

  return (
    <section className={PANEL}>
      <h2 className="mb-6 text-lg font-extrabold tracking-wide gaia-strong">
        Wealth 2.0 — Progress & Plans
      </h2>

      {/* Top summary is always visible */}
      <div className="mb-8">
        <WealthTopSummary metrics={metrics} />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 bg-muted/10 p-1 rounded-lg w-fit">
        <button
          className={activeTab === "plans" ? ACTIVE_TAB : INACTIVE_TAB}
          onClick={() => setActiveTab("plans")}
        >
          Plans
        </button>
        <button
          className={activeTab === "levels" ? ACTIVE_TAB : INACTIVE_TAB}
          onClick={() => setActiveTab("levels")}
        >
          Levels
        </button>
      </div>

      {/* Side Panel */}
      <div className="mb-6">
        <SettingsBar settings={settings} setSettings={setSettings} />
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* APR Schedule and Plan D Summary in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <APRScheduleEditor settings={settings} setSettings={setSettings} />

          <div className="p-4 rounded-md border gaia-border bg-card">
            <h3 className="font-semibold">Plan D · Catching my Breath</h3>
            <div className="text-sm text-muted-foreground mt-1">
              Target monthly (EGP): {planDMonthlyTargetEGP.toLocaleString()}
            </div>
            <div className="mt-3">
              <div className="text-sm">Live APR: {currentAprPercent}%</div>
              <div className="text-sm">
                Live principal target:{" "}
                {Math.round(livePrincipalTargetEGP).toLocaleString()} EGP
              </div>
              <div className="text-sm">
                Range (best→worst):{" "}
                {Math.round(principalAtMaxApr).toLocaleString()} —{" "}
                {Math.round(principalAtMinApr).toLocaleString()} EGP
              </div>
              <div className="text-sm mt-2">
                Monthly EGP contribution (surplus × FX):{" "}
                {monthlyEgpContribution.toLocaleString()} EGP
              </div>
              {/* Estimated months to hit target removed per request */}
            </div>
          </div>
        </div>

        {/* Content Tabs and Views */}
        {activeTab === "levels" ? (
          <div className="bg-card p-3 rounded-md shadow-sm">
            <LevelsView metrics={metrics} />
          </div>
        ) : (
          <>
            <PlansView metrics={metrics} />
            <div className="mt-8">
              <Simulator
                initialBaseADeposit={Math.round(monthlyEgpContribution)}
                initialBaseBDeposit={Math.round(monthlyEgpContribution / 4)}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
