"use client";

import { useEffect, useState } from "react";

import {
  getItem,
  subscribe,
  waitForUserStorage,
} from "@/lib/user-storage";
import { DEFAULT_THEME, THEMES, type Theme } from "./theme";

const THEME_KEY = "gaia.theme";
const VALID_THEMES = new Set<string>(THEMES as readonly string[]);

function parseTheme(raw: string | null): Theme | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (VALID_THEMES.has(trimmed)) {
    return trimmed as Theme;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string" && VALID_THEMES.has(parsed)) {
      return parsed as Theme;
    }
  } catch {
    // ignore parse failures
  }
  return null;
}

function readDocumentTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  const attr =
    document.documentElement.getAttribute("data-gaia-theme") ??
    document.documentElement.getAttribute("data-theme");
  return parseTheme(attr);
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-gaia-theme", theme);
}

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      const stored = parseTheme(getItem(THEME_KEY));
      const docTheme = readDocumentTheme();
      const initial = stored ?? docTheme ?? DEFAULT_THEME;
      applyTheme(initial);
      setTheme(initial);
    })();

    const unsubscribe = subscribe(({ key, value }) => {
      if (key !== THEME_KEY || cancelled) return;
      const next = parseTheme(value);
      if (!next) return;
      setTheme(next);
      applyTheme(next);
    });

    const onTheme = (event: CustomEvent<{ theme?: Theme }>) => {
      const candidate = event?.detail?.theme;
      if (candidate && VALID_THEMES.has(candidate)) {
        setTheme(candidate);
        applyTheme(candidate);
      }
    };

    window.addEventListener("gaia:theme", onTheme as EventListener);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener("gaia:theme", onTheme as EventListener);
    };
  }, []);

  return <>{children}</>;
}
