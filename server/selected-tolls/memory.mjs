import {selectedTariffNetworks} from './tariffs.mjs';
const need=(ok,message)=>{if(!ok)throw Error('Portion mémorisée : '+message)};
const text=(v,max)=>{need(typeof v==='string'&&v.trim()&&v.length<=max,'texte invalide.');return v.trim()};
const iso=v=>{need(typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v,'date invalide.');return v};
const day=v=>{need(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'jour invalide.');return v};
const point=p=>{need(Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==='number'&&Number.isFinite(n))&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90,'coordonnées invalides.');return p.slice()};
const url=v=>{text(v,2000);let u;try{u=new URL(v)}catch{}need(u?.protocol==='https:'&&!u.username&&!u.password,'source invalide.');return u.href};
function historicalTariff(t,m){
 if(t===null)return null;
 need(t&&t.coverage==='DECLARED_NOT_ROUTE_VERIFIED'&&t.currency==='EUR','statut tarifaire invalide.');
 need(Number.isSafeInteger(t.cents)&&t.cents>=0&&t.cents<=100000,'montant invalide.');
 const out={network:text(t.network,80),entryLabel:text(t.entryLabel,200),exitLabel:text(t.exitLabel,200),vehicleClass:t.vehicleClass,date:day(t.date),cents:t.cents,currency:'EUR',coverage:'DECLARED_NOT_ROUTE_VERIFIED',source:url(t.source),sourceTitle:text(t.sourceTitle,1000),effectiveFrom:day(t.effectiveFrom),lastReviewed:day(t.lastReviewed),consultationUntil:day(t.consultationUntil)};
 need(out.entryLabel!==out.exitLabel&&out.vehicleClass===m.vehicleClass&&out.date===m.date&&out.date>=out.effectiveFrom&&out.date<=out.consultationUntil&&out.lastReviewed<=m.capturedAt.slice(0,10),'référence incohérente.');
 return out;
}
export function validateSelectedTollMemory(raw,entry){
 if(raw===null)return null;
 need(raw?.kind==='selected-toll-memory'&&raw.version===1,'format inconnu.');
 need(entry.vehicle.type==='car'&&entry.optimization==='fastest'&&entry.meetings===null&&entry.snapshot.engine==='ors-selected','contexte routier incompatible.');
 need(entry.preferences.avoid.includes('tollways'),'évitement général manquant.');
 need(['1','2'].includes(raw.vehicleClass)&&typeof raw.allowHighwayOnSection==='boolean','classe ou exception invalide.');
 need(!raw.allowHighwayOnSection||entry.preferences.avoid.includes('highways'),'exception autoroutière sans évitement.');
 const capturedAt=iso(raw.capturedAt),observedAt=iso(raw.section?.observedAt);
 need(observedAt<=capturedAt&&capturedAt<=entry.savedAt,'chronologie incohérente.');
 need(raw.section?.provider==='openrouteservice'&&Array.isArray(raw.section.coordinates)&&raw.section.coordinates.length>=2&&raw.section.coordinates.length<=25000,'tracé historique invalide.');
 const coordinates=raw.section.coordinates.map(point),key=p=>p.join(','),path=a=>'|'+a.map(key).join('|')+'|';
 need(new Set(coordinates.map(key)).size>1&&path(entry.snapshot.geometry).includes(path(coordinates)),'portion absente du tracé historique ou sens différent.');
 const out={kind:'selected-toll-memory',version:1,capturedAt,vehicleClass:raw.vehicleClass,date:day(raw.date),allowHighwayOnSection:raw.allowHighwayOnSection,section:{provider:'openrouteservice',graphDate:text(raw.section.graphDate,200),observedAt,coordinates},tariff:null};
 out.tariff=historicalTariff(raw.tariff,out);return out;
}
export function captureSelectedTollMemory(selection,capturedAt){
 const part=selection?.parts?.[1];need(part&&selection.context,'sélection absente.');
 return {kind:'selected-toll-memory',version:1,capturedAt,vehicleClass:selection.context.vehicleClass,date:selection.context.date,allowHighwayOnSection:selection.allowHighwayOnSection,section:{provider:'openrouteservice',graphDate:part.graphDate,observedAt:part.observedAt,coordinates:structuredClone(part.coordinates)},tariff:selection.estimate?structuredClone(selection.estimate):null};
}
// Names and direction only. Old indices, price and confirmation are never replayed.
export function preparedTollPair(memory,catalogue){
 const t=memory?.tariff,networks=selectedTariffNetworks(catalogue),n=t&&Object.hasOwn(networks,t.network)?networks[t.network]:null;if(!n)return null;
 const one=label=>{const matches=n.gates.flatMap((name,i)=>name===label?[i]:[]);return matches.length===1?matches[0]:null};
 const entry=one(t.entryLabel),exit=one(t.exitLabel);
 return entry!==null&&exit!==null&&entry!==exit&&n.rows.filter(r=>r[0]===entry&&r[1]===exit).length===1?{network:t.network,entry,exit}:null;
}

