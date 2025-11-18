"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import NoScroll from "@/components/NoScroll";
import UserDropdown from "@/components/UserDropdown";
import { useAuthSnapshot } from "@/lib/auth-client";
import { isCreatorAdmin, useCurrentPermissions } from "@/lib/permissions";
import type { PermissionKey } from "@/config/permissions";

interface NavLink {
  href: string;
  label: string;
  permission: PermissionKey;
}

/**
 * New GAIA Home (v2.0)
 * - Circular layout with links around central symbol
 * - Responsive radius based on viewport
 */
export default function HomePage() {
  const [radius, setRadius] = useState<number>(280);
  const { profile, status } = useAuthSnapshot();
  const email = profile?.email ?? status?.email ?? null;
  const permissions = useCurrentPermissions();
  const isAdmin = useMemo(() => isCreatorAdmin(email), [email]);

  // All links in one array for circular layout
  const links: NavLink[] = [
    { href: "/gallery", label: "Gallery", permission: "gallery" },
    { href: "/apollo", label: "Apollo", permission: "apollo" },
    { href: "/timeline", label: "Timeline", permission: "timeline" },
    { href: "/health-awakening", label: "Health", permission: "health" },
    { href: "/wealth", label: "Wealth", permission: "wealth" },
    { href: "/dashboard", label: "Dashboard", permission: "dashboard" },
    // Archives moved under Apollo; remove from main intro links
    { href: "/settings", label: "Settings", permission: "settings" },
  ];
  const visibleLinks = isAdmin
    ? links
    : links.filter((link) => Boolean(permissions[link.permission]));

  return (
    <main className="fixed inset-0 flex items-center justify-center no-nav">
      <NoScroll />
      <div className="absolute right-6 top-6 z-50 hidden md:block">
        <UserDropdown />
      </div>
      <div className="relative mx-auto max-w-6xl w-full">
        {/* Circle Container */}
        <div className="relative h-[640px] sm:h-[720px] lg:h-[800px]">
          {/* Centered Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <img src="/gaia-intro-1.png" alt="GAIA" className="h-96 w-auto" />
          </div>

          {/* Links positioned in a circle */}
          {visibleLinks.map((link: NavLink, i: number) => {
            const angle = i * (360 / visibleLinks.length) * (Math.PI / 180);

            const rawX = radius * Math.cos(angle);
            const rawY = radius * Math.sin(angle);
            const x = rawX.toFixed(3);
            const y = rawY.toFixed(3);
            const style = {
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            };

            return (
              <Link
                key={link.href}
                href={link.href}
                className="gaia-glass octagon-link absolute left-1/2 top-1/2 w-32 px-6 py-3 text-center text-lg font-medium backdrop-blur transition whitespace-nowrap"
                style={style}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
