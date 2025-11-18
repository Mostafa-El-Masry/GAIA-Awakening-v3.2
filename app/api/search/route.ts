import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

    const indexPath = path.join(
      process.cwd(),
      "public",
      "jsons",
      "site-index.json"
    );
    let raw = "[]";
    try {
      raw = fs.readFileSync(indexPath, "utf8");
    } catch (e) {
      // If index missing, return empty results
      return NextResponse.json([]);
    }
    const items: Array<{ url: string; title?: string; content?: string }> =
      JSON.parse(raw || "[]");
    if (!q) return NextResponse.json([]);

    const results = items
      .map((it) => {
        const hay = (
          (it.title ?? "") +
          "\n" +
          (it.content ?? "")
        ).toLowerCase();
        const idx = hay.indexOf(q);
        const excerpt =
          idx >= 0
            ? hay.slice(Math.max(0, idx - 80), idx + q.length + 80)
            : undefined;
        return { url: it.url, title: it.title, excerpt };
      })
      .filter((r) => r.excerpt !== undefined)
      .slice(0, 50);

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  }
}
