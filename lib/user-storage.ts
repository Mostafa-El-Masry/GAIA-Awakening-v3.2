"use client";

import type {
  Session,
  RealtimeChannel,
  SupabaseClient,
} from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

export type StorageEventDetail = {
  key: string;
  value: string | null;
  previous: string | null;
};

type ReadyListener = () => void;
type StorageListener = (detail: StorageEventDetail) => void;

const STORAGE_TABLE = "user_storage";

let activeUserId: string | null = null;
let activeToken: string | null = null;
let ready = false;
let hydrating: Promise<void> | null = null;
let proxyDisabled = false;

const cache = new Map<string, string>();
let realtimeChannel: RealtimeChannel | null = null;
const readyListeners = new Set<ReadyListener>();
const storageListeners = new Set<StorageListener>();

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function resolveSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return getSupabaseClient();
  } catch (error) {
    console.warn("user-storage: Supabase client unavailable:", error);
    return null;
  }
}

function emit(detail: StorageEventDetail) {
  storageListeners.forEach((listener) => {
    try {
      listener(detail);
    } catch (error) {
      console.error("gaia:user-storage listener failed", error);
    }
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent<StorageEventDetail>("gaia:storage", { detail })
      );
    } catch {
      // Ignore dispatch failures (very old browsers/no window)
    }

    try {
      const event = new StorageEvent("storage", {
        key: detail.key,
        oldValue: detail.previous,
        newValue: detail.value,
      });
      window.dispatchEvent(event);
    } catch {
      // Some runtimes (JSDOM) don't expose constructable StorageEvent
    }
  }
}

function notifyReady() {
  readyListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("gaia:user-storage ready listener failed", error);
    }
  });
}

export function isUserStorageReady(): boolean {
  return ready;
}

export function onUserStorageReady(listener: ReadyListener): () => void {
  if (ready) {
    listener();
  }
  readyListeners.add(listener);
  return () => {
    readyListeners.delete(listener);
  };
}

export async function waitForUserStorage(): Promise<void> {
  if (ready) {
    return;
  }
  await new Promise<void>((resolve) => {
    const unsubscribe = onUserStorageReady(() => {
      unsubscribe();
      resolve();
    });
  });
}

async function fetchRows(
  userId: string,
  token?: string
): Promise<Map<string, string>> {
  // Prefer server-side proxy to fetch user storage. Falls back to direct
  // Supabase client only if server proxy is not available.
  if (typeof window === "undefined") return new Map();

  const map = new Map<string, string>();

  try {
    if (typeof fetch !== "undefined" && !proxyDisabled) {
      const headers: Record<string, string> = {};
      if (token) headers["authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/user-storage", { headers });
      if (!res.ok) {
        throw new Error(`Failed to fetch user storage: ${res.status}`);
      }
      const json = await res.json();
      const data = json?.storage ?? {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") map.set(key, value);
      }
      return map;
    }
  } catch (err) {
    proxyDisabled = true;
    // If proxy fails, fall back to client Supabase call so the app remains functional.
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(
      "user-storage: server proxy fetch failed, falling back to client supabase:",
      errMsg
    );
  }

  const supabase = resolveSupabaseClient();
  if (!supabase) {
    console.warn(
      "user-storage: Supabase client not configured; continuing with empty storage fallback."
    );
    return map;
  }

  try {
    const result = await supabase
      .from(STORAGE_TABLE)
      .select("key,value")
      .eq("user_id", userId);
    if (result.error) throw result.error;
    for (const row of result.data ?? []) {
      if (!row || typeof row.key !== "string") continue;
      if (typeof row.value !== "string") continue;
      map.set(row.key, row.value);
    }
    return map;
  } catch (err) {
    // If both proxy and direct client call fail, return empty map and let app continue
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(
      "user-storage: client supabase call also failed, continuing with empty storage:",
      errMsg
    );
    return map;
  }
}

function diffAndApply(next: Map<string, string>) {
  const previous = new Map(cache);
  cache.clear();

  for (const [key, value] of next.entries()) {
    cache.set(key, value);
  }

  const keys = new Set<string>([...previous.keys(), ...next.keys()]);

  keys.forEach((key) => {
    const prev = previous.get(key) ?? null;
    const curr = next.get(key) ?? null;
    if (prev !== curr) {
      emit({ key, value: curr, previous: prev });
    }
  });
}

function emitClear() {
  const previous = new Map(cache);
  cache.clear();
  previous.forEach((_value, key) => {
    emit({ key, value: null, previous: previous.get(key) ?? null });
  });
}

