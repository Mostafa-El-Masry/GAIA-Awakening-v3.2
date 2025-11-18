"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Result = {
  url: string;
  title?: string;
  excerpt?: string;
};

function SearchResults() {
  const params = useSearchParams();
  const q = params?.get("q") ?? "";
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return setResults([]);
    let canceled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        if (canceled) return;
        setResults(Array.isArray(data) ? data : []);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
    return () => {
      canceled = true;
    };
  }, [q]);

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Search results</h1>
      {!q && <div className="gaia-muted">Enter a search term above.</div>}
      {loading && <div className="gaia-muted">Searching…</div>}
      {!loading && results.length === 0 && q && (
        <div className="gaia-muted">No results found.</div>
      )}
      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li key={r.url} className="rounded-lg border gaia-border p-3">
            <Link href={r.url} className="text-sm font-semibold">
              {r.title ?? r.url}
            </Link>
            {r.excerpt && (
              <div className="mt-1 text-sm gaia-muted">{r.excerpt}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-lg px-4 py-6">
          <div className="gaia-muted">Loading...</div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
