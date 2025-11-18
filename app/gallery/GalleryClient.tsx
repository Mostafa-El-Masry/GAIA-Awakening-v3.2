"use client";
import "./gallery.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import Featured from "@/components/gallery/Featured";
import Grid from "@/components/gallery/Grid";
import Lightbox from "@/components/gallery/Lightbox";
import {
  usePrefs,
  getAddedMap,
  setAddedDate,
  getTagsMap,
  setItemTags,
  getTitlesMap,
  setItemTitle,
  getWatchTimeMap,
} from "@/components/gallery/prefs";
import type { GalleryItem } from "@/components/gallery/types";
import type { Mode } from "@/components/gallery/prefs";
import Toggle from "./components/Toggle";

const FILTER_MODES: Mode[] = ["images", "videos"];
const ACCESS_KEY = "gaia_gallery_access";
const IMAGE_PREFIX = "media/images";
const VIDEO_PREFIX = "media/videos";
const PREVIEW_PREFIX = "media/previews";

function ensureLocalPath(value: string | undefined, prefix: string) {
  if (!value) return value;
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  const clean = value.replace(/^\/+/, "");
  if (clean.startsWith(prefix)) return clean;
  const parts = clean.split("/");
  const filename = parts.pop();
  if (!filename) return value;
  return `${prefix}/${filename}`;
}

function normalizeGalleryItem(item: GalleryItem): GalleryItem {
  const srcPrefix = item.type === "video" ? VIDEO_PREFIX : IMAGE_PREFIX;
  const normalizedSrc = ensureLocalPath(item.src, srcPrefix) ?? item.src;
  const normalizedPreview = Array.isArray(item.preview)
    ? item.preview
        .map((entry) => ensureLocalPath(entry, PREVIEW_PREFIX) ?? entry)
        .filter(Boolean) as string[]
    : item.preview;

  return {
    ...item,
    src: normalizedSrc,
    preview: normalizedPreview,
  };
}

function deriveTagsFromFilename(src: string, limit = 6): string[] {
  const filename = src.split("/").pop() ?? "";
  const basename = filename.split(".").slice(0, -1).join(".") || filename;
  const tokens = basename
    .split(/[\s_\-\.]+/)
    .map((token) => token.replace(/[^a-z0-9]/gi, "").toLowerCase())
    .filter((token) => token.length >= 3 && !/^\d+$/.test(token));

  const unique: string[] = [];
  for (const token of tokens) {
    if (!unique.includes(token)) {
      unique.push(token);
      if (unique.length >= limit) break;
    }
  }
  return unique;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

type ScanResp = { items: GalleryItem[] };
const FALLBACK_TAGS = ["personal", "exotic", "landscape", "portrait"];

async function fetchManifest(): Promise<GalleryItem[]> {
  try {
    const res = await fetch("/jsons/gallery-manifest.json", {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.items))
        return (json.items as GalleryItem[]).map(normalizeGalleryItem);
    }
  } catch {}

  const res = await fetch("/api/gallery/scan", { cache: "no-store" });
  const js = (await res.json()) as ScanResp;
  return Array.isArray(js.items)
    ? js.items.map(normalizeGalleryItem)
    : [];
}

