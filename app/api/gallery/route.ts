import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import type { Dirent } from "fs";
import { ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMG_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".avif",
]);
const VID_EXTS = new Set([".mp4", ".webm", ".mov", ".mkv", ".avi"]);
const PREVIEW_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

type ManifestItem = {
  id: string;
  type: "image" | "video";
  src: string;
  /**
   * Preview frames for videos (thumbnails, sprite frames, etc.)
   */
  preview?: string[];
  addedAt: string;
};

type R2Config = {
  endpoint?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

function hashId(p: string) {
  let h = 0,
    i = 0;
  while (i < p.length) {
    h = ((h << 5) - h + p.charCodeAt(i++)) | 0;
  }
  return Math.abs(h).toString(36);
}

// ---------- R2 helpers ----------

function hasValidConfig(cfg: R2Config): cfg is Required<R2Config> {
  return Boolean(
    cfg.endpoint && cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey
  );
}

function createR2Client(cfg: Required<R2Config>) {
  return new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

async function listR2(
  client: S3Client,
  bucket: string
): Promise<{ key: string; lastModified?: Date }[]> {
  try {
    const res = await client.send(
      new ListObjectsCommand({
        Bucket: bucket,
      })
    );
    if (!res.Contents) return [];
    return res.Contents.map((item) => ({
      key: item.Key ?? "",
      lastModified: item.LastModified,
    })).filter((item) => item.key);
  } catch (error) {
    console.error("gallery: failed to list R2 bucket", bucket, error);
    return [];
  }
}

function buildPreviewMap(keys: { key: string }[]) {
  const map = new Map<string, string[]>();
  for (const { key } of keys) {
    const base = path.basename(key).toLowerCase();
    // Expecting e.g. "video_thumb_001.jpg"
    const match = base.match(/^(.*?)(?:_thumb_\d+)?\.[a-z0-9]+$/i);
    if (!match) continue;
    const logical = match[1];
    if (!map.has(logical)) map.set(logical, []);
    map.get(logical)!.push(key);
  }
  // Preserve stable ordering for previews
  map.forEach((list, key) => {
    map.set(
      key,
      list
        .slice()
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    );
  });
  return map;
}

async function collectFromR2() {
  const mediaCfg: R2Config = {
    endpoint: process.env.CLOUDFLARE_R2_S3_ENDPOINT,
    bucket: process.env.CLOUDFLARE_R2_BUCKET,
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  };
  const previewCfg: R2Config = {
    endpoint: process.env.CLOUDFLARE_R2_PREVIEWS_S3_ENDPOINT,
    bucket: process.env.CLOUDFLARE_R2_PREVIEWS_BUCKET,
    accessKeyId: process.env.CLOUDFLARE_R2_PREVIEWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_PREVIEWS_SECRET_ACCESS_KEY,
  };

  if (!hasValidConfig(mediaCfg)) return null;

  const client = createR2Client(mediaCfg);
  const mediaObjects = await listR2(client, mediaCfg.bucket);

  // Build preview map if previews bucket is configured
  let previewMap: Map<string, string[]> | null = null;
  const previewCandidatesFromMedia: { key: string }[] = [];
  mediaObjects.forEach(({ key }) => {
    const ext = path.extname(key).toLowerCase();
    const base = path.basename(key).toLowerCase();
    const isThumb = base.includes("_thumb_");
    if (PREVIEW_EXTS.has(ext) && isThumb) {
      previewCandidatesFromMedia.push({ key });
    }
  });
  if (previewCandidatesFromMedia.length) {
    previewMap = buildPreviewMap(previewCandidatesFromMedia);
  }

  if (hasValidConfig(previewCfg)) {
    const previewClient = createR2Client(previewCfg);
    const previews = await listR2(previewClient, previewCfg.bucket);
    const filtered = previews.filter((obj) =>
      PREVIEW_EXTS.has(path.extname(obj.key).toLowerCase())
    );
    const fromPreviewBucket = buildPreviewMap(filtered);
    // merge: prefer dedicated preview bucket over media bucket candidates
    if (previewMap) {
      fromPreviewBucket.forEach((list, key) => {
        previewMap!.set(key, list);
      });
    } else {
      previewMap = fromPreviewBucket;
    }
  }

  const items: ManifestItem[] = [];

  for (const { key, lastModified } of mediaObjects) {
    const ext = path.extname(key).toLowerCase();
    const base = path.basename(key).toLowerCase();
    const addedAt =
      lastModified instanceof Date
        ? lastModified.toISOString()
        : new Date(0).toISOString();

    // Skip preview assets we already merged
    if (PREVIEW_EXTS.has(ext) && base.includes("_thumb_")) {
      continue;
    }

    if (IMG_EXTS.has(ext)) {
      items.push({
        id: hashId(key),
        type: "image",
        src: key.replace(/^\/+/, ""),
        addedAt,
      });
      continue;
    }

    if (VID_EXTS.has(ext)) {
      const baseName = path.basename(key, ext).toLowerCase();
      const preview =
        previewMap?.get(baseName)?.map((p) => p.replace(/^\/+/, "")) ?? [];
      items.push({
        id: hashId(key),
        type: "video",
        src: key.replace(/^\/+/, ""),
        preview,
        addedAt,
      });
    }
  }

  return items;
}

// ---------- Local FS fallback ----------

async function statSafe(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function collectMedia(
  rootDir: string,
  prefix: string,
  type: "image" | "video",
  extensions: Set<string>,
  options?: { previewMap?: Map<string, string[]> }
) {
  const items: ManifestItem[] = [];
  const stack: Array<{ dir: string; rel: string }> = [
    { dir: rootDir, rel: prefix },
  ];

  while (stack.length) {
    const { dir, rel } = stack.pop()!;
    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const absolute = path.join(dir, entry.name);
      const relative = path
        .posix.join(rel, entry.name)
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

      if (entry.isDirectory()) {
        stack.push({ dir: absolute, rel: path.posix.join(rel, entry.name) });
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!extensions.has(ext)) continue;

      const stats = await statSafe(absolute);
      const addedAt =
        stats?.mtime instanceof Date
          ? stats.mtime.toISOString()
          : new Date(0).toISOString();

      const base = path.basename(relative, ext).toLowerCase();
      const preview =
        type === "video"
          ? options?.previewMap?.get(base)?.map((p) => p.replace(/^\/+/, ""))
          : undefined;

      items.push({
        id: hashId(relative),
        type,
        src: relative,
        ...(preview && preview.length ? { preview } : {}),
        addedAt,
      });
    }
  }

  return items;
}

async function collectLocalPreviews(previewsDir: string, prefix: string) {
  const keys: string[] = [];
  const stack: Array<{ dir: string; rel: string }> = [
    { dir: previewsDir, rel: prefix },
  ];

  while (stack.length) {
    const { dir, rel } = stack.pop()!;
    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const absolute = path.join(dir, entry.name);
      const relative = path
        .posix.join(rel, entry.name)
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

      if (entry.isDirectory()) {
        stack.push({ dir: absolute, rel: path.posix.join(rel, entry.name) });
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!PREVIEW_EXTS.has(ext)) continue;

      keys.push(relative);
    }
  }

  return buildPreviewMap(keys.map((key) => ({ key })));
}

export async function GET() {
  const publicDir = path.join(process.cwd(), "public");
  const imageDir = path.join(publicDir, "media", "images");
  const videoDir = path.join(publicDir, "media", "videos");
  const previewDir = path.join(publicDir, "media", "previews");

  const previewMap = await collectLocalPreviews(
    previewDir,
    "media/previews"
  ).catch(() => new Map<string, string[]>());

  // Prefer live R2 listing when configured, but always merge local media so dev/local files still appear.
  const [r2ItemsRaw, localImages = [], localVideos = []] = await Promise.all([
    collectFromR2().catch(() => null),
    collectMedia(imageDir, "media/images", "image", IMG_EXTS).catch(
      () => [] as ManifestItem[]
    ),
    collectMedia(videoDir, "media/videos", "video", VID_EXTS, {
      previewMap,
    }).catch(() => [] as ManifestItem[]),
  ]);
  const r2Items = r2ItemsRaw ?? [];

  const merged = new Map<string, ManifestItem>();
  // Prefer R2 entries when keys collide
  [...localImages, ...localVideos, ...r2Items].forEach((item) => {
    merged.set(item.id, item);
  });

  const items = Array.from(merged.values()).sort((a, b) =>
    a.addedAt < b.addedAt ? 1 : -1
  );

  return NextResponse.json({ items });
}
