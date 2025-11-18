export default function WhatsNewV21W1() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">What’s New · GAIA v2.1 — Week 1 (Merge‑Safe)</h1>
      <p className="mt-2 text-sm text-black/70">Dates: Jun 29 – Jul 5, 2026</p>
      <section className="mt-6 space-y-4 text-sm leading-6">
        <p>
          Added a parallel <strong>Apollo v2.1</strong> wrapper at <code>/apollo-v21</code> that links to your
          existing <em>Archives</em>, <em>Tower</em>, and <em>Academy</em> — nothing was moved or overwritten.
        </p>
        <ul className="list-disc pl-6">
          <li>Config file: <code>config/apollo.v21.json</code> — set link targets to your current routes.</li>
          <li>Zero theme changes this week. Tabs are Tailwind‑only.</li>
        </ul>
        <p className="opacity-70">
          Week 2 will inject the editor/preview into your current Tower topics without relocating files.
        </p>
      </section>
    </main>
  );
}
