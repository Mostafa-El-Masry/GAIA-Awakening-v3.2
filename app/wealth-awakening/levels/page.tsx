"use client";

import { useEffect, useMemo, useState } from "react";
import type { WealthState, WealthLevelsSnapshot } from "../lib/types";
import { loadWealthState } from "../lib/wealthStore";
import { buildWealthOverview, getTodayInKuwait } from "../lib/summary";
import { buildLevelsSnapshot } from "../lib/levels";

function formatCurrency(value: number, currency: string) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "–";
  return `${value.toFixed(1)}%`;
}

function formatMonths(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "–";
  if (value < 1) return `${value.toFixed(1)} mo`;
  if (value < 10) return `${value.toFixed(1)} mo`;
  return `${value.toFixed(0)} mo`;
}

export default function WealthLevelsPage() {
  const [state, setState] = useState<WealthState | null>(null);
  const [snapshot, setSnapshot] = useState<WealthLevelsSnapshot | null>(
    null,
  );

  useEffect(() => {
    const s = loadWealthState();
    setState(s);
    const today = getTodayInKuwait();
    const todayOverview = buildWealthOverview(s, today);
    const snap = buildLevelsSnapshot(todayOverview);
    setSnapshot(snap);
  }, []);

  const primaryCurrency = useMemo(() => {
    if (!state) return "KWD";
    return (
      state.accounts.find((a) => a.isPrimary)?.currency ||
      state.accounts[0]?.currency ||
      "KWD"
    );
  }, [state]);

  if (!state || !snapshot) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-base-content">
          Wealth levels
        </h1>
        <p className="mt-2 text-sm text-base-content/70">
          Loading your current level and coverage from local cache...
        </p>
      </main>
    );
  }

  const currentLevel = snapshot.levels.find(
    (lvl) => lvl.id === snapshot.currentLevelId,
  );
  const nextLevel = snapshot.levels.find(
    (lvl) => lvl.id === snapshot.nextLevelId,
  );

  const totalPrimaryStash = state.accounts
    .filter((a) => a.currency === primaryCurrency)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  let nextLevelHint: string | null = null;
  if (nextLevel && snapshot.estimatedMonthlyExpenses && snapshot.monthsOfExpensesSaved !== null) {
    const targetMonths =
      nextLevel.minMonthsOfExpenses ?? snapshot.monthsOfExpensesSaved;
    const targetSavings = targetMonths * snapshot.estimatedMonthlyExpenses;
    const needMore = targetSavings - totalPrimaryStash;
    if (needMore > 0) {
      nextLevelHint = `You are roughly ${formatCurrency(
        needMore,
        primaryCurrency,
      )} away from the savings side of ${nextLevel.shortLabel}.`;
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
            Wall Street Drive
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-base-content md:text-3xl">
            Wealth levels
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-base-content/70">
            A calm ladder from Thin buffer to Interest cover, driven by your
            real numbers. GAIA looks at your savings, typical expenses, and
            interest to place you on the road.
          </p>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Current level
          </h2>
          <p className="mt-2 text-sm font-semibold text-base-content">
            {currentLevel ? currentLevel.shortLabel : "Not enough data yet"}
          </p>
          <p className="mt-1 text-xs text-base-content/70">
            {currentLevel
              ? currentLevel.description
              : "Once GAIA sees at least one month of expenses, it will place you on the ladder."}
          </p>
        </article>

        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Coverage
          </h2>
          <dl className="mt-2 space-y-1 text-xs text-base-content/80">
            <div className="flex items-center justify-between gap-2">
              <dt>Estimated monthly expenses</dt>
              <dd className="font-semibold">
                {snapshot.estimatedMonthlyExpenses
                  ? formatCurrency(
                      snapshot.estimatedMonthlyExpenses,
                      primaryCurrency,
                    )
                  : "–"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Monthly interest (passive)</dt>
              <dd className="font-semibold">
                {formatCurrency(
                  snapshot.monthlyPassiveIncome ?? 0,
                  primaryCurrency,
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Interest coverage</dt>
              <dd className="font-semibold">
                {formatPercent(snapshot.coveragePercent)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-base-content/60">
            Coverage is how much of your estimated monthly expenses could be
            paid by interest alone, in your primary currency.
          </p>
        </article>

        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Runway
          </h2>
          <dl className="mt-2 space-y-1 text-xs text-base-content/80">
            <div className="flex items-center justify-between gap-2">
              <dt>Savings in primary currency</dt>
              <dd className="font-semibold">
                {formatCurrency(totalPrimaryStash, primaryCurrency)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Months of expenses saved</dt>
              <dd className="font-semibold">
                {formatMonths(snapshot.monthsOfExpensesSaved)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-base-content/60">
            This is an approximate runway in your primary currency only. Other
            currencies and assets add extra safety on top.
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
        <h2 className="text-sm font-semibold text-base-content">
          Ladder & next step
        </h2>
        <p className="mt-1 text-xs text-base-content/70">
          Each level is a simple checkpoint. You don&apos;t have to race. The
          goal is to know roughly where you stand and what the next gentle
          improvement could be.
        </p>

        {nextLevelHint && (
          <p className="mt-3 text-xs font-medium text-base-content/80">
            {nextLevelHint}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {snapshot.levels.map((level) => {
            const isCurrent = level.id === snapshot.currentLevelId;
            const isNext = level.id === snapshot.nextLevelId;

            return (
              <div
                key={level.id}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-xs ${
                  isCurrent
                    ? "border-primary/70 bg-primary/5"
                    : isNext
                    ? "border-accent/70 bg-accent/5"
                    : "border-base-300 bg-base-100"
                }`}
              >
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-base-content/80">
                  {level.order}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-base-content/90">
                      {level.shortLabel}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Current
                      </span>
                    )}
                    {isNext && !isCurrent && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        Next target
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-base-content/70">
                    {level.description}
                  </p>
                  <p className="mt-0.5 text-[11px] text-base-content/60">
                    {level.minMonthsOfExpenses != null && (
                      <span>
                        • Aim for at least{" "}
                        <span className="font-semibold">
                          {level.minMonthsOfExpenses} months
                        </span>{" "}
                        of expenses saved.
                      </span>
                    )}{" "}
                    {level.minInterestCoveragePercent != null && (
                      <span>
                        • Interest covering around{" "}
                        <span className="font-semibold">
                          {level.minInterestCoveragePercent}%
                        </span>{" "}
                        of your monthly costs.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
