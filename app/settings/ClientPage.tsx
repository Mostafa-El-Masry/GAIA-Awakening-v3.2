'use client';

import { useEffect, useMemo, useState } from 'react';
import BackupPanel from './sections/BackupPanel';
import ThemeCard from './sections/ThemeCard';
import SceneCard from './sections/SceneCard';
import AccessibilityCard from './sections/AccessibilityCard';
import PrivacyCard from './sections/PrivacyCard';
import DefaultsCard from './sections/DefaultsCard';

type Tab = 'appearance' | 'scene' | 'accessibility' | 'privacy' | 'defaults' | 'backup';

const TABS: { id: Tab; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'scene', label: 'Scene' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'privacy', label: 'Privacy & Lock' },
  { id: 'defaults', label: 'Defaults' },
  { id: 'backup', label: 'Backup' },
];

export default function SettingsPage(){
  const [tab, setTab] = useState<Tab>('appearance');

  // Deep-link support e.g. /settings#backup
  useEffect(()=>{
    const h = (typeof window !== 'undefined' && window.location.hash || '').replace('#','') as Tab;
    if (TABS.find(t => t.id === h)) setTab(h);
    const onHash = () => {
      const hh = (window.location.hash || '').replace('#','') as Tab;
      if (TABS.find(t => t.id === hh)) setTab(hh);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <main className="min-h-screen gaia-surface">
      {/* GAIA back to intro */}
      <div className="fixed left-4 top-4 z-40">
        <a href="/" className="gaia-glass-strong gaia-border inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold">⟵ GAIA</a>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <h1 className="text-2xl font-extrabold tracking-wide">Settings</h1>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map(t => (
            <a key={t.id}
               href={`#${t.id}`}
               onClick={e=>{ e.preventDefault(); setTab(t.id); history.replaceState(null,'',`#${t.id}`);}}
               className={'rounded-lg border px-3 py-1.5 text-sm ' + (tab===t.id ? 'gaia-contrast' : 'gaia-border')}>
              {t.label}
            </a>
          ))}
        </div>

        {/* Sections */}
        {tab==='appearance' && <ThemeCard />}
        {tab==='scene' && <SceneCard />}
        {tab==='accessibility' && <AccessibilityCard />}
        {tab==='privacy' && <PrivacyCard />}
        {tab==='defaults' && <DefaultsCard />}
        {tab==='backup' && <BackupPanel />}

        <p className="text-xs gaia-muted">All settings are saved locally (LocalStorage).</p>
      </div>
    </main>
  );
}
