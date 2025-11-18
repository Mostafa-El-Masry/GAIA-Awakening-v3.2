'use client';

import { devRoutes } from "../data/routes";

export default function DirectoryClient() {
  const dev = process.env.NODE_ENV === "development";
  if (!dev) {
    return (
      <div className="gaia-callout gaia-callout-warning p-4 text-sm">
        Dev-only directory is hidden in production builds.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {devRoutes.map((r) => (
        <a key={r.path} href={r.path} className="rounded border gaia-border p-3 transition gaia-hover-soft">
          <div className="font-medium">{r.path}</div>
          {r.note && <div className="text-xs gaia-muted">{r.note}</div>}
        </a>
      ))}
    </div>
  );
}
