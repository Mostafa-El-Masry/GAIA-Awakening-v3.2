/* Writes /public/jsons/gallery-manifest.json by scanning /public/media/** */
const fs = require("fs");
const path = require("path");
const IMG = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".avif",
]);
const VID = new Set([".mp4", ".webm", ".mov", ".mkv", ".avi"]);
function hashId(p) {
  let h = 0,
    i = 0;
  while (i < p.length) {
    h = ((h << 5) - h + p.charCodeAt(i++)) | 0;
  }
  return Math.abs(h).toString(36);
}
function walk(dir) {
  let out = [];
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      e.isDirectory() ? (out = out.concat(walk(p))) : out.push(p);
    }
  } catch {}
  return out;
}
(function main() {
  const base = process.cwd(),
    media = path.join(base, "public", "media");
  const files = [
    ...walk(path.join(media, "images")),
    ...walk(path.join(media, "videos")),
  ];
  const prevDir = path.join(media, "previews");
  const items = files
    .map((abs) => {
      const rel = abs
        .split(path.join(base, "public"))
        .pop()
        .replace(/\\\\/g, "/");
      const ext = path.extname(abs).toLowerCase();
      if (IMG.has(ext))
        return {
          id: hashId(rel),
          type: "image",
          src: rel,
          addedAt: new Date().toISOString(),
        };
      if (VID.has(ext)) {
        const baseName = path.basename(abs, ext);
        const preview = [];
        for (let i = 1; i <= 6; i++) {
          const name = `${baseName}_thumb_${String(i).padStart(3, "0")}.jpg`;
          if (fs.existsSync(path.join(prevDir, name)))
            preview.push(`/media/previews/${name}`);
        }
        return {
          id: hashId(rel),
          type: "video",
          src: rel,
          preview,
          addedAt: new Date().toISOString(),
        };
      }
      return null;
    })
    .filter(Boolean);
  const manifestDir = path.join(base, "public", "jsons");
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(
    path.join(manifestDir, "gallery-manifest.json"),
    JSON.stringify({ items }, null, 2)
  );
  console.log(
    "Wrote public/jsons/gallery-manifest.json with",
    items.length,
    "items."
  );
})();
