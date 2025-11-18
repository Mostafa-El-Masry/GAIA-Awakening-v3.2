"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import LogoutButton from "@/app/components/LogoutButton";
import { useAuthSnapshot } from "@/lib/auth-client";
import { capitalizeWords, normaliseEmail } from "@/lib/strings";
import { getItem, waitForUserStorage } from "@/lib/user-storage";
import { getCreatorAdminEmail } from "@/config/permissions";

export default function UserDropdown() {
  const { profile, status } = useAuthSnapshot();
  const [open, setOpen] = useState(false);
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

  // saved profiles (loaded below) — declare early so hooks using it don't hit TDZ
  const [savedProfiles, setSavedProfiles] = useState<
    Array<{ email: string; name: string }>
  >([]);

  const { title, email, isLoggedIn } = useMemo(() => {
    const emailRaw = profile?.email ?? status?.email ?? null;
    const prettyEmail = emailRaw ? normaliseEmail(emailRaw) : null;
    const session = status?.session ?? null;

    // Prefer a saved profile name if available
    const saved = savedProfiles.find((p) => p.email === emailRaw);
    const isCreator = emailRaw?.toLowerCase() === getCreatorAdminEmail();
    const displayName = saved?.name || (isCreator ? "Creator" : prettyEmail);

    return {
      title: displayName ? capitalizeWords(displayName) : "User",
      email: prettyEmail,
      isLoggedIn: Boolean(prettyEmail && session),
    };
  }, [profile, status]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await waitForUserStorage();
        if (cancelled) return;
        const raw = getItem("gaia.saved-profiles");
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Array<{
              email: string;
              name: string;
            }>;
            setSavedProfiles(parsed || []);
            return;
          } catch {
            // ignore parse errors
          }
        }

        // fallback to localStorage if available
        if (typeof window !== "undefined") {
          const local = localStorage.getItem("gaia.saved-profiles.local");
          if (local) {
            try {
              const parsed = JSON.parse(local) as Array<{
                email: string;
                name: string;
              }>;
              setSavedProfiles(parsed || []);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <Link
        href="/auth/login"
        className="rounded-lg border gaia-border px-3 py-1.5 text-sm font-medium gaia-hover-soft"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => handleToggle(true)}
      onMouseLeave={() => handleToggle(false)}
    >
      <button
        type="button"
        className="rounded-lg border gaia-border px-3 py-1.5 text-sm font-semibold gaia-hover-soft transition"
        aria-haspopup="true"
        aria-expanded={open}
        onFocus={() => handleToggle(true)}
        onBlur={() => handleToggle(false)}
      >
        {title}
      </button>
      {open && isLoggedIn && (
        <div className="gaia-glass gaia-border absolute right-0 top-[calc(100%+0.5rem)] min-w-[220px] rounded-lg border p-3 shadow-lg z-50">
          <div className="mb-3 text-xs uppercase tracking-wide gaia-muted">
            Signed in as
          </div>
          <div className="text-sm font-semibold">{title}</div>
          {email && <div className="break-all text-xs gaia-muted">{email}</div>}
          <div className="mt-4">
            <LogoutButton className="w-full rounded-lg border gaia-border px-3 py-1.5 text-sm font-medium gaia-hover-soft" />
          </div>
        </div>
      )}
    </div>
  );
}
