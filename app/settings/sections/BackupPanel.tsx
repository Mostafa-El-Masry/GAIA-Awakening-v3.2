'use client';

"use client";

import { useRef, useState } from "react";

import Button from "@/app/DesignSystem/components/Button";
import {
  removeItem,
  setItem,
  snapshotStorage,
  waitForUserStorage,
} from "@/lib/user-storage";

type Snapshot = Record<string, string | null>;

function snapshotUserStorage(): Snapshot {
  return snapshotStorage();
}

function downloadSnapshot(data: Snapshot) {
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `gaia-backup-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ExportPanel() {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        onClick={async () => {
          await waitForUserStorage();
          const snapshot = snapshotUserStorage();
          downloadSnapshot(snapshot);
          const total = Object.keys(snapshot).length;
          setStatus(`Backup created (${total} keys).`);
        }}
      >
        Download backup
      </Button>
      {status && <div className="text-xs gaia-muted">{status}</div>}
    </div>
  );
}

function ImportPanel() {
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid backup payload.');
      }
      if (typeof window === 'undefined') return;
      await waitForUserStorage();
      if (mode === 'replace') {
        const current = snapshotUserStorage();
        Object.keys(current).forEach((key) => removeItem(key));
      }
      let count = 0;
      Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
        try {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          setItem(key, stringValue);
          count += 1;
        } catch {
          // Ignore entries that cannot be serialised
        }
      });
      setMessage(`Imported ${count} keys via ${mode} mode.`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import backup.');
      setMessage(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="backup-mode"
            value="merge"
            checked={mode === 'merge'}
            onChange={() => setMode('merge')}
          />
          Merge
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="backup-mode"
            value="replace"
            checked={mode === 'replace'}
            onChange={() => setMode('replace')}
          />
          Replace existing data
        </label>
        <Button
          type="button"
          onClick={() => {
            setMessage(null);
            setError(null);
            fileInputRef.current?.click();
          }}
          className="shrink-0"
        >
          Choose backup file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleFile(file);
              event.target.value = '';
            }
          }}
        />
      </div>
      <p className="text-xs gaia-muted">
        Merge keeps existing keys. Replace clears local data before writing the backup.
      </p>
      {message && <div className="gaia-callout gaia-callout-info text-sm">{message}</div>}
      {error && <div className="gaia-callout gaia-callout-negative text-sm">{error}</div>}
    </div>
  );
}

export default function BackupPanel() {
  return (
    <section className="space-y-4">
      <div className="gaia-panel rounded-xl border p-4 shadow-sm">
        <div className="mb-2">
          <h2 className="text-lg font-extrabold tracking-wide">Backup</h2>
          <p className="text-sm gaia-muted">Export your GAIA data (LocalStorage) as JSON.</p>
        </div>
        <ExportPanel />
      </div>

      <div className="gaia-panel rounded-xl border p-4 shadow-sm">
        <div className="mb-2">
          <h2 className="text-lg font-extrabold tracking-wide">Restore</h2>
          <p className="text-sm gaia-muted">Import a backup file using merge or replace mode.</p>
        </div>
        <ImportPanel />
      </div>
    </section>
  );
}
