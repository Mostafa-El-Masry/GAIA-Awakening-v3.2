'use client';

import { useMemo, useState } from "react";
import { files } from "../data/files";

function copy(text: string) { try { navigator.clipboard.writeText(text); } catch {} }

export default function DownloadCenterClient() {
  const [tag, setTag] = useState<string>("all");

  const tags = useMemo(() => {
    const s = new Set<string>();
    files.forEach(f => f.tags?.forEach(t => s.add(t)));
    return ["all", ...Array.from(s).sort()];
  }, []);

  const list = useMemo(() => {
    return tag === "all" ? files : files.filter(f => f.tags?.includes(tag));
  }, [tag]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm">Filter</label>
        <select value={tag} onChange={(e) => setTag(e.target.value)} className="gaia-input rounded-md border px-3 py-2 text-sm">
          {tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {list.map(f => (
          <article key={f.id} className="gaia-panel flex items-center justify-between rounded border p-4">
            <div>
              <div className="font-medium">{f.name}</div>
              <div className="gaia-muted text-xs">{f.size || ""}</div>
            </div>
            <div className="flex items-center gap-2">
              <a className="gaia-border rounded border px-3 py-1 text-sm" href={f.href} download>Download</a>
              <button className="gaia-border rounded border px-3 py-1 text-sm" onClick={() => copy(location.origin + f.href)}>Copy URL</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
