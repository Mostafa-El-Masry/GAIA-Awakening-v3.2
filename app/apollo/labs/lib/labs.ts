"use client";

import { readJSON } from "@/lib/user-storage";
import { concepts } from "../../(tabs)/academy/data/academy";
import type { MicroConcept } from "../../(tabs)/academy/data/academy";

export type BuildEntry = {
  conceptId: string;
  nodeId: string;
  trackId: string;
  trackTitle: string;
  title: string;
  note: string;
  embedUrl?: string;
  score?: number;
  total?: number;
  completedAt?: number;
};

function listAcademyBuilds(): BuildEntry[] {
  const results = readJSON<Record<string, { score?: number; total?: number; completedAt?: number }>>(
    "gaia.academy.results",
    {}
  );
  const builds = readJSON<Record<string, { note?: string; embedUrl?: string }>>("gaia.academy.builds", {});

  return concepts
    .map((c: MicroConcept) => {
      const r = results[c.id];
      const b = builds[c.id];
      if (!r) return null;
      const note = b?.note || "";
      const embedUrl = b?.embedUrl || "";
      return {
        conceptId: c.id,
        nodeId: c.nodeId,
        trackId: c.trackId,
        trackTitle: c.trackTitle,
        title: c.title,
        note,
        embedUrl,
        score: r?.score,
        total: r?.total,
        completedAt: r?.completedAt,
      } as BuildEntry;
    })
    .filter((b): b is BuildEntry => !!b && typeof b.score === "number");
}

/**
 * Static demo builds that show up only when you have not completed any Academy builds yet.
 * They give Labs a useful baseline without polluting your real data.
 */
const demoBuilds: BuildEntry[] = [
  {
    conceptId: "demo-inventory-system",
    nodeId: "demo-node-inventory",
    trackId: "systems",
    trackTitle: "Systems",
    title: "Inventory Management · v0 Lab",
    note:
      "First sketch of a personal inventory system: 8 locations, 8 POS terminals, and a simple dashboard.\n" +
      "This is a demo entry so Labs never feels empty – your real builds will replace this once you pass Academy concepts.",
    embedUrl: "/apollo/labs/inventory",
    score: 100,
    total: 100,
    completedAt: Date.now(),
  },
  {
    conceptId: "demo-html-layout",
    nodeId: "demo-node-html-layout",
    trackId: "html",
    trackTitle: "HTML",
    title: "HTML · Static Layout Prototype",
    note:
      "A small static layout that only uses semantic HTML: header/nav/main/section/footer.\n" +
      "The goal is to prove to yourself that you can ship something clean without any JavaScript.",
    embedUrl: "/Archives/html",
    score: 100,
    total: 100,
    completedAt: Date.now(),
  },
];

export function listBuilds(): BuildEntry[] {
  const academyBuilds = listAcademyBuilds();

  if (academyBuilds.length === 0) {
    // No completed concepts yet – show static demos so the UI has something to work with.
    return demoBuilds;
  }

  return academyBuilds;
}
