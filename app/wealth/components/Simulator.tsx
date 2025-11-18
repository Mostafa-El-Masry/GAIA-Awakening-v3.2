"use client";

import { useMemo, useState } from "react";
import { simulate } from "../lib/sim";
import type { SimInput, SimResult, YearRow } from "../lib/types";

function fmt(n: number) {
  return n.toLocaleString("en-EG", { maximumFractionDigits: 0 });
}

const PANEL = "gaia-surface rounded-xl border gaia-border p-4 shadow-sm";
const INPUT = "gaia-input rounded-lg px-3 py-1.5";
const BUTTON_BASE =
  "rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors";

interface SimulatorProps {
  initialBaseADeposit?: number;
  initialBaseBDeposit?: number;
  id?: string;
}

export default function Simulator({
  initialBaseADeposit,
  initialBaseBDeposit,
  id,
}: SimulatorProps) {
  const [tab, setTab] = useState<"A" | "B">("A");

  const [baseA, setBaseA] = useState<SimInput>(() => ({
    startYear: 2025,
    startMonthIndex: 11,
    yearsOfDeposits: 7,
    baseMonthlyDeposit: initialBaseADeposit ?? 25000,
    minReinvest: 1000,
  }));
  const [baseB, setBaseB] = useState<SimInput>(() => ({
    startYear: 2025,
    startMonthIndex: 11,
    yearsOfDeposits: 7,
    baseMonthlyDeposit: initialBaseBDeposit ?? Math.round(25000 / 4),
    minReinvest: 1000,
  }));

  const resA: SimResult = useMemo(() => simulate("Plan A", baseA), [baseA]);
  const resB: SimResult = useMemo(() => simulate("Plan B", baseB), [baseB]);

  const res = tab === "A" ? resA : resB;

  return (
    <section id={id} className={PANEL}>
      <header className="mb-3 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="gaia-strong text-lg font-extrabold tracking-wide">
              Savings Simulator
            </h2>
            <span className="gaia-ink-soft text-xs rounded px-2 py-0.5">
              3y certs; 15%+10% floor; reinvest interest & maturities until age
              60
            </span>
          </div>
          <div className="gaia-muted text-xs">
            Start: Dec 2025. Deposits for 7 years, then auto‑reinvest monthly if
            ≥ 1,000 EGP.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`${BUTTON_BASE} ${
              tab === "A" ? "gaia-contrast" : "gaia-border gaia-surface"
            }`}
            onClick={() => setTab("A")}
          >
            Plan A — {fmt(baseA.baseMonthlyDeposit)}/mo
          </button>
          <button
            className={`${BUTTON_BASE} ${
              tab === "B" ? "gaia-contrast" : "gaia-border gaia-surface"
            }`}
            onClick={() => setTab("B")}
          >
            Plan B — {fmt(baseB.baseMonthlyDeposit)}/mo
          </button>
        </div>
      </header>

      {/* Plan inputs moved into the summary area below (merged) */}

      <div className="overflow-auto rounded-lg border gaia-border bg-[color-mix(in_srgb,var(--gaia-surface)_88%,transparent)]">
        <table className="w-full text-sm">
          <thead className="gaia-panel-soft">
            <tr>
              <th className="p-2 text-left">Year</th>
              <th className="p-2 text-left">Age</th>
              <th className="p-2 text-right">Deposited YTD</th>
              <th className="p-2 text-right">Monthly Interest (Dec)</th>
              <th className="p-2 text-right">Active Principal (Dec)</th>
              <th className="p-2 text-right">Net Worth (Dec)</th>
            </tr>
          </thead>
          <tbody>
            {(res.rows as YearRow[]).map((r) => (
              <tr key={r.year} className="border-t gaia-border">
                <td className="p-2">{r.year}</td>
                <td className="p-2">{Math.floor(r.age)}</td>
                <td className="p-2 text-right">{fmt(r.depositsYTD)}</td>
                <td className="p-2 text-right">{fmt(r.monthlyInterestDec)}</td>
                <td className="p-2 text-right">{fmt(r.activePrincipalEnd)}</td>
                <td className="p-2 text-right font-semibold">
                  {fmt(r.netWorthEnd)}
                </td>
              </tr>
            ))}
            {res.rows.length === 0 && (
              <tr>
                <td className="p-3 text-center gaia-muted" colSpan={6}>
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-6">
        <div className="gaia-panel-soft rounded-lg border p-3 shadow-sm col-span-1 sm:col-span-1">
          <div className="gaia-muted text-xs">Plan A deposit</div>
          <input
            className={`${INPUT} w-full mt-2`}
            type="number"
            value={baseA.baseMonthlyDeposit}
            onChange={(e) =>
              setBaseA({
                ...baseA,
                baseMonthlyDeposit: Number(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="gaia-panel-soft rounded-lg border p-3 shadow-sm col-span-1 sm:col-span-1">
          <div className="gaia-muted text-xs">Plan B deposit</div>
          <input
            className={`${INPUT} w-full mt-2`}
            type="number"
            value={baseB.baseMonthlyDeposit}
            onChange={(e) =>
              setBaseB({
                ...baseB,
                baseMonthlyDeposit: Number(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="gaia-panel-soft rounded-lg border p-3 shadow-sm sm:col-span-1">
          <div className="gaia-muted text-xs">Deposited total</div>
          <div className="text-lg font-extrabold">
            {fmt(res.totals.deposited)} EGP
          </div>
        </div>

        <div className="gaia-panel-soft rounded-lg border p-3 shadow-sm sm:col-span-1">
          <div className="gaia-muted text-xs">Active principal (end)</div>
          <div className="text-lg font-extrabold">
            {fmt(res.totals.activePrincipal)} EGP
          </div>
        </div>

        <div className="gaia-panel-soft rounded-lg border p-3 shadow-sm sm:col-span-1">
          <div className="gaia-muted text-xs">Cash (end)</div>
          <div className="text-lg font-extrabold">
            {fmt(res.totals.cash)} EGP
          </div>
        </div>

        <div className="gaia-panel-soft rounded-lg border p-3 shadow-sm sm:col-span-1">
          <div className="gaia-muted text-xs">Net worth (end)</div>
          <div className="text-lg font-extrabold">
            {fmt(res.totals.netWorth)} EGP
          </div>
        </div>
      </div>
    </section>
  );
}
