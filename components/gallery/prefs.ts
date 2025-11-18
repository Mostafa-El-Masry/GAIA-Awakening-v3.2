"use client";
import { useEffect, useState } from "react";
import {
  getItem,
  readJSON,
  setItem,
  waitForUserStorage,
  writeJSON,
} from "@/lib/user-storage";
import type { AutoTagMeta } from "./tagging";
export type { AutoTagMeta } from "./tagging";

export type Mode = "images" | "videos";
export type SortKey = "newest" | "trend";

const PREF = "gaia_gallery_prefs";
const WATCH_TIME = "gaia_gallery_watch_seconds";
const LEGACY_VIEWS = "gaia_gallery_views";
const ADDED = "gaia_gallery_addedAt";
const VIDEO_PROGRESS = "gaia_gallery_video_progress";
const VIDEO_VOLUME = "gaia_gallery_video_volume";
const FAVORITES = "gaia_gallery_favorites";
const TAGS = "gaia_gallery_tags";
const AUTO_TAG_META = "gaia_gallery_auto_tag_meta";
const TITLES = "gaia_gallery_titles";

export function usePrefs() {
  const [mode, setMode] = useState<Mode>("images");
  const [sort, setSort] = useState<SortKey>("trend");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      const stored = readJSON<{ mode?: Mode; sort?: SortKey }>(PREF, {});
      if (stored.mode) setMode(stored.mode);
      if (stored.sort) setSort(stored.sort);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeJSON(PREF, { mode, sort });
  }, [mode, sort]);

  return { mode, setMode, sort, setSort };
}

function readWatchMap(): Record<string, number> {
  const primary = readJSON<Record<string, number>>(WATCH_TIME, {});
  if (Object.keys(primary).length > 0) {
    return primary;
  }
  const legacy = readJSON<Record<string, number>>(LEGACY_VIEWS, {});
  if (Object.keys(legacy).length > 0) {
    writeJSON(WATCH_TIME, legacy);
    return legacy;
  }
  return {};
}

export function getWatchTimeMap(): Record<string, number> {
  return readWatchMap();
}

export function addWatchTime(id: string, seconds: number) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const map = { ...readWatchMap() };
  map[id] = (map[id] || 0) + seconds;
  writeJSON(WATCH_TIME, map);
  window.dispatchEvent(new CustomEvent("gallery:view-updated"));
}

export function resetViews() {
  if (typeof window === "undefined") return;
  writeJSON(WATCH_TIME, {});
  writeJSON(LEGACY_VIEWS, {});
  window.dispatchEvent(new CustomEvent("gallery:view-updated"));
}
export function getAddedMap(): Record<string, string> {
  return readJSON<Record<string, string>>(ADDED, {});
}
export function setAddedDate(id: string, iso: string) {
  const map = getAddedMap();
  if (!map[id]) {
    map[id] = iso;
    writeJSON(ADDED, map);
  }
}

export function getFavorites(): Record<string, boolean> {
  return readJSON<Record<string, boolean>>(FAVORITES, {});
}

export function setFavorite(id: string, value: boolean) {
  const map = getFavorites();
  if (value) {
    map[id] = true;
  } else {
    delete map[id];
  }
  writeJSON(FAVORITES, map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gallery:favorites-updated", {
        detail: { id, value },
      })
    );
  }
}

export function getTagsMap(): Record<string, string[]> {
  return readJSON<Record<string, string[]>>(TAGS, {});
}

export function setItemTags(id: string, tags: string[]) {
  const clean = Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
    )
  );
  const map = getTagsMap();
  if (clean.length) {
    map[id] = clean;
  } else {
    delete map[id];
  }
  writeJSON(TAGS, map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gallery:tags-updated", { detail: { id, tags: clean } })
    );
  }
}

export function mergeItemTags(id: string, tags: string[]) {
  const current = getTagsMap();
  const existing = current[id] ?? [];
  const merged = Array.from(new Set([...existing, ...tags]));
  setItemTags(id, merged);
}

export function getAutoTagMeta(): Record<string, AutoTagMeta> {
  return readJSON<Record<string, AutoTagMeta>>(AUTO_TAG_META, {});
}

export function setAutoTagMeta(id: string, meta: AutoTagMeta) {
  const map = getAutoTagMeta();
  map[id] = meta;
  writeJSON(AUTO_TAG_META, map);
}

export function getTitlesMap(): Record<string, string> {
  return readJSON<Record<string, string>>(TITLES, {});
}

export function setItemTitle(id: string, title: string | null) {
  const map = getTitlesMap();
  if (title && title.trim()) {
    map[id] = title.trim();
  } else {
    delete map[id];
  }
  writeJSON(TITLES, map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gallery:titles-updated", { detail: { id, title } })
    );
  }
}

export function getVideoProgressMap(): Record<string, number> {
  return readJSON<Record<string, number>>(VIDEO_PROGRESS, {});
}

export function setVideoProgress(id: string, seconds: number) {
  const map = getVideoProgressMap();
  const previous = map[id];
  map[id] = seconds;
  writeJSON(VIDEO_PROGRESS, map);
  if (
    typeof window !== "undefined" &&
    (previous === undefined || Math.abs(previous - seconds) >= 0.5)
  ) {
    window.dispatchEvent(
      new CustomEvent("gallery:video-progress", {
        detail: { id, seconds },
      })
    );
  }
}

export function getVideoProgress(id: string): number {
  const map = getVideoProgressMap();
  return map[id] ?? 0;
}

export function getVideoVolume(): number | undefined {
  const raw = getItem(VIDEO_VOLUME);
  if (!raw) return undefined;
  const vol = Number(raw);
  return Number.isFinite(vol) ? Math.min(Math.max(vol, 0), 1) : undefined;
}

export function setVideoVolume(volume: number) {
  const safe = Math.min(Math.max(volume, 0), 1);
  setItem(VIDEO_VOLUME, String(safe));
}
