import { Suspense } from 'react';
import LastUpdatedBadge from '../Shared/components/LastUpdatedBadge';
import ViewCounter from '../Shared/components/ViewCounter';
import SiteMapClient from './components/SiteMapClient';

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manual Site Map</h1>
          <p className="text-sm gaia-muted">Curated links to the important places.</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdatedBadge />
          <ViewCounter path="/Classic/SiteMap" />
        </div>
      </header>
      <Suspense fallback={<div className="text-sm gaia-muted">Loading&hellip;</div>}>
        <SiteMapClient />
      </Suspense>
    </main>
  );
}
