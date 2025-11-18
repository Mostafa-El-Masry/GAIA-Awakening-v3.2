"use client";

import type { Session } from "@supabase/supabase-js";

export type AuthMode = "login" | "signup";

export type StoredProfile = {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastLogoutAt?: string;
  lastMode?: AuthMode;
  sessionToken?: string | null;
};

export type AuthStatus = {
  email: string | null;
  session: string | null;
  loggedInAt?: string;
  loggedOutAt?: string;
};

type ProfileMap = Record<string, StoredProfile>;

const profiles: ProfileMap = {};

let activeProfileKey: string | null = null;
let status: AuthStatus | null = null;

function dispatch(name: string, detail: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

type NormalisedEmail = {
  key: string;
  original: string;
};

function normaliseEmail(email: string | null | undefined): NormalisedEmail | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return { original: trimmed, key: trimmed.toLowerCase() };
}

function ensureProfile(key: string, value: StoredProfile) {
  profiles[key] = value;
}

function emitStorageEvents(keys: string[]) {
  if (typeof window === "undefined") return;
  keys.forEach((key) => {
    try {
      window.dispatchEvent(
        new StorageEvent("storage", { key, newValue: null, oldValue: null })
      );
    } catch {
      dispatch("storage", { key });
    }
  });
}

function deriveNameFromSession(session: Session): string | null {
  const metadata = (session.user?.user_metadata ?? {}) as Record<string, unknown>;
  const candidates = [metadata.full_name, metadata.name, session.user?.email];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function recordUserLogin(input: {
  email: string | null;
  name?: string | null;
  mode: AuthMode;
  sessionToken?: string | null;
}): StoredProfile | null {
  const normalised = normaliseEmail(input.email);
  if (!normalised) return null;

  const now = new Date().toISOString();
  const existing = profiles[normalised.key];

  const profile: StoredProfile = {
    id: existing?.id ?? normalised.key,
    email: normalised.original,
    name: input.name?.trim() || existing?.name || null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastLoginAt: now,
    lastLogoutAt: existing?.lastLogoutAt,
    lastMode: input.mode,
    sessionToken: input.sessionToken ?? null,
  };

  ensureProfile(normalised.key, profile);

  status = {
    email: normalised.original,
    session: input.sessionToken ?? status?.session ?? null,
    loggedInAt: now,
  };
  activeProfileKey = normalised.key;

  dispatch("gaia:auth:login", { profile, status });
  emitStorageEvents(["gaia.auth.profiles", "gaia.auth.status"]);
  return profile;
}

export function recordUserLogout(explicitEmail?: string | null): AuthStatus | null {
  const normalised = normaliseEmail(explicitEmail ?? status?.email);
  if (normalised?.key && profiles[normalised.key]) {
    profiles[normalised.key] = {
      ...profiles[normalised.key],
      lastLogoutAt: new Date().toISOString(),
      sessionToken: null,
    };
  }
  const snapshot: AuthStatus | null = status
    ? { ...status, session: null, loggedOutAt: new Date().toISOString() }
    : null;
  status = snapshot;
  activeProfileKey = null;
  dispatch("gaia:auth:logout", { previousEmail: normalised?.original ?? null });
  emitStorageEvents(["gaia.auth.profiles", "gaia.auth.status"]);
  return snapshot;
}

export function getActiveStatus(): AuthStatus | null {
  return status;
}

export function getActiveProfile(): StoredProfile | null {
  if (!activeProfileKey) return null;
  return profiles[activeProfileKey] ?? null;
}

export function listProfiles(): StoredProfile[] {
  return Object.values(profiles);
}

export function getProfileByEmail(email: string | null | undefined): StoredProfile | null {
  const normalised = normaliseEmail(email);
  if (!normalised) return null;
  return profiles[normalised.key] ?? null;
}

export function isLoggedIn(): boolean {
  return Boolean(status?.email && status?.session);
}

export function ensureAuthFromSupabaseSession(session: Session | null): boolean {
  if (!session || !session.user) {
    if (status?.email || status?.session) {
      recordUserLogout();
      return true;
    }
    return false;
  }

  const normalised = normaliseEmail(session.user.email ?? null);
  if (!normalised) return false;

  const currentToken = session.access_token ?? session.refresh_token ?? null;
  if (status?.email === normalised.original && status?.session === currentToken) {
    return false;
  }

  const name = deriveNameFromSession(session);
  recordUserLogin({
    email: normalised.original,
    name,
    mode: "login",
    sessionToken: currentToken,
  });
  return true;
}

export type UseAuthSnapshot = {
  profile: StoredProfile | null;
  status: AuthStatus | null;
};

export function useAuthSnapshot(): UseAuthSnapshot {
  const { useEffect, useState } = require("react") as typeof import("react");
  const [snapshot, setSnapshot] = useState<UseAuthSnapshot>(() => ({
    profile: getActiveProfile(),
    status: getActiveStatus(),
  }));

  useEffect(() => {
    function update() {
      setSnapshot({
        profile: getActiveProfile(),
        status: getActiveStatus(),
      });
    }

    if (typeof window === "undefined") {
      return () => {};
    }

    const handler = () => update();

    window.addEventListener("gaia:auth:login", handler);
    window.addEventListener("gaia:auth:logout", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("gaia:auth:login", handler);
      window.removeEventListener("gaia:auth:logout", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return snapshot;
}
