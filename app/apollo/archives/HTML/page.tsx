import Link from "next/link";

export default function HTMLArchive() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">HTML</h1>
        <p className="text-sm gaia-muted">Starter notes with a “teachable” card that feeds the Academy (Tier 1).</p>
      </header>

      <section className="space-y-3">
        <article className="rounded-lg border gaia-border p-4">
          <div className="text-xs gaia-muted">Teachable</div>
          <h3 className="text-lg font-semibold">Intro to semantic HTML</h3>
          <p className="mt-1 text-sm gaia-text-default">
            A short, focused concept designed for the Academy loop (learn → quiz → build). Passing unlocks Tier 1 for HTML.
          </p>
          <p className="mt-2 text-xs gaia-muted">Appears in Academy automatically.</p>
        </article>
      </section>

      <footer className="text-xs gaia-muted">More sections to come later.</footer>
    </main>
  );
}
