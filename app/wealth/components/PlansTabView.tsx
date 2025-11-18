"use client";

import { useState } from "react";
import { Plan, FinancialMetrics, PLANS } from "../lib/wealthLevels";
import { MonthRow, YearRow } from "../lib/types";

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
import { loadSettings, saveSettings } from "../lib/persistence";
import ResetSettings from "./ResetSettings";
import { TabNav } from "./TabNav";
import {
  determineWealthLevel,
  determineActivePlan,
  calculatePlanProgress,
  principalForMonthlyPayout,
  simulateMonthsToMonthlyInterest,
} from "../lib/wealthCalculations";
import { simulateUntilMonthlyTarget } from "../lib/sim";
import { loadNetItems, addInvestment, saveNetItems } from "../lib/store";
import ProgressBarAnimated from "./ProgressBarAnimated";

interface PlansTabViewProps {
  metrics: FinancialMetrics;
}

const defaultStartDate = () => new Date().toISOString().slice(0, 10);
const addYears = (dateStr: string, years: number) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
};

export function PlansTabView({ metrics }: PlansTabViewProps) {
  const settings = loadSettings();
  const [selectedPlan, setSelectedPlan] = useState<"D" | "C" | "B" | "A">("D");
  // simple tick to force re-render when store changes (e.g., after addInvestment)
  const [, setTick] = useState(0);

  // Calculate metrics (same calculations as PlansView)
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
      const re = /cert|certificate|cd|cdu|deposit/i;
      return items
        .filter((i) => i.amount > 0 && re.test(i.name))
        .reduce((s, i) => s + i.amount, 0);
    } catch (e) {
      return 0;
    }
  })();

  // handler to add investment from the Plan card UI
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [invName, setInvName] = useState("Certificate");
  const [invPrincipal, setInvPrincipal] = useState<number | "">(25000);
  const [invStartDate, setInvStartDate] = useState<string>(defaultStartDate());
  const [invEndDate, setInvEndDate] = useState<string>(
    addYears(defaultStartDate(), 3)
  );
  const [invApr, setInvApr] = useState<number>(
    settings.aprSchedule?.[0]?.aprPercent ?? 17
  );
  const [invMonthlyRev, setInvMonthlyRev] = useState<number | null>(null);

  const handleAddInvestment = () => {
    // show the inline form
    setShowInvestmentForm(true);
    // initialize values
    setInvName("Certificate");
    setInvPrincipal(25000);
    const start = defaultStartDate();
    setInvStartDate(start);
    setInvEndDate(addYears(start, 3));
    setInvApr(settings.aprSchedule?.[0]?.aprPercent ?? 17);
    setInvMonthlyRev(null);
  };

  const saveInvestmentFromForm = () => {
    try {
      const principal = Number(invPrincipal);
      if (!principal || principal <= 0) {
        alert("Enter valid principal");
        return;
      }
      const aprPercent = Number(invApr) || 0;
      const monthlyRevenue =
        invMonthlyRev !== null
          ? Number(invMonthlyRev)
          : (principal * (aprPercent / 100)) / 12;
      addInvestment({
        name: invName,
        principal,
        annualRatePercent: aprPercent,
        startDate: invStartDate || undefined,
        endDate: invEndDate || undefined,
      });
      // force update and hide form
      setTick((t) => t + 1);
      setShowInvestmentForm(false);
    } catch (e) {
      console.error(e);
      alert("Failed to add investment");
    }
  };

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

  // list of investments for display
  const investments = (() => {
    try {
      return loadNetItems().filter((i) => i.isCertificate);
    } catch (e) {
      return [] as any[];
    }
  })();

  const removeInvestment = (id: string) => {
    try {
      const items = loadNetItems().filter((i) => i.id !== id);
      saveNetItems(items);
      setTick((t) => t + 1);
    } catch (e) {
      console.error(e);
      alert("Failed to remove investment");
    }
  };

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

  const activePlan = settings.activePlan ?? "D";
  const planKeys = ["D", "C", "B", "A"] as const;
  const selectedPlanData = planCalculations[selectedPlan];

  return (
    <div className="space-y-6">
      {/* Plan selection tabs */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {planKeys.map((planKey) => (
          <TabNav
            key={planKey}
            tabKey={planKey}
            title={`Plan ${planKey}`}
            isSelected={selectedPlan === planKey}
            isActive={planKey === activePlan}
            isComplete={planCalculations[planKey].isComplete}
            onClick={() => setSelectedPlan(planKey)}
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
              {`Plan ${selectedPlan} · ${selectedPlanData.title}`}
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
          <div className="flex items-center gap-2">
            {selectedPlanData.isComplete && (
              <div className="text-green-600 flex items-center gap-1">
                <span>✓</span>
                <span className="text-sm font-medium">Complete</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm"
                onClick={handleAddInvestment}
                title="Add an investment that produces revenue"
              >
                Add Investment
              </button>
              <ResetSettings />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-sm font-medium">
              {Math.round(selectedPlanData.progressPct)}%
            </div>
          </div>
          <div>
            <ProgressBarAnimated
              percent={Math.min(100, selectedPlanData.progressPct)}
              isComplete={selectedPlanData.isComplete}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">
              Target monthly (EGP):{" "}
            </span>
            <span className="font-medium">
              {Math.round(selectedPlanData.targetEGP).toLocaleString()} EGP
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
                selectedPlanData.currentMonthlyInterest
              ).toLocaleString()}{" "}
              EGP
            </span>
          </div>
          {/* removed estimated months display */}
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
        {/* Existing investments for the current plan */}
        {selectedPlan === activePlan && (
          <div className="mt-4 rounded-2xl border border-cyan-100/70 bg-white/90 p-4 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-semibold tracking-tight text-slate-900">
                Certificates portfolio
              </h4>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
                {investments.length} active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Principal-heavy deposits converted into smooth monthly income.
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-cyan-100/80 ring-1 ring-cyan-500/15">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-cyan-600 to-sky-500 text-[0.65rem] uppercase tracking-[0.3em] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold first:rounded-tl-2xl">
                      Certificate
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Principal
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      APR
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Monthly yield
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      End Date
                    </th>
                    <th className="px-4 py-3 text-right font-semibold last:rounded-tr-2xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {showInvestmentForm && (
                    <tr className="border-b border-cyan-100/80 bg-amber-50/80">
                      <td className="px-4 py-3">
                        <input
                          className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm"
                          value={invName}
                          onChange={(e) => setInvName(e.target.value)}
                          placeholder="Certificate name"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-right text-sm font-mono"
                          value={invPrincipal}
                          onChange={(e) =>
                            setInvPrincipal(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-right text-sm font-mono"
                          value={invApr}
                          onChange={(e) => setInvApr(Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-right text-sm font-mono"
                          value={
                            invMonthlyRev === null ? "" : invMonthlyRev ?? ""
                          }
                          placeholder={(
                            ((Number(invPrincipal) || 0) *
                              ((Number(invApr) || 0) / 100)) /
                            12
                          ).toFixed(0)}
                          onChange={(e) =>
                            setInvMonthlyRev(
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <input
                          type="date"
                          className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm"
                          value={invStartDate}
                          onChange={(e) => {
                            const next = e.target.value;
                            setInvStartDate(next);
                            setInvEndDate(addYears(next, 3));
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <input
                          type="date"
                          className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm"
                          value={invEndDate}
                          onChange={(e) => setInvEndDate(e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          onClick={saveInvestmentFromForm}
                        >
                          Save
                        </button>
                        <button
                          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                          onClick={() => setShowInvestmentForm(false)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )}
                  {investments.length === 0 && !showInvestmentForm ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-sm text-slate-500"
                      >
                        No certificates yet. Click “Add Investment” to begin.
                      </td>
                    </tr>
                  ) : (
                    investments.map((inv: any, idx: number) => {
                      const stripe = idx % 2 === 0 ? "bg-white" : "bg-cyan-50/60";
                      const monthly = Math.round(
                        inv.monthlyRevenue ??
                          ((inv.amount || 0) * ((inv.aprPercent || 0) / 100)) / 12
                      ).toLocaleString();

                    const principal = Math.round(inv.amount || 0).toLocaleString();
                    const start = inv.startDate
                      ? new Date(inv.startDate).toLocaleDateString()
                      : "—";
                    const end = inv.endDate
                      ? new Date(inv.endDate).toLocaleDateString()
                      : "—";
                    return (
                      <tr
                        key={inv.id}
                        className={`${stripe} border-b border-cyan-100/80 last:border-b-0 transition-colors hover:bg-cyan-100/70`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {inv.name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                          {principal} EGP
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                          {inv.aprPercent ?? "—"}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-emerald-600">
                          {monthly} EGP
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {start}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {end}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeInvestment(inv.id)}
                            className="inline-flex items-center rounded-full border border-red-100 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            title="Remove investment"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Savings trajectory for the active plan (stops deposits when target met) */}
        {selectedPlan === activePlan && (
          <div className="mt-4 rounded-2xl border border-cyan-100/70 bg-white/90 p-4 shadow-lg shadow-cyan-500/10">
            <h4 className="text-base font-semibold tracking-tight text-slate-900">
              Savings trajectory (to age 60)
            </h4>
            <p className="text-xs text-slate-500">
              Each row represents a single month of deposits, growth, and net
              worth.
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-cyan-100/80 ring-1 ring-cyan-500/15">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-cyan-600 to-sky-500 text-[0.65rem] uppercase tracking-[0.3em] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold first:rounded-tl-2xl">
                      Month
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Age
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Deposited
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Monthly Interest
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Active Principal
                    </th>
                    <th className="px-4 py-3 text-right font-semibold last:rounded-tr-2xl">
                      Net Worth
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {(() => {
                    const simRes = simulateUntilMonthlyTarget(
                      selectedPlanData.title,
                      {
                        startYear: 2025,
                        startMonthIndex: 11,
                        yearsOfDeposits: 100,
                        baseMonthlyDeposit: 25000,
                        minReinvest: 1000,
                      },
                      selectedPlanData.targetEGP
                    );
                    return (simRes.rows as MonthRow[]).map((r, idx) => {
                      const stripe =
                        idx % 2 === 0 ? "bg-white" : "bg-cyan-50/60";
                      return (
                        <tr
                          key={`${r.month}`}
                          className={`${stripe} border-b border-cyan-100/80 last:border-b-0 transition-colors hover:bg-cyan-100/70`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {`${MONTH_NAMES[r.monthIndex]} ${r.year}`}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {Math.floor(r.age)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                            {r.depositsThisMonth.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-emerald-600">
                            {r.monthlyInterest.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {r.activePrincipal.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {r.netWorth.toLocaleString()}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            {(() => {
              const simRes = simulateUntilMonthlyTarget(
                selectedPlanData.title,
                {
                  startYear: 2025,
                  startMonthIndex: 11,
                  yearsOfDeposits: 100,
                  baseMonthlyDeposit: 25000,
                  minReinvest: 1000,
                },
                selectedPlanData.targetEGP
              );
              if (
                !simRes.continuationYears ||
                simRes.continuationYears.length === 0
              )
                return null;
              return (
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-slate-900">
                    Post‑target trajectory (reinvest-only to age 60)
                  </h5>
                  <div className="mt-2 overflow-hidden rounded-2xl border border-cyan-100/80 ring-1 ring-cyan-500/15">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gradient-to-r from-slate-900 to-cyan-700 text-[0.65rem] uppercase tracking-[0.3em] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold first:rounded-tl-2xl">
                            Month
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Age
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Monthly Interest
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Active Principal
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Cash
                          </th>
                          <th className="px-4 py-3 text-right font-semibold last:rounded-tr-2xl">
                            Net Worth
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {simRes.continuationYears.map((r: YearRow, idx) => {
                          const stripe =
                            idx % 2 === 0 ? "bg-slate-900/5" : "bg-white";
                          return (
                            <tr
                              key={`${r.year}-cont`}
                              className={`${stripe} border-b border-cyan-100/60 last:border-b-0 transition-colors hover:bg-cyan-100/60`}
                            >
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {`Dec ${r.year}`}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {Math.floor(r.age)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs text-emerald-600">
                                {r.monthlyInterestDec.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs">
                                {r.activePrincipalEnd.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                                {r.cashEnd.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {(
                                  r.activePrincipalEnd + r.cashEnd
                                ).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
