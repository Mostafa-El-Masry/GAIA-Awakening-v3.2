'use client';

import { useEffect } from 'react';
import type { TimelinePrefs } from '../lib/types';
import "../styles/filter-bar.css";

export default function FilterBar({ prefs, setPrefs }:{ prefs: TimelinePrefs; setPrefs: (p: TimelinePrefs)=>void }){
  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      if (e.key.toLowerCase() === 'z') setPrefs({ ...prefs, zoom: prefs.zoom === 'cosmic' ? 'human' : (prefs.zoom === 'human' ? 'personal' : 'cosmic') });
    }
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  }, [prefs, setPrefs]);

  return (
    <div className="tl-bar">
      <div className="tl-row">
        <div className="tl-left">
          <div className="tl-title">Timeline</div>
          <select className="tl-select" value={prefs.zoom} onChange={e=>setPrefs({ ...prefs, zoom: e.target.value as any })}>
            <option value="cosmic">Cosmic</option>
            <option value="human">Human</option>
            <option value="personal">Personal</option>
          </select>
          <span className="tl-hint">Press Z to cycle zoom</span>
        </div>
        <div className="tl-right">
          <label className="tl-check">
            <input type="checkbox" checked={prefs.showCosmic} onChange={e=>setPrefs({ ...prefs, showCosmic: e.target.checked })}/>
            Cosmic
          </label>
          <label className="tl-check">
            <input type="checkbox" checked={prefs.showHuman} onChange={e=>setPrefs({ ...prefs, showHuman: e.target.checked })}/>
            Human
          </label>
          <label className="tl-check">
            <input type="checkbox" checked={prefs.showPersonal} onChange={e=>setPrefs({ ...prefs, showPersonal: e.target.checked })}/>
            Personal
          </label>
          <select className="tl-select" value={prefs.sort} onChange={e=>setPrefs({ ...prefs, sort: e.target.value as any })}>
            <option value="chronological">Chronological</option>
            <option value="recent">Recently added</option>
          </select>
        </div>
      </div>
    </div>
  );
}
