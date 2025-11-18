"use client";

import LabsClient from "./components/LabsClient";

export default function ApolloLabsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] gaia-muted">
          Apollo Labs
        </p>
        <h1 className="text-3xl font-semibold gaia-strong">Experiments & builds</h1>
        <p className="text-sm gaia-muted max-w-2xl">
          Labs now lives inside Apollo alongside Academy and Archives. Review your builds and
          open the experimental systems here.
        </p>
      </header>

      <section className="gaia-panel gaia-border rounded-2xl border p-4 sm:p-6 shadow-sm">
        <LabsClient />
      </section>
    </main>
  );
}
