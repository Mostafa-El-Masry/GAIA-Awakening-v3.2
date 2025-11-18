import { getPreviewImageUrl } from "./imageUrl";
import type { GalleryItem } from "./types";

const PREVIEW_FRAME_COUNT = 6;

function encodePathSegment(value: string): string {
  const clean = value.trim();
  if (/^(?:https?:|data:|blob:)/i.test(clean)) return clean;
  return clean
    .split("/")
    .map((part) => {
      try {
        return encodeURIComponent(decodeURIComponent(part));
      } catch {
        return encodeURIComponent(part);
      }
    })
    .join("/");
}

function derivePreviewKeysFromSrc(src: string, count = PREVIEW_FRAME_COUNT) {
  const file = src.split(/[/\\]/).pop() ?? src;
  const base = file.replace(/\.[^/.]+$/, "").trim();
  if (!base) return [] as string[];

  const encodedBase = encodePathSegment(base);
  const keys: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    keys.push(`${encodedBase}_thumb_${String(i).padStart(3, "0")}.jpg`);
  }
  return keys;
}

export function getPreviewSources(
  item: GalleryItem | null | undefined,
  count = PREVIEW_FRAME_COUNT
): string[] {
  if (!item || item.type !== "video") return [];

  const provided = Array.isArray(item.preview) ? item.preview : [];
  const candidates =
    provided.length > 0 ? provided : derivePreviewKeysFromSrc(item.src, count);

  const seen = new Set<string>();
  const normalized: string[] = [];
  candidates.forEach((candidate) => {
    const encoded = encodePathSegment(candidate);
    if (!encoded) return;
    const url = getPreviewImageUrl(encoded);
    if (url && !seen.has(url)) {
      seen.add(url);
      normalized.push(url);
    }
  });

  return normalized;
}

export { PREVIEW_FRAME_COUNT };
