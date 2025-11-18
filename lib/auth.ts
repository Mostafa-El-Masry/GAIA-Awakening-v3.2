export const AUTH_COOKIE_NAME = "gaia.session";

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function buildAuthCookie(value: string) {
  return {
    name: AUTH_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

export function sanitizeRedirect(target: string | null | undefined) {
  if (!target) return "/";
  // Only allow relative paths within the app.
  if (!target.startsWith("/")) return "/";
  if (target.startsWith("//")) return "/";
  return target;
}
