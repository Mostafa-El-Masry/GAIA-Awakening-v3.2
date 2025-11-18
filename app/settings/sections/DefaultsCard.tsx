'use client';

import { removeItem } from '@/lib/user-storage';

export default function DefaultsCard(){
  function resetSettings(){
    const keys = [
      'settings_theme_mode','settings_accent','settings_fontScale','settings_density','settings_glass',
      'settings_landing','settings_introStyle',
      'settings_reduceMotion','settings_highContrast','settings_underlineLinks',
    ];
    for(const k of keys) removeItem(k);
    alert('Settings reset (kept your data).');
  }

  return (
    <section className="gaia-panel rounded-xl border p-4 shadow-sm">
      <div className="mb-2 font-semibold">Defaults</div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={resetSettings} className="gaia-contrast rounded-lg border px-3 py-1.5 text-sm">Reset Settings</button>
      </div>
    </section>
  );
}
