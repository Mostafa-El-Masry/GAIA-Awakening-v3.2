"use client";

import React, { useEffect, useState } from "react";
import { AppSettings } from "../lib/persistence";
import { getExchangeRate } from "../lib/exchangeRate";
import {
  calculateMonthsOfBuffer,
  determineActivePlan,
} from "../lib/wealthCalculations";
import { FinancialMetrics } from "../lib/wealthLevels";

interface Props {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

export default function CombinedSettingsPanel({
  settings,
  setSettings,
}: Props) {
  const [liveExchangeRate, setLiveExchangeRate] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const updateExchangeRate = async () => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const { rate, timestamp, isCached } = await getExchangeRate();
      if (rate > 0) {
        setLiveExchangeRate(rate);
        setLastUpdateTime(new Date(timestamp));
        setIsStale(isCached);
        // Update settings with the new rate
        if (Math.abs(rate - settings.fxEgpPerKd) > 0.01) {
          updateField("fxEgpPerKd", rate);
        }
      } else {
        setUpdateError("Unable to get valid exchange rate");
      }
    } catch (error) {
      console.error("Failed to update exchange rate:", error);
      setUpdateError("Failed to fetch exchange rate. Using last known rate.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // Check if we need to update on component mount
    const checkAndUpdate = async () => {
      const { isCached } = await getExchangeRate();
      if (isCached) {
        updateExchangeRate();
      }
    };

    // Initial check
    checkAndUpdate();

    // Set up periodic updates every 24 hours
    const interval = setInterval(updateExchangeRate, 24 * 60 * 60 * 1000);

    // Also update when the tab becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndUpdate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  const updateField = (k: keyof AppSettings, v: any) => {
    const next = { ...settings, [k]: v } as AppSettings;
    setSettings(next);
  };

  // Derive financial metrics used by plan calculation
  const metrics: FinancialMetrics = React.useMemo(() => {
    const monthlyExpensesKD = settings.expenses.reduce(
      (s, e) => s + e.amountKD,
      0
    );
    const monthlyExpensesEGP = monthlyExpensesKD * settings.fxEgpPerKd;
    const liquidSavings = settings.startingPrincipalEgp || 0;
    const netWorth = settings.startingPrincipalEgp || 0;
    const monthsOfBuffer = calculateMonthsOfBuffer({
      liquidSavings,
      monthlyExpenses: monthlyExpensesEGP,
    });

    // Estimate current monthly investment income (EGP) from starting principal
    const aprs = (settings.aprSchedule || []).map((r) => r.aprPercent || 0);
    const avgApr = aprs.length
      ? aprs.reduce((s, v) => s + v, 0) / aprs.length
      : 0;
    const monthlyInvestmentIncome =
      ((settings.startingPrincipalEgp || 0) * (avgApr / 100)) / 12;

    return {
      monthlyExpenses: monthlyExpensesEGP,
      liquidSavings,
      netWorth,
      monthsOfBuffer,
      monthlyInvestmentIncome,
    };
  }, [settings.expenses, settings.fxEgpPerKd, settings.startingPrincipalEgp]);

  const activePlan = React.useMemo(
    () => determineActivePlan(metrics),
    [metrics]
  );

  // Persist active plan in settings so other parts of the app can read it
  useEffect(() => {
    if (
      activePlan &&
      activePlan.type &&
      settings.activePlan !== activePlan.type
    ) {
      updateField("activePlan", activePlan.type);
    }
  }, [activePlan.type]);

  const updateExpense = (id: string, amount: number) => {
    const next = { ...settings };
    next.expenses = next.expenses.map((e) =>
      e.id === id ? { ...e, amountKD: amount } : e
    );
    setSettings(next);
  };

  const updateApr = (index: number, value: number) => {
    const next = { ...settings };
    next.aprSchedule = next.aprSchedule.map((row, i) =>
      i === index ? { ...row, aprPercent: value } : row
    );
    setSettings(next);
  };

  const addAprRow = () => {
    const next = { ...settings };
    const nextIndex = next.aprSchedule.length;
    next.aprSchedule = [
      ...next.aprSchedule,
      { monthIndex: nextIndex, aprPercent: 16 },
    ];
    setSettings(next);
  };

  const removeAprRow = (index: number) => {
    const next = { ...settings };
    next.aprSchedule = next.aprSchedule
      .filter((_, i) => i !== index)
      .map((r, i) => ({ ...r, monthIndex: i }));
    setSettings(next);
  };

  const addExpense = () => {
    const next = { ...settings };
    const id = `exp-${Date.now()}`;
    next.expenses = [
      ...next.expenses,
      { id, name: "New Expense", amountKD: 0 },
    ];
    setSettings(next);
  };

  const updateExpenseName = (id: string, name: string) => {
    const next = { ...settings };
    next.expenses = next.expenses.map((e) =>
      e.id === id ? { ...e, name } : e
    );
    setSettings(next);
  };

  const removeExpense = (id: string) => {
    const next = { ...settings };
    next.expenses = next.expenses.filter((e) => e.id !== id);
    setSettings(next);
  };

  return (
    <div className="p-6 rounded-lg border gaia-border bg-card">
      <h3 className="text-lg font-semibold mb-4">Settings</h3>

      <div className="space-y-6">
        {/* Income and FX Section */}
        <div>
          <h4 className="text-sm font-medium mb-2">
            Income & Expenses Summary
          </h4>
          <div className="flex items-start gap-4">
            <div className="w-full grid grid-cols-4 gap-2">
              <div>
                <label className="text-sm text-muted-foreground block">
                  Monthly income (KD)
                </label>
                <input
                  className="w-full p-2 rounded border gaia-border"
                  type="number"
                  value={settings.monthlyIncomeKD}
                  onChange={(e) =>
                    updateField("monthlyIncomeKD", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block">
                  Monthly Income (EGP)
                </label>
                <div className="w-full p-2 rounded border gaia-border bg-muted/5">
                  {(
                    settings.monthlyIncomeKD * settings.fxEgpPerKd
                  ).toLocaleString()}{" "}
                  EGP
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block">
                  Monthly expenses (KD)
                </label>
                <div className="w-full p-2 rounded border gaia-border bg-muted/5">
                  {settings.expenses
                    .reduce((sum, exp) => sum + exp.amountKD, 0)
                    .toFixed(3)}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block">
                  Exchange Rate (EGP/KD)
                </label>
                <div className="relative">
                  <div className="w-full p-2 rounded border gaia-border bg-muted/5 pr-24">
                    {settings.fxEgpPerKd.toFixed(3)}
                  </div>
                  <button
                    onClick={updateExchangeRate}
                    disabled={isUpdating}
                    title="Update exchange rate now"
                    aria-label="Update exchange rate now"
                    className={`absolute right-1 top-1 bottom-1 px-2 rounded 
                      ${
                        isUpdating
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                  >
                    {isUpdating ? "Updating..." : ""}
                  </button>
                </div>
                {lastUpdateTime && (
                  <div
                    className={`text-xs mt-1 flex items-center gap-2 ${
                      isStale ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    <span>
                      Last updated ·{" "}
                      {lastUpdateTime.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    {isStale && <span className="text-yellow-600"></span>}
                  </div>
                )}
                {updateError && (
                  <div className="text-xs text-red-500 mt-1">{updateError}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Monthly Expenses</h4>
            <button
              onClick={addExpense}
              className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add Expense
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {settings.expenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-2 group">
                <input
                  type="text"
                  value={exp.name}
                  onChange={(e) => updateExpenseName(exp.id, e.target.value)}
                  className="w-28 p-1 text-sm rounded border gaia-border"
                  placeholder="Expense name"
                />
                <input
                  type="number"
                  value={exp.amountKD}
                  onChange={(e) =>
                    updateExpense(exp.id, Number(e.target.value))
                  }
                  className="p-1 rounded border gaia-border w-full"
                  placeholder="Amount (KD)"
                />
                <button
                  onClick={() => removeExpense(exp.id)}
                  className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate Settings */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <label className="text-sm text-muted-foreground block">
                  Current plan Ravenu target (EGP/month)
                </label>
                <div className="w-full p-2 rounded border gaia-border bg-muted/5">
                  <div className="text-sm">
                    <strong>Plan {activePlan.type}</strong> — {activePlan.title}
                  </div>
                  <div className="text-lg font-semibold">
                    {activePlan.targetAmount.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    EGP / month
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block">
                  Starting principal (EGP)
                </label>
                <input
                  className="w-full p-2 rounded border gaia-border"
                  type="number"
                  value={settings.startingPrincipalEgp}
                  onChange={(e) =>
                    updateField("startingPrincipalEgp", Number(e.target.value))
                  }
                />
              </div>
              {/* Add Investment button moved to the Plan card */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.reinvest}
                    onChange={(e) => updateField("reinvest", e.target.checked)}
                  />
                  <span className="text-sm">Reinvest interest</span>
                </label>
                {settings.reinvest && (
                  <div className="flex items-center gap-2">
                    <input
                      className="p-1 rounded border gaia-border w-20"
                      type="number"
                      min={0}
                      max={100}
                      value={settings.reinvestPercent}
                      onChange={(e) =>
                        updateField("reinvestPercent", Number(e.target.value))
                      }
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
