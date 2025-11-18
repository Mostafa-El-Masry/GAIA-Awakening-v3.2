'use client';

import { useMemo, useRef, useState } from "react";
import Button from "@/app/DesignSystem/components/Button";
import { listSnapshots, addSnapshot, deleteSnapshot, type Snapshot } from "@/app/ELEUTHIA/lib/snapshots";
import { readVaultCipher, writeVaultCipher } from "@/app/ELEUTHIA/lib/storage";

function uid(prefix = "snap") {
  const r = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36);
  return `${prefix}_${t}${r}`;
}

export default function BackupsClient() {
  const [snaps, setSnaps] = useState<Snapshot[]>(listSnapshots());
  const [name, setName] = useState("");

  function refresh() {
    setSnaps(listSnapshots());
  }

  function createSnapshot() {
    const payload = readVaultCipher();
    if (!payload) {
      alert("No vault found. Unlock or create ELEUTHIA first."); return;
    }
    const s: Snapshot = { id: uid(), name: name || "Snapshot", createdAt: Date.now(), payload };
    addSnapshot(s);
    setName("");
    refresh();
  }

  function restoreSnapshot(s: Snapshot) {
    if (!confirm("Restore this snapshot? Your current encrypted vault will be replaced.")) return;
    writeVaultCipher(s.payload);
    alert("Snapshot restored. Unlock ELEUTHIA again to see its content.");
  }

  function exportEncrypted() {
    const payload = readVaultCipher();
    if (!payload) { alert("No vault found."); return; }
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ELEUTHIA-encrypted-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const fileRef = useRef<HTMLInputElement>(null);
  function onImportClick() { fileRef.current?.click(); }
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload.iv || !payload.ct) throw new Error("Invalid file");
      writeVaultCipher(payload);
      alert("Encrypted backup imported. Unlock ELEUTHIA to view.");
    } catch {
      alert("Import failed. Choose a valid ELEUTHIA encrypted JSON.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Backups (ELEUTHIA)</h2>
          <p className="text-xs gaia-muted">Encrypted-only backups live here.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportEncrypted}>Export current (encrypted)</Button>
          <Button onClick={onImportClick} className="opacity-90">Import encrypted</Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
        </div>
      </header>

      <div className="rounded-lg border gaia-border p-4">
        <div className="flex items-end gap-2">
          <label className="text-sm">
            Snapshot name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Before-reset"
              className="mt-1 block w-64 rounded-md border gaia-border px-3 py-2 text-sm focus:outline-none gaia-focus"
            />
          </label>
          <Button onClick={createSnapshot}>Create snapshot</Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {snaps.length === 0 ? (
            <div className="rounded border gaia-border p-6 text-center text-sm gaia-muted">No snapshots yet.</div>
          ) : (
            snaps.map((s) => (
              <article key={s.id} className="rounded border gaia-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs gaia-muted">{new Date(s.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => restoreSnapshot(s)} className="opacity-90">Restore</Button>
                    <Button onClick={() => { if (confirm("Delete this snapshot?")) { deleteSnapshot(s.id); refresh(); } }} className="opacity-75">Delete</Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

