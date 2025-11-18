import type { WealthState, WealthAccount, WealthInstrument, WealthFlow } from "./types";
import { hasSupabaseConfig, fetchRemoteWealthAll, pushRemoteWealthAll } from "./remoteWealth";

const LOCAL_KEY = "gaia_wealth_awakening_state_v1";

const DEFAULT_ACCOUNTS: WealthAccount[] = [
  {
    id: "cash-main",
    name: "Main cash buffer",
    currency: "KWD",
    type: "cash",
    currentBalance: 600,
    isPrimary: true,
    note: "Day-to-day cash and bills in KWD.",
  },
  {
    id: "cd-egp-long-term",
    name: "EGP 3-year certificate",
    currency: "EGP",
    type: "certificate",
    currentBalance: 250000,
    note: "Long-term EGP certificate aimed at future income.",
  },
  {
    id: "invest-future",
    name: "Future investments",
    currency: "EGP",
    type: "investment",
    currentBalance: 0,
    note: "Reserved lane for future investment products.",
  },
];

const DEFAULT_INSTRUMENTS: WealthInstrument[] = [
  {
    id: "cert-main-3y",
    accountId: "cd-egp-long-term",
    name: "Main 3-year EGP certificate",
    currency: "EGP",
    principal: 250000,
    startDate: "2026-01-01",
    termMonths: 36,
    annualRatePercent: 18.5,
    payoutFrequency: "monthly-interest",
    autoRenew: false,
    note: "Simple example certificate with monthly interest payouts.",
  },
];

const DEFAULT_FLOWS: WealthFlow[] = [
  {
    id: "flow-salary-1",
    date: "2026-01-05",
    accountId: "cash-main",
    instrumentId: null,
    kind: "income",
    amount: 800,
    currency: "KWD",
    description: "Example salary income into main KWD buffer.",
  },
  {
    id: "flow-deposit-cert",
    date: "2026-01-06",
    accountId: "cd-egp-long-term",
    instrumentId: "cert-main-3y",
    kind: "deposit",
    amount: 250000,
    currency: "EGP",
    description: "Deposit into EGP certificate.",
  },
  {
    id: "flow-interest-1",
    date: "2026-01-30",
    accountId: "cash-main",
    instrumentId: "cert-main-3y",
    kind: "interest",
    amount: 3800,
    currency: "EGP",
    description: "Example monthly interest from certificate (EGP).",
  },
  {
    id: "flow-expense-1",
    date: "2026-01-20",
    accountId: "cash-main",
    instrumentId: null,
    kind: "expense",
    amount: 400,
    currency: "KWD",
    description: "Grouped monthly expenses example from cash buffer (approx 400 KWD).",
  },
];

const DEFAULT_STATE: WealthState = {
  accounts: DEFAULT_ACCOUNTS,
  instruments: DEFAULT_INSTRUMENTS,
  flows: DEFAULT_FLOWS,
};

export function loadWealthState(): WealthState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(DEFAULT_STATE));
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    return {
      accounts: Array.isArray(parsed.accounts)
        ? parsed.accounts
        : DEFAULT_STATE.accounts,
      instruments: Array.isArray(parsed.instruments)
        ? parsed.instruments
        : DEFAULT_STATE.instruments,
      flows: Array.isArray(parsed.flows) ? parsed.flows : DEFAULT_STATE.flows,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveWealthState(state: WealthState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function resetWealthState(): WealthState {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(DEFAULT_STATE));
  }
  return DEFAULT_STATE;
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) {
    map.set(item.id, item);
  }
  for (const item of remote) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export async function loadWealthStateWithRemote(): Promise<WealthState> {
  const local = loadWealthState();

  if (typeof window === "undefined" || !hasSupabaseConfig()) {
    return local;
  }

  const remote = await fetchRemoteWealthAll();
  if (!remote) {
    return local;
  }

  const remoteIsEmpty =
    remote.accounts.length === 0 &&
    remote.instruments.length === 0 &&
    remote.flows.length === 0;

  if (remoteIsEmpty) {
    // Seed Supabase with local state on first sync
    await pushRemoteWealthAll(local);
    return local;
  }

  const merged: WealthState = {
    accounts: mergeById(local.accounts, remote.accounts),
    instruments: mergeById(local.instruments, remote.instruments),
    flows: mergeById(local.flows, remote.flows),
  };

  saveWealthState(merged);
  return merged;
}

export async function saveWealthStateWithRemote(
  state: WealthState,
): Promise<void> {
  saveWealthState(state);
  if (!hasSupabaseConfig()) return;
  await pushRemoteWealthAll(state);
}

export async function resetWealthStateWithRemote(): Promise<WealthState> {
  const fresh = resetWealthState();
  if (hasSupabaseConfig()) {
    await pushRemoteWealthAll(fresh);
  }
  return fresh;
}
