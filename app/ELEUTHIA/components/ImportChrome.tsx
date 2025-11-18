'use client';

import Button from "@/app/DesignSystem/components/Button";
import type { EleuEntry, EleuVault } from "../types";
import { uid } from "../lib/uid";

type Props = {
  onImport: (entries: EleuEntry[]) => Promise<void>;
};

function parseCSV(text: string): string[][] {
  // Basic CSV parser that handles quoted fields and commas/newlines
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } // escaped quote
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        cur.push(cell); cell = "";
        if (cur.length) rows.push(cur);
        cur = [];
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length || cur.length) { cur.push(cell); rows.push(cur); }
  return rows.filter(r => r.some(c => c.trim().length));
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

function toEntries(rows: string[][]): EleuEntry[] {
  if (!rows.length) return [];
  const header = rows[0].map(normalizeHeader);
  const nameIdx = header.findIndex(h => ["name","title"].includes(h));
  const urlIdx = header.findIndex(h => h.includes("url"));
  const userIdx = header.findIndex(h => h.includes("user"));
  const passIdx = header.findIndex(h => h.includes("pass"));
  const entries: EleuEntry[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const title = r[nameIdx] || (r[urlIdx] ? new URL(r[urlIdx]).hostname : "Imported");
    const url = r[urlIdx] || "";
    const username = r[userIdx] || "";
    const password = r[passIdx] || "";
    if (!username && !password && !url) continue; // skip empties
    entries.push({
      id: uid("e"),
      title,
      username,
      password,
      url,
      notes: "Imported from CSV",
      updatedAt: Date.now(),
    });
  }
  return entries;
}

export default function ImportChrome({ onImport }: Props) {
  async function handleFile(file: File) {
    const text = await file.text();
    const rows = parseCSV(text);
    const entries = toEntries(rows);
    await onImport(entries);
    alert(`Imported ${entries.length} entries.`);
  }

  return (
    <label className="inline-flex items-center gap-2">
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await handleFile(f);
          e.currentTarget.value = "";
        }}
      />
      <span className="inline-flex items-center">
        <Button>Import Chrome CSV</Button>
      </span>
    </label>
  );
}
