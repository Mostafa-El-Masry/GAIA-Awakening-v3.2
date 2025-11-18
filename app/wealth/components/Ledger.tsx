'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadTx, saveTx } from '../lib/store';
import type { Transaction } from '../lib/types';
import type { FilterState } from './Filters';

function match(t: Transaction, f: FilterState): boolean {
  if (f.type !== 'All' && t.type !== f.type) return false;
  if (f.category && t.category.toLowerCase() !== f.category.toLowerCase()) return false;
  if (f.q) {
    const hay = [t.note||'', t.category, ...t.tags].join(' ').toLowerCase();
    if (!hay.includes(f.q.toLowerCase())) return false;
  }
  if (f.from && t.date < new Date(f.from).toISOString()) return false;
  if (f.to && t.date > new Date(f.to + 'T23:59:59').toISOString()) return false;
  return true;
}

function fmt(n: number){ return n.toLocaleString('en-EG', { maximumFractionDigits: 0 }); }

const PANEL =
  "gaia-surface rounded-xl border gaia-border p-4 shadow-sm";
const BUTTON =
  "gaia-border gaia-surface rounded-lg px-2 py-1 text-xs font-semibold shadow-sm";

export default function Ledger({ filter }:{ filter: FilterState }){
  const [list, setList] = useState<Transaction[]>([]);
  useEffect(()=>{ setList(loadTx()); }, []);

  const filtered = useMemo(()=> list.filter(t => match(t, filter)).sort((a,b)=> a.date.localeCompare(b.date)), [list, filter]);

  function remove(id: string){
    const next = loadTx().filter(t => t.id !== id); saveTx(next); setList(next);
  }

  return (
    <section className={PANEL}>
      <h2 className="mb-2 text-lg font-extrabold tracking-wide gaia-strong">Ledger</h2>
      <div className="overflow-auto rounded-lg border gaia-border bg-[color-mix(in_srgb,var(--gaia-surface)_88%,transparent)]">
        <table className="w-full text-sm">
          <thead className="gaia-panel-soft"><tr className="gaia-strong">
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Tags</th>
            <th className="p-2 text-left">Note</th>
            <th className="p-2 text-right">Amount</th>
            <th className="p-2"></th>
          </tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-t gaia-border">
                <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                <td className="p-2">{t.type}</td>
                <td className="p-2">{t.category}</td>
                <td className="p-2">{t.tags.join(', ')}</td>
                <td className="p-2">{t.note}</td>
                <td className={"p-2 text-right " + (t.type==='expense'?'gaia-negative':'gaia-positive')}>{fmt(t.amount)}</td>
                <td className="p-2 text-right"><button className={BUTTON} onClick={()=>remove(t.id)}>Delete</button></td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td className="gaia-muted p-3 text-center" colSpan={7}>No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
