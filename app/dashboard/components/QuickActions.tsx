'use client';

export default function QuickActions(){
  return (
    <section className="gaia-panel rounded-xl border p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold">Quick actions</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a href="/timeline" className="gaia-border rounded-lg border px-3 py-1.5 text-sm">Add Timeline Event</a>
        <a href="/health" className="gaia-border rounded-lg border px-3 py-1.5 text-sm">Add Health Log</a>
        <a href="/sync" className="gaia-border rounded-lg border px-3 py-1.5 text-sm">Open Sync</a>
              </div>
    </section>
  );
}
