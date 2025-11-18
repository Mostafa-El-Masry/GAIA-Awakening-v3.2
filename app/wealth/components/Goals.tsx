"use client";

import { useEffect, useMemo, useState } from "react";
import { loadGoals, saveGoals, nid } from "../lib/store";
import type { Goal } from "../lib/types";

function fmt(n: number) {
  return n.toLocaleString("en-EG", { maximumFractionDigits: 0 });
}

const PANEL =
  "gaia-surface rounded-xl border gaia-border p-4 shadow-sm";
const CARD =
  "gaia-surface rounded-lg border gaia-border p-3 shadow-sm";
const INPUT =
  "gaia-input rounded-lg px-3 py-1.5";
const BUTTON_SM =
  "gaia-border gaia-surface rounded-lg px-2 py-1 text-xs font-semibold shadow-sm";
const BUTTON =
  "gaia-border gaia-surface rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm";

export default function Goals() {
  const [list, setList] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState<number>(0);

  useEffect(() => {
    setList(loadGoals());
  }, []);

  function add() {
    if (!title || !target) return;
    const next = [...list, { id: nid(), title, target, saved: 0 }];
    saveGoals(next);
    setList(next);
    setTitle("");
    setTarget(0);
  }
  function adjust(id: string, delta: number) {
    const next = list.map((g) =>
      g.id === id ? { ...g, saved: Math.max(0, g.saved + delta) } : g
    );
    saveGoals(next);
    setList(next);
  }
  function remove(id: string) {
    const next = list.filter((g) => g.id !== id);
    saveGoals(next);
    setList(next);
  }

  return (
    <section className={PANEL}>
      <h2 className="mb-2 text-lg font-extrabold tracking-wide gaia-strong">Goals</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((g) => {
          const pct = Math.min(
            100,
            Math.round((g.saved / (g.target || 1)) * 100)
          );
          return (
            <div key={g.id} className={CARD}>
              <div className="flex items-center justify-between gaia-strong">
                <div className="font-semibold">{g.title}</div>
                <div className="text-sm">
                  {fmt(g.saved)} / {fmt(g.target)}
                </div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded gaia-ink-faint">
                <div className="h-full" style={{ width: pct + "%", backgroundColor: "var(--gaia-contrast-bg)" }} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className={BUTTON_SM}
                  onClick={() => adjust(g.id, 1000)}
                >
                  +1k
                </button>
                <button
                  className={BUTTON_SM}
                  onClick={() => adjust(g.id, -1000)}
                >
                  -1k
                </button>
                <button
                  className={`ml-auto ${BUTTON_SM}`}
                  onClick={() => remove(g.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div className="gaia-muted">No goals yet.</div>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className={INPUT}
          placeholder="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={INPUT}
          placeholder="Target amount"
          type="number"
          value={target ?? ""}
          onChange={(e) => setTarget(Number(e.target.value))}
        />
        <button
          className={BUTTON}
          onClick={add}
        >
          Add Goal
        </button>
      </div>
    </section>
  );
}
