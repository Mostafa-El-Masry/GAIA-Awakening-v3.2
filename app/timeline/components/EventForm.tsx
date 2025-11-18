'use client';

import { useEffect, useState } from 'react';
import type { TLEvent, Era } from '../lib/types';
import { addEvent, loadData } from '../lib/store';
import { readJSON } from '@/lib/user-storage';
import "../styles/event-form.css";

type ApolloSection = { label: string; sectionId: string; topicId: string };

export default function EventForm({ onAdded }:{ onAdded:(e:TLEvent)=>void }){
  const [title, setTitle] = useState('GAIA — Week completed');
  const [era, setEra] = useState<Era>('personal');
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endYear, setEndYear] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [apolloOptions, setApolloOptions] = useState<ApolloSection[]>([]);
  const [apolloSel, setApolloSel] = useState('');

  // Load Apollo sections from the per-user store so we can deep-link
  useEffect(()=>{
    const data = readJSON<{ topics?: Array<{ title: string; id: string; sections?: Array<{ heading: string; id: string }> }> }>(
      'gaia_apollo_v1_notes',
      { topics: [] }
    );
    const opts: ApolloSection[] = [];
    for (const t of data.topics || []) {
      for (const s of t.sections || []) {
        opts.push({ label: `${t.title} – ${s.heading}`, sectionId: s.id, topicId: t.id });
      }
    }
    setApolloOptions(opts);
  }, []);

  function submit(){
    if (!title) return;
    const d = loadData();
    const ev = addEvent(d, {
      title, era, note, link,
      range: { startYear: Number(startYear), endYear: endYear===''? undefined : Number(endYear) },
      color: era==='cosmic' ? '#0ea5e9' : era==='human' ? '#10b981' : '#8b5cf6'
    });
    onAdded(ev);
    setEndYear('');
  }

  // Quick presets
  function quick(label: string){
    setTitle(label);
    setEra('personal');
    setStartYear(new Date().getFullYear());
    setNote('');
  }

  return (
    <div className="tl-form">
      <div className="tl-form-top">
        <input className="tl-input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <div className="tl-quick">
          <button className="tl-btn" onClick={()=>quick('GAIA — Week completed')}>Quick: GAIA week</button>
          <button className="tl-btn" onClick={()=>quick('GAIA — Milestone')}>Quick: Milestone</button>
          <button className="tl-btn" onClick={()=>quick('Personal — Today')}>Quick: Today</button>
        </div>
      </div>

      <div className="tl-grid">
        <select className="tl-input" value={era} onChange={e=>setEra(e.target.value as Era)}>
          <option value="cosmic">Cosmic</option>
          <option value="human">Human</option>
          <option value="personal">Personal</option>
        </select>
        <input className="tl-input" type="number" placeholder="Start year (e.g., -13800000000)" value={startYear} onChange={e=>setStartYear(Number(e.target.value))} />
        <input className="tl-input" type="number" placeholder="End year (optional)" value={endYear} onChange={e=>setEndYear(e.target.value===''? '' : Number(e.target.value))} />
      </div>

      <div className="tl-grid">
        <input className="tl-input" placeholder="Link (optional, e.g., /apollo#sectionId)" value={link} onChange={e=>setLink(e.target.value)} />
        <select className="tl-input" value={apolloSel} onChange={e=>{
          const id = e.target.value;
          setApolloSel(id);
          if (!id) return;
          setLink(`/apollo#${id}`);
        }}>
          <option value="">Link to Apollo section…</option>
          {apolloOptions.map(o => <option key={o.sectionId} value={o.sectionId}>{o.label}</option>)}
        </select>
      </div>

      <textarea className="tl-ta" placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
      <button className="tl-btn" onClick={submit}>Add event</button>
    </div>
  );
}
