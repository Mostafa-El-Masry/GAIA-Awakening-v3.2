/**
 * Builds CDN URLs for gallery images using environment configuration
 */

import { r2 } from "@/lib/r2";

const RAW_BASE = process.env.NEXT_PUBLIC_IMG_CDN_BASE ?? "";
const RAW_PREVIEW_BASE = process.env.NEXT_PUBLIC_GAIA_PREVIEWS_URL ?? "";
const BASE = RAW_BASE.replace(/\/+$/, "");
const PREVIEW_BASE = RAW_PREVIEW_BASE.replace(/\/+$/, "");
const HAS_BASE = BASE.length > 0;
const HAS_PREVIEW_BASE = PREVIEW_BASE.length > 0;
const GALLERY_LOCAL_PREFIXES = ["media/images/", "media/videos/"];
const GALLERY_STRIP_PREFIXES = [...GALLERY_LOCAL_PREFIXES];
const PREVIEW_LOCAL_PREFIXES = ["media/previews/"];
const PREVIEW_STRIP_PREFIXES = [...PREVIEW_LOCAL_PREFIXES];

function stripPrefix(value: string, prefixes: string[]) {
  for (const prefix of prefixes) {
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }
  return value;
}

/**
 * Converts a raw image key/path to a CDN URL
 * @param key The R2 object key or path
 * @returns Full CDN URL for the image
 */
export function getGalleryImageUrl(key: string): string {
  if (!key) return key;

  if (/^(?:https?:|data:|blob:)/i.test(key)) return key;

  // Remove any leading slashes
  const cleanKey = key.replace(/^\/+/, "");
  const isLocal = GALLERY_LOCAL_PREFIXES.some((prefix) =>
    cleanKey.startsWith(prefix)
  );
  const normalizedKey = isLocal
    ? cleanKey
    : stripPrefix(cleanKey, GALLERY_STRIP_PREFIXES);

  if (!normalizedKey) {
    return isLocal ? "/" : HAS_BASE ? BASE : "/";
  }

  const src = normalizedKey;
  if (typeof src === "string") {
    const name = src.split("/").pop()!;
    const looksLikeFile = /\.[a-z0-9]{2,5}$/i.test(name);
    const isBareFilename = looksLikeFile && !src.includes("/");

    if (isBareFilename && !isLocal) {
      return r2(name);
    }
  }

  // Build the full CDN URL (or fall back to root-relative path)
  if (isLocal) {
    return `/${normalizedKey}`;
  }

  return HAS_BASE ? `${BASE}/${normalizedKey}` : `/${normalizedKey}`;
}

/**
 * Converts a preview key/path to the previews CDN URL
 */
export function getPreviewImageUrl(key: string): string {
  if (!key) return key;
  if (/^(?:https?:|data:|blob:)/i.test(key)) return key;

  const cleanKey = key.replace(/^\/+/, "");
  const isLocal = PREVIEW_LOCAL_PREFIXES.some((prefix) =>
    cleanKey.startsWith(prefix)
  );
  const normalizedKey = isLocal
    ? cleanKey
    : stripPrefix(cleanKey, PREVIEW_STRIP_PREFIXES);

  if (!normalizedKey) {
    return isLocal ? "/" : HAS_PREVIEW_BASE ? PREVIEW_BASE : "/";
  }

  if (isLocal) {
    return `/${normalizedKey}`;
  }

  return HAS_PREVIEW_BASE ? `${PREVIEW_BASE}/${normalizedKey}` : `/${normalizedKey}`;
}

/**
 * Converts a raw image URL to a CDN URL
 * @param url The original image URL or path
 * @returns The CDN URL for the image
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return url;

  if (/^(?:data:|blob:)/i.test(url)) return url;

  if (/^https?:\/\//i.test(url)) {
    // If it's already our CDN URL, return as is
    if (HAS_BASE && url.startsWith(BASE)) return url;

    // Extract the key/path portion
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.replace(/^\//, "");
      return getGalleryImageUrl(path);
    } catch {
      // If not a valid URL, treat as a direct key/path
      return getGalleryImageUrl(url);
    }
  }

  return getGalleryImageUrl(url);
}
