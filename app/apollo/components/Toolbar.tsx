"use client";

// Primary button explicitly sets bg and text to avoid accidental overrides and ensure contrast
const primaryButton =
  "inline-flex items-center justify-center rounded-2xl border border-transparent bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-600";

export default function Toolbar({
  onNewSection,
}: {
  onNewSection: () => void;
}) {
  return (
    <div className="gaia-surface flex flex-wrap items-center gap-3 rounded-2xl border gaia-border px-4 py-3 shadow-sm">
      <button className={primaryButton} onClick={onNewSection}>
        New section (N)
      </button>
    </div>
  );
}

