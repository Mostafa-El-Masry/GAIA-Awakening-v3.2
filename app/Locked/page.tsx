'use client';

import EleuGate from "../ELEUTHIA/components/EleuGate";

export default function LockedDemoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Locked (ELEUTHIA-gated demo)</h1>
        <p className="text-sm gaia-muted">This route demonstrates gating a section behind your ELEUTHIA passphrase.</p>
      </header>

      <EleuGate>
        <section className="rounded-lg border gaia-border p-4">
          <h2 className="text-lg font-semibold">Secret notes</h2>
          <p className="mt-1 text-sm gaia-text-default">
            You’re in. Anything inside <code>{"<EleuGate/>"}</code> renders only after a successful unlock in this tab.
          </p>
          <ul className="mt-2 list-inside list-disc text-sm gaia-text-default">
            <li>Use this component to protect sensitive pages (e.g., private docs, download mirrors, API keys).</li>
            <li>It validates by decrypting your existing ELEUTHIA vault (zero-knowledge).</li>
            <li>Session persists per tab until you close or clear it.</li>
          </ul>
        </section>
      </EleuGate>
    </main>
  );
}
