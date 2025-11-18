"use client";

import Link from "next/link";

const entries = [
  {
    title: "Archives & Ask",
    desc: "Study transcripts, ask the assistant, and keep longform notes.",
    href: "/apollo",
    action: "Open Apollo",
    tag: "Research",
    accent: "from-secondary/20 via-transparent to-transparent",
  },
  {
    title: "Review builds",
    desc: "Private embeds, annotations, and build timelines.",
    href: "/apollo/labs",
    action: "Open Labs",
    tag: "Labs",
    accent: "from-warning/20 via-transparent to-transparent",
  },
  {
    title: "Safety",
    desc: "Vault setup, backups, CSV import, and recovery tooling.",
    href: "/ELEUTHIA",
    action: "Open ELEUTHIA",
    tag: "Security",
    accent: "from-success/20 via-transparent to-transparent",
  },
  {
    title: "Appearance",
    desc: "Personal themes, primitives, and typography controls.",
    href: "/Settings",
    action: "Open Settings",
    tag: "Personalize",
    accent: "from-info/20 via-transparent to-transparent",
  },
  {
    title: "Gallery",
    desc: "Online carousel with swipe-ready, curated drops.",
    href: "/Gallery",
    action: "Open Gallery",
    tag: "Showcase",
    accent: "from-error/20 via-transparent to-transparent",
  },
  {
    title: "GAIA Intro",
    desc: "Phase 5 overview, placement, and onboarding materials.",
    href: "/Archives/GAIA/Intro",
    action: "Open Intro",
    tag: "Orientation",
    accent: "from-primary/20 via-transparent to-transparent",
  },
];

export default function Entry() {
  return (
    <section className="space-y-6 rounded-2xl border border-base-200 dark:border-base-700 bg-base-100 dark:bg-base-900 p-6 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-base-content/50">
          Entry points
        </p>
        <h2 className="text-2xl font-semibold text-base-content">
          Choose your lane
        </h2>
        <p className="text-sm text-base-content/70">
          Each surface is tuned for a different part of the workflow. Pick one
          to jump straight in.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {entries.map((entry) => (
          <article
            key={entry.href}
            className="group relative overflow-hidden rounded-xl border border-base-300 dark:border-base-600 bg-base-50 dark:bg-base-800 p-5 transition hover:shadow-md hover:border-base-400 dark:hover:border-base-500"
          >
            <div
              className={`pointer-events-none absolute inset-0 opacity-30 blur-2xl bg-gradient-to-br ${entry.accent}`}
            />
            <div className="relative z-10 flex flex-col gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-base-300 dark:border-base-600 px-3 py-1 text-[11px] uppercase tracking-wide text-base-content/70">
                  {entry.tag}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-base-content">
                  {entry.title}
                </h3>
                <p className="text-sm text-base-content/70">{entry.desc}</p>
              </div>
              <div>
                <Link href={entry.href} className="block">
                  <button className="w-full rounded-lg bg-primary text-primary-content px-4 py-2 font-semibold hover:bg-primary/90 transition">
                    <span className="flex items-center justify-between">
                      <span>{entry.action}</span>
                      <span aria-hidden="true">{"→"}</span>
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="text-xs text-base-content/50">
        Tip: use global search (Cmd+K / Ctrl+K) to hop anywhere instantly.
      </p>
    </section>
  );
}
