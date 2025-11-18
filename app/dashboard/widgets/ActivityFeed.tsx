'use client';

import { useEffect, useState } from 'react';

import { snapshotStorage, waitForUserStorage } from '@/lib/user-storage';

/**
 * Builds a tiny recent feed using any *createdAt/updatedAt/date* fields it finds.
 */

export default function ActivityFeed(){
  const [rows, setRows] = useState<{key:string, when:number, route?:string}[]>([]);

  useEffect(()=>{
    let cancelled = false;
    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      const snapshot = snapshotStorage();
      const items:any[] = [];
      for(const [k, raw] of Object.entries(snapshot)){
        if (!raw) continue;
        let v:any = null;
        try{
          v = JSON.parse(raw);
        }catch{
          continue;
        }
        const when = new Date(v?.updatedAt || v?.createdAt || v?.date || 0).getTime();
        if (when>0){
          let route: string | undefined = undefined;
          if (k.startsWith('apollo_')) route='/apollo';
          else if (k.startsWith('gallery_')) route='/gallery';
          else if (k.startsWith('wealth_')) route='/wealth';
          else if (k.startsWith('health_')) route='/health';
          else if (k.startsWith('timeline_')) route='/timeline';
          else if (k.startsWith('labs_')) route='/apollo/labs';
          items.push({ key:k, when, route });
        }
      }
      items.sort((a,b)=> b.when - a.when);
      setRows(items.slice(0, 12));
    })();
    return () => { cancelled = true; };
  }, []);

  if (!rows.length) return <div className="text-sm gaia-muted">No recent activity.</div>;

  return (
    <div className="grid gap-2">
      {rows.map(r=> (
        <a key={r.key} href={r.route || '#'} className="flex items-center justify-between rounded border border-black/10 px-3 py-2 text-sm hover:border-black/30">
          <span className="truncate">{r.key}</span>
          <span className="gaia-muted">{new Date(r.when).toLocaleString()}</span>
        </a>
      ))}
    </div>
  );
}
