"use client";

import { useEffect, useState } from "react";

import {
  PERMISSION_KEYS,
  type PermissionKey,
  type PermissionSet,
  getCreatorAdminEmail,
  PERMISSION_STORAGE_KEY,
  createAdminPermissionSet as sharedAdminSet,
  createEmptyPermissionSet as sharedEmptySet,
  ensurePermissionShape,
} from "@/config/permissions";
import { normaliseEmail } from "./strings";
import {
  readJSON,
  subscribe,
  waitForUserStorage,
} from "./user-storage";

export type { PermissionSet };

const STORAGE_KEY = PERMISSION_STORAGE_KEY;
const ADMIN_EMAIL = getCreatorAdminEmail();

let cachedPermissions: PermissionSet = sharedEmptySet();

function dispatchPermissionsEvent(detail: unknown) {
  try {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("gaia:permissions:update", { detail }));
  } catch {
    // ignore dispatch failures
  }
}

async function hydrate() {
  await waitForUserStorage();
  cachedPermissions = ensurePermissionShape(
    readJSON(STORAGE_KEY, sharedEmptySet())
  );
  dispatchPermissionsEvent({ permissions: cachedPermissions });
}

if (typeof window !== "undefined") {
  void hydrate();
  subscribe(({ key, value }) => {
    if (key !== STORAGE_KEY) return;
    try {
      const parsed = value ? (JSON.parse(value) as Partial<PermissionSet>) : null;
      cachedPermissions = ensurePermissionShape(parsed);
      dispatchPermissionsEvent({ permissions: cachedPermissions });
    } catch {
      cachedPermissions = sharedEmptySet();
      dispatchPermissionsEvent({ permissions: cachedPermissions });
    }
  });
}

export function isCreatorAdmin(email: string | null | undefined): boolean {
  const normalised = normaliseEmail(email);
  if (!normalised) return false;
  return normalised.toLowerCase() === ADMIN_EMAIL;
}

export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}

export function getAvailablePermissionKeys(): PermissionKey[] {
  return [...PERMISSION_KEYS];
}

export const createEmptyPermissionSet = sharedEmptySet;

export const createAdminPermissionSet = sharedAdminSet;

export function getCachedPermissionSet(): PermissionSet {
  return { ...cachedPermissions };
}

export function useCurrentPermissions(): PermissionSet {
  const [snapshot, setSnapshot] = useState<PermissionSet>(() => getCachedPermissionSet());

  useEffect(() => {
    const handler = () => setSnapshot(getCachedPermissionSet());
    if (typeof window === "undefined") return () => {};
    window.addEventListener("gaia:permissions:update", handler);
    return () => {
      window.removeEventListener("gaia:permissions:update", handler);
    };
  }, []);

  return snapshot;
}

export async function saveUserPermissionSet(input: {
  userId: string;
  permissions: PermissionSet;
}): Promise<void> {
  const response = await fetch("/api/admin/permissions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      detail || "Unable to update permissions. Check your admin credentials."
    );
  }
}
