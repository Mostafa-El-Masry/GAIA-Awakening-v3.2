'use client';

import { useEffect, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/user-storage';

const KEY = "gaia.classic.views";

function readAll(): Record<string, number> {
  return readJSON<Record<string, number>>(KEY, {});
}
function writeAll(obj: Record<string, number>) {
  writeJSON(KEY, obj);
}

export default function ViewCounter({ path }: { path: string }) {
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    const obj = readAll();
    obj[path] = (obj[path] || 0) + 1;
    setCount(obj[path]);
    writeAll(obj);
  }, [path]);
  return (
    <span className="gaia-panel-soft gaia-muted inline-flex items-center rounded border px-2 py-1 text-xs">
      Views (local): {count}
    </span>
  );
}
