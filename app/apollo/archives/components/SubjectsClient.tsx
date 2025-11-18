'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { subjects } from "../data/subjects";
import { isTeachable } from "../lib/teachables";

export default function SubjectsClient() {
  const [teachableCount, setTeachableCount] = useState<Record<string, number>>({});

  function refresh() {
    const map: Record<string, number> = {};
    subjects.forEach(s => {
      map[s.id] = s.lessons.reduce((acc, l) => acc + (isTeachable(l.id) ? 1 : 0), 0);
    });
    setTeachableCount(map);
  }

  useEffect(() => {
    refresh();
    function onAny() { refresh(); }
    window.addEventListener("storage", onAny);
    return () => window.removeEventListener("storage", onAny);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {subjects.map(s => (
        <Link key={s.id} href={`/Archives/${s.id}`} className="rounded-lg border gaia-border p-4 transition gaia-hover-soft">
          <div className="text-xs gaia-muted">Track: {s.trackTitle}</div>
          <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
          <div className="mt-2 text-xs gaia-muted">{s.lessons.length} lessons</div>
          <div className="mt-1 text-xs gaia-muted">{teachableCount[s.id] || 0} marked teachable</div>
        </Link>
      ))}
    </div>
  );
}
