"use client";

import { useEffect, useState } from "react";

import { getItem, readJSON, waitForUserStorage } from "@/lib/user-storage";

/**
 * Lightweight SVG sparkline (no libs).
 * Looks for arrays like health_weight_history = [{date,kg}, …] or health_weights.
 */

export default function WeightSpark() {
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      let arr: number[] = [];
      const cand =
        readJSON<any[]>("health_weight_history", []) ??
        readJSON<any[]>("health_weights", []);
      if (Array.isArray(cand)) {
        arr = cand
          .map((x: any) => Number(x?.kg ?? x?.weight))
          .filter((n: any) => !isNaN(n));
      }
      if (arr.length === 0) {
        const latestRaw = getItem("health_weight_latest");
        const w = Number(latestRaw || 0);
        if (w) arr = [w - 1, w - 0.5, w, w + 0.2, w - 0.1];
      }
      setPoints(arr.slice(-30));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!points.length) return <div className="text-sm gaia-muted">No data</div>;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = (v: number) => (max === min ? 0.5 : (v - min) / (max - min));
  const w = 320,
    h = 64;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step},${(1 - norm(p)) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="block">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
