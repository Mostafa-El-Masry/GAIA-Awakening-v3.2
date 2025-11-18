'use client';

import { useEffect, useRef } from 'react';

const inputStyles =
  'gaia-input w-full rounded-2xl px-4 py-2 text-sm font-medium shadow-sm placeholder:gaia-muted focus:outline-none focus:ring-2 focus:ring-black/10';

export default function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/') {
        e.preventDefault();
        ref.current?.focus();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <input
      ref={ref}
      className={inputStyles}
      placeholder='Search... ( / )'
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
