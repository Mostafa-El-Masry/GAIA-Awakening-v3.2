import CoreBrainClient from "./components/CoreBrainClient";

export const metadata = {
  title: "Core Brain · Daily Thread",
};

export default function CoreBrainPage() {
  return (
    <main className="min-h-screen bg-base-200">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <header className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-wide text-primary/80">
            GAIA Awakening · v3.0
          </p>
          <h1 className="text-2xl font-semibold text-base-content">
            Core Brain · Daily Thread
          </h1>
          <p className="max-w-2xl text-sm text-base-content/80">
            A simple, time-aware daily thread: one honest note for the day,
            small slots for the areas that matter, a weekly overview, a small
            &quot;GAIA&apos;s voice&quot; layer and meta-notes. v3.0 stops
            here on purpose so later versions can add real metrics, guidance
            and automation without changing this foundation.
          </p>
        </header>
        <CoreBrainClient />
      </div>
    </main>
  );
}
