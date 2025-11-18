"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listBuilds } from "@/app/apollo/labs/lib/labs";
import { hasVault } from "@/app/ELEUTHIA/lib/storage";
import { readJSON, waitForUserStorage } from "@/lib/user-storage";

type Result = {
  conceptId: string;
  score: number;
  total: number;
  completedAt: number;
  notes?: string;
};

export default function Active() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Result[]>([]);
  const [vault, setVault] = useState<boolean>(false);
  const [buildCount, setBuildCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await waitForUserStorage();
      if (cancelled) return;
      setProgress(readJSON("gaia.tower.progress", {}));
      setResults(readJSON<Result[]>("gaia.apollo.academy.results", []));
      setVault(hasVault());
      try {
        setBuildCount(listBuilds().length);
      } catch {
        setBuildCount(0);
      }
    }
    void load();
    function onAny() {
      void load();
    }
    window.addEventListener("storage", onAny);
    window.addEventListener("gaia:tower:progress", onAny as any);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onAny);
      window.removeEventListener("gaia:tower:progress", onAny as any);
    };
  }, []);

  const unlocked = useMemo(
    () => Object.values(progress).filter(Boolean).length,
    [progress]
  );
  const last = useMemo(
    () =>
      results
        .slice()
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0],
    [results]
  );

  const cards = [
    {
      href: "/apollo",
      eyebrow: "Tower",
      value: unlocked,
      helper: "nodes unlocked",
      accent: "from-error/20 via-transparent to-transparent",
    },
    {
      href: "/apollo/academy",
      eyebrow: "Last Academy score",
      value: last ? `${last.score}/${last.total}` : "\u2014",
      helper: last
        ? new Date(last.completedAt).toLocaleString()
        : "No sessions yet",
      accent: "from-info/20 via-transparent to-transparent",
    },
    {
      href: "/apollo/labs",
      eyebrow: "Labs builds",
      value: buildCount,
      helper: "completed concepts",
      accent: "from-warning/20 via-transparent to-transparent",
    },
    {
      href: "/ELEUTHIA",
      eyebrow: "ELEUTHIA",
      value: vault ? "Ready" : "Setup",
      helper: vault ? "Vault present" : "Create your vault",
      accent: "from-success/20 via-transparent to-transparent",
    },
  ];

  return (
    <section className="space-y-6 rounded-2xl border border-base-200 dark:border-base-700 bg-base-100 dark:bg-base-900 p-6 shadow-lg">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-base-content/50">
            Live snapshot
          </p>
          <h2 className="text-2xl font-semibold text-base-content">Active</h2>
        </div>
        <p className="text-sm text-base-content/70 max-w-sm">
          Quick health check across the tower, academy, labs, and vault. Tap any
          tile to drill in.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative overflow-hidden rounded-xl border border-base-300 dark:border-base-600 bg-base-50 dark:bg-base-800 p-4 text-base-content transition hover:shadow-md hover:border-base-400 dark:hover:border-base-500"
          >
            <div
              className={`pointer-events-none absolute inset-0 opacity-40 blur-2xl bg-gradient-to-br ${card.accent}`}
            />
            <div className="relative z-10">
              <div className="text-xs uppercase tracking-wide text-base-content/60">
                {card.eyebrow}
              </div>
              <div className="mt-2 text-3xl font-semibold text-base-content">
                {card.value}
              </div>
              <div className="text-xs text-base-content/60">{card.helper}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
