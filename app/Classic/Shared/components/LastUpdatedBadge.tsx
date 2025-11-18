'use client';

import { useEffect, useState } from 'react';

export default function LastUpdatedBadge({ date }: { date?: string }) {
  const [d, setD] = useState<string>("");
  useEffect(() => {
    const source = date ? new Date(date) : new Date(document.lastModified || Date.now());
    setD(source.toLocaleString());
  }, [date]);
  return (
    <span className="gaia-panel-soft gaia-muted inline-flex items-center rounded border px-2 py-1 text-xs">
      Last updated: {d || "—"}
    </span>
  );
}
