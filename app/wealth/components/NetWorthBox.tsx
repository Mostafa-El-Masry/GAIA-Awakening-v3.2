"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadNetItems,
  saveNetItems,
  loadNetSnaps,
  saveNetSnaps,
  nid,
} from "../lib/store";
import type { NetItem, NetSnapshot } from "../lib/types";
import { FinancialMetrics } from "../lib/wealthLevels";
import {
  determineWealthLevel,
  determineActivePlan,
} from "../lib/wealthCalculations";

function fmt(n: number) {
  return n.toLocaleString("en-EG", { maximumFractionDigits: 0 });
}

const PANEL = "gaia-surface rounded-xl border gaia-border p-4 shadow-sm";
const INPUT = "gaia-input rounded-lg px-3 py-1.5";
const BUTTON =
  "gaia-border gaia-surface rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm";
const TABLE_WRAPPER =
  "mt-2 rounded-lg border gaia-border bg-[color-mix(in_srgb,var(--gaia-surface)_88%,transparent)]";

export default function NetWorth() {
  const [items, setItems] = useState<NetItem[]>([]);
  const [month, setMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [snaps, setSnaps] = useState<NetSnapshot[]>([]);

  const [name, setName] = useState("Cash");
  const [amount, setAmount] = useState<number>(0);
  const [isCert, setIsCert] = useState<boolean>(false);

  useEffect(() => {
    setItems(loadNetItems());
    setSnaps(loadNetSnaps());
  }, []);

  const total = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);

  function add() {
    const next = [...items, { id: nid(), name, amount, isCertificate: isCert }];
    saveNetItems(next);
    setItems(next);
    setName("Cash");
    setAmount(0);
    setIsCert(false);
  }
  function remove(id: string) {
    const next = items.filter((i) => i.id !== id);
    saveNetItems(next);
    setItems(next);
  }
  function snapshot() {
    const next = [...snaps.filter((s) => s.month !== month), { month, total }];
    saveNetSnaps(next);
    setSnaps(next);
  }

  return (
    <section className={PANEL}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-wide gaia-strong">
          Net Worth
        </h2>
        <div className="flex items-center gap-2">
          <input
            className={INPUT}
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button className={BUTTON} onClick={snapshot}>
            Snapshot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border gaia-border p-3 gaia-surface shadow-sm">
          <div className="font-semibold gaia-strong">Items</div>
          <div className="mt-2 flex items-center gap-2">
            <input
              className={INPUT}
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className={INPUT}
              placeholder="Amount (+/-)"
              type="number"
              value={amount ?? ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isCert}
                onChange={(e) => setIsCert(e.target.checked)}
              />
              <span className="text-sm">Certificate</span>
            </label>
            <button className={BUTTON} onClick={add}>
              Add
            </button>
          </div>
          <div className={TABLE_WRAPPER}>
            <table className="w-full text-sm">
              <thead className="gaia-panel-soft">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t gaia-border">
                    <td className="p-2">{i.name}</td>
                    <td className="p-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!i.isCertificate}
                          onChange={(e) => {
                            const next = items.map((it) =>
                              it.id === i.id
                                ? { ...it, isCertificate: e.target.checked }
                                : it
                            );
                            saveNetItems(next);
                            setItems(next);
                          }}
                        />
                        <span className="text-sm">Certificate</span>
                      </label>
                    </td>
                    <td className="p-2 text-right">{fmt(i.amount)}</td>
                    <td className="p-2 text-right">
                      <button
                        className="gaia-border gaia-surface rounded-lg px-2 py-1 text-xs font-semibold shadow-sm"
                        onClick={() => remove(i.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="gaia-muted p-3 text-center" colSpan={3}>
                      No items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-right text-sm">
            Total: <span className="font-bold">{fmt(total)}</span>
          </div>
        </div>
        <div className="rounded-lg border gaia-border p-3 gaia-surface shadow-sm">
          <div className="font-semibold gaia-strong">Snapshots</div>
          <div className={TABLE_WRAPPER}>
            <table className="w-full text-sm">
              <thead className="gaia-panel-soft">
                <tr>
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {snaps
                  .sort((a, b) => a.month.localeCompare(b.month))
                  .map((s) => (
                    <tr key={s.month} className="gaia-border border-t">
                      <td className="p-2">{s.month}</td>
                      <td className="p-2 text-right">{fmt(s.total)}</td>
                    </tr>
                  ))}
                {snaps.length === 0 && (
                  <tr>
                    <td className="gaia-muted p-3 text-center" colSpan={2}>
                      No snapshots yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// Export a compact NetWorthBox for use elsewhere (merged from NetWorthBox.tsx)
export function NetWorthBox({ metrics }: { metrics: FinancialMetrics }) {
  const stage = determineWealthLevel(metrics);
  const activePlan = determineActivePlan(metrics);

  return (
    <div className="p-6 bg-card rounded-lg shadow-sm">
      <div className="grid grid-cols-2 gap-6">
        {/* Left column - Main metrics */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Net Worth
            </h3>
            <p className="text-2xl font-semibold">
              {metrics.netWorth.toLocaleString("en-US", {
                style: "currency",
                currency: "KWD",
              })}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Liquid Savings
            </h3>
            <p className="text-2xl font-semibold">
              {metrics.liquidSavings.toLocaleString("en-US", {
                style: "currency",
                currency: "KWD",
              })}
            </p>
          </div>
        </div>

        {/* Right column - Monthly stats */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Monthly Expenses
            </h3>
            <p className="text-2xl font-semibold">
              {metrics.monthlyExpenses.toLocaleString("en-US", {
                style: "currency",
                currency: "KWD",
              })}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Months of Buffer
            </h3>
            <p className="text-2xl font-semibold">
              {metrics.monthsOfBuffer.toFixed(1)} months
            </p>
          </div>
        </div>
      </div>

      {/* Stage and Plan Info */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium 
              ${
                stage.isHighRisk
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {stage.level}
            </div>
            {stage.isHighRisk && (
              <div className="text-red-600 flex items-center gap-1">
                <span className="text-lg">⚠️</span>
                <span className="text-sm font-medium">
                  High risk—focus on buffer
                </span>
              </div>
            )}
          </div>
          {stage.nextStage && stage.gapToNext && (
            <div className="text-sm text-muted-foreground">
              Next: {stage.nextStage} (Gap:{" "}
              {stage.gapToNext.toLocaleString("en-US", {
                style: "currency",
                currency: "KWD",
              })}
              )
            </div>
          )}
        </div>

        {/* Active Plan Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">{`Plan ${activePlan.type} · ${activePlan.title}`}</div>
            <div className="text-sm text-muted-foreground">
              {Math.round(
                (activePlan.currentProgress / activePlan.targetAmount) * 100
              )}
              %
            </div>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (activePlan.currentProgress / activePlan.targetAmount) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
