'use client';

import { useState } from "react";
import Unlock from "./Unlock";
import Vault from "./Vault";
import type { EleuVault } from "../types";

export default function EleuthiaClient() {
  const [k, setK] = useState<CryptoKey | null>(null);
  const [v, setV] = useState<EleuVault | null>(null);

  if (!k || !v) {
    return (
      <div className="py-10">
        <Unlock onUnlock={(key, vault) => { setK(key); setV(vault); }} />
      </div>
    );
  }

  return (
    <div className="py-6">
      <Vault cryptoKey={k} initial={v} onLock={() => { setK(null); setV(null); }} />
    </div>
  );
}
