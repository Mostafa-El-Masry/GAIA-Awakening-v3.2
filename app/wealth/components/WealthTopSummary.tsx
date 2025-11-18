"use client";

import { loadNetItems } from '../lib/store';
import { loadSettings } from '../lib/persistence';
import type { FinancialMetrics, WealthLevel } from '../lib/wealthLevels';
import { PLANS } from '../lib/wealthLevels';
import { determineWealthLevel, determineActivePlan } from '../lib/wealthCalculations';

function fmt(n: number) {
  return n.toLocaleString('en-EG', { maximumFractionDigits: 0 });
}

const LEVEL_LABELS: Record<WealthLevel, string> = {
  "L0-Broke": "L0 — Broke",
  "L1-Poor": "L1 — Poor",
  "L2-GettingBy": "L2 — Getting by",
  "L3-BasicSafety": "L3 — Basic safety",
  "L4-SolidSafety": "L4 — Solid safety",
  "L5-SecureBuffer": "L5 — Secure buffer",
  "L6-StrongBuffer": "L6 — Strong buffer",
  "L7-LaunchInvesting": "L7 — Launch investing",
  "L8-WealthBuilding": "L8 — Wealth building",
  "L9-Wealthy": "L9 — Wealthy",
};

interface Props {
  metrics: FinancialMetrics;
}

export default function WealthTopSummary({ metrics }: Props) {
  const settings = loadSettings();
  const items = loadNetItems();

  // assume net item amounts are in EGP
  const certTotal = items.filter(i => i.isCertificate).reduce((s, i) => s + i.amount, 0);
  const liquidTotal = items.filter(i => !i.isCertificate).reduce((s, i) => s + i.amount, 0);
  const netWorth = certTotal + liquidTotal;

  const stage = determineWealthLevel(metrics);
  const autoPlan = determineActivePlan(metrics);
  const planType = (settings.activePlan ?? autoPlan.type) as keyof typeof PLANS;
  const planMeta = PLANS[planType];

  const monthlyExpensesEGP = metrics.monthlyExpenses;
  const monthlySurplusEGP = Math.max(0, metrics.monthsOfBuffer > 0
    ? metrics.monthsOfBuffer * monthlyExpensesEGP - monthlyExpensesEGP * (metrics.monthsOfBuffer - 1)
    : (settings.monthlyIncomeKD - settings.expenses.reduce((s, e) => s + e.amountKD, 0)) * settings.fxEgpPerKd
  );

  const targetMonthlyEGP =
    planType === "D"
      ? settings.planDTargetMonthlyEgp
      : planType === "C"
      ? settings.planCTargetMonthlyEgp ?? 3000
      : planType === "B"
      ? 5000
      : 10000;

  return (
    <section className="mb-6 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="inline-flex items-center rounded-full border gaia-border bg-card px-3 py-1 text-xs font-semibold">
            {LEVEL_LABELS[stage.level]}
          </span>
          <span className="text-xs text-muted-foreground">
            Active plan: {planMeta.title} ({planType}) • Target interest: {fmt(targetMonthlyEGP)} EGP/month
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Snapshot net worth: <span className="font-semibold">{fmt(netWorth)} EGP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="p-4 rounded-lg border gaia-border bg-card">
          <div className="text-xs text-muted-foreground">Liquid savings</div>
          <div className="text-xl font-extrabold">{fmt(liquidTotal)} EGP</div>
        </div>

        <div className="p-4 rounded-lg border gaia-border bg-card">
          <div className="text-xs text-muted-foreground">Certificates (principal)</div>
          <div className="text-xl font-extrabold">{fmt(certTotal)} EGP</div>
        </div>

        <div className="p-4 rounded-lg border gaia-border bg-card">
          <div className="text-xs text-muted-foreground">Net worth</div>
          <div className="text-xl font-extrabold">{fmt(netWorth)} EGP</div>
        </div>

        <div className="p-4 rounded-lg border gaia-border bg-card">
          <div className="text-xs text-muted-foreground">Monthly surplus (EGP)</div>
          <div className="text-xl font-extrabold">
            {fmt(monthlySurplusEGP >= 0 ? monthlySurplusEGP : 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Expenses: {fmt(monthlyExpensesEGP)} EGP
          </div>
        </div>
      </div>
    </section>
  );
}
