"use client";

import { readJSON, removeItem, writeJSON } from "@/lib/user-storage";
import type { EleuVault } from "../types";

const META_KEY = "eleu.meta";
const VAULT_KEY = "eleu.vault";

export type EleuMeta = {
  salt: string;      // base64
  iterations: number;
  ver: 1;
};

export function readMeta(): EleuMeta | null {
  return readJSON<EleuMeta | null>(META_KEY, null);
}

export function writeMeta(m: EleuMeta) {
  writeJSON(META_KEY, m);
}

export function readVaultCipher(): { iv: string; ct: string } | null {
  return readJSON<{ iv: string; ct: string } | null>(VAULT_KEY, null);
}

export function writeVaultCipher(payload: { iv: string; ct: string }) {
  writeJSON(VAULT_KEY, payload);
}

export function hasVault(): boolean {
  return !!readMeta() && !!readVaultCipher();
}

export function clearAll() {
  removeItem(META_KEY);
  removeItem(VAULT_KEY);
}
