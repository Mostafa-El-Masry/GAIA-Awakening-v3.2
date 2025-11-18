'use client';

import { useEffect, useState } from 'react';

import { snapshotStorage, waitForUserStorage } from '@/lib/user-storage';

type SnapshotMap = Record<string, string | null>;

function scan(prefix:string, keys:string[]){ return keys.filter(k=>k.startsWith(prefix)); }

function parseValue(key:string, snapshot: SnapshotMap){
  const raw = snapshot[key];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function latestByDate(keys:string[], snapshot: SnapshotMap){
  let best:any=null, bestKey='';
  for(const k of keys){
    const v = parseValue(k, snapshot) || {};
    const d = new Date(v?.date || v?.updatedAt || v?.createdAt || 0).getTime();
    if (!best || d > best.when){ best = { when:d, key:k, v }; bestKey=k; }
  }
  return best ? { key: bestKey, v: best.v } : null;
}

export default function OverviewCards(){
  const [data, setData] = useState<any>(null);

  useEffect(()=>{
    let cancelled = false;
    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      const snapshot = snapshotStorage();
      const keys = Object.keys(snapshot);
      const apolloKeys = scan('apollo_', keys);
      const healthKeys = scan('health_', keys);
      const wealthKeys = scan('wealth_', keys);
      const galleryKeys = scan('gallery_', keys);
      const labsKeys = scan('labs_', keys);
      const timelineKeys = scan('timeline_', keys);

      const latestApollo = latestByDate(apolloKeys, snapshot);
      const latestHealth = latestByDate(healthKeys, snapshot);
      const latestWealth = latestByDate(wealthKeys, snapshot);
      const latestGallery = latestByDate(galleryKeys, snapshot);
      const latestLabs = latestByDate(labsKeys, snapshot);
      const latestTimeline = latestByDate(timelineKeys, snapshot);

    // wealth snapshot try
      let wealthSnapshot = 0;
      for(const k of wealthKeys){
        const v = parseValue(k, snapshot);
        if (typeof v==='number') wealthSnapshot += v;
        if (v && typeof v==='object' && typeof v.balance==='number') wealthSnapshot += v.balance;
        if (v && v.total) wealthSnapshot += Number(v.total)||0;
      }

    // health snapshot try (weight/glucose)
      let weight = null, glucose = null;
      for(const k of healthKeys){
        const v = parseValue(k, snapshot);
        if (v?.weight) weight = v.weight;
        if (v?.glucose) glucose = v.glucose;
        if (Array.isArray(v?.weights) && v.weights.length) weight = v.weights[v.weights.length-1]?.kg ?? weight;
        if (Array.isArray(v?.glucoseLogs) && v.glucoseLogs.length) glucose = v.glucoseLogs[v.glucoseLogs.length-1]?.mgdl ?? glucose;
      }

      const galleryCount = galleryKeys.length;

      setData({
        latestApollo, latestHealth, latestWealth, latestGallery, latestLabs, latestTimeline,
        wealthSnapshot, weight, glucose, galleryCount,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <a href="/apollo" className="gaia-panel rounded-xl border p-4 shadow-sm">
        <div className="text-sm gaia-muted">Apollo</div>
        <div className="mt-1 text-2xl font-extrabold">Last note</div>
        <div className="mt-1 text-sm opacity-80 truncate">{data?.latestApollo?.key || '—'}</div>
      </a>

      <a href="/gallery" className="gaia-panel rounded-xl border p-4 shadow-sm">
        <div className="text-sm gaia-muted">Gallery</div>
        <div className="mt-1 text-2xl font-extrabold">Items</div>
        <div className="mt-1 text-sm opacity-80">{data?.galleryCount ?? 0}</div>
      </a>

      <a href="/health" className="gaia-panel rounded-xl border p-4 shadow-sm">
        <div className="text-sm gaia-muted">Health</div>
        <div className="mt-1 text-2xl font-extrabold">Weight / Glucose</div>
        <div className="mt-1 text-sm opacity-80">{data?.weight ?? '—'} kg • {data?.glucose ?? '—'} mg/dL</div>
      </a>

      <a href="/wealth" className="gaia-panel rounded-xl border p-4 shadow-sm">
        <div className="text-sm gaia-muted">Wealth</div>
        <div className="mt-1 text-2xl font-extrabold">Snapshot</div>
        <div className="mt-1 text-sm opacity-80">{(data?.wealthSnapshot ?? 0).toLocaleString()}</div>
      </a>

      <a href="/apollo/labs" className="gaia-panel rounded-xl border p-4 shadow-sm">
        <div className="text-sm gaia-muted">Labs</div>
        <div className="mt-1 text-2xl font-extrabold">Last</div>
        <div className="mt-1 text-sm opacity-80 truncate">{data?.latestLabs?.key || '—'}</div>
      </a>

      <a href="/timeline" className="gaia-panel rounded-xl border p-4 shadow-sm">
        <div className="text-sm gaia-muted">Timeline</div>
        <div className="mt-1 text-2xl font-extrabold">Recent</div>
        <div className="mt-1 text-sm opacity-80 truncate">{data?.latestTimeline?.key || '—'}</div>
      </a>
    </section>
  );
}
