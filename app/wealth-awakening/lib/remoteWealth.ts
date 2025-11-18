import { supabase } from "./supabaseClient";
import type { WealthAccount, WealthInstrument, WealthFlow, WealthState } from "./types";

export function hasSupabaseConfig(): boolean {
  return !!supabase;
}

function mapAccountFromRow(row: any): WealthAccount {
  return {
    id: String(row.id),
    name: row.name ?? "",
    currency: row.currency ?? "KWD",
    type: row.type ?? "cash",
    currentBalance: Number(row.current_balance ?? 0),
    isPrimary: !!row.is_primary,
    note: row.note ?? undefined,
  };
}

function mapInstrumentFromRow(row: any): WealthInstrument {
  return {
    id: String(row.id),
    accountId: row.account_id ?? "",
    name: row.name ?? "",
    currency: row.currency ?? "KWD",
    principal: Number(row.principal ?? 0),
    startDate: row.start_date ?? "2026-01-01",
    termMonths: Number(row.term_months ?? 0),
    annualRatePercent: Number(row.annual_rate_percent ?? 0),
    payoutFrequency: row.payout_frequency ?? "monthly-interest",
    autoRenew: !!row.auto_renew,
    note: row.note ?? undefined,
  };
}

function mapFlowFromRow(row: any): WealthFlow {
  return {
    id: String(row.id),
    date: row.date ?? "2026-01-01",
    accountId: row.account_id ?? null,
    instrumentId: row.instrument_id ?? null,
    kind: row.kind ?? "deposit",
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? "KWD",
    description: row.description ?? undefined,
  };
}

function mapAccountToRow(acc: WealthAccount) {
  return {
    id: acc.id,
    name: acc.name,
    currency: acc.currency,
    type: acc.type,
    current_balance: acc.currentBalance,
    is_primary: acc.isPrimary ?? false,
    note: acc.note ?? null,
  };
}

function mapInstrumentToRow(inst: WealthInstrument) {
  return {
    id: inst.id,
    account_id: inst.accountId,
    name: inst.name,
    currency: inst.currency,
    principal: inst.principal,
    start_date: inst.startDate,
    term_months: inst.termMonths,
    annual_rate_percent: inst.annualRatePercent,
    payout_frequency: inst.payoutFrequency,
    auto_renew: inst.autoRenew,
    note: inst.note ?? null,
  };
}

function mapFlowToRow(flow: WealthFlow) {
  return {
    id: flow.id,
    date: flow.date,
    account_id: flow.accountId ?? null,
    instrument_id: flow.instrumentId ?? null,
    kind: flow.kind,
    amount: flow.amount,
    currency: flow.currency,
    description: flow.description ?? null,
  };
}

export async function fetchRemoteWealthAll(): Promise<WealthState | null> {
  if (!supabase) return null;

  try {
    const [accRes, instRes, flowRes] = await Promise.all([
      supabase.from("wealth_accounts").select("*"),
      supabase.from("wealth_instruments").select("*"),
      supabase.from("wealth_flows").select("*"),
    ]);

    if (accRes.error || instRes.error || flowRes.error) {
      console.warn("[Wealth] Supabase fetch error", {
        accError: accRes.error,
        instError: instRes.error,
        flowError: flowRes.error,
      });
      return null;
    }

    const accounts: WealthAccount[] = (accRes.data ?? []).map(mapAccountFromRow);
    const instruments: WealthInstrument[] = (instRes.data ?? []).map(mapInstrumentFromRow);
    const flows: WealthFlow[] = (flowRes.data ?? []).map(mapFlowFromRow);

    return { accounts, instruments, flows };
  } catch (err) {
    console.warn("[Wealth] Supabase fetch exception", err);
    return null;
  }
}

export async function pushRemoteWealthAll(state: WealthState): Promise<void> {
  if (!supabase) return;

  try {
    const accountsRows = state.accounts.map(mapAccountToRow);
    const instrumentsRows = state.instruments.map(mapInstrumentToRow);
    const flowsRows = state.flows.map(mapFlowToRow);

    const [accRes, instRes, flowRes] = await Promise.all([
      supabase.from("wealth_accounts").upsert(accountsRows, { onConflict: "id" }),
      supabase.from("wealth_instruments").upsert(instrumentsRows, { onConflict: "id" }),
      supabase.from("wealth_flows").upsert(flowsRows, { onConflict: "id" }),
    ]);

    if (accRes.error || instRes.error || flowRes.error) {
      console.warn("[Wealth] Supabase upsert error", {
        accError: accRes.error,
        instError: instRes.error,
        flowError: flowRes.error,
      });
    }
  } catch (err) {
    console.warn("[Wealth] Supabase upsert exception", err);
  }
}
