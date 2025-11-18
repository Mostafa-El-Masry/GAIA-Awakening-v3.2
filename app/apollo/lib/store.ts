'use client';
import { readJSON, writeJSON } from '@/lib/user-storage';
import type { ApolloData, ApolloPrefs, Topic, Section } from './types';
import { nid } from './id';
const DATA_KEY='gaia_apollo_v1_notes';const PREF_KEY='gaia_apollo_v1_prefs';
export function loadData():ApolloData{return readJSON<ApolloData>(DATA_KEY,{topics:[]});}
export function saveData(d:ApolloData){writeJSON(DATA_KEY,d);}
export function loadPrefs():ApolloPrefs{return readJSON<ApolloPrefs>(PREF_KEY,{});}
export function savePrefs(p:ApolloPrefs){writeJSON(PREF_KEY,p);}
export function findTopic(d:ApolloData,title:string){return d.topics.find(t=>t.title.toLowerCase()===title.toLowerCase());}
export function getTopicById(d:ApolloData,id?:string){return d.topics.find(t=>t.id===id)}
export function getSectionById(t:Topic|undefined,id?:string){return t?.sections.find(s=>s.id===id)}
export function upsertTopic(d:ApolloData,title:string){const e=findTopic(d,title); if(e) return e; const t:Topic={id:nid(),title,sections:[]}; d.topics.push(t); saveData(d); return t;}
export function upsertSection(t:Topic, heading:string){const e=t.sections.find(s=>s.heading.toLowerCase()===heading.toLowerCase()); if(e) return e; const s:Section={id:nid(), heading, blocks:[], editedAt:new Date().toISOString()}; t.sections.push(s); return s;}
export function appendToSection(s:Section, text:string){s.blocks.push(text); s.editedAt=new Date().toISOString();}
export function replaceSection(s:Section, text:string){const parts=text.split(/\n\s*\n/); s.blocks=parts; s.editedAt=new Date().toISOString();}
export function search(d:ApolloData,q:string){const query=q.trim().toLowerCase(); if(!query) return []; const hits:any[]=[]; for(const t of d.topics){for(const s of t.sections){const body=s.blocks.join('\n\n'); if(t.title.toLowerCase().includes(query)||s.heading.toLowerCase().includes(query)||body.toLowerCase().includes(query)){const idx=body.toLowerCase().indexOf(query); const start=Math.max(0, idx-40); const end=Math.min(body.length, idx+80); hits.push({topic:t.title, heading:s.heading, sectionId:s.id, snippet:body.slice(start,end)});}}} return hits;}
export function exportJSON(d:ApolloData){const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='apollo-archive.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),0);}
export async function importJSON(setter:(d:ApolloData)=>void){return new Promise<void>((resolve)=>{const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json'; inp.onchange=async()=>{const f=inp.files?.[0]; if(!f) return resolve(); const text=await f.text(); try{const d=JSON.parse(text) as ApolloData; saveData(d); setter(d);}catch{} resolve();}; inp.click();});}
