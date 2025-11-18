"use client";

import { useEffect, useState } from "react";
import type {
  WealthOverview,
  WealthState,
  WealthLevelsSnapshot,
  WealthLevelDefinition,
} from "./lib/types";
import {
  loadWealthState,
  loadWealthStateWithRemote,
} from "./lib/wealthStore";
import { buildWealthOverview, getTodayInKuwait } from "./lib/summary";
import { buildLevelsSnapshot } from "./lib/levels";
import { hasSupabaseConfig } from "./lib/remoteWealth";
import { getExchangeRate } from "./lib/exchangeRate";
import WealthSnapshot from "./components/WealthSnapshot";
import WealthMap from "./components/WealthMap";
import QuickLinks from "./components/QuickLinks";
import WealthAlerts from "./components/WealthAlerts";
import BlendsStrip from "./components/BlendsStrip";

type FxInfo = {
  rate: number;
  timestamp: number;
  isCached: boolean;
};

function getLevelDefinitions(snapshot: WealthLevelsSnapshot | null) {
  if (!snapshot) {
    return {
      current: null as WealthLevelDefinition | null,
      next: null as WealthLevelDefinition | null,
    };
  }
  const current =
    snapshot.currentLevelId != null
      ? snapshot.levels.find((l) => l.id === snapshot.currentLevelId) ?? null
      : null;
  const next =
    snapshot.nextLevelId != null
      ? snapshot.levels.find((l) => l.id === snapshot.nextLevelId) ?? null
      : null;
  return { current, next };
}

function buildLevelHeadline(snapshot: WealthLevelsSnapshot | null): string {
  if (!snapshot) {
    return "GAIA needs at least one month of expenses to place you on the ladder.";
  }
  const { current } = getLevelDefinitions(snapshot);
  if (!current) {
    return "You are at the starting line. Once expenses and interest are logged for at least one month, GAIA will place you on the ladder.";
  }

  const order = current.order ?? 0;
  if (order <= 2) {
    return "You are in the early buffer zone. This is still a 'poor' level, but it is a starting point, not a verdict.";
  }
  if (order <= 4) {
    return "You are in the stability-building zone. You are no longer at the very bottom; the focus now is deepening your runway.";
  }
  return "You are in a strong stability / wealth zone. The main work from here is maintenance and gentle optimisation, not stress.";
}

function buildPlanHeadline(
  snapshot: WealthLevelsSnapshot | null,
  overview: WealthOverview | null,
): string {
  if (!snapshot || !overview) {
    return "Log grouped expenses and any interest events for at least one month so GAIA can suggest a concrete next step.";
  }

  const { next } = getLevelDefinitions(snapshot);
  const monthsSaved = snapshot.monthsOfExpensesSaved;
  const expenses = snapshot.estimatedMonthlyExpenses;
  const currency = overview.primaryCurrency;

  if (
    !next ||
    monthsSaved == null ||
    !Number.isFinite(monthsSaved) ||
    !expenses ||
    !Number.isFinite(expenses)
  ) {
    return "Keep logging income, deposits, expenses, and interest. GAIA will refine your next step as the picture becomes clearer.";
  }

  const targetMonths = next.minMonthsOfExpenses ?? monthsSaved;
  if (!Number.isFinite(targetMonths) || targetMonths <= monthsSaved) {
    return "You are very close to the next level. A few more consistent months of saving will push you over the line.";
  }

  const deltaMonths = targetMonths - monthsSaved;
  const additionalNeeded = deltaMonths * expenses;

  const formattedNeeded = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(additionalNeeded);

  const levelName = next.name || "your next level";

  return `If you can add roughly ${formattedNeeded} into your buffers / certificates over time, you will cross into ${levelName}. Small, repeatable moves are enough.`;
}

