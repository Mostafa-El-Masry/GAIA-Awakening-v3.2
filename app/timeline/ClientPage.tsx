"use client";
import "./styles/layout.css";
import { useEffect, useMemo, useState } from "react";
import FilterBar from "./components/FilterBar";
import EventForm from "./components/EventForm";
import ImportExport from "./components/ImportExport";
import TimelineCanvas from "./components/TimelineCanvas";
import type { TimelineData, TimelinePrefs, TLEvent } from "./lib/types";
import { loadData, saveData, loadPrefs, savePrefs } from "./lib/store";

const SEED: TLEvent[] = [
  {
    id: "seed1",
    title: "Big Bang",
    era: "cosmic",
    range: { startYear: -13800000000 },
    color: "#0ea5e9",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed2",
    title: "Milky Way forms (approx.)",
    era: "cosmic",
    range: { startYear: -13200000000 },
    color: "#0ea5e9",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed3",
    title: "Solar System forms",
    era: "cosmic",
    range: { startYear: -4600000000 },
    color: "#0ea5e9",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed4",
    title: "Earth forms",
    era: "cosmic",
    range: { startYear: -4540000000 },
    color: "#0ea5e9",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed5",
    title: "Earliest life (approx.)",
    era: "cosmic",
    range: { startYear: -3700000000 },
    color: "#0ea5e9",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed6",
    title: "Dinosaurs",
    era: "human",
    range: { startYear: -230000000, endYear: -66000000 },
    color: "#10b981",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed7",
    title: "Homo sapiens (approx.)",
    era: "human",
    range: { startYear: -300000 },
    color: "#10b981",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed8",
    title: "Agriculture (approx.)",
    era: "human",
    range: { startYear: -10000 },
    color: "#10b981",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed9",
    title: "Internet (ARPANET)",
    era: "human",
    range: { startYear: 1969 },
    color: "#10b981",
    createdAt: new Date().toISOString(),
  },
];

export default function TimelinePage() {
  const [data, setData] = useState<TimelineData>({ events: [] });
  const [prefs, setPrefs] = useState<TimelinePrefs>(loadPrefs());

  useEffect(() => {
    const d = loadData();
    if (!d.events || d.events.length === 0) {
      // seed once
      d.events = SEED;
      saveData(d);
    }
    setData(d);
  }, []);

  function setAndSavePrefs(p: TimelinePrefs) {
    setPrefs(p);
    savePrefs(p);
  }

  const remove = (id: string) => {
    const d = { ...data, events: data.events.filter((e) => e.id !== id) };
    saveData(d);
    setData(d);
  };

  const personalCount = useMemo(
    () => data.events.filter((e) => e.era === "personal").length,
    [data.events]
  );

  return (
    <main
      className="timeline"
      style={{ minHeight: "100vh", background: "#fff", color: "#111" }}
    >
      <div className="tl-shell">
        <div className="tl-header">
          <div className="tl-title">From the Big Bang to Today</div>
          <div className="tl-sub">
            Add your own milestones — local-only, exportable JSON. Personal
            events: {personalCount}
          </div>
        </div>

        <FilterBar prefs={prefs} setPrefs={setAndSavePrefs} />

        <TimelineCanvas events={data.events} prefs={prefs} />

        <div className="tl-tools">
          <EventForm
            onAdded={(e) => {
              const d = { ...data, events: [...data.events, e] };
              saveData(d);
              setData(d);
            }}
          />
          <ImportExport
            getData={() => data}
            setData={(d: any) => {
              saveData(d);
              setData(d);
            }}
          />
        </div>

        <div className="tl-list">
          {data.events
            .slice()
            .sort((a, b) =>
              prefs.sort === "recent"
                ? (b.createdAt || "").localeCompare(a.createdAt || "")
                : a.range.startYear - b.range.startYear
            )
            .map((ev) => (
              <div key={ev.id} className="tl-card">
                <div
                  className="tl-chip"
                  style={{ background: ev.color || "#ddd" }}
                />
                <div className="tl-card-main">
                  <div className="tl-card-title">{ev.title}</div>
                  <div className="tl-card-meta">
                    {ev.era.toUpperCase()} •{" "}
                    {typeof ev.range.endYear === "number"
                      ? `${ev.range.startYear.toLocaleString()} → ${ev.range.endYear.toLocaleString()}`
                      : ev.range.startYear.toLocaleString()}
                  </div>
                  {ev.note && <div className="tl-card-note">{ev.note}</div>}
                  {ev.link && (
                    <a className="tl-link" href={ev.link}>
                      Open
                    </a>
                  )}
                </div>
                <button className="tl-btn" onClick={() => remove(ev.id)}>
                  Delete
                </button>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
