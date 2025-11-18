"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  WealthAccount,
  WealthAccountType,
  WealthState,
} from "../lib/types";
import {
  loadWealthState,
  resetWealthStateWithRemote,
} from "../lib/wealthStore";

type CurrencyTotals = Record<string, number>;

const typeLabels: Record<WealthAccountType, string> = {
  cash: "Cash & buffers",
  certificate: "Certificates / CDs",
  investment: "Investments",
  other: "Other",
};

function computeCurrencyTotals(accounts: WealthAccount[]): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const acc of accounts) {
    totals[acc.currency] = (totals[acc.currency] ?? 0) + acc.currentBalance;
  }
  return totals;
}

function formatCurrency(value: number, currency: string) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function WealthAccountsPage() {
  const [state, setState] = useState<WealthState | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const s = loadWealthState();
    setState(s);
  }, []);

  const currencyTotals = useMemo(() => {
    if (!state) return {};
    return computeCurrencyTotals(state.accounts);
  }, [state]);

  const primaryCurrency =
    state?.accounts.find((a) => a.isPrimary)?.currency ||
    state?.accounts[0]?.currency ||
    "KWD";

  const grandTotal =
    primaryCurrency && state
      ? state.accounts
          .filter((a) => a.currency === primaryCurrency)
          .reduce((sum, a) => sum + a.currentBalance, 0)
      : 0;

  async function handleReset() {
    setResetting(true);
    const fresh = await resetWealthStateWithRemote();
    setState(fresh);
    setResetting(false);
  }

  if (!state) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-base-content">
          Accounts & balances
        </h1>
        <p className="mt-2 text-sm text-base-content/70">
          Loading your Wealth accounts from local cache...
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
            Accounts & balances
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-base-content/70">
            These are the places where your money currently lives – cash
            buffers, certificates, and future investment lanes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="mt-3 inline-flex items-center justify-center rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-base-content/80 shadow-sm transition hover:border-error/60 hover:text-error disabled:opacity-60 md:mt-0"
        >
          {resetting ? "Resetting..." : "Reset example data"}
        </button>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Main currency stash
          </h2>
          <p className="mt-2 text-2xl font-semibold text-base-content">
            {formatCurrency(grandTotal, primaryCurrency)}
          </p>
          <p className="mt-1 text-xs text-base-content/65">
            Sum of all accounts in your primary currency (
            <span className="font-semibold">{primaryCurrency}</span>).
          </p>
        </article>

        <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            By currency
          </h2>
          <ul className="mt-2 space-y-1.5 text-xs text-base-content/80">
            {Object.entries(currencyTotals).map(([currency, total]) => (
              <li key={currency} className="flex items-center justify-between">
                <span className="font-medium">{currency}</span>
                <span>{formatCurrency(total, currency)}</span>
              </li>
            ))}
            {Object.keys(currencyTotals).length === 0 && (
              <li className="text-xs text-base-content/60">
                No accounts found yet.
              </li>
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-dashed border-base-300 bg-base-100/70 p-4 shadow-inner">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Editing (coming later)
          </h2>
          <p className="mt-2 text-xs text-base-content/70">
            In later weeks, you&apos;ll be able to add, rename, and retune
            these accounts directly from here. For now, GAIA uses a simple
            example map stored in your browser and optionally mirrored to
            Supabase.
          </p>
          <p className="mt-2 text-[11px] text-base-content/60">
            Tip: the data lives in local storage under{" "}
            <code className="rounded bg-base-200 px-1 py-0.5">
              gaia_wealth_awakening_state_v1
            </code>
            . If Supabase is configured, resets and later changes will also be
            backed up online.
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
        <h2 className="text-sm font-semibold text-base-content">
          Account list
        </h2>
        <p className="mt-1 text-xs text-base-content/70">
          Each entry shows the account type, currency, and current balance.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-base-content/80">
            <thead>
              <tr className="border-b border-base-300 text-[11px] uppercase tracking-wide text-base-content/60">
                <th className="py-2 pr-3">Name</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Currency</th>
                <th className="px-3 py-2 text-right">Current balance</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {state.accounts.map((acc: WealthAccount) => (
                <tr
                  key={acc.id}
                  className="border-b border-base-200/60 last:border-b-0"
                >
                  <td className="py-2 pr-3 align-top">
                    <div className="flex flex-col">
                      <span className="font-medium text-base-content/90">
                        {acc.name}
                      </span>
                      {acc.isPrimary && (
                        <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Primary
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-base-content/70">
                    {typeLabels[acc.type] ?? acc.type}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-base-content/70">
                    {acc.currency}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[11px] font-semibold text-base-content/90">
                    {formatCurrency(acc.currentBalance, acc.currency)}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-base-content/65">
                    {acc.note || <span className="opacity-60">—</span>}
                  </td>
                </tr>
              ))}
              {state.accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-xs text-base-content/60"
                  >
                    No accounts defined yet. In Week 6+ you&apos;ll be able to
                    wire in your real map here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
