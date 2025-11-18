'use client';

import { useEffect, useState } from "react";
import Button from "@/app/DesignSystem/components/Button";
import { readMeta, readVaultCipher } from "../lib/storage";
import { deriveKey, decryptJSON } from "../lib/crypto";
import type { EleuVault } from "../types";

/**
 * EleuGate
 * - Asks for ELEUTHIA passphrase
 * - Validates by attempting to decrypt the vault payload
 * - On success, stores a session flag in sessionStorage ('eleu.session' = 'ok') for this tab
 * - Renders children while session is valid
 */
export default function EleuGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean>(false);
  const [pass, setPass] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    if (sessionStorage.getItem("eleu.session") === "ok") setOk(true);
  }, []);

  async function unlock() {
    setBusy(true); setErr(null);
    try {
      const meta = readMeta();
      const payload = readVaultCipher();
      if (!meta || !payload) throw new Error("Vault not found. Create it in ELEUTHIA first.");
      const key = await deriveKey(pass, meta.salt, meta.iterations);
      await decryptJSON<EleuVault>(key, payload);
      sessionStorage.setItem("eleu.session", "ok");
      setOk(true);
    } catch (e: any) {
      setErr("Invalid passphrase or vault missing.");
    } finally {
      setBusy(false);
    }
  }

  if (ok) return <>{children}</>;

  return (
    <div className="mx-auto max-w-sm space-y-3 rounded-lg border gaia-border p-4">
      <h3 className="font-semibold">Protected area</h3>
      <p className="text-sm gaia-muted">
        Enter your ELEUTHIA passphrase to unlock this section (in this tab). No data leaves your browser.
      </p>
      <input
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="ELEUTHIA passphrase"
        className="w-full rounded-md border gaia-border px-3 py-2 text-sm focus:outline-none gaia-focus"
      />
      {err && <div className="gaia-callout gaia-callout-negative p-2 text-sm">{err}</div>}
      <div className="flex items-center gap-2">
        <Button onClick={unlock} disabled={!pass || busy}>Unlock</Button>
        <span className="text-xs gaia-muted">Vault must exist already.</span>
      </div>
    </div>
  );
}

