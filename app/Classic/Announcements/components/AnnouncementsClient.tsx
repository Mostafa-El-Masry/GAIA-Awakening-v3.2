'use client';

import { posts } from "../data/posts";

export default function AnnouncementsClient() {
  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <article key={p.id} className="rounded border gaia-border p-4">
          <header className="flex items-center justify-between">
            <h3 className="font-semibold">{p.title}</h3>
            <div className="text-xs gaia-muted">{new Date(p.date).toLocaleDateString()}</div>
          </header>
          <p className="mt-2 text-sm gaia-text-default whitespace-pre-wrap">{p.body}</p>
        </article>
      ))}
    </div>
  );
}
