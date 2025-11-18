"use client";

import { useCallback, useTransition } from "react";

import { endSession } from "@/app/auth/login/actions";
import { recordUserLogout } from "@/lib/auth-client";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  busyLabel?: string;
};

export default function LogoutButton({
  className,
  label = "Log out",
  busyLabel = "Logging out...",
}: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = useCallback(() => {
    recordUserLogout();
    startTransition(async () => {
      try {
        if (isSupabaseConfigured) {
          const client = getSupabaseClient();
          await client.auth.signOut();
        }
      } catch {
        // ignore sign-out failures; we'll still clear local state
      }
      try {
        await endSession();
      } catch {
        try {
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        } catch {
          // ignore navigation fallback failure
        }
      }
    });
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        "rounded-lg border gaia-border px-3 py-1.5 text-sm font-medium gaia-hover-soft transition"
      }
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending ? busyLabel : label}
    </button>
  );
}
