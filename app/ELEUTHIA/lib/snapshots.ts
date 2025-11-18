"use client";

import { readJSON, writeJSON } from "@/lib/user-storage";

export type EncryptedPayload = { iv: string; ct: string };

const SNAP_KEY = "eleu.snapshots"; // array of { id, name, createdAt, payload }

export type Snapshot = {
  id: string;
  name: string;
  createdAt: number;
  payload: EncryptedPayload;
};

function read(): Snapshot[] {
  return readJSON<Snapshot[]>(SNAP_KEY, []);
}

function write(list: Snapshot[]) {
  writeJSON(SNAP_KEY, list);
}

export function listSnapshots(): Snapshot[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function addSnapshot(s: Snapshot) {
  const list = read();
  list.unshift(s);
  write(list);
}

export function deleteSnapshot(id: string) {
  const list = read().filter(s => s.id !== id);
  write(list);
}
