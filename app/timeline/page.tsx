import TimelineWrapper from "./components/TimelineWrapper";

export default function TimelinePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <p className="text-sm gaia-muted">
          Top → bottom events with keyboard (j/k) and quick jumps.
        </p>
      </header>
      <TimelineWrapper />
    </main>
  );
}
