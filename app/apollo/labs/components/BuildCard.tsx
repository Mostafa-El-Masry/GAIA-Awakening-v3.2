"use client";

import type { BuildEntry } from "../lib/labs";

type Props = {
  b: BuildEntry;
};

export default function BuildCard({ b }: Props) {
  const hasEmbed = Boolean(b.embedUrl);

  return (
    <article className="gaia-panel gaia-border rounded-lg border p-4 shadow-sm flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide gaia-muted">
            {b.trackTitle} - {b.trackId}
          </p>
          <h3 className="text-lg font-semibold">{b.title}</h3>
          <p className="text-xs gaia-muted">
            Concept {b.conceptId} - Node {b.nodeId}
          </p>
        </div>
        {typeof b.score === "number" && typeof b.total === "number" && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {b.score}/{b.total}
          </span>
        )}
      </header>

      {b.note && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap gaia-muted">
          {b.note}
        </p>
      )}

      {hasEmbed && (
        <div className="overflow-hidden rounded-lg border gaia-border">
          <iframe
            src={b.embedUrl}
            title={b.title}
            className="w-full aspect-video border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {b.completedAt && (
        <p className="text-xs gaia-muted">
          Completed {new Date(b.completedAt).toLocaleString()}
        </p>
      )}
    </article>
  );
}