export default function GalleryClient() {
  const { mode, setMode, sort, setSort } = usePrefs();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [viewsVersion, setViewsVersion] = useState(0);
  const [pendingFeaturedId, setPendingFeaturedId] = useState<string | null>(
    null
  );
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filtersBtnRef = useRef<HTMLButtonElement>(null);
  const filtersMenuRef = useRef<HTMLDivElement>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategoriesByMode, setSelectedCategoriesByMode] = useState<
    Record<Mode, string[]>
  >({
    images: [],
    videos: [],
  });
  const [selectedTagsByMode, setSelectedTagsByMode] = useState<
    Record<Mode, string[]>
  >({
    images: [],
    videos: [],
  });
  const [tagMap, setTagMap] = useState<Record<string, string[]>>({});
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const filtersPanelId = useId();

  const selectedCategories = selectedCategoriesByMode[mode];
  const selectedTags = selectedTagsByMode[mode];

  const categoryOptionsByMode = useMemo(() => {
    const extMap: Record<Mode, Set<string>> = {
      images: new Set<string>(),
      videos: new Set<string>(),
    };

    items.forEach((it) => {
      const ext = it.src.split(".").pop()?.toLowerCase();
      if (!ext) return;
      if (it.type === "image") {
        extMap.images.add(ext);
      } else if (it.type === "video") {
        extMap.videos.add(ext);
      }
    });

    const buildOptions = (values: Set<string>) =>
      Array.from(values)
        .sort()
        .map((ext) => ({ value: ext.toLowerCase(), label: ext.toUpperCase() }));

    return {
      images: buildOptions(extMap.images),
      videos: buildOptions(extMap.videos),
    };
  }, [items]);

  const videoAutoTags = useMemo(() => {
    const map: Record<string, string[]> = {};
    items.forEach((it) => {
      if (it.type !== "video") return;
      const manual = new Set<string>();
      if (Array.isArray(it.tags)) {
        it.tags
          .filter(Boolean)
          .forEach((tag) => manual.add(tag.trim().toLowerCase()));
      }
      const stored = tagMap[it.id] ?? [];
      stored
        .filter(Boolean)
        .forEach((tag) => manual.add(tag.trim().toLowerCase()));

      const derived = deriveTagsFromFilename(it.src).filter(
        (tag) => tag && !manual.has(tag)
      );
      if (derived.length) {
        map[it.id] = derived;
      }
    });
    return map;
  }, [items, tagMap]);

  const tagOptionsByMode = useMemo(() => {
    const collected: Record<Mode, Set<string>> = {
      images: new Set<string>(),
      videos: new Set<string>(),
    };

    items.forEach((it) => {
      const targetMode: Mode = it.type === "video" ? "videos" : "images";
      if (Array.isArray(it.tags)) {
        it.tags.forEach((tag) => {
          if (tag) collected[targetMode].add(tag.toLowerCase());
        });
      }
      const localTags = tagMap[it.id];
      if (Array.isArray(localTags)) {
        localTags.forEach((tag) => {
          if (tag) collected[targetMode].add(tag.toLowerCase());
        });
      }
      if (targetMode === "videos") {
        const auto = videoAutoTags[it.id];
        if (auto) auto.forEach((tag) => collected.videos.add(tag));
      }
    });

    FALLBACK_TAGS.forEach((tag) => collected.images.add(tag));

    const toOptions = (set: Set<string>) =>
      Array.from(set)
        .sort()
        .map((value) => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
        }));

    return {
      images: toOptions(collected.images),
      videos: toOptions(collected.videos),
    };
  }, [items, tagMap, videoAutoTags]);

  const categoryOptions = categoryOptionsByMode[mode];
  const tagOptions = tagOptionsByMode[mode];

  const displayTagMap = useMemo(() => {
    if (Object.keys(videoAutoTags).length === 0) return tagMap;
    const merged: Record<string, string[]> = { ...tagMap };
    Object.entries(videoAutoTags).forEach(([id, auto]) => {
      const base = merged[id] ?? [];
      const existing = new Set(base.map((tag) => tag.toLowerCase()));
      const additions = auto.filter((tag) => !existing.has(tag));
      if (additions.length) {
        merged[id] = [...base, ...additions];
      }
    });
    return merged;
  }, [tagMap, videoAutoTags]);

  useEffect(() => {
    setSelectedCategoriesByMode((prev) => {
      let changed = false;
      const next = { ...prev };
      FILTER_MODES.forEach((key) => {
        const allowed = new Set(
          categoryOptionsByMode[key].map((opt) => opt.value)
        );
        const filtered = prev[key].filter((value) => allowed.has(value));
        if (!arraysEqual(filtered, prev[key])) {
          next[key] = filtered;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [categoryOptionsByMode]);

  useEffect(() => {
    setSelectedTagsByMode((prev) => {
      let changed = false;
      const next = { ...prev };
      FILTER_MODES.forEach((key) => {
        const allowed = new Set(tagOptionsByMode[key].map((opt) => opt.value));
        const filtered = prev[key].filter((value) => allowed.has(value));
        if (!arraysEqual(filtered, prev[key])) {
          next[key] = filtered;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tagOptionsByMode]);

  useEffect(() => {
    const syncTags = () => {
      try {
        setTagMap(getTagsMap());
      } catch {
        setTagMap({});
      }
    };
    syncTags();
    const syncTitles = () => {
      try {
        setTitleMap(getTitlesMap());
      } catch {
        setTitleMap({});
      }
    };
    syncTitles();
    window.addEventListener("storage", syncTags);
    window.addEventListener("gallery:tags-updated", syncTags);
    window.addEventListener(
      "gallery:titles-updated",
      syncTitles as EventListener
    );
    return () => {
      window.removeEventListener("storage", syncTags);
      window.removeEventListener("gallery:tags-updated", syncTags);
      window.removeEventListener(
        "gallery:titles-updated",
        syncTitles as EventListener
      );
    };
  }, []);

  const loadItems = useCallback(async () => {
    const list = await fetchManifest();
    const addedMap = getAddedMap();
    const now = new Date().toISOString();
    const merged = list.map((it) => {
      const addedAt = addedMap[it.id] || it.addedAt || now;
      if (!addedMap[it.id]) setAddedDate(it.id, addedAt);
      return { ...it, addedAt };
    });
    setItems(merged);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "g" && e.ctrlKey) {
        e.preventDefault();
        window.location.href = "/";
      } else if (e.key.toLowerCase() === "s" && e.ctrlKey) {
        e.preventDefault();
        setSort(sort === "newest" ? "trend" : "newest");
      } else if (e.key.toLowerCase() === "i") {
        setMode("images");
      } else if (e.key.toLowerCase() === "v") {
        setMode("videos");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setMode, setSort, sort]);

  useEffect(() => {
    if (!sortMenuOpen) return;

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        sortMenuRef.current?.contains(target) ||
        sortBtnRef.current?.contains(target)
      )
        return;
      setSortMenuOpen(false);
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setSortMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [sortMenuOpen]);

  useEffect(() => {
    if (!filtersOpen) return;

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        filtersMenuRef.current?.contains(target) ||
        filtersBtnRef.current?.contains(target)
      )
        return;
      setFiltersOpen(false);
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setFiltersOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (mode === "videos") {
      setFiltersOpen(false);
    }
  }, [mode]);

  useEffect(() => {
    const handle = () => setViewsVersion((v) => v + 1);
    window.addEventListener("gallery:view-updated", handle);
    window.addEventListener("storage", handle);
    return () => {
      window.removeEventListener("gallery:view-updated", handle);
      window.removeEventListener("storage", handle);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => {
      void loadItems();
    };
    window.addEventListener("gallery:refresh", handleRefresh);
    return () => {
      window.removeEventListener("gallery:refresh", handleRefresh);
    };
  }, [loadItems]);

  const filtered = useMemo(() => {
    const base = items.filter((i) =>
      mode === "images" ? i.type === "image" : i.type === "video"
    );

    const selectedItemType = mode === "images" ? "image" : "video";
    const categorySet = selectedCategories.length
      ? new Set(selectedCategories.map((value) => value.toLowerCase()))
      : null;
    const tagSet = selectedTags.length
      ? new Set(selectedTags.map((value) => value.toLowerCase()))
      : null;

    const categorized = categorySet
      ? base.filter((i) => {
          if (i.type !== selectedItemType) return true;
          const ext = i.src.split(".").pop()?.toLowerCase();
          if (!ext) return true;
          return categorySet.has(ext);
        })
      : base;

    const tagged = tagSet
      ? categorized.filter((i) => {
          const tags =
            (i.type === "image"
              ? tagMap[i.id]
              : videoAutoTags[i.id] || tagMap[i.id]) || [];
          if (!tags.length) return tagSet.has("untagged");
          for (const tag of tags) {
            if (tagSet.has(tag.toLowerCase())) return true;
          }
          return false;
        })
      : categorized;

    if (sort === "newest") {
      return [...tagged].sort((a, b) =>
        (b.addedAt || "").localeCompare(a.addedAt || "")
      );
    }

    const watchTotals =
      typeof window === "undefined" ? {} : getWatchTimeMap();
    return [...tagged].sort(
      (a, b) => (watchTotals[b.id] || 0) - (watchTotals[a.id] || 0)
    );
  }, [
    items,
    mode,
    selectedCategories,
    selectedTags,
    sort,
    tagMap,
    viewsVersion,
    videoAutoTags,
  ]);

  // Stable lightbox order: capture the current filtered order once when opening.
  const [sequenceIds, setSequenceIds] = useState<string[] | null>(null);

  const itemsById = useMemo(() => {
    const map: Record<string, GalleryItem> = {};
    items.forEach((it) => {
      map[it.id] = it;
    });
    return map;
  }, [items]);

  const activeIndex = useMemo(() => {
    if (!openId || !sequenceIds) return -1;
    return sequenceIds.indexOf(openId);
  }, [openId, sequenceIds]);

  useEffect(() => {
    if (!openId) {
      if (sequenceIds !== null) setSequenceIds(null);
      return;
    }
    if (!sequenceIds || sequenceIds.length === 0) {
      // First open in this session – freeze the current filtered order.
      const ids = filtered.map((i) => i.id);
      setSequenceIds(ids);
    }
  }, [openId, filtered, sequenceIds]);

  function openAt(idx: number) {
    const list = sequenceIds && sequenceIds.length
      ? sequenceIds
      : filtered.map((i) => i.id);
    const targetId = list[idx];
    if (targetId) setOpenId(targetId);
  }
  function close() {
    setOpenId(null);
  }
  function prev() {
    if (!sequenceIds || activeIndex === -1 || sequenceIds.length === 0) return;
    const nextIndex = (activeIndex - 1 + sequenceIds.length) % sequenceIds.length;
    const nextId = sequenceIds[nextIndex];
    if (nextId) setOpenId(nextId);
  }
  function next() {
    if (!sequenceIds || activeIndex === -1 || sequenceIds.length === 0) return;
    const nextIndex = (activeIndex + 1) % sequenceIds.length;
    const nextId = sequenceIds[nextIndex];
    if (nextId) setOpenId(nextId);
  }

  function openFeatured(idx: number) {
    const selected = items[idx];
    if (!selected) return;
    const targetMode: Mode = selected.type === "image" ? "images" : "videos";
    if (mode !== targetMode) {
      setMode(targetMode);
      setPendingFeaturedId(selected.id);
      return;
    }
    const exists = filtered.some((i) => i.id === selected.id);
    if (exists) {
      setOpenId(selected.id);
    } else {
      setPendingFeaturedId(selected.id);
    }
  }


  useEffect(() => {
    if (!pendingFeaturedId) return;
    const exists = filtered.some((i) => i.id === pendingFeaturedId);
    if (!exists) return;
    setOpenId(pendingFeaturedId);
    setPendingFeaturedId(null);
  }, [filtered, pendingFeaturedId]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (selectedCategories.length) {
      const map = new Map(categoryOptions.map((opt) => [opt.value, opt.label]));
      selectedCategories.forEach((value) => {
        const label = map.get(value);
        if (label) labels.push(label);
      });
    }
    if (selectedTags.length) {
      const map = new Map(tagOptions.map((opt) => [opt.value, opt.label]));
      selectedTags.forEach((value) => {
        const label = map.get(value);
        if (label) labels.push(label);
      });
    }
    return labels;
  }, [categoryOptions, selectedCategories, selectedTags, tagOptions]);

  const activeFiltersCount = useMemo(() => {
    return FILTER_MODES.reduce(
      (sum, key) =>
        sum +
        selectedCategoriesByMode[key].length +
        selectedTagsByMode[key].length,
      0
    );
  }, [selectedCategoriesByMode, selectedTagsByMode]);

  const filtersActive = activeFiltersCount > 0;
  const filtersSummary = useMemo(() => {
    if (activeFilterLabels.length > 0) {
      if (activeFilterLabels.length <= 2) {
        return activeFilterLabels.join(" · ");
      }
      const preview = activeFilterLabels.slice(0, 2).join(" · ");
      const remaining = activeFilterLabels.length - 2;
      return `${preview} · +${remaining} more`;
    }

    if (filtersActive) {
      return `${activeFiltersCount} active filter${
        activeFiltersCount === 1 ? "" : "s"
      }`;
    }

    return "No filters selected";
  }, [activeFilterLabels, activeFiltersCount, filtersActive]);

  const filtersButtonAriaLabel = filtersActive
    ? activeFilterLabels.length
      ? `Filters active: ${activeFilterLabels.join(", ")}`
      : `Filters active: ${activeFiltersCount}`
    : "No filters selected";

  const handleCategorySelect = useCallback(
    (value: string) => {
      const normalized = value.toLowerCase();
      const order = new Map(
        categoryOptions.map((opt, index) => [opt.value, index])
      );
      if (!order.has(normalized)) return;

      setSelectedCategoriesByMode((prev) => {
        const current = prev[mode] ?? [];
        const exists = current.includes(normalized);
        const nextList = exists
          ? current.filter((entry) => entry !== normalized)
          : [...current, normalized].sort(
              (a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)
            );

        if (arraysEqual(nextList, current)) return prev;
        return { ...prev, [mode]: nextList };
      });
    },
    [categoryOptions, mode]
  );

  const handleTagSelect = useCallback(
    (value: string) => {
      const normalized = value.toLowerCase();
      const order = new Map(tagOptions.map((opt, index) => [opt.value, index]));
      if (!order.has(normalized)) return;

      setSelectedTagsByMode((prev) => {
        const current = prev[mode] ?? [];
        const exists = current.includes(normalized);
        const nextList = exists
          ? current.filter((entry) => entry !== normalized)
          : [...current, normalized].sort(
              (a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)
            );

        if (arraysEqual(nextList, current)) return prev;
        return { ...prev, [mode]: nextList };
      });
    },
    [mode, tagOptions]
  );

  const handleClearFilters = useCallback(() => {
    setSelectedCategoriesByMode({
      images: [],
      videos: [],
    });
    setSelectedTagsByMode({
      images: [],
      videos: [],
    });
    setFiltersOpen(false);
  }, []);

  const handleTagsChange = useCallback((id: string, tags: string[]) => {
    const sanitized = Array.from(
      new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))
    );
    setItemTags(id, sanitized);
    setTagMap((prev) => {
      const next = { ...prev };
      if (!sanitized.length) {
        delete next[id];
      } else {
        next[id] = sanitized;
      }
      return next;
    });
  }, []);

  const handleTitleChange = useCallback((id: string, title: string | null) => {
    try {
      setItemTitle(id, title);
    } catch {
      // ignore
    }
    setTitleMap((prev) => {
      const next = { ...prev };
      if (title && title.trim()) next[id] = title.trim();
      else delete next[id];
      return next;
    });
  }, []);

  return (
    <main className={`gallery-page gallery-page--${mode}`}>
      <div className="gallery-shell">
        <section className="gallery-hero">
          <div className="gallery-hero__copy">
            <div className="gallery-featured">
              <div className="gallery-featured__rail">
                <Featured
                  items={items}
                  onOpen={openFeatured}
                  titleMap={titleMap}
                  onRename={handleTitleChange}
                  tagMap={tagMap}
                  onEditTags={handleTagsChange}
                />
              </div>
            </div>
          </div>
        </section>
        <section className="gallery-controls">
          <div className="gallery-controls__filters">
            <div
              className={
                "filter-button" +
                (filtersOpen ? " is-open" : "") +
                (filtersActive ? " is-active" : "")
              }
              role="group"
              aria-label={filtersButtonAriaLabel}
            >
              <button
                type="button"
                className="filter-button__clear-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  if (filtersActive) handleClearFilters();
                }}
                disabled={!filtersActive}
                aria-label={
                  filtersActive ? "Clear all filters" : "No filters to clear"
                }
              >
                {filtersActive ? (
                  "\u2715"
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3 5h14M5.5 10h9M8 15h4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className="filter-button__main"
                ref={filtersBtnRef}
                onClick={() => setFiltersOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={filtersOpen}
                aria-controls={filtersPanelId}
              >
                <span className="filter-button__text">
                  <span className="filter-button__label">Filters</span>
                  <span className="filter-button__summary">
                    {filtersSummary}
                  </span>
                </span>
                <span className="filter-button__meta">
                  {filtersActive && (
                    <span className="filter-button__badge" aria-hidden>
                      {activeFiltersCount}
                    </span>
                  )}
                  <span className="filter-button__caret" aria-hidden>
                    {"\u25BC"}
                  </span>
                </span>
              </button>
            </div>
            {filtersOpen && (
              <div
                className="gallery-filters"
                ref={filtersMenuRef}
                id={filtersPanelId}
                role="region"
                aria-label="Gallery filters"
              >
                {categoryOptions.length > 0 && (
                  <div className="gallery-filters__section">
                    <h4 className="gallery-filters__title">File type</h4>
                    <div className="gallery-filters__options">
                      {categoryOptions.map((opt) => {
                        const active = selectedCategories.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`gallery-filters__chip${
                              active ? " is-active" : ""
                            }`}
                            onClick={() => handleCategorySelect(opt.value)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {tagOptions.length > 0 && (
                  <div className="gallery-filters__section">
                    <h4 className="gallery-filters__title">Tags</h4>
                    <div className="gallery-filters__options">
                      {tagOptions.map((opt) => {
                        const active = selectedTags.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`gallery-filters__chip${
                              active ? " is-active" : ""
                            }`}
                            onClick={() => handleTagSelect(opt.value)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {categoryOptions.length === 0 && tagOptions.length === 0 && (
                  <p className="gallery-filters__empty">
                    Filters will appear once items include tags or file types.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="gallery-controls__toggle">
            <Toggle
              value={mode}
              options={[
                { value: "images", label: "Photo" },
                { value: "videos", label: "Video" },
              ]}
              onChange={setMode as (value: string) => void}
            />
          </div>
          <div className="gallery-controls__sort">
            <button
              type="button"
              className={`sort-button${sortMenuOpen ? " is-open" : ""}`}
              ref={sortBtnRef}
              onClick={() => setSortMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={sortMenuOpen}
            >
              <span className="sort-button__label">
                {sort === "trend" ? "Trending" : "Newest"}
              </span>
              <span className="sort-button__icon" aria-hidden>
                {"\u25BC"}
              </span>
            </button>
            {sortMenuOpen && (
              <div className="sort-dropdown" ref={sortMenuRef} role="menu">
                {[
                  { key: "trend", label: "Trending" },
                  { key: "newest", label: "Newest" },
                ].map((opt) => {
                  const active = sort === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      className={`sort-option${active ? " is-active" : ""}`}
                      onClick={() => {
                        setSort(opt.key as any);
                        setSortMenuOpen(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {active && (
                        <span className="sort-option__check">{"\u2713"}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="gallery-grid">
          <Grid
            items={filtered}
            onOpen={openAt}
            tagMap={displayTagMap}
            onUpdateTags={handleTagsChange}
            titleMap={titleMap}
            onUpdateTitle={handleTitleChange}
            availableTags={tagOptions.map((opt) => opt.value)}
          />
        </section>
      </div>

      {/* pass Lightbox props as `any` spread to avoid prop-type mismatch in JSX inference */}
      {(() => {
        const queueIds = sequenceIds && sequenceIds.length
          ? sequenceIds
          : filtered.map((i) => i.id);
        const queue = queueIds.map((id) => itemsById[id]).filter(Boolean);
        const lbProps: any = {
          item: activeIndex === -1 ? null : queue[activeIndex] ?? null,
          queue,
          currentIndex: activeIndex,
          onClose: close,
          onPrev: prev,
          onNext: next,
          onSelect: openAt,
          titleMap,
          onUpdateTitle: handleTitleChange,
        };
        return <Lightbox {...lbProps} />;
      })()}
    </main>
  );
}
