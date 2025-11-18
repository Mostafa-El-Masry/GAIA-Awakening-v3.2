import { Suspense } from 'react';
import LastUpdatedBadge from '../Shared/components/LastUpdatedBadge';
import ViewCounter from '../Shared/components/ViewCounter';
import DirectoryClient from './components/DirectoryClient';

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dev Directory</h1>
          <p className="text-sm gaia-muted">Quick list of app routes for development.</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdatedBadge />
          <ViewCounter path="/Classic/Directory" />
        </div>
      </header>
      <Suspense fallback={<div className="text-sm gaia-muted">Loading&hellip;</div>}>
        <DirectoryClient />
      </Suspense>
    </main>
  );
}
