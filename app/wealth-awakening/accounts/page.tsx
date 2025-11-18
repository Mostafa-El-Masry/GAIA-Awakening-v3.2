"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  WealthAccount,
  WealthAccountType,
  WealthState,
} from "../lib/types";
import {
  loadWealthState,
  saveWealthStateWithRemote,
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
  const [editing, setEditing] = useState<WealthAccount | null>(null);
  const [isNew, setIsNew] = useState(false);
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
    setEditing(null);
    setIsNew(false);
    setResetting(false);
  }

  function startCreate() {
    setIsNew(true);
    setEditing({
      id: `acc-${Math.random().toString(36).slice(2, 8)}`,
      name: "",
      currency: primaryCurrency || "KWD",
      type: "cash",
      currentBalance: 0,
      note: "",
      isPrimary: false,
    });
  }

  function startEdit(acc: WealthAccount) {
    setIsNew(false);
    setEditing(acc);
  }

  async function handleDelete(id: string) {
    if (!state) return;
    const nextAccounts = state.accounts.filter((a) => a.id !== id);
    const next: WealthState = { ...state, accounts: nextAccounts };
    await saveWealthStateWithRemote(next);
    setState(next);
    if (editing?.id === id) {
      setEditing(null);
      setIsNew(false);
    }
  }

  async function handleSave() {
    if (!state || !editing) return;
    const trimmedName = editing.name.trim();
    if (!trimmedName) return;

    let accounts = state.accounts.slice();
    const existingIdx = accounts.findIndex((a) => a.id === editing.id);

    const payload: WealthAccount = {
      ...editing,
      name: trimmedName,
      currentBalance: Number(editing.currentBalance) || 0,
      note: editing.note?.trim() || "",
    };

    if (payload.isPrimary) {
      accounts = accounts.map((a) => ({ ...a, isPrimary: false }));
    }

    if (existingIdx >= 0) {
      accounts[existingIdx] = payload;
    } else {
      accounts.push(payload);
    }

    const next: WealthState = { ...state, accounts };
    await saveWealthStateWithRemote(next);
    setState(next);
    setEditing(null);
    setIsNew(false);
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
            These are the places where your money currently lives — cash
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

      <section className="mt-6 space-y-4 rounded-3xl border border-base-300 bg-base-100/95 p-4 shadow-lg shadow-primary/10 md:p-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                  Main currency stash
                </p>
                <p className="mt-2 text-2xl font-semibold text-base-content">
                  {formatCurrency(grandTotal, primaryCurrency)}
                </p>
                <p className="mt-1 text-xs text-base-content/65">
                  Sum of all accounts in your primary currency (
                  <span className="font-semibold">{primaryCurrency}</span>).
                </p>
              </div>
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:border-primary/50"
              >
                + Add account
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-base-300 bg-base-100/90 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-base-content/70">
              By currency
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-base-content/80">
              {Object.entries(currencyTotals).map(([currency, total]) => (
                <li key={currency} className="flex items-center justify-between">
                  <span className="font-medium">{currency}</span>
                  <span>{formatCurrency(total, currency)}</span>
                </li>
              ))}
              {Object.keys(currencyTotals).length === 0 && (
                <li className="text-xs text-base-content/60">No accounts found yet.</li>
              )}
            </ul>
            <p className="mt-3 text-[11px] text-base-content/60">
              Editing and resets save locally and mirror to Supabase when configured.
            </p>
          </div>
        </div>

        {editing && (
          <div className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-base-content">
                {isNew ? "Add account" : "Edit account"}
              </h3>
              <div className="flex gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setIsNew(false);
                  }}
                  className="rounded-full border border-base-300 px-3 py-1 text-base-content/70 hover:border-base-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full border border-success/30 bg-success/10 px-3 py-1 font-semibold text-success hover:border-success/50"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-xs text-base-content/70">
                Name
                <input
                  className="mt-1 w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                />
              </label>
              <label className="text-xs text-base-content/70">
                Currency
                <input
                  className="mt-1 w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm"
                  value={editing.currency}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, currency: e.target.value.toUpperCase() } : prev,
                    )
                  }
                />
              </label>
              <label className="text-xs text-base-content/70">
                Type
                <select
                  className="mt-1 w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm"
                  value={editing.type}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, type: e.target.value as WealthAccountType } : prev,
                    )
                  }
                >
                  <option value="cash">Cash & buffers</option>
                  <option value="certificate">Certificates / CDs</option>
                  <option value="investment">Investments</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-xs text-base-content/70">
                Current balance
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm"
                  value={editing.currentBalance}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, currentBalance: Number(e.target.value) } : prev,
                    )
                  }
                />
              </label>
              <label className="text-xs text-base-content/70 md:col-span-2">
                Notes
                <textarea
                  className="mt-1 w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm"
                  rows={2}
                  value={editing.note ?? ""}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, note: e.target.value } : prev))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-base-content/80">
                <input
                  type="checkbox"
                  checked={editing.isPrimary}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, isPrimary: e.target.checked } : prev,
                    )
                  }
                  className="h-4 w-4 rounded border-base-300"
                />
                Mark as primary currency
              </label>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
        <h2 className="text-sm font-semibold text-base-content">Account list</h2>
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
                <th className="px-3 py-2 text-right">Actions</th>
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
                  <td className="px-3 py-2 align-top text-right">
                    <div className="flex justify-end gap-2 text-[11px]">
                      <button
                        type="button"
                        className="rounded-full border border-base-300 px-2 py-1 text-base-content/70 hover:border-base-400"
                        onClick={() => startEdit(acc)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-error/30 px-2 py-1 text-error hover:border-error/50"
                        onClick={() => handleDelete(acc.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {state.accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
