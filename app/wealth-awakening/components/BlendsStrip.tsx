"use client";

import type { FC } from "react";
import type { WealthLevelsSnapshot } from "../lib/types";
import { BLENDS, pickBlendForSnapshot } from "../lib/blends";

interface BlendsStripProps {
  snapshot: WealthLevelsSnapshot | null;
}

const BlendsStrip: FC<BlendsStripProps> = ({ snapshot }) => {
  const activeBlend = pickBlendForSnapshot(snapshot);

  return (
    <section className="mt-4 rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-md shadow-primary/5">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Blends · Wealth lanes
          </h2>
          <p className="mt-1 text-xs text-base-content/70">
            Four simple lanes GAIA can use to describe your current money season. Right now
            you are closest to:
          </p>
        </div>
      </header>

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Current blend
          </p>
          <h3 className="mt-1 text-sm font-semibold text-base-content">
            {activeBlend.shortLabel}
          </h3>
          <p className="mt-1 text-xs text-base-content/75">
            {activeBlend.objective}
          </p>
          <p className="mt-2 text-[11px] text-base-content/65">
            {activeBlend.importance}
          </p>
        </article>

        <article className="rounded-xl border border-base-300 bg-base-100 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
            All blends
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-base-content/75">
            {BLENDS.map((blend) => {
              const isActive = blend.id === activeBlend.id;
              return (
                <li key={blend.id}>
                  <div
                    className={`inline-flex w-full items-center justify-between rounded-full border px-3 py-1 ${
                      isActive
                        ? "border-primary/60 bg-primary/10 text-primary font-semibold"
                        : "border-base-300 bg-base-100 text-base-content/75"
                    }`}
                  >
                    <span>{blend.shortLabel}</span>
                    {isActive && (
                      <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[10px] text-base-content/60">
            Later versions can attach concrete targets and simulations to each blend.
            For now they act as a language for where you are driving.
          </p>
        </article>
      </div>
    </section>
  );
};

export default BlendsStrip;
