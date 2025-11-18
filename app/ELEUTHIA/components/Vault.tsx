'use client';

import { useMemo, useRef, useState } from "react";
import Button from "@/app/DesignSystem/components/Button";
import type { EleuEntry, EleuVault } from "../types";
import { encryptJSON, decryptJSON } from "../lib/crypto";
import { writeVaultCipher, readVaultCipher } from "../lib/storage";
import { uid } from "../lib/uid";
import ImportChrome from "./ImportChrome";

function copy(text: string) {
  try { navigator.clipboard.writeText(text); } catch {}
}

type Props = {
  cryptoKey: CryptoKey;
  initial: EleuVault;
  onLock: () => void;
};

function hostname(url?: string) {
  try { return url ? new URL(url).hostname : ""; } catch { return ""; }
}

export default function Vault({ cryptoKey, initial, onLock }: Props) {
  const [vault, setVault] = useState<EleuVault>(initial);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<EleuEntry | null>(null);
  const [site, setSite] = useState<string>("all");
  const [onlyPw, setOnlyPw] = useState<boolean>(false);

  async function persist(next: EleuVault) {
    const payload = await encryptJSON(cryptoKey, next);
    writeVaultCipher(payload);
  }

  function allSites() {
    const s = new Set<string>();
    vault.entries.forEach(e => { const h = hostname(e.url); if (h) s.add(h); });
    return ["all", ...Array.from(s).sort()];
  }

  function filtered(entries: EleuEntry[]) {
    let list = entries;
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((e) =>
        (e.title && e.title.toLowerCase().includes(s)) ||
        (e.username && e.username.toLowerCase().includes(s)) ||
        (e.url && e.url.toLowerCase().includes(s)) ||
        (e.notes && e.notes.toLowerCase().includes(s))
      );
    }
    if (site !== "all") {
      list = list.filter(e => hostname(e.url) === site);
    }
    if (onlyPw) {
      list = list.filter(e => !!e.password);
    }
    return list;
  }

  async function saveEntry(e: EleuEntry) {
    const list = [...vault.entries];
    const idx = list.findIndex((x) => x.id === e.id);
    if (idx >= 0) list[idx] = e; else list.unshift(e);
    const next = { entries: list, updatedAt: Date.now() };
    setVault(next);
    await persist(next);
    setEditing(null);
  }

  async function importEntries(entries: EleuEntry[]) {
    if (!entries.length) return;
    const list = [...entries, ...vault.entries];
    const next = { entries: list, updatedAt: Date.now() };
    setVault(next);
    await persist(next);
  }

  function onExport() {
    // Export encrypted payload as JSON file
    const payload = readVaultCipher();
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ELEUTHIA-encrypted-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const entries = useMemo(() => filtered(vault.entries), [vault.entries, q, site, onlyPw]);
  const sites = useMemo(() => allSites(), [vault.entries]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">ELEUTHIA</h2>
          <p className="gaia-muted text-xs">Zero-knowledge Â· local-first Â· AES-GCM 256</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportChrome onImport={importEntries} />
          <Button onClick={onExport} className="opacity-90">Export (encrypted)</Button>
          <a href="/ELEUTHIA/Backups" className="text-sm underline hover:no-underline">Backups â†’</a>
          <Button onClick={onLock} className="opacity-75">Lock</Button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="title, user, urlâ€¦"
            className="gaia-input mt-1 block w-64 rounded-md border px-3 py-2 text-sm focus:outline-none gaia-focus"
          />
        </label>
        <label className="text-sm">
          Site
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="gaia-input mt-1 block w-56 rounded-md border px-3 py-2 text-sm focus:outline-none gaia-focus"
          >
            {sites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyPw} onChange={(e) => setOnlyPw(e.target.checked)} />
          Has password
        </label>
        <Button onClick={() => { setQ(""); setSite("all"); setOnlyPw(false); }} className="opacity-75">Reset</Button>
        <Button onClick={() => setEditing({ id: uid("e"), title: "", username: "", password: "", url: "", notes: "", updatedAt: Date.now() })}>
          Add entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="gaia-panel gaia-muted rounded border p-6 text-center text-sm">No entries match.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {entries.map((e) => (
            <article key={e.id} className="gaia-panel rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{e.title}</h3>
                <div className="gaia-muted text-xs">{new Date(e.updatedAt).toLocaleString()}</div>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {e.username && <div><span className="gaia-muted">User:</span> {e.username}</div>}
                {e.url && (
                  <div className="truncate">
                    <span className="gaia-muted">URL:</span>{" "}
                    <a className="underline hover:no-underline" href={e.url} target="_blank" rel="noreferrer">{e.url}</a>
                  </div>
                )}
                {e.notes && <div className="whitespace-pre-wrap gaia-text-default">{e.notes}</div>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {e.password && <Button onClick={() => copy(e.password!)} className="opacity-90">Copy password</Button>}
                <Button onClick={() => setEditing(e)} className="opacity-90">Edit</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="gaia-panel rounded-lg border p-4">
          <h4 className="font-medium">{editing.id.startsWith("e_") ? "New entry" : "Edit entry"}</h4>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm">
              Title
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="gaia-input mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none gaia-focus" />
            </label>
            <label className="text-sm">
              Username
              <input value={editing.username ?? ""} onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                className="gaia-input mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none gaia-focus" />
            </label>
            <label className="text-sm">
              Password
              <input type="password" value={editing.password ?? ""} onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                className="gaia-input mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none gaia-focus" />
            </label>
            <label className="text-sm">
              URL
              <input value={editing.url ?? ""} onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                className="gaia-input mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none gaia-focus" />
            </label>
          </div>
          <label className="mt-3 block text-sm">
            Notes
            <textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              rows={4}
              className="gaia-input mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none gaia-focus" />
          </label>

          <div className="mt-4 flex items-center gap-2">
            <Button onClick={() => saveEntry({ ...editing, updatedAt: Date.now() })} disabled={!editing.title}>Save</Button>
            <Button onClick={() => setEditing(null)} className="opacity-75">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

