"use client";

import Link from "next/link";
import React from "react";

type Props = {
  href: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
};

export default function LinkCard({ href, title, description, icon }: Props) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl p-4 sm:p-5 gaia-panel-soft hover:shadow-md transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white/90 group-hover:bg-white/10">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold gaia-strong">{title}</h3>
          {description ? (
            <p className="text-xs gaia-muted max-w-xs mt-1">{description}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