function cleanupRealtimeSubscription() {
  if (realtimeChannel) {
    const supabase = resolveSupabaseClient();
    if (supabase) {
      void supabase.removeChannel(realtimeChannel);
    }
    realtimeChannel = null;
  }
}

function subscribeToRealtime(userId: string) {
  if (realtimeChannel) {
    cleanupRealtimeSubscription();
  }

  const supabase = resolveSupabaseClient();
  if (!supabase) {
    console.warn(
      "user-storage: Supabase client unavailable; realtime sync disabled."
    );
    return;
  }

  realtimeChannel = supabase
    .channel(`user-storage:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: STORAGE_TABLE,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const key =
          (payload.new as { key?: string } | null)?.key ??
          (payload.old as { key?: string } | null)?.key;
        if (!key) return;
        const previous = cache.get(key) ?? null;
        const nextValue =
          typeof (payload.new as { value?: string } | null)?.value === "string"
            ? ((payload.new as { value?: string } | null)?.value as string)
            : null;
        if (nextValue === null) {
          cache.delete(key);
        } else {
          cache.set(key, nextValue);
        }
        emit({ key, value: nextValue, previous });
      }
    )
    .subscribe();
}

export async function hydrateUserStorage(
  session: Session | null
): Promise<void> {
  const userId = session?.user?.id ?? null;

  if (!userId) {
    if (activeUserId !== null || cache.size > 0) {
      activeUserId = null;
      emitClear();
    }
    cleanupRealtimeSubscription();
    activeToken = null;
    ready = true;
    notifyReady();
    return;
  }

  if (userId === activeUserId && ready && !hydrating) {
    return;
  }

  hydrating ??= (async () => {
    try {
      activeToken = session?.access_token ?? null;
      const rows = await fetchRows(userId, activeToken ?? undefined);
      activeUserId = userId;
      diffAndApply(rows);
      subscribeToRealtime(userId);
      ready = true;
      notifyReady();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Unable to hydrate user storage:", errMsg);
      ready = true;
      notifyReady();
    } finally {
      hydrating = null;
    }
  })();

  await hydrating;
}

async function persist(key: string, value: string | null) {
  if (!activeUserId) return;

  // Try to use server proxy for persistence. If activeToken is not available
  // or the proxy fails, fall back to direct client Supabase call.
  if (activeToken && !proxyDisabled) {
    try {
      if (value === null) {
        const url = new URL("/api/user-storage", window.location.origin);
        url.searchParams.set("key", key);
        const res = await fetch(url.toString(), {
          method: "DELETE",
          headers: { authorization: `Bearer ${activeToken}` },
        });
        if (!res.ok) throw new Error(`delete failed ${res.status}`);
        return;
      }

      const res = await fetch("/api/user-storage", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error(`upsert failed ${res.status}`);
      return;
    } catch (err) {
      proxyDisabled = true;
      console.warn(
        "user-storage: server proxy persist failed, falling back to client supabase:",
        err
      );
    }
  }

  // fallback to client-side Supabase direct call
  const supabase = resolveSupabaseClient();
  if (!supabase) {
    console.warn(
      "user-storage: Supabase client unavailable; skipping direct persistence."
    );
    return;
  }

  if (value === null) {
    const { error } = await supabase
      .from(STORAGE_TABLE)
      .delete()
      .match({ user_id: activeUserId, key });
    if (error)
      console.warn(
        "Failed to delete user storage value; continuing without persistence:",
        formatError(error)
      );
    return;
  }
  const { error } = await supabase
    .from(STORAGE_TABLE)
    .upsert([{ user_id: activeUserId, key, value }], {
      onConflict: "user_id,key",
    });
  if (error)
    console.warn(
      "Failed to persist user storage value; continuing without persistence:",
      formatError(error)
    );
}

export function getItem(key: string): string | null {
  return cache.get(key) ?? null;
}

export function setItem(key: string, value: string) {
  const previousValue = cache.get(key) ?? null;
  if (previousValue === value) {
    return;
  }
  cache.set(key, value);
  emit({ key, value, previous: previousValue });
  void persist(key, value);
}

export function removeItem(key: string) {
  const previousValue = cache.get(key) ?? null;
  if (!cache.has(key)) {
    return;
  }
  cache.delete(key);
  emit({ key, value: null, previous: previousValue });
  void persist(key, null);
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T) {
  setItem(key, JSON.stringify(value));
}

export function subscribe(listener: StorageListener): () => void {
  storageListeners.add(listener);
  return () => {
    storageListeners.delete(listener);
  };
}

export type StorageSnapshot = Record<string, string>;

export function snapshotStorage(): StorageSnapshot {
  const entries: [string, string][] = [];
  cache.forEach((value, key) => entries.push([key, value]));
  return Object.fromEntries(entries);
}
