import { Suspense } from 'react';
import LastUpdatedBadge from '../Shared/components/LastUpdatedBadge';
import ViewCounter from '../Shared/components/ViewCounter';
import AnnouncementsClient from './components/AnnouncementsClient';

export default function AnnouncementsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Announcements</h1>
          <p className="text-sm gaia-muted">Longer notes and bulletins.</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdatedBadge />
          <ViewCounter path="/Classic/Announcements" />
        </div>
      </header>
      <Suspense fallback={<div className="text-sm gaia-muted">Loading&hellip;</div>}>
        <AnnouncementsClient />
      </Suspense>
    </main>
  );
}
