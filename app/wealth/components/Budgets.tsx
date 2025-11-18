'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadBudgets, loadTx, saveBudgets } from '../lib/store';
import type { Budget } from '../lib/types';

function monthKey(d: string){ return d.slice(0,7); }
function fmt(n: number){ return n.toLocaleString('en-EG', { maximumFractionDigits: 0 }); }

const PANEL =
  "gaia-surface rounded-xl border gaia-border p-4 shadow-sm";
const INPUT =
  "gaia-input rounded-lg px-3 py-1.5";
const BUTTON =
  "gaia-border gaia-surface rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm";

export default function Budgets(){
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
  const [list, setList] = useState<Budget[]>([]);
  const [cat, setCat] = useState('General');
  const [amt, setAmt] = useState<number>(0);

  useEffect(()=>{ setList(loadBudgets()); }, []);

  const tx = useMemo(()=> loadTx().filter(t => monthKey(t.date)===month && t.type==='expense'), [month]);

  const byCat = useMemo(()=>{
    const spent: Record<string, number> = {};
    for (const t of tx){ spent[t.category] = (spent[t.category]||0) + t.amount; }
    const curr = list.filter(b => b.month===month);
    return curr.map(b => ({
      ...b,
      spent: spent[b.category] || 0,
    }));
  }, [tx, list, month]);

  function addBudget(){
    const next = [...list.filter(b=>!(b.month===month && b.category.toLowerCase()===cat.toLowerCase())), { month, category: cat, amount: amt } as Budget];
    saveBudgets(next); setList(next); setCat('General'); setAmt(0);
  }

  return (
    <section className={PANEL}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-wide gaia-strong">Budgets</h2>
        <input type="month" className={INPUT} value={month} onChange={e=>setMonth(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {byCat.map(b => {
          const pct = Math.min(100, Math.round((b.spent / (b.amount||1)) * 100));
          const barColor =
            pct < 80
              ? "var(--gaia-contrast-bg)"
              : pct < 100
                ? "color-mix(in srgb, var(--gaia-contrast-bg) 60%, var(--gaia-surface) 40%)"
                : "color-mix(in srgb, var(--gaia-contrast-bg) 45%, var(--gaia-text-strong) 55%)";
          return (
            <div key={b.category} className="rounded-lg border gaia-border p-3 gaia-surface">
              <div className="flex items-center justify-between gaia-strong">
                <div className="font-semibold">{b.category}</div>
                <div className="text-sm">{fmt(b.spent)} / {fmt(b.amount)}</div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded gaia-ink-faint">
                <div className="h-full" style={{ width: pct + "%", backgroundColor: barColor }} />
              </div>
            </div>
          );
        })}
        {byCat.length===0 && <div className="gaia-muted">No budgets set for this month.</div>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input className={INPUT} placeholder="Category" value={cat} onChange={e=>setCat(e.target.value)} />
        <input className={INPUT} placeholder="Amount" type="number" value={amt || ''} onChange={e=>setAmt(Number(e.target.value))} />
        <button className={BUTTON} onClick={addBudget}>Add / Update</button>
      </div>
    </section>
  );
}
