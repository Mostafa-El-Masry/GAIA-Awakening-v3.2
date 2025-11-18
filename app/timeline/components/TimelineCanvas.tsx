'use client';

import { useMemo } from 'react';
import type { TLEvent, TimelinePrefs } from '../lib/types';
import { yearToPct, zoomDomain } from '../lib/scale';
import "../styles/timeline-canvas.css";

export default function TimelineCanvas({ events, prefs }:{ events: TLEvent[]; prefs: TimelinePrefs }){
  const [minYear, maxYear] = zoomDomain(prefs.zoom);

  const visible = useMemo(()=> events.filter(e => (
    (e.era==='cosmic' && prefs.showCosmic) ||
    (e.era==='human' && prefs.showHuman) ||
    (e.era==='personal' && prefs.showPersonal)
  )), [events, prefs]);

  const sorted = useMemo(()=>{
    if (prefs.sort === 'recent') return [...visible].sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
    // chronological: by start, then end
    return [...visible].sort((a,b)=> (a.range.startYear - b.range.startYear) || ((a.range.endYear||a.range.startYear) - (b.range.endYear||b.range.startYear)));
  }, [visible, prefs.sort]);

  return (
    <div className="tl-wrap">
      <div className="tl-axis">
        <span className="tl-min">{minYear.toLocaleString()}</span>
        <span className="tl-max">{maxYear.toLocaleString()}</span>
      </div>
      <div className="tl-track">
        {sorted.map(ev => {
          const x1 = yearToPct(ev.range.startYear, minYear, maxYear);
          const x2 = yearToPct(ev.range.endYear ?? ev.range.startYear, minYear, maxYear);
          const left = Math.min(x1, x2);
          const width = Math.max(0.5, Math.abs(x2 - x1)); // min width for visibility
          return (
            <div key={ev.id} className="tl-item" style={{ left: `${left}%`, width: `${width}%`, borderColor: ev.color || 'rgba(0,0,0,.2)' }}>
              <div className="tl-dot" style={{ background: ev.color || '#000' }} />
              <div className="tl-box">
                <div className="tl-ttl">{ev.title}</div>
                {ev.note && <div className="tl-note">{ev.note}</div>}
                {typeof ev.range.endYear === 'number'
                  ? <div className="tl-range">{ev.range.startYear.toLocaleString()} → {ev.range.endYear.toLocaleString()}</div>
                  : <div className="tl-range">{ev.range.startYear.toLocaleString()}</div>
                }
                {ev.link && <a className="tl-link" href={ev.link}>Open</a>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
