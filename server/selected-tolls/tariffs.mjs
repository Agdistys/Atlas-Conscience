import {asfReferenceTariffs} from './asf-tariffs.mjs';
const need=(ok,message)=>{if(!ok)throw Object.assign(Error(message),{code:'TARIFF_REFERENCE_INVALID'})};
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const localDay=now=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
export function selectedTariffNetworks(catalogue){
 if(catalogue?.schemaVersion!==2)return {};
 return Object.fromEntries(Object.entries({...catalogue.networks,ASF:asfReferenceTariffs}).filter(([id,n])=>['APRR','AREA','ASF'].includes(id)&&n?.kind==='pair'&&Array.isArray(n.gates)&&Array.isArray(n.rows)));
}
// This is a source price for DECLARED gates, never automatic route coverage.
// Its separate shape deliberately cannot be passed as the planner's verified quote.
export function declaredSectionTariff(catalogue,choice,context,sectionKey,now=Date.now()){
 need(choice&&choice.confirmed===true,'Confirmer les gares déclarées pour cette portion.');
 need(context&&['1','2'].includes(context.vehicleClass)&&day(context.date),'Classe ou date de péage invalide.');
 need(typeof sectionKey==='string'&&sectionKey.length>0&&sectionKey.length<=5000000,'Portion à confirmer avant le tarif.');
 const n=selectedTariffNetworks(catalogue)[choice.network];
 need(n&&day(n.effectiveFrom)&&day(n.consultationUntil)&&day(n.lastReviewed),'Source tarifaire indisponible.');
 need(context.date>=n.effectiveFrom&&context.date<=n.consultationUntil&&localDay(now)<=n.consultationUntil&&localDay(now)>=n.lastReviewed,'Grille non proposée pour cette date.');
 const {entry,exit}=choice;
 need(Number.isSafeInteger(entry)&&Number.isSafeInteger(exit)&&entry>=0&&exit>=0&&entry!==exit&&typeof n.gates[entry]==='string'&&typeof n.gates[exit]==='string','Choisir deux gares distinctes dans le sens publié.');
 const matches=n.rows.filter(row=>row[0]===entry&&row[1]===exit);need(matches.length===1,'Tarif absent ou ambigu pour ce sens.');
 const cents=matches[0][Number(context.vehicleClass)+1];need(Number.isSafeInteger(cents)&&cents>=0&&cents<=100000,'Tarif inconnu pour cette classe.');
 let source;try{source=new URL(n.source)}catch{need(false,'Source tarifaire absente.')}
 need(source.protocol==='https:'&&!source.username&&!source.password,'Source tarifaire invalide.');
 return {kind:'declared-gates-reference',network:choice.network,entry,exit,entryLabel:n.gates[entry],exitLabel:n.gates[exit],vehicleClass:context.vehicleClass,date:context.date,cents,currency:'EUR',source:source.href,sourceTitle:n.sourceTitle||'Grille '+choice.network,effectiveFrom:n.effectiveFrom,lastReviewed:n.lastReviewed,consultationUntil:n.consultationUntil,sectionKey,coverage:'DECLARED_NOT_ROUTE_VERIFIED'};
}
export function currentDeclaredTariff(catalogue,value,context,sectionKey,now=Date.now()){
 if(!value||value.kind!=='declared-gates-reference')return null;
 try{const expected=declaredSectionTariff(catalogue,{network:value.network,entry:value.entry,exit:value.exit,confirmed:true},context,sectionKey,now);return JSON.stringify(value)===JSON.stringify(expected)?expected:null}catch{return null}
}
