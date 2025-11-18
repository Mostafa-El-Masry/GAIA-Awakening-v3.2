"use client";

import { readJSON, writeJSON } from "@/lib/user-storage";
import type { Transaction, Budget, Goal, NetItem, NetSnapshot } from "./types";

const K = {
  tx: "wealth_transactions_v1",
  bd: "wealth_budgets_v1",
  gl: "wealth_goals_v1",
  nw: "wealth_net_items_v1",
  ns: "wealth_net_snaps_v1",
  pf: "wealth_prefs_v1",
};

export type Prefs = {
  currency: string;
  month: string; // YYYY-MM current view
};

function g<T>(k: string, fb: T): T {
  return readJSON<T>(k, fb);
}
function s<T>(k: string, v: T) {
  writeJSON(k, v);
}

export const loadTx = (): Transaction[] => g<Transaction[]>(K.tx, []);
export const saveTx = (list: Transaction[]) => s(K.tx, list);

export const loadBudgets = (): Budget[] => g<Budget[]>(K.bd, []);
export const saveBudgets = (list: Budget[]) => s(K.bd, list);

export const loadGoals = (): Goal[] => g<Goal[]>(K.gl, []);
export const saveGoals = (list: Goal[]) => s(K.gl, list);

export const loadNetItems = (): NetItem[] => g<NetItem[]>(K.nw, []);
export const saveNetItems = (list: NetItem[]) => s(K.nw, list);

export const loadNetSnaps = (): NetSnapshot[] => g<NetSnapshot[]>(K.ns, []);
export const saveNetSnaps = (list: NetSnapshot[]) => s(K.ns, list);

export const loadPrefs = (): Prefs =>
  g<Prefs>(K.pf, {
    currency: "EGP",
    month: new Date().toISOString().slice(0, 7),
  });
export const savePrefs = (p: Prefs) => s(K.pf, p);

// Helpers
export function nid(): string {
  return (
    (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)) +
    Math.random().toString(36).slice(2, 10)
  );
}
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/**
 * Add an investment (net item marked as certificate) and create an initial
 * income transaction representing the first month's revenue.
 *
 * params:
 *  - name: label for the investment
 *  - principal: amount (positive)
 *  - annualRatePercent: APR as percent (e.g. 17 for 17%)
 *  - startDate?: ISO date string to use for the initial income txn (defaults to today)
 *
 * Returns the created NetItem id.
 */
export function addInvestment({
  name,
  principal,
  annualRatePercent,
  startDate,
  endDate,
}: {
  name: string;
  principal: number;
  annualRatePercent: number;
  startDate?: string;
  endDate?: string;
}) {
  const nidVal = nid();
  // add net item
  const items = loadNetItems();
  const monthlyRevenue = (principal * (annualRatePercent / 100)) / 12;
  const item: NetItem = {
    id: nidVal,
    name,
    amount: principal,
    isCertificate: true,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    aprPercent: annualRatePercent,
    monthlyRevenue: monthlyRevenue,
  } as NetItem;
  items.push(item);
  saveNetItems(items);

  // compute monthly revenue and create an income transaction for the start date
  const date = startDate ? new Date(startDate) : new Date();
  const iso = date.toISOString();
  // compute monthly revenue and create an income transaction for the start date

  const txs = loadTx();
  txs.push({
    id: nid(),
    date: iso,
    amount: Math.round(monthlyRevenue),
    type: "income",
    category: "Investment income",
    tags: ["investment", nidVal],
    note: `Investment ${name} principal ${principal} APR ${annualRatePercent}%`,
  });
  saveTx(txs);

  return nidVal;
}
