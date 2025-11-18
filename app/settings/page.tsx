"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  useDesign,
  type ButtonStyle,
  type SearchStyle,
} from "@/app/DesignSystem/context/DesignProvider";
import { exportJSON, importJSON, loadData } from "@/app/apollo/lib/store";
import { THEMES, type Theme } from "@/app/DesignSystem/theme";
import {
  resetViews,
  getTagsMap,
  mergeItemTags,
  getAutoTagMeta,
  setAutoTagMeta,
} from "@/components/gallery/prefs";
import type { GalleryItem } from "@/components/gallery/types";
import { deriveAutoTags, AUTO_TAG_VERSION } from "@/components/gallery/tagging";
import PermissionGate from "@/components/permissions/PermissionGate";
import ProfilesCard from "./sections/ProfilesCard";

const BUTTONS: ButtonStyle[] = ["solid", "outline", "ghost"];
const SEARCHES: SearchStyle[] = ["rounded", "pill", "underline"];

const THEME_OPTIONS = THEMES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

type GalleryStatus = {
  type: "loading" | "success" | "error" | "progress";
  message: string;
  progress?: number;
  detail?: string;
};

type ManifestResponse = {
  items?: GalleryItem[];
};

type TabId = "appearance" | "gallery" | "profiles" | "users";

async function fetchGalleryManifest(): Promise<GalleryItem[]> {
  // Prefer the live API scan so freshly added media shows up immediately.
  try {
    const live = await fetch(`/api/gallery/scan?ts=${Date.now()}`, {
      cache: "no-store",
    });
    if (live.ok) {
      const json = (await live.json()) as ManifestResponse;
      if (Array.isArray(json.items)) return json.items;
    }
  } catch {
    /* ignore API failure and fall through to static manifest */
  }

  try {
    const res = await fetch("/jsons/gallery-manifest.json", {
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json()) as ManifestResponse;
      if (Array.isArray(json.items)) return json.items;
    }
  } catch {
    /* surface error below */
  }

  throw new Error("Unable to load gallery manifest.");
}

