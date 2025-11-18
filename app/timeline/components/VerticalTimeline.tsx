'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { events as seed } from "../data/events";

type E = typeof seed[number];

function byDate(a: E, b: E) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

export default function VerticalTimeline() {
  const events = useMemo(() => seed.slice().sort(byDate), []);
  const [active, setActive] = useState<string | null>(events[0]?.id ?? null);
  const mapRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Keyboard nav (j/k)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!active) return;
      const idx = events.findIndex(ev => ev.id === active);
      if (e.key === "j" || e.key === "ArrowDown") {
        const next = events[Math.min(events.length - 1, idx + 1)];
        if (next) jump(next.id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        const prev = events[Math.max(0, idx - 1)];
        if (prev) jump(prev.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, events]);

  function jump(id: string) {
    setActive(id);
    const el = mapRef.current.get(id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="grid grid-cols-[auto,1fr] gap-4">
      <aside className="gaia-panel sticky top-16 hidden h-[calc(100vh-6rem)] flex-col gap-2 overflow-auto rounded-lg border p-3 sm:flex">
        <div className="gaia-muted mb-1 text-xs font-medium">Jump</div>
        {events.map(ev => (
          <button
            key={ev.id}
            onClick={() => jump(ev.id)}
            className={`truncate rounded px-2 py-1 text-left text-sm transition ${
              active === ev.id ? "gaia-contrast" : "gaia-border gaia-hover-soft"
            }`}
            title={ev.title}
          >
            {new Date(ev.date).toLocaleDateString()} — {ev.title}
          </button>
        ))}
      </aside>

      <section className="relative">
        {/* Vertical line */}
        <div className="gaia-axis absolute left-4 top-0 h-full w-px" />
        <ol className="space-y-8">
          {events.map((ev) => (
            <li key={ev.id} id={ev.id}>
              <div
                ref={(el) => { if (el) mapRef.current.set(ev.id, el); }}
                className="relative pl-12"
              >
                {/* Dot */}
                <div className="gaia-surface gaia-border absolute left-0 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border shadow" />
                <div className="gaia-muted text-xs">{new Date(ev.date).toLocaleDateString()}</div>
                <h3 className="text-lg font-semibold">{ev.title}</h3>
                {ev.description && <p className="mt-1 text-sm gaia-text-default">{ev.description}</p>}
                <div className="mt-2 text-xs gaia-muted">ID: {ev.id}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
