'use client';

import { useEffect, useState } from 'react';

import { readJSON, waitForUserStorage, writeJSON } from '@/lib/user-storage';

export default function SceneCard(){
  const [landing, setLanding] = useState<'/'|'/gallery'|'/dashboard'|'/search'>('/');
  const [introStyle, setIntroStyle] = useState<'gaia-only'|'gaia-glass'>('gaia-glass');

  useEffect(()=>{
    let cancelled = false;
    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      setLanding(readJSON('settings_landing', landing));
      setIntroStyle(readJSON('settings_introStyle', introStyle));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(()=>{
    writeJSON('settings_landing', landing);
    writeJSON('settings_introStyle', introStyle);
  }, [landing, introStyle]);

  return (
    <section className="gaia-panel rounded-xl border p-4 shadow-sm">
      <div className="mb-2 font-semibold">Scene preferences</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">Default landing page</span>
          <select value={landing} onChange={e=>setLanding(e.target.value as any)} className="gaia-input rounded border px-2 py-1 text-sm">
            <option value="/">Intro</option>
            <option value="/gallery">Gallery</option>
            <option value="/dashboard">Dashboard</option>
            <option value="/search">Search</option>
          </select>
        </label>

        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">Intro style</span>
          <select value={introStyle} onChange={e=>setIntroStyle(e.target.value as any)} className="gaia-input rounded border px-2 py-1 text-sm">
            <option value="gaia-only">GAIA only</option>
            <option value="gaia-glass">GAIA + glass search</option>
          </select>
        </label>
      </div>
    </section>
  );
}
