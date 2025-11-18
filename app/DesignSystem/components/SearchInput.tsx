'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDesign } from '../context/DesignProvider';

export default function SearchInput() {
  const { search } = useDesign();
  const [q, setQ] = useState('');
  const router = useRouter();

  let style = 'w-full px-3 py-2 border text-sm focus:outline-none gaia-focus';
  if (search === 'rounded') {
    style += ' rounded-md gaia-border';
  } else if (search === 'pill') {
    style += ' rounded-full gaia-border';
  } else {
    style += ' border-0 border-b gaia-border rounded-none';
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const v = q.trim();
      if (v.length) router.push(`/Classic/SiteMap?q=${encodeURIComponent(v)}`);
    }
  }

  return (
    <input
      placeholder="Searchâ€¦"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      onKeyDown={onKeyDown}
      className={style}
      aria-label="Global search"
    />
  );
}

