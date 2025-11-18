'use client';

import { exportJSON, importJSON } from '../lib/store';
import "../styles/import-export.css";

export default function ImportExport({ getData, setData }:{ getData:()=>any; setData:(d:any)=>void }){
  return (
    <div className="tl-iobox">
      <button className="tl-btn" onClick={()=>exportJSON(getData())}>Export</button>
      <button className="tl-btn" onClick={()=>importJSON(setData)}>Import</button>
    </div>
  );
}
