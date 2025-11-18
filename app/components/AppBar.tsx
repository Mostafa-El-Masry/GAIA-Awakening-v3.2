"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import LogoutButton from "./LogoutButton";
import { useAuthSnapshot } from "@/lib/auth-client";
import { capitalizeWords, normaliseEmail } from "@/lib/strings";
import { getItem, waitForUserStorage } from "@/lib/user-storage";
import { getCreatorAdminEmail } from "@/config/permissions";

/**
 * Slim App Bar
 */
export default function AppBar() {
  const pathname = usePathname();
  const { profile, status } = useAuthSnapshot();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<
    Array<{ email: string; name: string }>
  >([]);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCloseTimer = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };
  const handleToggle = (value: boolean) => {
    if (value) {
      clearCloseTimer();
      setOpen(true);
    } else {
      clearCloseTimer();
      closeTimeout.current = setTimeout(() => {
        setOpen(false);
        closeTimeout.current = null;
      }, 250);
    }
  };

  const { title, email, isLoggedIn } = useMemo(() => {
    const emailRaw = profile?.email ?? status?.email ?? null;
    const prettyEmail = emailRaw ? normaliseEmail(emailRaw) : null;
    const session = status?.session ?? null;

    // Try to get saved profile name first
    const savedProfile = savedProfiles.find((p) => p.email === emailRaw);
    let displayName: string | undefined = savedProfile?.name ?? undefined;

    // Fallback to "Creator" for admin, or email if nothing saved
    if (!displayName) {
      const isCreator = emailRaw?.toLowerCase() === getCreatorAdminEmail();
      displayName = isCreator ? "Creator" : prettyEmail ?? undefined;
    }

    const name = displayName ? capitalizeWords(displayName) : null;

    return {
      title: name ?? "User",
      email: prettyEmail,
      isLoggedIn: Boolean(prettyEmail && session),
    };
  }, [profile, status, savedProfiles]);

  const router = useRouter();
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
  };

  useEffect(() => {
    try {
      const hideNav = pathname === "/" || pathname.startsWith("/auth");
      if (hideNav) {
        document.body.classList.remove("has-navbar");
        return;
      }
      document.body.classList.add("has-navbar");
      return () => {
        document.body.classList.remove("has-navbar");
      };
    } catch {
      // ignore DOM access errors outside the browser
    }
  }, [pathname]);

  useEffect(() => {
    setMounted(true);

    // Load saved profiles
    const loadProfiles = async () => {
      try {
        await waitForUserStorage();
        const raw = getItem("gaia.saved-profiles");
        if (raw) {
          const profiles = JSON.parse(raw);
          setSavedProfiles(profiles);
        }
      } catch {
        // Ignore errors loading profiles
      }
    };

    loadProfiles();
  }, []);

  if (!mounted || pathname === "/" || pathname.startsWith("/auth")) return null;

  return (
    <header className="gaia-glass-strong gaia-border fixed inset-x-0 top-0 z-50 border-b border backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-3 px-3">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gaia-intro.svg"
            onError={(event) => {
              const el = event.currentTarget as HTMLImageElement;
              el.src = "/gaia-intro.png";
            }}
            alt="GAIA"
            className="h-9 w-auto"
          />
          <span className="sr-only">GAIA Home</span>
        </Link>

        <div className="flex-1 flex items-center gap-3">
          <form
            className="w-full max-w-lg"
            onSubmit={submitSearch}
            role="search"
          >
            <label htmlFor="gaia-search" className="sr-only">
              Search the site
            </label>
            <div className="relative">
              <input
                id="gaia-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search site..."
                className="w-full rounded-lg border gaia-border px-3 py-2 text-sm bg-white/6 placeholder:gaia-muted"
              />
            </div>
          </form>

          <div className="flex-shrink-0" />
        </div>

        <div
          className="relative"
          onMouseEnter={() => isLoggedIn && handleToggle(true)}
          onMouseLeave={() => isLoggedIn && handleToggle(false)}
        >
          {isLoggedIn ? (
            <>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border gaia-border px-3 py-1.5 text-sm font-semibold gaia-hover-soft transition"
                aria-haspopup="true"
                aria-expanded={open}
                onFocus={() => handleToggle(true)}
                onBlur={() => handleToggle(false)}
              >
                {/* Avatar with initials */}
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                  {title
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <span>{title}</span>
              </button>
              {open && (
                <div className="gaia-glass gaia-border absolute right-0 top-[calc(100%+0.5rem)] min-w-[240px] rounded-lg border p-3 shadow-lg z-50">
                  <div className="mb-3 flex items-center gap-3 pb-3 border-b gaia-border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                      {title
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {title}
                      </div>
                      {email && (
                        <div className="break-all text-xs gaia-muted truncate">
                          {email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <LogoutButton className="w-full rounded-lg border gaia-border px-3 py-1.5 text-sm font-medium gaia-hover-soft" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg border gaia-border px-3 py-1.5 text-sm font-medium gaia-hover-soft"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
