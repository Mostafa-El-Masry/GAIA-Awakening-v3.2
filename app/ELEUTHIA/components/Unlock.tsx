'use client';

import { useEffect, useState } from "react";
import Button from "@/app/DesignSystem/components/Button";
import { makeSalt, deriveKey, encryptJSON, decryptJSON } from "../lib/crypto";
import { readMeta, writeMeta, writeVaultCipher, readVaultCipher, hasVault } from "../lib/storage";
import type { EleuVault } from "../types";

/**
 * Unlock / Create screen
 */
export default function Unlock({ onUnlock }: { onUnlock: (key: CryptoKey, vault: EleuVault) => void }) {
  const [exists, setExists] = useState<boolean>(false);
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setExists(hasVault());
  }, []);

  async function handleUnlock() {
    setBusy(true); setError(null);
    try {
      const meta = readMeta();
      const cipher = readVaultCipher();
      if (!meta || !cipher) throw new Error("No vault found.");
      const key = await deriveKey(pass, meta.salt, meta.iterations);
      const vault = await decryptJSON<EleuVault>(key, cipher);
      onUnlock(key, vault);
    } catch (e: any) {
      setError("Invalid passphrase or corrupted vault.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!pass || pass !== confirm) {
      setError("Passwords do not match."); return;
    }
    setBusy(true); setError(null);
    try {
      const salt = await makeSalt();
      const iterations = 250_000;
      const key = await deriveKey(pass, salt, iterations);
      const emptyVault: EleuVault = { entries: [], updatedAt: Date.now() };
      const payload = await encryptJSON(key, emptyVault);
      writeMeta({ salt, iterations, ver: 1 });
      writeVaultCipher(payload);
      onUnlock(key, emptyVault);
    } catch {
      setError("Failed to create vault.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border gaia-border p-6">
      <h2 className="text-xl font-semibold">ELEUTHIA</h2>
      <p className="mt-1 text-sm gaia-muted">
        Zero-knowledge, local-first vault. Data is encrypted in your browser.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block text-sm">
          Passphrase
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="mt-1 w-full rounded-md border gaia-border px-3 py-2 text-sm focus:outline-none gaia-focus"
          />
        </label>

        {!exists && (
          <label className="block text-sm">
            Confirm passphrase
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border gaia-border px-3 py-2 text-sm focus:outline-none gaia-focus"
            />
          </label>
        )}

        {error && <div className="gaia-callout gaia-callout-negative p-2 text-sm">{error}</div>}

        <div className="flex items-center gap-3">
          {exists ? (
            <Button onClick={handleUnlock} disabled={busy || !pass}>Unlock</Button>
          ) : (
            <Button onClick={handleCreate} disabled={busy || !pass || !confirm}>Create vault</Button>
          )}
          {exists ? (
            <span className="text-xs gaia-muted">Enter your passphrase to unlock.</span>
          ) : (
            <span className="text-xs gaia-muted">Keep this passphrase safe. Thereâ€™s no recovery.</span>
          )}
        </div>
      </div>
    </div>
  );
}

