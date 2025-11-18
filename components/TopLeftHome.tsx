"use client";
import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { GaiaWordmark } from "./Brand";
export function TopLeftHome() {
  const router = useContext(AppRouterContext);
  const pathname = useContext(PathnameContext);
  if (!router) return null;
  if (!pathname) return null;
  if (pathname === "/") return null;
  return (
    <div className="fixed left-4 top-4 z-50 md:left-6 md:top-6">
      <Link
        href="/"
        aria-label="Back to GAIA Intro"
        className="gaia-glass-strong gaia-border gaia-strong inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
      >
        <div
          className="gaia-border gaia-strong grid h-10 w-10 place-items-center rounded-full border bg-gradient-to-br from-sky-500/25 to-cyan-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] md:h-11 md:w-11"
          aria-hidden
        >
          <Image src="/gaia-intro.svg" width={40} height={40} alt="GAIA Logo" />
        </div>
        <span className="sr-only text-xs font-bold tracking-[0.14em] md:not-sr-only md:ml-2">
          <GaiaWordmark />
        </span>
      </Link>
    </div>
  );
}
