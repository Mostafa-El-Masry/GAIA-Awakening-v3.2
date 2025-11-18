import type { WealthLevelsSnapshot } from "./types";

export type WealthBlendId = "D" | "C" | "B" | "A";

export interface WealthBlend {
  id: WealthBlendId;
  title: string;
  shortLabel: string;
  objective: string;
  importance: string;
}

export const BLENDS: WealthBlend[] = [
  {
    id: "D",
    title: "Catching my breath",
    shortLabel: "Blend D · Breathe",
    objective: "Leave \"broke\" territory and reach a thin positive buffer.",
    importance:
      "Removes immediate risk so life can calm down a bit. Focus: get to zero and build a tiny buffer.",
  },
  {
    id: "C",
    title: "Stabilize",
    shortLabel: "Blend C · Stabilize",
    objective: "Build roughly a 6‑month safety buffer.",
    importance:
      "Creates stability and reduces daily money stress. Focus: protecting your lifestyle from short shocks.",
  },
  {
    id: "B",
    title: "Secure",
    shortLabel: "Blend B · Secure",
    objective: "Build ~12 months of buffer and let investing start to matter.",
    importance:
      "Provides long‑term security and growth potential. Focus: deep runway and gentle investing.",
  },
  {
    id: "A",
    title: "Grow",
    shortLabel: "Blend A · Grow",
    objective: "Build lasting wealth and strong passive income.",
    importance:
      "Supports financial independence over time. Focus: letting interest and investments carry more of the load.",
  },
];

function findBlend(id: WealthBlendId): WealthBlend {
  const found = BLENDS.find((b) => b.id === id);
  return (
    found ?? BLENDS[0]
  );
}

export function pickBlendForSnapshot(
  snapshot: WealthLevelsSnapshot | null,
): WealthBlend {
  if (!snapshot || !snapshot.currentLevelId) {
    // Starting line – use the most basic, breathing-space blend
    return findBlend("D");
  }

  // Map the current level order onto a blend lane.
  // Early levels → breathing / stabilise, later → secure / grow.
  const current = snapshot.levels.find((l) => l.id === snapshot.currentLevelId);
  const order = current?.order ?? 1;

  if (order <= 2) {
    return findBlend("D");
  }
  if (order <= 4) {
    return findBlend("C");
  }
  if (order <= 6) {
    return findBlend("B");
  }
  return findBlend("A");
}
