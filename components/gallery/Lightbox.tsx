"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GalleryItem } from "./types";
import {
  addWatchTime,
  getVideoProgress,
  setVideoProgress,
  getVideoVolume,
  setVideoVolume,
} from "./prefs";
import { getDisplayName } from "./utils";
import { getGalleryImageUrl } from "./imageUrl";

const AUTOPLAY_DELAY_MS = 10000;
const AUTOPLAY_TICK_MS = 100;

export default function Lightbox({
  item,
  queue,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onSelect,
  titleMap,
  onUpdateTitle,
}: {
  item: GalleryItem | null;
  queue: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (idx: number) => void;
  titleMap?: Record<string, string>;
  onUpdateTitle?: (id: string, title: string | null) => void;
}) {
  const vref = useRef<HTMLVideoElement>(null);
  const lastPersist = useRef<number>(0);
  const resumeTargetRef = useRef<number | null>(null);
  const resumeAppliedRef = useRef(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [countdownMs, setCountdownMs] = useState(AUTOPLAY_DELAY_MS);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      try {
        setIsMobile(window.innerWidth < 640);
      } catch {
        setIsMobile(false);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // title editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    if (!item) {
      setTitleDraft("");
      setEditingTitle(false);
      return;
    }
    const defaultTitle =
      titleMap && titleMap[item.id]
        ? titleMap[item.id]
        : getDisplayName(item.src, item.id);
    setTitleDraft(defaultTitle);
    setEditingTitle(false);
  }, [item, titleMap]);

  const submitTitle = (next?: string | null) => {
    if (!item) return;
    const val = next === undefined ? titleDraft : next ?? "";
    const trimmed = (val || "").trim();
    try {
      onUpdateTitle && onUpdateTitle(item.id, trimmed.length ? trimmed : null);
    } catch {
      // ignore
    }
    setEditingTitle(false);
  };

  const suggestions = useMemo(() => {
    if (!item || item.type !== "video") return [];
    if (!Array.isArray(queue) || currentIndex < 0) return [];
    const candidates = queue
      .map((entry, idx) => ({ entry, idx }))
      .filter(
        ({ entry, idx }) => entry.type === "video" && idx !== currentIndex
      );
    if (!candidates.length) return [];
    const forward = candidates.filter(({ idx }) => idx > currentIndex);
    const wrapped = candidates.filter(({ idx }) => idx <= currentIndex);
    return [...forward, ...wrapped].slice(0, 2);
  }, [currentIndex, item, queue]);

  const clearTimers = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleRecommendationSelect = useCallback(
    (idx: number) => {
      clearTimers();
      setShowRecommendations(false);
      onSelect(idx);
    },
    [clearTimers, onSelect]
  );

  const startAutoAdvance = useCallback(() => {
    if (!suggestions.length) {
      onNext();
      return;
    }
    clearTimers();
    setShowRecommendations(true);
    setCountdownMs(AUTOPLAY_DELAY_MS);
    autoAdvanceRef.current = setTimeout(() => {
      if (suggestions.length) {
        handleRecommendationSelect(suggestions[0].idx);
      } else {
        setShowRecommendations(false);
        clearTimers();
        onNext();
      }
    }, AUTOPLAY_DELAY_MS);
    countdownRef.current = setInterval(() => {
      setCountdownMs((prev) => {
        const next = Math.max(prev - AUTOPLAY_TICK_MS, 0);
        if (next <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return 0;
        }
        return next;
      });
    }, AUTOPLAY_TICK_MS);
  }, [clearTimers, handleRecommendationSelect, onNext, suggestions]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    setShowRecommendations(false);
    setCountdownMs(AUTOPLAY_DELAY_MS);
    clearTimers();
    resumeAppliedRef.current = false;
    resumeTargetRef.current = null;
  }, [clearTimers, item?.id]);

  useEffect(() => {
    resumeAppliedRef.current = false;
    resumeTargetRef.current = null;
    if (!item || item.type !== "video") return;
    const saved = getVideoProgress(item.id);
    if (!(saved > 0)) return;
    resumeTargetRef.current = saved;

    const events: Array<keyof HTMLVideoElementEventMap> = [
      "loadedmetadata",
      "loadeddata",
      "canplay",
      "timeupdate",
    ];
    let raf: number | null = null;
    let listenersAttached = false;

    function removeListeners() {
      const current = vref.current;
      if (!current || !listenersAttached) return;
      events.forEach((ev) => current.removeEventListener(ev, tryRestore));
      listenersAttached = false;
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }

    function schedule() {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        tryRestore();
      });
    }

    function attachListeners() {
      const current = vref.current;
      if (!current || listenersAttached) return;
      events.forEach((ev) => current.addEventListener(ev, tryRestore));
      listenersAttached = true;
    }

    function tryRestore() {
      if (resumeAppliedRef.current) return;
      const target = resumeTargetRef.current;
      const current = vref.current;
      if (target == null || !current) {
        schedule();
        return;
      }
      attachListeners();
      const hasDuration =
        Number.isFinite(current.duration) && current.duration > 0;
      if (!hasDuration) {
        schedule();
        return;
      }
      const maxSeek = Math.max(current.duration - 0.2, 0);
      const clamped = Math.min(target, maxSeek);
      if (Math.abs(current.currentTime - clamped) > 0.2) {
        const resumePlayback = !current.paused;
        try {
          current.currentTime = clamped;
        } catch {
          return;
        }
        if (resumePlayback) {
          current.play().catch(() => {});
        }
      }
      if (Math.abs(current.currentTime - clamped) <= 0.25) {
        resumeAppliedRef.current = true;
        resumeTargetRef.current = null;
        removeListeners();
      } else {
        schedule();
      }
    }

    attachListeners();
    schedule();

    return () => {
      removeListeners();
    };
  }, [item?.id]);

  useEffect(() => {
    const seekVideo = (delta: number) => {
      const video = vref.current;
      if (!video || item?.type !== "video") return false;
      const duration = isFinite(video.duration) ? video.duration : undefined;
      const next = video.currentTime + delta;
      const clamped =
        duration !== undefined
          ? Math.min(Math.max(0, next), duration)
          : Math.max(0, next);
      video.currentTime = clamped;
      return true;
    };
    const adjustVolume = (deltaPercent: number) => {
      const video = vref.current;
      if (!video || item?.type !== "video") return false;
      const next = Math.min(1, Math.max(0, video.volume + deltaPercent));
      if (Math.abs(next - video.volume) < 0.0001) return false;
      video.volume = next;
      return true;
    };
    const toggleFullscreen = () => {
      const video = vref.current;
      if (!video || item?.type !== "video") return;
      const anyVideo = video as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
        webkitRequestFullscreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void> | void;
      };
      if (doc.fullscreenElement) {
        const exit =
          doc.exitFullscreen ??
          doc.webkitExitFullscreen;
        if (exit) {
          try {
            const result = exit.call(doc);
            if (result && typeof (result as Promise<void>).catch === "function") {
              (result as Promise<void>).catch(() => {});
            }
          } catch {
            /* noop */
          }
        }
        return;
      }
      const request =
        video.requestFullscreen ??
        anyVideo.webkitRequestFullscreen ??
        anyVideo.msRequestFullscreen;
      if (request) {
        try {
          const result = request.call(video);
          if (result && typeof (result as Promise<void>).catch === "function") {
            (result as Promise<void>).catch(() => {});
          }
        } catch {
          /* noop */
        }
      } else if (anyVideo.webkitEnterFullscreen) {
        try {
          anyVideo.webkitEnterFullscreen();
        } catch {
          /* noop */
        }
      }
    };

    const shouldIgnoreKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target.isContentEditable
      );
    };

    function onKey(e: KeyboardEvent) {
      if (!item || shouldIgnoreKey(e)) return;
      const key = e.key;
      if (key === "Escape") {
        onClose();
      } else if (key === "ArrowLeft") {
        e.preventDefault();
        if (item.type === "video") {
          if (showRecommendations) {
            clearTimers();
            setShowRecommendations(false);
          }
          seekVideo(-10);
        } else {
          onPrev();
        }
      } else if (key === "ArrowRight") {
        e.preventDefault();
        if (item.type === "video") {
          if (showRecommendations) {
            clearTimers();
            setShowRecommendations(false);
          }
          seekVideo(10);
        } else {
          onNext();
        }
      } else if (key === "ArrowUp" && item.type === "video") {
        e.preventDefault();
        adjustVolume(0.01);
      } else if (key === "ArrowDown" && item.type === "video") {
        e.preventDefault();
        adjustVolume(-0.01);
      } else if (key === "f" || key === "F") {
        if (item.type === "video") {
          e.preventDefault();
          toggleFullscreen();
        }
      } else if (key === " ") {
        e.preventDefault();
        if (item.type === "video" && vref.current)
          vref.current.paused ? vref.current.play() : vref.current.pause();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearTimers, item, onClose, onNext, onPrev, showRecommendations]);

  useEffect(() => {
    if (!item) return;
    if (typeof document === "undefined") return;

    const MIN_DELTA = 0.1;
    let last = Date.now();
    const flush = () => {
      const now = Date.now();
      const delta = (now - last) / 1000;
      if (delta > MIN_DELTA) {
        addWatchTime(item.id, delta);
      }
      last = now;
    };

    const handleVisibility = () => {
      flush();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      flush();
    };
  }, [item]);

  useEffect(() => {
    if (!item || item.type !== "video") return;
    const video = vref.current;
    if (!video) return;
    lastPersist.current = 0;
    const savedVolume = getVideoVolume();
    if (savedVolume !== undefined) {
      video.volume = savedVolume;
    }
    const handleTime = () => {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      if (now - lastPersist.current > 500) {
        lastPersist.current = now;
        setVideoProgress(item.id, video.currentTime);
      }
    };
    const handleVolume = () => setVideoVolume(video.volume);
    const handleEnded = () => {
      setVideoProgress(item.id, 0);
      startAutoAdvance();
    };

    video.addEventListener("timeupdate", handleTime);
    video.addEventListener("volumechange", handleVolume);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTime);
      video.removeEventListener("volumechange", handleVolume);
      video.removeEventListener("ended", handleEnded);
      setVideoProgress(item.id, video.currentTime);
    };
  }, [item, startAutoAdvance]);
  if (!item) return null;

  const mediaSrc = getGalleryImageUrl(item.src);

  const countdownProgress = Math.max(
    0,
    Math.min(1, countdownMs / AUTOPLAY_DELAY_MS)
  );
  const srCountdownSeconds = Math.ceil(countdownMs / 1000);

  return (
    <div
      className="lb-backdrop"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={(e) => {
        if (!isMobile) return;
        if (!e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        touchStartRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        if (!isMobile) return;
        const start = touchStartRef.current;
        if (!start) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        touchStartRef.current = null;
        if (absDx < 40 || absDx < absDy) return;
        if (dx < 0) {
          onNext();
        } else {
          onPrev();
        }
      }}
    >
      {item.type === "image" ? (
        <img
          src={mediaSrc}
          alt=""
          className="lb-media"
          onClick={(e) => {
            if (isMobile) return;
            e.stopPropagation();
            onNext();
          }}
        />
      ) : (
        <video
          className="lb-media"
          ref={vref}
          src={mediaSrc}
          controls
          autoPlay
          onClick={(e) => {
            e.stopPropagation();
            const v = vref.current;
            if (v) {
              v.currentTime = Math.min(
                v.duration || v.currentTime + 0,
                v.currentTime + 10
              );
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            const v = vref.current;
            if (v) {
              v.currentTime = Math.max(0, v.currentTime - 10);
            }
          }}
        />
      )}
      {item.type === "video" &&
        showRecommendations &&
        suggestions.length > 0 && (
          <div className="lb-recommendations">
            <div
              className="lb-recommendations__panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lb-recommendations__timer">
                <div
                  className="lb-recommendations__timer-track"
                  aria-hidden="true"
                >
                  <div
                    className="lb-recommendations__timer-bar"
                    style={{ width: `${countdownProgress * 100}%` }}
                  />
                </div>
                <span className="sr-only">
                  Auto-playing next in {srCountdownSeconds} seconds
                </span>
              </div>
              <div className="lb-recommendations__options">
                {suggestions.map(({ entry, idx }) => {
                  const thumbKey =
                    entry.preview?.[0] ?? "/media/video-placeholder.jpg";
                  const thumbSrc = getGalleryImageUrl(thumbKey);
                  const label = getDisplayName(entry.src, entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className="lb-recommendations__option"
                      onClick={() => handleRecommendationSelect(idx)}
                    >
                      <img
                        src={thumbSrc}
                        alt=""
                        className="lb-recommendations__thumb"
                        loading="lazy"
                      />
                      <span className="lb-recommendations__label">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      {/* Title bar / inline editor */}
      {item && (
        <div className="lb-title" onClick={(e) => e.stopPropagation()}>
          {editingTitle ? (
            <form
              className="lb-title__edit"
              onSubmit={(e) => {
                e.preventDefault();
                submitTitle();
              }}
            >
              <input
                className="lb-title__input"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => submitTitle()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setEditingTitle(false);
                    setTitleDraft(
                      titleMap && item
                        ? titleMap[item.id] ?? getDisplayName(item.src, item.id)
                        : getDisplayName(item.src, item.id)
                    );
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    submitTitle();
                  }
                }}
                autoFocus
              />
            </form>
          ) : (
            <div className="lb-title__text">
              <button
                type="button"
                className="lb-title__btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTitle(true);
                }}
              >
                {titleMap && item
                  ? titleMap[item.id] ?? getDisplayName(item.src, item.id)
                  : getDisplayName(item.src, item.id)}
              </button>
            </div>
          )}
        </div>
      )}

      {!isMobile && (
        <div className="lb-ui">
          <button
          aria-label="Prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="gaia-contrast m-4 rounded px-3 py-2"
        >
          ◀
        </button>
        <button
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="gaia-contrast m-4 rounded px-3 py-2"
        >
          ▶
        </button>
        </div>
      )}
    </div>
  );
}