export default function SettingsPage() {
  const { theme, setTheme, button, setButton, search, setSearch } = useDesign();

  const [syncing, setSyncing] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);
  const [autoTagProgress, setAutoTagProgress] = useState(0);
  const [galleryStatus, setGalleryStatus] = useState<GalleryStatus | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<TabId>("appearance");

  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: TabId; label: string }> = [
      { id: "appearance", label: "Appearance" },
      { id: "profiles", label: "Profiles" },
      { id: "gallery", label: "Gallery" },
      // Users tab removed to avoid server-side admin calls when proxy is not configured
    ];
    return tabs;
  }, []);

  // Users/admin UI removed to avoid server-side admin calls when the project
  // is running without Supabase service-role credentials (local/dev).

  const handleSyncGallery = useCallback(async () => {
    setSyncing(true);
    setGalleryStatus({
      type: "loading",
      message: "Syncing gallery... please wait.",
    });
    try {
      const res = await fetch("/api/gallery/scan", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Sync failed with status ${res.status}`);
      }
      window.dispatchEvent(new Event("gallery:refresh"));
      setGalleryStatus({
        type: "success",
        message: "Gallery sync requested. The gallery will reload shortly.",
      });
    } catch (error) {
      console.error(error);
      setGalleryStatus({
        type: "error",
        message: "Could not sync gallery. Please try again.",
      });
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleResetViews = useCallback(() => {
    resetViews();
    setGalleryStatus({
      type: "success",
      message: "Gallery watch stats reset.",
    });
  }, []);

  const handleAutoTagging = useCallback(async () => {
    if (autoTagging) return;
    setAutoTagging(true);
    setAutoTagProgress(0);
    setGalleryStatus({
      type: "progress",
      message: "Auto-tagging media... 0%",
      progress: 0,
    });
    try {
      const items = await fetchGalleryManifest();
      if (!items.length) {
        setGalleryStatus({
          type: "success",
          message: "No gallery items available to tag.",
        });
        return;
      }
      const tagMap = getTagsMap();
      const autoMeta = getAutoTagMeta();
      let updatedItems = 0;
      let totalNewTags = 0;
      let previouslyTagged = 0;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const manualTags = tagMap[item.id] ?? [];
        const existingMeta = autoMeta[item.id];
        if (existingMeta?.version === AUTO_TAG_VERSION) {
          previouslyTagged += 1;
          continue;
        }

        const derived = deriveAutoTags(item);
        // deriveAutoTags returns an object { id, tags, matchedKeywords }
        // ensure there are discovered tags before continuing
        if (!derived || !derived.tags || derived.tags.length === 0) continue;

        // compute new tags that aren't already present (manual tags or item.tags)
        const existingTags = new Set<string>([
          ...(manualTags ?? []),
          ...(item.tags ?? []),
        ]);
        const newTags = derived.tags.filter((t) => !existingTags.has(t));

        if (newTags.length > 0) {
          // merge into storage and update local map
          mergeItemTags(item.id, newTags);
          tagMap[item.id] = Array.from(new Set([...existingTags, ...newTags]));
          updatedItems += 1;
          totalNewTags += newTags.length;
        } else if (autoMeta[item.id]) {
          previouslyTagged += 1;
        }

        // update auto-tag metadata entry
        autoMeta[item.id] = {
          version: AUTO_TAG_VERSION,
          tags: derived.tags,
          updatedAt: new Date().toISOString(),
        };

        const progress = (i + 1) / items.length;
        setAutoTagProgress(progress);
        setGalleryStatus({
          type: "progress",
          progress,
          message: `Auto-tagging media... ${Math.round(progress * 100)}%`,
          detail: `Processed ${i + 1} of ${items.length} items`,
        });
      }

      // Persist auto tag metadata per item
      for (const [id, meta] of Object.entries(autoMeta)) {
        // meta is AutoTagMeta
        setAutoTagMeta(id, meta as any);
      }
      window.dispatchEvent(
        new CustomEvent("gallery:tags-updated", { detail: { tagMap } })
      );
      window.dispatchEvent(new Event("storage"));

      setGalleryStatus({
        type: "success",
        message: "Auto-tagging complete.",
        detail: `Updated ${updatedItems} items (${totalNewTags} new tags). ${previouslyTagged} items were already up to date.`,
      });
    } catch (error) {
      console.error(error);
      setGalleryStatus({
        type: "error",
        message: "Auto-tagging failed. Please try again later.",
      });
    } finally {
      setAutoTagging(false);
      setAutoTagProgress(0);
    }
  }, [autoTagging]);

  const handleExportApollo = useCallback(() => {
    const data = loadData();
    exportJSON(data);
  }, []);

  const handleImportApollo = useCallback(() => {
    importJSON((data) => {
      try {
        window.dispatchEvent(
          new CustomEvent("gaia:apollo:data", { detail: { data } })
        );
      } catch {
        // no-op if window not available
      }
    });
  }, []);

  return (
    <PermissionGate permission="settings">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <div className="flex flex-wrap gap-2">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  isActive ? "gaia-contrast" : "gaia-border gaia-hover-soft"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "appearance" && (
          <>
            <section className="space-y-3 rounded-lg border gaia-border p-4">
              <h2 className="font-medium">Theme</h2>
              <select
                className="w-full rounded border gaia-border px-3 py-2 text-sm"
                value={theme}
                onChange={(event) => setTheme(event.target.value as Theme)}
              >
                {THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs gaia-muted">
                Applies everywhere. Stored in your browser.
              </p>
            </section>

            <section className="space-y-3 rounded-lg border gaia-border p-4">
              <h2 className="font-medium">Button</h2>
              <div className="flex flex-wrap items-center gap-2">
                {BUTTONS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setButton(b)}
                    className={`rounded border px-3 py-1 text-sm capitalize ${
                      button === b
                        ? "gaia-contrast"
                        : "gaia-border gaia-hover-soft"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border gaia-border p-4">
              <h2 className="font-medium">Search bar</h2>
              <div className="flex flex-wrap items-center gap-2">
                {SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSearch(s)}
                    className={`rounded border px-3 py-1 text-sm capitalize ${
                      search === s
                        ? "gaia-contrast"
                        : "gaia-border gaia-hover-soft"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border gaia-border p-4">
              <h2 className="font-medium">Apollo archives</h2>
              <p className="text-sm gaia-muted">
                Export a backup of your local Apollo notes or import a saved
                JSON file.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportApollo}
                  className="rounded border px-3 py-1 text-sm gaia-contrast"
                >
                  Export archive
                </button>
                <button
                  type="button"
                  onClick={handleImportApollo}
                  className="rounded border px-3 py-1 text-sm gaia-border gaia-hover-soft"
                >
                  Import archive
                </button>
              </div>
              <p className="text-xs gaia-muted">
                Data stays on this device; imports overwrite your current local
                archive.
              </p>
            </section>
          </>
        )}

        {activeTab === "profiles" && (
          <>
            <ProfilesCard />
          </>
        )}

        {activeTab === "gallery" && (
          <section className="space-y-3 rounded-lg border gaia-border p-4">
            <h2 className="font-medium">Gallery maintenance</h2>
            <p className="text-sm gaia-muted">
              Trigger a new scan or clear saved watch/preview time tracked on
              this device.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncGallery}
                className={`rounded border px-3 py-1 text-sm ${
                  syncing
                    ? "cursor-not-allowed opacity-70 gaia-contrast"
                    : "gaia-contrast"
                }`}
                disabled={syncing}
                aria-busy={syncing}
              >
                {syncing ? "Syncing..." : "Sync gallery"}
              </button>
              <button
                type="button"
                onClick={handleResetViews}
                className="rounded border px-3 py-1 text-sm gaia-border gaia-hover-soft"
              >
                Reset watch data
              </button>
              <button
                type="button"
                onClick={handleAutoTagging}
                className={`rounded border px-3 py-1 text-sm gaia-border gaia-hover-soft ${
                  autoTagging ? "cursor-not-allowed opacity-70" : ""
                }`}
                disabled={autoTagging}
                aria-busy={autoTagging}
              >
                {autoTagging
                  ? `Auto-tagging ${Math.round(autoTagProgress * 100)}%`
                  : "Auto-tag media"}
              </button>
            </div>
            {galleryStatus && (
              <div
                className={`mt-2 space-y-2 rounded border px-3 py-2 text-xs ${
                  galleryStatus.type === "error"
                    ? "border-red-500 text-red-400"
                    : galleryStatus.type === "success"
                    ? "border-green-500 text-green-400"
                    : "border-blue-500 text-blue-300"
                }`}
                role="status"
                aria-live="polite"
              >
                {(galleryStatus.type === "loading" ||
                  galleryStatus.type === "progress") && (
                  <progress
                    className="h-2 w-full overflow-hidden rounded bg-transparent"
                    max={1}
                    value={galleryStatus.progress ?? undefined}
                  />
                )}
                <p className="font-medium">{galleryStatus.message}</p>
                {galleryStatus.detail && (
                  <p className="text-[11px] opacity-75">
                    {galleryStatus.detail}
                  </p>
                )}
                {galleryStatus.type === "success" && !galleryStatus.detail && (
                  <p className="text-[11px] opacity-75">
                    You can return to the gallery to view the latest items.
                  </p>
                )}
                {galleryStatus.type === "error" && (
                  <p className="text-[11px] opacity-75">
                    Check your connection or try again later.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Users admin table removed to avoid server-side admin calls when proxy is not configured */}
      </main>
    </PermissionGate>
  );
}
