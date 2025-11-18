export const PERMISSION_KEYS = [
  "apollo",
  "archives",
  "classic",
  "core",
  "dashboard",
  "eleuthia",
  "gallery",
  "health",
  "labs",
  "locked",
  "timeline",
  "wealth",
  "settings",
  "settingsAppearance",
  "settingsGallery",
  "settingsPermissions",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

const DEFAULT_ADMIN_EMAIL = "mostafa.abdelfattah2021@gmail.com";

export const PERMISSION_STORAGE_KEY = "gaia.permissions";

export type PermissionSet = Record<PermissionKey, boolean>;

export function getCreatorAdminEmail(): string {
  return (
    process.env.NEXT_PUBLIC_CREATOR_EMAIL ||
    process.env.NEXT_PUBLIC_CREATOR_ADMIN_EMAIL ||
    DEFAULT_ADMIN_EMAIL
  )
    .trim()
    .toLowerCase();
}

export function createEmptyPermissionSet(): PermissionSet {
  return PERMISSION_KEYS.reduce<PermissionSet>((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as PermissionSet);
}

export function createAdminPermissionSet(): PermissionSet {
  return PERMISSION_KEYS.reduce<PermissionSet>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as PermissionSet);
}

export function ensurePermissionShape(
  input: Partial<PermissionSet> | null | undefined
): PermissionSet {
  const base = createEmptyPermissionSet();
  if (!input) return base;
  for (const key of PERMISSION_KEYS) {
    base[key] = Boolean(input[key]);
  }
  return base;
}
