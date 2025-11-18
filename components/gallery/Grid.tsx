"use client";
import NextImage from "next/image";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryItem } from "./types";
import { getFavorites, getWatchTimeMap, setFavorite } from "./prefs";
import { formatDuration } from "./metrics";
import {
  DownloadGlyph,
  EyeGlyph,
  HeartFilledGlyph,
  HeartGlyph,
  PlayBadgeGlyph,
} from "./icons";
import { getDisplayName } from "./utils";
import { getGalleryImageUrl } from "./imageUrl";
import { getPreviewSources } from "./previews";

// EditableTitle: small inline editor for item title. Shows title and an edit button.
function EditableTitle({
  id,
  title,
  onSave,
}: {
  id: string;
  title: string;
  onSave: (next: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  // keep draft in sync when title prop changes
  useEffect(() => setDraft(title), [title]);

  const submit = (next?: string | null) => {
    const val = (next === undefined ? draft : next) ?? "";
    const trimmed = val.trim();
    onSave(trimmed.length ? trimmed : null);
    setEditing(false);
  };

  return editing ? (
    <form
      className="card-overlay__title-edit"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        className="card-overlay__title-input"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            setEditing(false);
            setDraft(title);
          } else if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        onBlur={() => submit()}
      />
    </form>
  ) : (
    <span className="card-overlay__title" title={title}>
      <button
        type="button"
        className="card-overlay__title-btn"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        {title}
        <span className="sr-only">Edit title</span>
      </button>
    </span>
  );
}

const PAGE_SIZE = 20;
const PREVIEW_START_DELAY_MS = 250;
const PREVIEW_FRAME_DELAY_MS = 500;

export default function Grid({
  items,
  onOpen,
  tagMap,
  onUpdateTags,
  availableTags,
  titleMap,
  onUpdateTitle,
}: {
  items: GalleryItem[];
  onOpen: (idx: number) => void;
  tagMap: Record<string, string[]>;
  onUpdateTags: (id: string, tags: string[]) => void;
  availableTags: string[];
  titleMap?: Record<string, string>;
  onUpdateTitle?: (id: string, title: string | null) => void;
}) {
  const [watchMap, setWatchMap] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [limit, setLimit] = useState(PAGE_SIZE);
  const signatureRef = useRef<string>("");
  const signature = useMemo(
    () =>
      items
        .slice(0, PAGE_SIZE)
        .map((item) => item.id)
        .join("|"),
    [items]
  );

  useEffect(() => {
    setLimit((prev) => {
      const base = Math.min(PAGE_SIZE, items.length || PAGE_SIZE);
      if (signatureRef.current !== signature) {
        signatureRef.current = signature;
        return base;
      }
      signatureRef.current = signature;
      return Math.min(items.length, Math.max(prev, PAGE_SIZE));
    });
  }, [items.length, signature]);

  const slice = useMemo(() => items.slice(0, limit), [items, limit]);
  const hasMore = limit < items.length;

  const handleLoadMore = () => {
    setLimit((prev) => Math.min(items.length, prev + PAGE_SIZE));
  };

  useEffect(() => {
    function syncWatchTime() {
      try {
        setWatchMap(getWatchTimeMap());
      } catch {
        setWatchMap({});
      }
    }
    syncWatchTime();
    window.addEventListener("storage", syncWatchTime);
    const handleCustom = () => syncWatchTime();
    window.addEventListener("gallery:view-updated", handleCustom);
    return () => {
      window.removeEventListener("storage", syncWatchTime);
      window.removeEventListener("gallery:view-updated", handleCustom);
    };
  }, [items.length]);

  useEffect(() => {
    const syncFavorites = () => {
      try {
        setFavorites(getFavorites());
      } catch {
        setFavorites({});
      }
    };
    syncFavorites();
    function onFavoriteEvent(event: Event) {
      const detail = (event as CustomEvent<{ id: string; value: boolean }>)
        .detail;
      if (!detail) {
        syncFavorites();
        return;
      }
      setFavorites((prev) => {
        const next = { ...prev };
        if (detail.value) {
          next[detail.id] = true;
        } else {
          delete next[detail.id];
        }
        return next;
      });
    }
    window.addEventListener("gallery:favorites-updated", onFavoriteEvent);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener("gallery:favorites-updated", onFavoriteEvent);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const nextValue = !prev[id];
      const next = { ...prev };
      if (nextValue) {
        next[id] = true;
      } else {
        delete next[id];
      }
      try {
        setFavorite(id, nextValue);
      } catch {
        // ignore write errors; state already updated optimistically
      }
      return next;
    });
  };

  return (
    <div className="gallery-grid__inner">
      <div className="gallery-grid-list">
        {slice.map((item, idx) => (
          <GalleryCard
            key={item.id}
            item={item}
            idx={idx}
            onOpen={onOpen}
            watchSeconds={watchMap[item.id] ?? 0}
            isFavorite={Boolean(favorites[item.id])}
            onToggleFavorite={() => handleToggleFavorite(item.id)}
            tags={tagMap[item.id] ?? item.tags ?? []}
            availableTags={availableTags}
            onUpdateTags={(tags) => onUpdateTags(item.id, tags)}
            titleMap={titleMap}
            onUpdateTitle={onUpdateTitle}
          />
        ))}
      </div>
      {hasMore && (
        <div className="load-more">
          <button
            type="button"
            className="load-more__btn"
            onClick={handleLoadMore}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

function GalleryCard({
  item,
  idx,
  onOpen,
  watchSeconds,
  isFavorite,
  onToggleFavorite,
  tags,
  availableTags,
  onUpdateTags,
  onUpdateTitle,
  titleMap,
}: {
  item: GalleryItem;
  idx: number;
  onOpen: (idx: number) => void;
  watchSeconds: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  tags: string[] | undefined;
  availableTags: string[];
  onUpdateTags: (tags: string[]) => void;
  onUpdateTitle?: (id: string, title: string | null) => void;
  titleMap?: Record<string, string>;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const imageCover = getGalleryImageUrl(item.src);
  const previewSources = useMemo(
    () => (item.type === "video" ? getPreviewSources(item) : []),
    [item]
  );
  const baseCover =
    item.type === "image"
      ? imageCover
      : previewSources[0] ?? "/media/video-placeholder.jpg";
  const cover = baseCover;
  const fallbackRatio = item.type === "video" ? 16 / 9 : undefined;
  const aspect = useAspect(cover, fallbackRatio);
  const [rowSpan, setRowSpan] = useState<number | undefined>(undefined);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [draftTag, setDraftTag] = useState("");
  const normalizedTags = useMemo(() => {
    if (!Array.isArray(tags)) return [] as string[];
    const set = new Set<string>();
    tags.forEach((tag) => {
      const clean = tag.trim().toLowerCase();
      if (clean) set.add(clean);
    });
    return Array.from(set).sort();
  }, [tags]);
  const menuTags = useMemo(() => {
    const set = new Set<string>();
    availableTags.forEach((tag) => {
      const clean = tag.trim().toLowerCase();
      if (clean) set.add(clean);
    });
    normalizedTags.forEach((tag) => set.add(tag));
    return Array.from(set).sort();
  }, [availableTags, normalizedTags]);
  const isTaggable = item.type === "image" || item.type === "video";

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const grid = node.parentElement;
    if (!grid) return;

    const compute = () => {
      if (!grid) return;
      const styles = window.getComputedStyle(grid);
      const rowHeight =
        parseFloat(styles.getPropertyValue("grid-auto-rows")) || 1;
      const gap = parseFloat(styles.getPropertyValue("row-gap")) || 0;
      const height = node.getBoundingClientRect().height;
      const span = Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)));
      setRowSpan((prev) => (prev === span ? prev : span));
    };

    compute();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => compute());
      observer.observe(node);
    }
    window.addEventListener("resize", compute);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [item.id]);

  useEffect(() => {
    if (!tagMenuOpen) return;
    const onDocClick = (event: MouseEvent) => {
      const node = cardRef.current;
      if (!node) return;
      if (!node.contains(event.target as Node)) {
        setTagMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [tagMenuOpen]);

  useEffect(() => {
    if (!isTaggable && tagMenuOpen) {
      setTagMenuOpen(false);
    }
  }, [isTaggable, tagMenuOpen]);

  useEffect(() => {
    setTagMenuOpen(false);
    setDraftTag("");
  }, [item.id]);

  const style: React.CSSProperties = {};
  if (typeof aspect === "number") {
    (style as any)["--card-aspect"] = aspect;
  }
  if (rowSpan) {
    style.gridRowEnd = `span ${rowSpan}`;
  }

  const name = getDisplayName(item.src, item.id);
  const titleOverride =
    titleMap && titleMap[item.id] ? titleMap[item.id] : name;
  // Allow title override from local storage via GalleryClient -> passed prop
  // We'll read it from the DOM prop via dataset if provided later; default is filesystem-derived
  const totalWatchSeconds = Math.max(0, watchSeconds || 0);
  const watchLabel = formatDuration(totalWatchSeconds) ?? "0:00";
  const clipDuration =
    item.type === "video" ? formatDuration(item.duration) : undefined;

  const downloadName = item.src.split("/").pop() ?? `${name}`;

  const handleFavoriteClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite();
  };

  const handleTagToggle = (tagValue: string) => {
    const clean = tagValue.trim().toLowerCase();
    if (!clean) return;
    const next = new Set(normalizedTags);
    if (next.has(clean)) {
      next.delete(clean);
    } else {
      next.add(clean);
    }
    onUpdateTags(Array.from(next));
  };

  const handleTagAdd = () => {
    const clean = draftTag.trim().toLowerCase();
    if (!clean) return;
    const next = new Set(normalizedTags);
    next.add(clean);
    onUpdateTags(Array.from(next));
    setDraftTag("");
  };

  const handleClearTags = () => {
    onUpdateTags([]);
  };

  return (
    <figure
      ref={cardRef}
      className={`card card--${item.type} relative cursor-pointer`}
      style={style}
      onClick={() => onOpen(idx)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="card-media-wrapper">
        {item.type === "image" ? (
          <img src={cover} alt="" className="card-media" loading="lazy" />
        ) : (
          <VideoThumb cover={cover} previews={previewSources} />
        )}
        <div className="card-overlay">
          <div className="card-overlay__row card-overlay__row--top">
            <div className="card-overlay__badges">
              <span
                className="card-pill card-pill--views"
                title={`${watchLabel} total watch time`}
              >
                <EyeGlyph className="card-pill__icon" strokeWidth={1.8} />
                {watchLabel}
              </span>
              {clipDuration && (
                <span className="card-pill card-pill--muted">
                  {clipDuration}
                </span>
              )}
            </div>
            <button
              type="button"
              className={`card-overlay__favorite${
                isFavorite ? " is-active" : ""
              }`}
              onClick={handleFavoriteClick}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              {isFavorite ? (
                <HeartFilledGlyph className="card-overlay__favorite-icon" />
              ) : (
                <HeartGlyph
                  className="card-overlay__favorite-icon"
                  strokeWidth={1.8}
                />
              )}
            </button>
          </div>
          <div className="card-overlay__row card-overlay__row--bottom">
            <EditableTitle
              title={titleOverride}
              id={item.id}
              onSave={(next: string | null) =>
                onUpdateTitle && onUpdateTitle(item.id, next)
              }
            />
            <div className="card-overlay__actions">
              {isTaggable && (
                <div className="card-tags" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`card-tags__button${
                      tagMenuOpen ? " is-open" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTagMenuOpen((open) => !open);
                    }}
                  >
                    Tags
                    {normalizedTags.length > 0 && (
                      <span className="card-tags__count">
                        {normalizedTags.length}
                      </span>
                    )}
                  </button>
                  {tagMenuOpen && (
                    <div className="card-tags__menu">
                      {menuTags.length === 0 ? (
                        <p className="card-tags__empty">
                          No preset tags; add your own below.
                        </p>
                      ) : (
                        <div className="card-tags__options">
                          {menuTags.map((tag) => (
                            <label key={tag} className="card-tags__option">
                              <input
                                type="checkbox"
                                checked={normalizedTags.includes(tag)}
                                onChange={() => handleTagToggle(tag)}
                              />
                              <span>
                                {tag.charAt(0).toUpperCase() + tag.slice(1)}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      <div className="card-tags__add">
                        <input
                          type="text"
                          value={draftTag}
                          onChange={(e) => setDraftTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleTagAdd();
                            }
                          }}
                          placeholder="Add tag"
                          className="card-tags__input"
                        />
                        <button
                          type="button"
                          className="card-tags__add-btn"
                          onClick={handleTagAdd}
                        >
                          Add
                        </button>
                      </div>
                      {normalizedTags.length > 0 && (
                        <button
                          type="button"
                          className="card-tags__clear"
                          onClick={handleClearTags}
                        >
                          Clear tags
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {item.type === "image" && (
                <a
                  className="card-overlay__download card-overlay__download--icon-only"
                  href={getGalleryImageUrl(item.src)}
                  download={downloadName}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Download ${name}`}
                >
                  <DownloadGlyph
                    className="card-overlay__download-icon"
                    strokeWidth={1.8}
                  />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function VideoThumb({
  cover,
  previews,
}: {
  cover: string;
  previews: string[];
}) {
  const [frame, setFrame] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const rotationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewSources = previews;
  const hasPreviews = previewSources.length > 0;
  const previewAvailable = hasPreviews && !previewFailed;

  useEffect(() => {
    setPreviewFailed(false);
    setFrame(0);
  }, [previewSources]);

  useEffect(() => {
    if (!previewAvailable) {
      setFrame(0);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const startRotation = () => {
      if (rotationTimer.current) clearInterval(rotationTimer.current);
      rotationTimer.current = setInterval(() => {
        setFrame((prev) => (prev + 1) % previewSources.length);
      }, PREVIEW_FRAME_DELAY_MS);
    };

    const clearTimers = () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (rotationTimer.current) clearInterval(rotationTimer.current);
      hoverTimer.current = null;
      rotationTimer.current = null;
    };

    const onEnter = () => {
      clearTimers();
      hoverTimer.current = setTimeout(
        startRotation,
        PREVIEW_START_DELAY_MS
      );
    };

    const onLeave = () => {
      clearTimers();
      setFrame(0);
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      clearTimers();
    };
  }, [previewAvailable, previewSources]);

  useEffect(() => {
    if (!previewAvailable) {
      setFrame(0);
    }
  }, [previewAvailable]);

  const activePreviewSrc = previewAvailable
    ? previewSources[frame] ?? previewSources[0]
    : cover;

  return (
    <div ref={ref} className="video-thumb relative">
      <NextImage
        src={activePreviewSrc ?? cover}
        alt="Preview"
        width={400}
        height={300}
        className="card-media rounded-xl object-cover"
        onError={() => setPreviewFailed(true)}
      />
      <span className="video-badge" aria-hidden>
        <PlayBadgeGlyph className="video-badge__icon" />
      </span>
    </div>
  );
}

function useAspect(src?: string, fallback?: number) {
  const [ratio, setRatio] = useState<number | undefined>(fallback);

  useEffect(() => {
    if (!src) {
      setRatio(fallback);
      return;
    }
    let active = true;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!active) return;
      const computed =
        img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : fallback;
      setRatio(computed || fallback);
    };
    img.onerror = () => {
      if (active) setRatio(fallback);
    };
    img.src = src;
    return () => {
      active = false;
    };
  }, [src, fallback]);

  return ratio;
}
