'use client';

import { useEffect, useState } from 'react';

import { getItem, removeItem, setItem, waitForUserStorage } from '@/lib/user-storage';

export default function PrivacyCard(){
  const [pin, setPin] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      setPin(getItem('settings_lock_pin') ?? '');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function savePin(){
    if (!pin) { removeItem('settings_lock_pin'); alert('PIN cleared'); return; }
    if (!/^\d{4}$/.test(pin)) { alert('PIN must be 4 digits'); return; }
    setItem('settings_lock_pin', pin);
    alert('PIN saved');
  }

  return (
    <section className="gaia-panel rounded-xl border p-4 shadow-sm">
      <div className="mb-2 font-semibold">Privacy & Lock</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="gaia-panel-soft flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
          <span className="text-sm">Lock PIN (4 digits)</span>
          <input className="gaia-input w-32 rounded border px-2 py-1 text-center" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} />
        </label>
      </div>

      <div className="mt-2">
        <button onClick={savePin} className="gaia-contrast rounded-lg border px-3 py-1.5 text-sm">Save</button>
      </div>
    </section>
  );
}