export default function WealthAwakeningClientPage() {
  const [overview, setOverview] = useState<WealthOverview | null>(null);
  const [levelsSnapshot, setLevelsSnapshot] =
    useState<WealthLevelsSnapshot | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "syncing" | "synced" | "local-only" | "no-supabase"
  >("syncing");
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [fxInfo, setFxInfo] = useState<FxInfo | null>(null);

  // Detect whether Supabase is configured on the client
  useEffect(() => {
    setSupabaseEnabled(hasSupabaseConfig());
  }, []);

  // Load Wealth state (local + Supabase) and build overview + levels
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setSyncStatus(supabaseEnabled ? "syncing" : "no-supabase");
      let state: WealthState;
      try {
        state = await loadWealthStateWithRemote();
        if (!supabaseEnabled) {
          setSyncStatus("no-supabase");
        } else {
          setSyncStatus("synced");
        }
      } catch (error) {
        console.warn("Wealth Awakening: falling back to local state only:", error);
        state = loadWealthState();
        setSyncStatus(supabaseEnabled ? "local-only" : "no-supabase");
      }

      if (cancelled) return;

      const today = getTodayInKuwait();
      const ov = buildWealthOverview(state, today);
      setOverview(ov);
      const snapshot = buildLevelsSnapshot(ov);
      setLevelsSnapshot(snapshot);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled]);

  // Load FX rate (KWD → EGP) with 24h cache
  useEffect(() => {
    let cancelled = false;

    async function hydrateFx() {
      const info = await getExchangeRate();
      if (!cancelled) {
        setFxInfo(info);
      }
    }

    hydrateFx();

    return () => {
      cancelled = true;
    };
  }, []);

  const syncLabel =
    syncStatus === "syncing"
      ? "Syncing with Supabase..."
      : syncStatus === "synced"
      ? "Synced with Supabase"
      : syncStatus === "local-only"
      ? "Local mode (Supabase unreachable)"
      : "Local cache only";

  const syncTone =
    syncStatus === "synced"
      ? "bg-success/10 text-success border-success/40"
      : syncStatus === "syncing"
      ? "bg-warning/10 text-warning border-warning/40"
      : "bg-base-200 text-base-content/70 border-base-300";

  const levelHeadline = buildLevelHeadline(levelsSnapshot);
  const planHeadline = buildPlanHeadline(levelsSnapshot, overview);

  const fxText =
    fxInfo && fxInfo.rate > 0
      ? `1 KWD ≈ ${fxInfo.rate.toFixed(2)} EGP · ${
          fxInfo.isCached ? "cached in last 24h" : "fresh"
        }`
      : null;

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-primary/10 via-base-100 to-base-100">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_18%_20%,rgba(79,70,229,0.14),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.12),transparent_25%),radial-gradient(circle_at_50%_85%,rgba(34,197,94,0.12),transparent_30%)]" />
      <main className="relative mx-auto max-w-6xl px-4 py-10">
        <section className="overflow-hidden rounded-3xl border border-base-300/70 bg-base-100/95 shadow-2xl shadow-primary/10">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
            <header className="relative flex flex-col gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/90">
                  Wall Street Drive
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold text-base-content md:text-4xl">
                    Wealth Awakening
                  </h1>
                  <p className="max-w-2xl text-sm text-base-content/70 md:text-base">
                    A calm, driven Wealth co-pilot that tracks your accounts, certificates, and flows, and tells the story of how your money moves through your life.
                  </p>
                  {fxText && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-200/60 px-3 py-1 text-[11px] font-medium text-base-content/70">
                      <span className="h-2 w-2 rounded-full bg-primary/70" />
                      {fxText}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${syncTone}`}
                >
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-current opacity-70" />
                  {syncLabel}
                </span>
                <span className="text-[11px] text-base-content/60">
                  Snapshots update as you log flows; Supabase sync when available.
                </span>
              </div>
            </header>
          </div>
        </section>

        {!overview ? (
          <section className="mt-8 rounded-2xl border border-base-300 bg-base-100/85 p-6 text-sm text-base-content/70 shadow-lg shadow-primary/5">
            Loading your Wealth map and snapshot...
          </section>
        ) : (
          <>
            <section className="mt-8">
              <WealthSnapshot overview={overview} />
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
                  Current level
                </h2>
                <p className="mt-2 text-sm text-base-content/75">{levelHeadline}</p>
              </article>
              <article className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
                  Current plan
                </h2>
                <p className="mt-2 text-sm text-base-content/75">{planHeadline}</p>
              </article>
            </section>

            <div className="mt-4">
              <BlendsStrip snapshot={levelsSnapshot} />
            </div>

            <section className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <WealthMap overview={overview} />
              <QuickLinks />
            </section>

              <section className="mt-6">
                <WealthAlerts overview={overview} />
              </section>
          </>
        )}
      </main>
    </div>
  );
}
