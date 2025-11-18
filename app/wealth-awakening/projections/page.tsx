"use client";

import { useEffect, useMemo, useState } from "react";
import type { WealthInstrument, WealthState } from "../lib/types";
import { loadWealthState } from "../lib/wealthStore";
import {
  estimateMonthlyInterest,
  estimateTotalInterestOverHorizon,
  instrumentEndMonth,
  monthLabel,
} from "../lib/projections";
import { getTodayInKuwait } from "../lib/summary";

const HORIZON_OPTIONS = [12, 24, 36] as const;

function formatCurrency(value: number, currency: string) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function WealthProjectionsPage() {
  const [state, setState] = useState<WealthState | null>(null);
  const [horizon, setHorizon] = useState<(typeof HORIZON_OPTIONS)[number]>(
    12,
  );

  useEffect(() => {
    const s = loadWealthState();
    setState(s);
  }, []);

  const today = getTodayInKuwait();
  const instruments = state?.instruments ?? [];

  const byCurrency = useMemo(() => {
    const map = new Map<
      string,
      {
        monthlyInterest: number;
        totalOverHorizon: number;
      }
    >();
    for (const inst of instruments) {
      const monthly = estimateMonthlyInterest(inst);
      const total = estimateTotalInterestOverHorizon(inst, horizon, today);
      const entry = map.get(inst.currency) ?? {
        monthlyInterest: 0,
        totalOverHorizon: 0,
      };
      entry.monthlyInterest += monthly;
      entry.totalOverHorizon += total;
      map.set(inst.currency, entry);
    }
    return map;
  }, [instruments, horizon, today]);

  if (!state) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-base-content">
          Future projections
        </h1>
        <p className="mt-2 text-sm text-base-content/70">
          Loading your instruments and projections from local cache...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
            Wall Street Drive
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-base-content md:text-3xl">
            Future projections
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-base-content/70">
            Rough, calm projections of your interest income if nothing
            changes. No step-downs or complex compounding – just a simple view
            over the next 12–36 months.
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 md:mt-0">
          <label className="text-xs text-base-content/70">
            Horizon
            <select
              className="ml-2 rounded-full border border-base-300 bg-base-100 px-2 py-1 text-xs text-base-content/80"
              value={horizon}
              onChange={(e) =>
                setHorizon(parseInt(e.target.value, 10) as
                  | 12
                  | 24
                  | 36)
              }
            >
              {HORIZON_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h} months
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Simple, on-purpose rough
          </h2>
          <p className="mt-2 text-xs text-base-content/70">
            These projections assume your principal, rates, and payout rules
            stay the same. They&apos;re meant for a feeling, not a contract.
          </p>
        </article>

        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5 md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Interest by currency
          </h3>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {Array.from(byCurrency.entries()).map(([currency, agg]) => (
              <div
                key={currency}
                className="rounded-xl border border-base-300 bg-base-200/60 p-3 text-xs text-base-content/80"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                    {currency}
                  </span>
                  <span className="text-[11px] text-base-content/60">
                    Horizon: {horizon} months
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-base-content">
                  {formatCurrency(agg.monthlyInterest, currency)} / month
                </p>
                <p className="mt-0.5 text-[11px] text-base-content/65">
                  Roughly{" "}
                  <span className="font-semibold">
                    {formatCurrency(agg.totalOverHorizon, currency)}
                  </span>{" "}
                  total interest over the next {horizon} months.
                </p>
              </div>
            ))}
            {byCurrency.size === 0 && (
              <p className="text-xs text-base-content/60">
                No instruments defined yet. Add certificates first, then
                revisit projections.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
        <h2 className="text-sm font-semibold text-base-content">
          Instrument breakdown
        </h2>
        <p className="mt-1 text-xs text-base-content/70">
          For each instrument, see the approximate monthly interest and how
          much it could pay you over the selected horizon, within its term.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-base-content/80">
            <thead>
              <tr className="border-b border-base-300 text-[11px] uppercase tracking-wide text-base-content/60">
                <th className="py-2 pr-3">Name</th>
                <th className="px-3 py-2">Currency</th>
                <th className="px-3 py-2 text-right">Principal</th>
                <th className="px-3 py-2 text-right">Annual rate</th>
                <th className="px-3 py-2 text-right">Term</th>
                <th className="px-3 py-2 text-right">Monthly interest</th>
                <th className="px-3 py-2 text-right">
                  Interest over horizon
                </th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((inst: WealthInstrument) => {
                const monthly = estimateMonthlyInterest(inst);
                const total = estimateTotalInterestOverHorizon(
                  inst,
                  horizon,
                  today,
                );
                const endMonth = instrumentEndMonth(inst);
                return (
                  <tr
                    key={inst.id}
                    className="border-b border-base-200/70 last:border-b-0"
                  >
                    <td className="py-2 pr-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium text-base-content/90">
                          {inst.name}
                        </span>
                        <span className="mt-0.5 text-[11px] text-base-content/60">
                          Ends around {monthLabel(endMonth)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-base-content/70">
                      {inst.currency}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-[11px] font-semibold text-base-content/90">
                      {formatCurrency(inst.principal, inst.currency)}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-[11px] text-base-content/80">
                      {inst.annualRatePercent.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2 align-top text-right text-[11px] text-base-content/80">
                      {inst.termMonths} m
                    </td>
                    <td className="px-3 py-2 align-top text-right text-[11px] font-semibold text-base-content/90">
                      {formatCurrency(monthly, inst.currency)}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-[11px] font-semibold text-base-content/90">
                      {formatCurrency(total, inst.currency)}
                    </td>
                  </tr>
                );
              })}
              {instruments.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-4 text-center text-xs text-base-content/60"
                  >
                    No instruments defined yet, so there is nothing to project
                    yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-base-content/60">
          Later versions of GAIA can add more precise formulas, step-down
          rules, and multi-currency conversions. For Awakening, the goal is a
          gentle, human-scale feeling of what your current certificates are
          doing for you.
        </p>
      </section>
    </main>
  );
}
