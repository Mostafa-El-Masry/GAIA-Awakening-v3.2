export const metadata = {
  title: "GAIA Awakening · v3.0 — Core Brain & Daily Thread (Log)",
};

export default function V3LogPage() {
  return (
    <main className="min-h-screen bg-base-200">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <header className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-wide text-primary/80">
            What&apos;s New
          </p>
          <h1 className="text-2xl font-semibold text-base-content">
            GAIA Awakening · v3.0 — Core Brain &amp; Daily Thread
          </h1>
          <p className="max-w-2xl text-sm text-base-content/80">
            Internal log for the first Awakening version. This page lists the
            six weeks of v3.0 and what each one introduced, so you always know
            where this version stops and the next one should begin.
          </p>
        </header>

        <section className="mb-6 rounded-2xl bg-base-100 p-4 text-sm text-base-content shadow">
          <h2 className="mb-2 text-base font-semibold">Version envelope</h2>
          <ul className="list-disc space-y-1 pl-5 text-xs">
            <li>Project: GAIA Awakening</li>
            <li>Version: 3.0 — Core Brain &amp; Daily Thread</li>
            <li>Timeline: Mon Aug 10, 2026 → Sun Sep 20, 2026</li>
            <li>
              Focus: Give GAIA a time-aware core (days + weeks) with simple
              slots for Health, Wealth, Learning, Work and Memories.
            </li>
            <li>Closing date confirmed: Sun Sep 20, 2026.</li>
          </ul>
        </section>

        <div className="space-y-4 text-xs text-base-content/90">
          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">
              Week 1 · Foundations &amp; Skeleton
            </h2>
            <p className="mb-1 text-[11px] text-base-content/70">
              Mon Aug 10, 2026 → Sun Aug 16, 2026
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Defined what v3.0 means inside GAIA Awakening.</li>
              <li>
                Created the new Core Brain / Daily Thread route at{" "}
                <code className="rounded bg-base-200 px-1 py-0.5 text-[10px]">
                  /core-brain
                </code>
                .
              </li>
              <li>
                Introduced the first daily data model: one main note plus slots
                for health, wealth, learning, work and memories.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">
              Week 2 · Daily Thread UX &amp; Time Awareness
            </h2>
            <p className="mb-1 text-[11px] text-base-content/70">
              Mon Aug 17, 2026 → Sun Aug 23, 2026
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Shaped the Today card and vertical Daily Thread.</li>
              <li>
                Taught GAIA to talk about time in plain language: Today,
                Yesterday, Tomorrow, plus long-form dates.
              </li>
              <li>
                Added a manual &quot;End of day&quot; toggle so each day can be
                explicitly closed without automation.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">
              Week 3 · Weekly Rhythm &amp; Reflection Structure
            </h2>
            <p className="mb-1 text-[11px] text-base-content/70">
              Mon Aug 24, 2026 → Sun Aug 30, 2026
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Defined the six v3.0 weeks so days can roll up into a weekly
                structure.
              </li>
              <li>
                Added the weekly overview panel with three reflection questions:
                what went well, what drained you, and one thing to improve.
              </li>
              <li>Kept everything text-only and local to the browser.</li>
            </ul>
          </section>

          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">
              Week 4 · Cross-Component Hooks (no deep logic)
            </h2>
            <p className="mb-1 text-[11px] text-base-content/70">
              Mon Aug 31, 2026 → Sun Sep 6, 2026
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Locked in the daily hooks (health, wealth, learning, work,
                memories) as stable names.
              </li>
              <li>
                Documented which future components will talk to each hook:
                Health tracker, Wealth tracker, Citadel / Apollo, Work
                automations, Galleries.
              </li>
              <li>
                Kept logic simple so future versions can plug in without
                redesigning the Core Brain.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">
              Week 5 · Narrative &amp; Version-Level Logging
            </h2>
            <p className="mb-1 text-[11px] text-base-content/70">
              Mon Sep 7, 2026 → Sun Sep 13, 2026
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Added a small local &quot;GAIA&apos;s voice&quot; layer that
                mirrors daily and weekly notes back to you without using any AI
                calls.
              </li>
              <li>
                Introduced a meta-notes box so you can write how using the Daily
                Thread feels in practice.
              </li>
              <li>
                Created this v3.0 log page to capture the story of the version
                in one place.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">
              Week 6 · Stabilisation &amp; Closure of v3.0
            </h2>
            <p className="mb-1 text-[11px] text-base-content/70">
              Mon Sep 14, 2026 → Sun Sep 20, 2026
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Reviewed the Core Brain flow end-to-end: Today view, recent
                days thread, weekly overview and daily hooks.
              </li>
              <li>
                Confirmed naming and labels around the &quot;Core Brain / Daily
                Thread&quot; so later versions can build on top of it.
              </li>
              <li>
                Marked v3.0 as complete and documented what should be left for
                v3.1+ instead of forcing it into this version.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">What v3.0 can do</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Keep a daily thread with one main note and five simple slots for
                life areas (health, wealth, learning, work, memories).
              </li>
              <li>
                Show a short timeline of recent days and which of them are
                &quot;closed&quot;.
              </li>
              <li>
                Offer a weekly overview with steady questions and a gentle,
                local &quot;GAIA&apos;s voice&quot; reflection.
              </li>
              <li>
                Store everything locally in the browser so you can actually use
                it every day without any backend.
              </li>
              <li>
                Expose stable hooks so Health, Wealth, Learning, Work and
                Galleries can connect later without redesigning this page.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">
              Intentionally left for v3.1+
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Real metrics and numbers (steps, sleep, money amounts, study
                time, etc.).
              </li>
              <li>
                Visualisations or graphs for Health, Wealth or Learning inside
                the Core Brain.
              </li>
              <li>
                Automatic &quot;End of day&quot; prompts or reminders.
              </li>
              <li>
                Any AI-driven guidance; v3.0 only mirrors back what you already
                wrote.
              </li>
              <li>
                Deeper integration with other GAIA Awakening components (full
                cross-component wiring).
              </li>
            </ul>
          </section>

          <section className="rounded-2xl bg-base-100 p-4 shadow">
            <h2 className="mb-1 text-sm font-semibold">End of v3.0</h2>
            <p className="text-[11px] text-base-content/80">
              GAIA Awakening v3.0 ends on{" "}
              <span className="font-semibold">Sun Sep 20, 2026</span>. From this
              point on, any changes to the Core Brain / Daily Thread belong to
              v3.1+ and should treat this version as a stable foundation rather
              than something to rewrite.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
