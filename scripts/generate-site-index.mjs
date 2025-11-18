import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");
const OUT = path.join(ROOT, "public", "jsons", "site-index.json");

function walk(dir) {
  const items = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      items.push(...walk(full));
    } else if (stat.isFile()) {
      const ext = path.extname(name).toLowerCase();
      if ([".tsx", ".ts", ".jsx", ".js", ".md"].includes(ext)) {
        items.push(full);
      }
    }
  }
  return items;
}

function extractText(content) {
  // Remove JSX tags
  let s = content.replace(/<[^>]+>/g, " ");
  // Remove curly braces content
  s = s.replace(/\{[^}]+\}/g, " ");
  // Remove import/export lines
  s = s.replace(/^\s*(import|export)[^\n]*\n/gm, " ");
  // Remove excessive whitespace
  return s.replace(/\s+/g, " ").trim();
}

function toUrl(filePath) {
  // derive app-relative path
  const rel = path.relative(APP_DIR, filePath).replace(/\\/g, "/");
  // remove /page.* or /route.* or file names
  const parts = rel.split("/");
  // remove file name if it's page.* or route.* or layout.*
  const file = parts[parts.length - 1];
  if (
    file.startsWith("page") ||
    file.startsWith("route") ||
    file.startsWith("layout")
  ) {
    parts.pop();
  } else {
    // remove extension
    parts[parts.length - 1] = parts[parts.length - 1].replace(/\.[^/.]+$/, "");
  }
  // filter out segment groups like (tabs)
  const cleaned = parts.filter((p) => p && !p.startsWith("("));
  const url = "/" + cleaned.join("/");
  return url === "/" ? "/" : url.replace(/\/+/g, "/");
}

function buildIndex() {
  if (!fs.existsSync(APP_DIR)) {
    console.error("No app directory — nothing to index.");
    fs.writeFileSync(OUT, "[]", "utf8");
    return;
  }
  const files = walk(APP_DIR);
  const items = [];
  for (const f of files) {
    try {
      const raw = fs.readFileSync(f, "utf8");
      const txt = extractText(raw);
      const url = toUrl(f);
      const titleMatch =
        raw.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
        raw.match(/export const metadata = .*title:\s*['\"]([^'\"]+)['\"]/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;
      items.push({ url, title, content: txt });
    } catch (e) {
      // ignore
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2), "utf8");
  console.log("Wrote", OUT, "entries:", items.length);
}

// Run when executed directly
try {
  buildIndex();
} catch (e) {
  console.error(e);
  process.exit(1);
}
