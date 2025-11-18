"use client";

import { useEffect, useMemo, useState } from "react";
import type { WealthInstrument, WealthState } from "../lib/types";
import { loadWealthState, resetWealthState } from "../lib/wealthStore";
import {
  estimateMonthlyInterest,
  estimateTotalInterestOverHorizon,
  instrumentEndMonth,
  monthLabel,
} from "../lib/projections";
import { getTodayInKuwait } from "../lib/summary";

function formatCurrency(value: number, currency: string) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function WealthInstrumentsPage() {
  const [state, setState] = useState<WealthState | null>(null);

  useEffect(() => {
    const s = loadWealthState();
    setState(s);
  }, []);

  const today = getTodayInKuwait();

  const instruments = state?.instruments ?? [];

  const portfolioByCurrency = useMemo(() => {
    const map = new Map<
      string,
      { principal: number; monthlyInterest: number; interest12m: number }
    >();
    for (const inst of instruments) {
      const monthly = estimateMonthlyInterest(inst);
      const total12 = estimateTotalInterestOverHorizon(inst, 12, today);
      const entry = map.get(inst.currency) ?? {
        principal: 0,
        monthlyInterest: 0,
        interest12m: 0,
      };
      entry.principal += inst.principal;
      entry.monthlyInterest += monthly;
      entry.interest12m += total12;
      map.set(inst.currency, entry);
    }
    return map;
  }, [instruments, today]);

  function handleReset() {
    const fresh = resetWealthState();
    setState(fresh);
  }

  if (!state) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-base-content">
          Certificates & instruments
        </h1>
        <p className="mt-2 text-sm text-base-content/70">
          Loading your instruments from local cache...
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
            Certificates & instruments
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-base-content/70">
            Long-term deposits, CDs, and other instruments that generate
            interest for you. For now, GAIA uses a simple monthly-interest
            estimate without complex compounding.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="mt-3 inline-flex items-center justify-center rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-base-content/80 shadow-sm transition hover:border-error/60 hover:text-error md:mt-0"
        >
          Reset example data
        </button>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Portfolio overview
          </h2>
          <p className="mt-2 text-xs text-base-content/70">
            Overview of your instruments by currency. All numbers are rough,
            on-purpose-simple estimates.
          </p>
        </article>

        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5 md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            By currency
          </h3>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {Array.from(portfolioByCurrency.entries()).map(
              ([currency, agg]) => (
                <div
                  key={currency}
                  className="rounded-xl border border-base-300 bg-base-200/60 p-3 text-xs text-base-content/80"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/70">
                      {currency}
                    </span>
                    <span className="text-[11px] text-base-content/60">
                      ~monthly interest
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-base-content">
                    {formatCurrency(agg.monthlyInterest, currency)} / month
                  </p>
                  <p className="mt-0.5 text-[11px] text-base-content/65">
                    Principal parked:{" "}
                    <span className="font-semibold">
                      {formatCurrency(agg.principal, currency)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-base-content/65">
                    Roughly{" "}
                    <span className="font-semibold">
                      {formatCurrency(agg.interest12m, currency)}
                    </span>{" "}
                    over the next 12 months if nothing changes.
                  </p>
                </div>
              ),
            )}
            {portfolioByCurrency.size === 0 && (
              <p className="text-xs text-base-content/60">
                No instruments defined yet. Later you&apos;ll be able to add
                real certificates here.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
        <h2 className="text-sm font-semibold text-base-content">
          Instruments list
        </h2>
        <p className="mt-1 text-xs text-base-content/70">
          Each row is a single certificate or instrument, with a simple
          monthly-interest estimate and rough 12-month projection.
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
                <th className="px-3 py-2 text-right">Monthly interest (approx)</th>
                <th className="px-3 py-2 text-right">Next 12m (approx)</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((inst: WealthInstrument) => {
                const monthly = estimateMonthlyInterest(inst);
                const total12 = estimateTotalInterestOverHorizon(
                  inst,
                  12,
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
                      {formatCurrency(total12, inst.currency)}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-base-content/65">
                      {inst.note || <span className="opacity-60">—</span>}
                    </td>
                  </tr>
                );
              })}
              {instruments.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-4 text-center text-xs text-base-content/60"
                  >
                    No instruments defined yet. In later weeks, you&apos;ll be
                    able to add your real certificates here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-base-content/60">
          These are soft, approximate numbers meant to give you a feeling for
          your interest income, not legal or banking-grade precision.
        </p>
      </section>
    </main>
  );
}
