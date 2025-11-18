"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/app/DesignSystem/components/Button";
import BuildCard from "./BuildCard";
import { listBuilds } from "../lib/labs";

export default function LabsClient() {
  const [builds, setBuilds] = useState<ReturnType<typeof listBuilds>>([]);
  const [track, setTrack] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("systems");

  function refresh() {
    setBuilds(listBuilds());
  }

  useEffect(() => {
    refresh();
    function onAnyChange() {
      refresh();
    }
    window.addEventListener("storage", onAnyChange);
    window.addEventListener("gaia:tower:progress", onAnyChange as any);
    return () => {
      window.removeEventListener("storage", onAnyChange);
      window.removeEventListener("gaia:tower:progress", onAnyChange as any);
    };
  }, []);

  const tracks = useMemo(() => {
    const set = new Set<string>();
    builds.forEach((b) => set.add(b.trackId));
    return ["all", ...Array.from(set)];
  }, [builds]);

  const filtered = useMemo(() => {
    if (track === "all") return builds;
    return builds.filter((b) => b.trackId === track);
  }, [builds, track]);

  const totalBuilds = builds.length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b gaia-border">
        <button
          onClick={() => setActiveTab("systems")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === "systems"
              ? "border-blue-500 text-blue-600"
              : "border-transparent gaia-muted hover:text-foreground"
          }`}
        >
          💻 Systems
        </button>
        <button
          onClick={() => setActiveTab("academy")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === "academy"
              ? "border-blue-500 text-blue-600"
              : "border-transparent gaia-muted hover:text-foreground"
          }`}
        >
          🎓 Academy Builds
          {totalBuilds > 0 && (
            <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              {totalBuilds}
            </span>
          )}
        </button>
      </div>

      {/* Systems Tab */}
      {activeTab === "systems" && (
        <div>
          <div className="mb-4 text-sm gaia-muted max-w-2xl">
            Labs systems are bigger playgrounds that live inside GAIA itself. They are meant to
            feel like &quot;mini apps&quot; you can grow over time (starting with Inventory).
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/apollo/labs/inventory"
              className="gaia-panel gaia-border rounded-lg border p-4 hover:shadow-md transition block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-base">📦 Inventory Management</h3>
                  <p className="text-xs gaia-muted mt-2">
                    Multi-location stock tracking, POS terminals, sales recording, and cost accounting
                    as an experimental lab build.
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Labs · Flagship
                </span>
              </div>
              <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                ⚗️ <span className="font-semibold">Lab mode:</span> Some metrics use sample values and
                D1/Supabase integration. It&apos;s meant for experimentation, not official bookkeeping.
              </div>
              <div className="mt-3 text-xs text-blue-600 font-medium">Open system →</div>
            </Link>
          </div>
        </div>
      )}

      {/* Academy Builds Tab */}
      {activeTab === "academy" && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Builds from Academy
              </p>
              <p className="text-xs gaia-muted max-w-xl">
                Every time you pass a concept in the Academy and attach a build link, it shows up here.
                Until then, you&apos;ll see a couple of demo entries so the layout isn&apos;t empty.
              </p>
            </div>
            <Button size="sm" onClick={refresh}>
              Refresh
            </Button>
          </div>

          <div className="mb-3 flex items-center gap-3 text-xs">
            <div>
              <span className="font-semibold">Total builds:</span> {totalBuilds}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="labs-track" className="text-xs">
                Track:
              </label>
              <select
                id="labs-track"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="gaia-input rounded-md border px-3 py-1.5 text-xs focus:outline-none gaia-focus"
              >
                {tracks.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All tracks" : t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="gaia-panel gaia-muted rounded-lg border p-6 text-center text-sm">
              <p className="mb-1 font-medium">No builds yet.</p>
              <p>
                Finish a concept in the Academy (pass the quiz), then add a build link in the
                &quot;Build&quot; step to see it listed here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filtered.map((b) => (
                <BuildCard key={b.conceptId} b={b} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
