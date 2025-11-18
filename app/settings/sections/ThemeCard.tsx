"use client";

import { useEffect, useState } from "react";

import {
  useDesign,
  type Theme,
} from "@/app/DesignSystem/context/DesignProvider";
import { THEMES } from "@/app/DesignSystem/theme";
import { readJSON, waitForUserStorage, writeJSON } from "@/lib/user-storage";

const THEME_OPTIONS = THEMES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export default function ThemeCard() {
  const { theme, setTheme } = useDesign();
  const [mode, setMode] = useState<"light" | "dark" | "auto">("auto");
  const [accent, setAccent] = useState("#111111");
  const [scale, setScale] = useState(100);
  const [density, setDensity] = useState<"cozy" | "compact">("cozy");
  const [glass, setGlass] = useState(6); // blur intensity 0-12

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      const m = readJSON<"light" | "dark" | "auto">(
        "settings_theme_mode",
        mode
      );
      setMode(m);
      const a = readJSON<string>("settings_accent", accent);
      setAccent(a);
      const s = readJSON<number>("settings_fontScale", scale);
      setScale(s);
      const d = readJSON<"cozy" | "compact">("settings_density", density);
      setDensity(d);
      const g = readJSON<number>("settings_glass", glass);
      setGlass(g);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeJSON("settings_theme_mode", mode);
    writeJSON("settings_accent", accent);
    writeJSON("settings_fontScale", scale);
    writeJSON("settings_density", density);
    writeJSON("settings_glass", glass);

    // apply minimal CSS vars on <html>
    const html = document.documentElement;
    html.style.setProperty("--gaia-accent", accent);
    html.style.setProperty("--gaia-font-scale", (scale / 100).toString());
    html.style.setProperty("--gaia-density", density);
    html.style.setProperty("--gaia-glass", String(glass));

    // Handle dark mode syncing with custom theme variables
    if (mode === "auto") {
      // Remove forced theme, let system preference work
      html.classList.remove("dark", "light");
    } else {
      html.classList.remove("dark", "light");
      html.classList.add(mode);
    }
  }, [mode, accent, scale, density, glass]);

  return (
    <section className="gaia-panel rounded-xl border p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold">Appearance</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
          <span className="text-sm">Theme</span>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as Theme)}
            className="gaia-input rounded border px-2 py-1 text-sm min-w-[140px]"
          >
            {THEME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="gaia-input rounded border px-2 py-1 text-sm"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">Accent</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="gaia-border h-8 w-14 rounded border"
          />
        </label>

        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">Font scale</span>
          <input
            type="range"
            min={90}
            max={120}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </label>

        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">Density</span>
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value as any)}
            className="gaia-input rounded border px-2 py-1 text-sm"
          >
            <option value="cozy">Cozy</option>
            <option value="compact">Compact</option>
          </select>
        </label>

        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
          <span className="text-sm">Glass intensity</span>
          <input
            type="range"
            min={0}
            max={12}
            value={glass}
            onChange={(e) => setGlass(Number(e.target.value))}
          />
        </label>
      </div>
    </section>
  );
}
