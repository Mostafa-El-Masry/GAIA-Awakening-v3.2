'use client';

import { useEffect, useState } from 'react';

import { readJSON, waitForUserStorage, writeJSON } from '@/lib/user-storage';

export default function AccessibilityCard(){
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [underlineLinks, setUnderlineLinks] = useState(false);

  useEffect(()=>{
    let cancelled = false;
    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      setReduceMotion(readJSON('settings_reduceMotion', reduceMotion));
      setHighContrast(readJSON('settings_highContrast', highContrast));
      setUnderlineLinks(readJSON('settings_underlineLinks', underlineLinks));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(()=>{
    writeJSON('settings_reduceMotion', reduceMotion);
    writeJSON('settings_highContrast', highContrast);
    writeJSON('settings_underlineLinks', underlineLinks);
  }, [reduceMotion, highContrast, underlineLinks]);

  return (
    <section className="gaia-panel rounded-xl border p-4 shadow-sm">
      <div className="mb-2 font-semibold">Accessibility</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">Reduce motion</span>
          <input type="checkbox" checked={reduceMotion} onChange={e=>setReduceMotion(e.target.checked)} />
        </label>
        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">High-contrast text</span>
          <input type="checkbox" checked={highContrast} onChange={e=>setHighContrast(e.target.checked)} />
        </label>
        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
          <span className="text-sm">Underline links</span>
          <input type="checkbox" checked={underlineLinks} onChange={e=>setUnderlineLinks(e.target.checked)} />
        </label>
      </div>
    </section>
  );
}
