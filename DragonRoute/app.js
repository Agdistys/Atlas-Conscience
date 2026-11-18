(()=>{"use strict";
const C=window.DRAGONROUTE_CONFIG;
const $=id=>document.getElementById(id);
const fuelField={E10:"e10",Gazole:"gazole",SP98:"sp98",SP95:"sp95",E85:"e85",GPLc:"gplc"};
const log=[];
let map=null, routeLayer=null, markerLayer=null, currentPos=null, activeAbort=null, deferredInstall=null;
let trip=null, compared=[], busy=false,stationSearch=null;
let mapView=null,currentStation=null,detailSequence=0;
let orsLastRequest=-Infinity;
let ignLastRequest=-Infinity;
const ignCache=new Map();
let geoLastRequest=-Infinity,geoBlockedUntil=0,placePending=null,selectedStop=null,budgetReference=null,rangeMeasuredAt=null;
const geoCache=new Map();
const dimensionFields={height:"truckHeight",width:"truckWidth",length:"truckLength",weight:"truckWeight",axleload:"truckAxleload"};
const avoidLabels={tollways:"péages",highways:"autoroutes",ferries:"ferries"};
const PROFILE_SCOPE=document.body.dataset.preview==="true"?"preview:"+new URL('.',location.href).pathname:"public";
const PROFILE_KEY="dragonroute.profile.v2."+PROFILE_SCOPE,LEGACY_PROFILE_KEY="dragonroute.profile.v1."+PROFILE_SCOPE;
let profile,storageNotice="",profileSnapshot=null,legacySnapshot=null,profileWriteBlocked=false,legacyProfile=null;
let addressDraft=null,addressLookupSequence=0,profileImportSequence=0,pendingProfileImport=null;
const rememberedInputs={start:null,end:null},favoriteInputs={start:null,end:null};
// BEGIN PROFILE VALIDATION
function emptyProfile(){return {version:2,vehicle:{name:"",type:"car",fuel:"E10",cons:6.2,liters:40},addresses:[],stations:[]}}
function profileText(value,max){if(typeof value!=="string"||value.length>max)throw new Error("Texte de profil invalide");return value.trim()}
function profileNumber(value,min,max){if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new Error("Valeur de profil invalide");return value}
function addressKey(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR')}
function temporaryAddress(value){return ['ma position','__current__'].includes(addressKey(value))}
function validateSavedPlace(place){
 if(!place||typeof place!=='object'||place.source!=='ign')throw new Error('Lieu mémorisé invalide');
 const label=profileText(place.label,1000),resolvedAt=profileText(place.resolvedAt,40);
 if(!label||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(resolvedAt)||!Number.isFinite(Date.parse(resolvedAt))||new Date(resolvedAt).toISOString()!==(resolvedAt.includes('.')?resolvedAt:resolvedAt.replace('Z','.000Z')))throw new Error('Date ou libellé du lieu invalide');
 return {lat:profileNumber(place.lat,-90,90),lon:profileNumber(place.lon,-180,180),label,source:'ign',resolvedAt};
}
function validateProfile(data){
 if(!data||![1,2].includes(data.version)||!data.vehicle||!Array.isArray(data.addresses)||!Array.isArray(data.stations)||data.addresses.length>50||data.stations.length>100)throw new Error("Format de profil invalide");
 const v=data.vehicle;
 if(!["car","caravan","van","truck"].includes(v.type)||!Object.hasOwn(fuelField,v.fuel))throw new Error("Véhicule invalide");
 const addresses=data.addresses.map(a=>{
  const entry={id:profileText(a.id,80),name:profileText(a.name,80),value:profileText(a.value,250)};
  if(data.version===2&&a.place!=null){if(temporaryAddress(entry.value))throw new Error('Position GPS temporaire non réutilisable');entry.place=validateSavedPlace(a.place)}
  return entry;
 });
 const stations=data.stations.map(s=>({id:profileText(s.id,80),address:profileText(s.address,300),city:profileText(s.city,100),lat:profileNumber(s.lat,-90,90),lon:profileNumber(s.lon,-180,180)}));
 for(const list of [addresses,stations]){if(list.some(x=>!x.id)||new Set(list.map(x=>x.id)).size!==list.length)throw new Error("Identifiants invalides")}
 if(addresses.some(a=>!a.name||!a.value))throw new Error("Adresse incomplète");
 const dimensions=v.dimensions==null?undefined:validateDimensions(v.dimensions);
 const clean={version:2,vehicle:{name:profileText(v.name,80),type:v.type,fuel:v.fuel,cons:profileNumber(v.cons,1,100),liters:profileNumber(v.liters,1,2000),...(dimensions?{dimensions}:{})},addresses,stations};
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>100000)throw new Error('Profil trop volumineux');
 return clean;
}
function duplicateAddresses(entry,addresses){
 return addresses.filter(a=>a.id!==entry.id&&(addressKey(a.name)===addressKey(entry.name)||(a.place&&entry.place?Math.abs(a.place.lat-entry.place.lat)<1e-6&&Math.abs(a.place.lon-entry.place.lon)<1e-6:addressKey(a.value)===addressKey(entry.value))));
}
function duplicateAddressCount(addresses){return addresses.reduce((n,a,i)=>n+duplicateAddresses(a,addresses.slice(0,i)).length,0)}
// END PROFILE VALIDATION
function loadProfile(){
 profile=emptyProfile();storageNotice="";profileWriteBlocked=false;legacyProfile=null;
 try{
  profileSnapshot=localStorage.getItem(PROFILE_KEY);legacySnapshot=localStorage.getItem(LEGACY_PROFILE_KEY);
  const raw=profileSnapshot??legacySnapshot;
  if(raw!==null)profile=validateProfile(JSON.parse(raw));
  if(legacySnapshot!==null){try{const data=JSON.parse(legacySnapshot);if(data.version===1)legacyProfile={...validateProfile(data),version:1}}catch{}}
  if(profileSnapshot===null&&legacyProfile)storageNotice="Ancien profil repris. La copie d’origine reste conservée dans ce navigateur et peut être exportée.";
 }catch{profileWriteBlocked=true;storageNotice="Profil non chargé : format inconnu, données invalides ou stockage inaccessible. L’original est conservé ; aucun enregistrement ne le remplacera. Réouvrir avec une version compatible, ou effacer explicitement ce profil pour repartir."}
}
loadProfile();
function saveProfile(next){
 try{
  if(profileWriteBlocked)throw new Error('Profil non chargé : remplacement bloqué.');
  if(localStorage.getItem(PROFILE_KEY)!==profileSnapshot||localStorage.getItem(LEGACY_PROFILE_KEY)!==legacySnapshot)throw new Error('Profil modifié dans un autre onglet. Recharger avant de réessayer.');
  const clean=validateProfile(next),raw=JSON.stringify(clean);
  localStorage.setItem(PROFILE_KEY,raw);profileSnapshot=raw;profile=clean;storageNotice="";renderSaved();updateFavorite();return true;
 }catch(e){const message="Enregistrement impossible. "+(e.message.includes('autre onglet')||profileWriteBlocked?e.message:'Stockage indisponible, plein ou données invalides.');$("profileMessage").textContent=message;$("stationMessage").textContent=message;return false}
}
function downloadProfile(data,filename='DragonRoute-profil.json'){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
// BEGIN JOURNAL MODEL
/* Impact CO2 data attribution and license:
MIT License

Copyright (c) 2022 Datagir

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
// The bundled Impact CO2 factors are frozen, attributed and licensed below.
const CARBON_DATA={"version":"impactco2-2026-11-18-bece7af","publisher":"ADEME / Impact CO₂","retrievedAt":"2026-11-18","sourceCommit":"bece7af7e3daa41c7f2233e03d169c33e82530c2","sourceURL":"https://github.com/incubateur-ademe/impactco2/blob/bece7af7e3daa41c7f2233e03d169c33e82530c2/src/data/categories/deplacement.ts","license":"MIT","sourceSha256":"d0cf114a19cf098c726dc4bab5d79a8bc477e6f14309686d1f7726cf6b440ef2","factors":[{"id":"tgv","mode":"train","label":"TGV","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00063,"energy":0.0023,"source":"https://impactco2.fr/outils/transport/tgv"},{"id":"intercites","mode":"train","label":"Intercités","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00318,"energy":0.0058,"source":"https://impactco2.fr/outils/transport/intercites"},{"id":"autocar","mode":"bus","label":"Autocar thermique","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00442,"energy":0.03314,"source":"https://impactco2.fr/outils/transport/autocar"},{"id":"velo","mode":"bike","label":"Vélo mécanique","unit":"kgCO2e/person-km","scope":"construction","construction":0.00017,"energy":0,"source":"https://impactco2.fr/outils/transport/velo"},{"id":"veloelectrique","mode":"bike","label":"Vélo électrique","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00872,"energy":0.00223,"source":"https://impactco2.fr/outils/transport/veloelectrique"},{"id":"busthermique","mode":"bus","label":"Bus thermique","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00892,"energy":0.1135,"source":"https://impactco2.fr/outils/transport/busthermique"},{"id":"tramway","mode":"train","label":"Tramway","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00048,"energy":0.0038,"source":"https://impactco2.fr/outils/transport/tramway"},{"id":"metro","mode":"train","label":"Métro","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00024,"energy":0.0042,"source":"https://impactco2.fr/outils/transport/metro"},{"id":"rer","mode":"train","label":"RER / Transilien","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00318,"energy":0.0066,"source":"https://impactco2.fr/outils/transport/rer"},{"id":"ter","mode":"train","label":"TER","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00479,"energy":0.0229,"source":"https://impactco2.fr/outils/transport/ter"},{"id":"buselectrique","mode":"bus","label":"Bus électrique","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.0122,"energy":0.0095,"source":"https://impactco2.fr/outils/transport/buselectrique"},{"id":"voiture-citadine-essence","mode":"car","label":"Petite — Essence E5 / E10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.027733695652173936,"energy":0.1169810600556303,"source":"https://impactco2.fr/outils/transport/voiture-citadine-essence"},{"id":"voiture-citadine-diesel","mode":"car","label":"Petite — Diesel B7 / B10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.027733695652173936,"energy":0.09416971630563031,"source":"https://impactco2.fr/outils/transport/voiture-citadine-diesel"},{"id":"voiture-citadine-electrique","mode":"car","label":"Petite — Électrique","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.046089130434782626,"energy":0.011504485055630311,"source":"https://impactco2.fr/outils/transport/voiture-citadine-electrique"},{"id":"voiture-citadine-hybride","mode":"car","label":"Petite — Hybride non rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.02919796195652175,"energy":0.1060514350556303,"source":"https://impactco2.fr/outils/transport/voiture-citadine-hybride"},{"id":"voiture-citadine-hybriderechargeable","mode":"car","label":"Petite — Hybride rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03677027173913044,"energy":0.09211716005563031,"source":"https://impactco2.fr/outils/transport/voiture-citadine-hybriderechargeable"},{"id":"voiture-compact-essence","mode":"car","label":"Moyenne — Essence E5 / E10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03169565217391306,"energy":0.1380123725556303,"source":"https://impactco2.fr/outils/transport/voiture-compact-essence"},{"id":"voiture-compact-diesel","mode":"car","label":"Moyenne — Diesel B7 / B10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03169565217391306,"energy":0.1105577600556303,"source":"https://impactco2.fr/outils/transport/voiture-compact-diesel"},{"id":"voiture-compact-electrique","mode":"car","label":"Moyenne — Électrique","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.05527690217391306,"energy":0.01208836005563031,"source":"https://impactco2.fr/outils/transport/voiture-compact-electrique"},{"id":"voiture-compact-hybride","mode":"car","label":"Moyenne — Hybride non rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03315991847826087,"energy":0.1134194350556303,"source":"https://impactco2.fr/outils/transport/voiture-compact-hybride"},{"id":"voiture-compact-hybriderechargeable","mode":"car","label":"Moyenne — Hybride rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.04073222826086956,"energy":0.0931681350556303,"source":"https://impactco2.fr/outils/transport/voiture-compact-hybriderechargeable"},{"id":"voiture-berline-essence","mode":"car","label":"Berline — Essence E5 / E10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03961956521739131,"energy":0.1496510600556303,"source":"https://impactco2.fr/outils/transport/voiture-berline-essence"},{"id":"voiture-berline-diesel","mode":"car","label":"Berline — Diesel B7 / B10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03961956521739131,"energy":0.1437828350556303,"source":"https://impactco2.fr/outils/transport/voiture-berline-diesel"},{"id":"voiture-berline-electrique","mode":"car","label":"Berline — Électrique","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.0759790760869565,"energy":0.014735260055630313,"source":"https://impactco2.fr/outils/transport/voiture-berline-electrique"},{"id":"voiture-berline-hybride","mode":"car","label":"Berline — Hybride non rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.041083831521739125,"energy":0.12976718505563029,"source":"https://impactco2.fr/outils/transport/voiture-berline-hybride"},{"id":"voiture-berline-hybriderechargeable","mode":"car","label":"Berline — Hybride rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.048656141304347804,"energy":0.11580859130563032,"source":"https://impactco2.fr/outils/transport/voiture-berline-hybriderechargeable"},{"id":"voiture-grandeberline-essence","mode":"car","label":"SUV — Essence E5 / E10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03961956521739131,"energy":0.2066193725556303,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-essence"},{"id":"voiture-grandeberline-diesel","mode":"car","label":"SUV — Diesel B7 / B10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03961956521739131,"energy":0.1300887163056303,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-diesel"},{"id":"voiture-grandeberline-electrique","mode":"car","label":"SUV — Électrique","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.08024456521739132,"energy":0.014112460055630311,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-electrique"},{"id":"voiture-grandeberline-hybride","mode":"car","label":"SUV — Hybride non rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.041083831521739125,"energy":0.1408191850556303,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-hybride"},{"id":"voiture-grandeberline-hybriderechargeable","mode":"car","label":"SUV — Hybride rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.048656141304347804,"energy":0.1373241350556303,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-hybriderechargeable"}]};
const CARBON_SCOPES={'construction-energy':'Construction et énergie modélisées','construction':'Construction seule (vélo mécanique)'};
function unavailableCarbon(){return {version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null}}
function carbonInput(e){return {mode:e.mode,distanceMeters:e.distanceMeters,start:e.start,end:e.end,date:e.date}}
function estimateCarbon(entry,factorId,occupants,at){
 const factor=CARBON_DATA.factors.find(f=>f.id===factorId&&f.mode===entry.mode);
 if(!factor)throw new Error('Choisir un facteur compatible avec le mode.');
 if(entry.distanceMeters===null)throw new Error('Renseigner la distance pour estimer les émissions.');
 journalNumber(entry.distanceMeters,40000000);journalDate(entry.date);journalInstant(at);
 const vehicle=factor.unit==='kgCO2e/vehicle-km';
 if(vehicle&&(!Number.isInteger(occupants)||occupants<1||occupants>9))throw new Error('Indiquer de 1 à 9 occupants, conducteur compris.');
 const total=(entry.distanceMeters/1000)*(factor.construction+factor.energy);
 return {version:'impact-estimate-v1',status:'estimated',dataset:CARBON_DATA.version,factor:structuredClone(factor),input:carbonInput(entry),occupants:vehicle?occupants:null,vehicleKg:vehicle?total:null,valueKg:vehicle?total/occupants:total,calculatedAt:at};
}
function validateCarbon(c){
 if(c?.version==='unavailable-v1'&&c.status==='unavailable'&&c.valueKg===null&&c.factor===null)return unavailableCarbon();
 if(!c||c.version!=='impact-estimate-v1'||c.status!=='estimated'||c.dataset!==CARBON_DATA.version||!c.input)throw new Error('Version de calcul carbone non reconnue.');
 const i=c.input,input={mode:i.mode,distanceMeters:i.distanceMeters,date:journalDate(i.date),start:journalText(i.start,1000,true),end:journalText(i.end,1000,true)};
 const expected=estimateCarbon(input,c.factor?.id,c.occupants,journalInstant(c.calculatedAt));
 if(Object.keys(expected.factor).some(k=>c.factor[k]!==expected.factor[k])||c.valueKg!==expected.valueKg||c.vehicleKg!==expected.vehicleKg||c.occupants!==expected.occupants)throw new Error('Estimation carbone incohérente.');
 return expected;
}
function currentCarbon(e){return e.emissions?.status==='estimated'&&JSON.stringify(carbonInput(e))===JSON.stringify(carbonInput(e.emissions.input))}
function reviseCarbon(entry,previous,choice,at){
 entry.emissions=structuredClone(previous.emissions);entry.emissionsHistory=structuredClone(previous.emissionsHistory??[]);
 const changed=previous.emissions.status==='estimated'&&!currentCarbon(entry);
 if(choice||changed){
  if(entry.emissions.status==='estimated'){
   if(entry.emissionsHistory.length>=50)throw new Error('Limite de 50 estimations historiques atteinte. Exporter cette entrée avant une nouvelle révision.');
   entry.emissionsHistory.push({archivedAt:at,reason:choice?'Actualisation demandée':'Correction des données du trajet',estimate:entry.emissions});
  }
  entry.emissions=choice?estimateCarbon(entry,choice.factorId,choice.occupants,at):unavailableCarbon();
 }
 return entry;
}

const JOURNAL_MODES={car:'Voiture',truck:'Poids lourd',train:'Train',bus:'Bus / car',bike:'Vélo',walk:'Marche',other:'Autre'};
function journalDay(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
function journalDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||!Number.isFinite(Date.parse(value+'T12:00:00Z'))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)throw new Error('Date invalide.');return value}
function journalText(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Texte du journal invalide.');return value.trim()}
function journalNumber(value,max){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max)throw new Error('Distance invalide.');return value}
function journalInstant(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw new Error('Horodatage invalide.');return value}
function journalIdentity(e){const norm=s=>s.trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR');return JSON.stringify([e.date,e.mode,norm(e.start),norm(e.end),e.distanceMeters])}
function emptyJournal(){return {version:2,enabled:false,entries:[]}}
function validateJournal(data){
 if(!data||![1,2].includes(data.version)||typeof data.enabled!=='boolean'||!Array.isArray(data.entries)||data.entries.length>1000)throw new Error('Format ou capacité du journal invalide.');
 const entries=data.entries.map(e=>{
  if(!e||!Object.hasOwn(JOURNAL_MODES,e.mode)||!['route','declared','unknown'].includes(e.distanceSource)||!Number.isSafeInteger(e.revision)||e.revision<1||e.revision>100000)throw new Error('Entrée de journal invalide.');
  const clean={id:journalText(e.id,80,true),date:journalDate(e.date),start:journalText(e.start,1000,true),end:journalText(e.end,1000,true),mode:e.mode,distanceMeters:e.distanceMeters===null?null:journalNumber(e.distanceMeters,40000000),distanceSource:e.distanceSource,note:journalText(e.note,500),createdAt:journalInstant(e.createdAt),updatedAt:journalInstant(e.updatedAt),revision:e.revision,calculation:null,emissions:{version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null}};
  if(!/^[A-Za-z0-9-]+$/.test(clean.id)||clean.updatedAt<clean.createdAt||(clean.distanceMeters===null)!==(clean.distanceSource==='unknown'))throw new Error('Entrée incohérente.');
  if(e.calculation!==null){const c=e.calculation;if(!c||c.version!=='route-snapshot-v1'||!['car','truck'].includes(c.mode)||!['ign','osrm','ors'].includes(c.engine))throw new Error('Calcul historique inconnu.');clean.calculation={version:c.version,engine:c.engine,start:journalText(c.start,1000,true),end:journalText(c.end,1000,true),resourceVersion:c.resourceVersion===null?null:journalText(c.resourceVersion,150,true),calculatedAt:journalInstant(c.calculatedAt),mode:c.mode,distanceMeters:journalNumber(c.distanceMeters,40000000),stop:c.stop===null?null:journalText(c.stop,500,true)}}
  if(clean.distanceSource==='route'&&(!clean.calculation||clean.distanceMeters!==clean.calculation.distanceMeters||clean.mode!==clean.calculation.mode||clean.start!==clean.calculation.start||clean.end!==clean.calculation.end))throw new Error('Distance incohérente avec le calcul.');
  if(data.version===1&&e.emissions?.version!=='unavailable-v1')throw new Error('Ancien journal incohérent.');
  clean.emissions=validateCarbon(e.emissions);
  if(clean.emissions.status==='estimated'&&!currentCarbon(clean))throw new Error('Estimation non conforme au trajet.');
  const history=e.emissionsHistory??[];
  if(!Array.isArray(history)||history.length>50)throw new Error('Historique carbone invalide.');
  clean.emissionsHistory=history.map(h=>{const estimate=validateCarbon(h.estimate),archivedAt=journalInstant(h.archivedAt);if(estimate.status!=='estimated'||archivedAt<estimate.calculatedAt||!['Actualisation demandée','Correction des données du trajet'].includes(h.reason))throw new Error('Historique carbone incohérent.');return {archivedAt,reason:h.reason,estimate}});
  return clean;
 });
 if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('Identifiants de journal dupliqués.');
 const clean={version:2,enabled:data.enabled,entries};if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('Journal trop volumineux : exporter avant de libérer de la place.');return clean;
}
function journalMonthly(entries,month){
 const rows=entries.filter(e=>e.date.slice(0,7)===month),modes={};
 for(const e of rows){const m=modes[e.mode]??={count:0,meters:0,unknown:0};m.count++;if(e.distanceMeters===null)m.unknown++;else m.meters+=e.distanceMeters;m.carbonGroups??={};m.carbonUnknown??=0;if(currentCarbon(e)){const g=m.carbonGroups[e.emissions.factor.scope]??={valueKg:0,count:0};g.valueKg+=e.emissions.valueKg;g.count++}else m.carbonUnknown++}
 const carbonGroups={};for(const e of rows){if(currentCarbon(e)){const scope=e.emissions.factor.scope,g=carbonGroups[scope]??={valueKg:0,count:0};g.valueKg+=e.emissions.valueKg;g.count++}}
 return {count:rows.length,meters:rows.reduce((s,e)=>s+(e.distanceMeters??0),0),unknown:rows.filter(e=>e.distanceMeters===null).length,carbonUnknown:rows.filter(e=>!currentCarbon(e)).length,carbonGroups,modes};
}
function planJournalImport(current,incoming,mode,choices={},copyId=i=>'copy-'+i){
 const base=validateJournal(current),source=validateJournal(incoming);
 if(!['merge','replace'].includes(mode))throw new Error('Choix d’import invalide.');
 const entries=mode==='replace'?[]:structuredClone(base.entries),rows=[],byId=new Map(),byIdentity=new Map();
 function index(e){byId.set(e.id,e);const k=journalIdentity(e),list=byIdentity.get(k)||[];list.push(e);byIdentity.set(k,list)}
 entries.forEach(index);let added=0,identical=0,skipped=0,unresolved=0,copies=0;
 source.entries.forEach((e,i)=>{
  const existing=byId.get(e.id),related=existing?[existing]:(byIdentity.get(journalIdentity(e))||[]);
  let kind=mode==='replace'?'restore':existing?(JSON.stringify(e)===JSON.stringify(existing)?'identical':'conflict'):related.length?'duplicate':'new',choice=choices[i]??'',accept=false,copy=false;
  if(['restore','new'].includes(kind))accept=true;
  else if(kind==='identical')identical++;
  else if(choice==='skip')skipped++;
  else if((kind==='conflict'&&choice==='both')||(kind==='duplicate'&&choice==='add')){accept=true;copy=kind==='conflict'}
  else {choice='';unresolved++}
  rows.push({entry:e,index:i,kind,choice,related:related.slice(0,3),relatedCount:related.length});
  if(accept){const next=structuredClone(e);if(copy){next.id=copyId(i);if(byId.has(next.id)||source.entries.some(x=>x.id===next.id))throw new Error('Identifiant de copie déjà utilisé.');copies++}entries.push(next);index(next);added++}
 });
 let next=null,error='';try{const validated=validateJournal({version:2,enabled:base.enabled,entries});if(!unresolved)next=validated}catch(e){error=e.message}
 return {rows,next,error,added,identical,skipped,unresolved,copies,changed:!!next&&JSON.stringify(next)!==JSON.stringify(base)};
}

// END JOURNAL MODEL
const JOURNAL_KEY='dragonroute.journal.v2.'+PROFILE_SCOPE,LEGACY_JOURNAL_KEY='dragonroute.journal.v1.'+PROFILE_SCOPE;
let journal=emptyJournal(),journalSnapshot=null,journalLegacySnapshot=null,journalBlocked=false,journalNotice='',journalDraft=null;
function loadJournal(){
 journal=emptyJournal();journalBlocked=false;journalNotice='';
 try{journalSnapshot=localStorage.getItem(JOURNAL_KEY);journalLegacySnapshot=localStorage.getItem(LEGACY_JOURNAL_KEY);const raw=journalSnapshot??journalLegacySnapshot;if(raw!==null)journal=validateJournal(JSON.parse(raw));if(journalSnapshot===null&&journalLegacySnapshot!==null)journalNotice='Ancien journal repris. Sa copie d’origine reste conservée ; aucune émission historique n’est recalculée automatiquement.'}
 catch{journalBlocked=true;journalNotice='Journal non chargé : format inconnu, données invalides ou stockage inaccessible. L’original est conservé. Recharger avec une version compatible ou effacer explicitement le journal.'}
}
function writeJournal(next){
 try{
  if(journalBlocked)throw new Error('Journal non chargé : écriture bloquée.');
  if(localStorage.getItem(JOURNAL_KEY)!==journalSnapshot||localStorage.getItem(LEGACY_JOURNAL_KEY)!==journalLegacySnapshot)throw new Error('Journal modifié dans un autre onglet. Recharger avant de réessayer.');
  const clean=validateJournal(next),raw=JSON.stringify(clean);localStorage.setItem(JOURNAL_KEY,raw);journalSnapshot=raw;journal=clean;journalNotice='';return true;
 }catch(e){$('journalMessage').textContent='Enregistrement impossible. '+(journalBlocked||e.message.includes('autre onglet')||e.message.includes('volumineux')?e.message:'Stockage indisponible, plein ou données invalides. Le formulaire et les données précédentes sont conservés.');return false}
}
function renderJournal(){
 $('journalEnable').checked=journal.enabled;$('journalEnable').disabled=journalBlocked;
 $('journalNew').disabled=!journal.enabled||journalBlocked;$('journalCopy').disabled=!journal.enabled||journalBlocked||!trip||busy;
 $('journalExport').disabled=journalBlocked;$('journalImportBtn').disabled=journalBlocked;$('journalExportLegacy').hidden=journalLegacySnapshot===null;
 $('journalState').textContent=journal.enabled?'Journal activé. Chaque ajout reste volontaire.':'Journal désactivé. Les entrées déjà enregistrées restent consultables et exportables.';
 const month=$('journalMonth').value;if(!/^\d{4}-\d{2}$/.test(month)){$('journalSummary').textContent='Choisir un mois valide.';$('journalCarbonSummary').textContent='';$('journalModes').replaceChildren();$('journalEntries').replaceChildren();return}
 const total=journalMonthly(journal.entries,month),km=n=>fmt(n/1000,2)+' km';
 $('journalSummary').textContent=`${total.count} trajet(s) confirmé(s) · ${km(total.meters)} renseignés${total.unknown?` · bilan partiel : ${total.unknown} distance(s) non renseignée(s)`:''}. ${total.count?(total.carbonUnknown===total.count?'CO₂e non estimé.':`Empreinte partielle : ${total.count-total.carbonUnknown}/${total.count} trajet(s) estimé(s).`):'Aucun déplacement confirmé ce mois-ci.'}`;
 $('journalCarbonSummary').textContent=Object.entries(total.carbonGroups).map(([scope,g])=>`${CARBON_SCOPES[scope]} : ${carbonAmount(g.valueKg)} pour ${g.count} trajet(s), part individuelle.`).join(' ') + (total.count?` ${total.carbonUnknown} trajet(s) sans estimation. Périmètres présentés séparément ; ce bilan ne constitue pas une empreinte complète.`:'');
 $('journalModes').replaceChildren();for(const [mode,m] of Object.entries(total.modes)){const li=document.createElement('li');li.textContent=`${JOURNAL_MODES[mode]} : ${m.count} trajet(s), ${km(m.meters)} renseignés${m.unknown?`, ${m.unknown} distance(s) manquante(s)`:''}. ${Object.entries(m.carbonGroups).map(([scope,g])=>`${CARBON_SCOPES[scope]} : ${carbonAmount(g.valueKg)} pour une personne`).join(' ; ')}${m.carbonUnknown?' · '+m.carbonUnknown+' trajet(s) sans estimation':''}.`;$('journalModes').append(li)}
 $('journalEntries').innerHTML=journal.entries.filter(e=>e.date.slice(0,7)===month).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id)).map(e=>`<article class="saved-row"><h3>${escapeHtml(e.start)} → ${escapeHtml(e.end)}</h3><p>${escapeHtml(e.date.split('-').reverse().join('/'))} · ${JOURNAL_MODES[e.mode]} · ${e.distanceMeters===null?'Distance non renseignée':km(e.distanceMeters)}</p><p>${e.distanceSource==='route'?'Distance issue du trajet préparé, confirmée par la personne':e.distanceSource==='declared'?'Distance déclarée par la personne':'Distance à compléter'} · ${currentCarbon(e)?carbonAmount(e.emissions.valueKg)+' estimés pour une personne':'CO₂e non estimé'}.</p>${e.note?`<p>${escapeHtml(e.note)}</p>`:''}<details><summary>Provenance et révision</summary><p>Confirmé le ${escapeHtml(new Date(e.createdAt).toLocaleString('fr-FR'))}. Révision ${e.revision}, mise à jour ${escapeHtml(new Date(e.updatedAt).toLocaleString('fr-FR'))}.</p><p>${e.calculation?`Calcul d’origine ${escapeHtml(e.calculation.start)} → ${escapeHtml(e.calculation.end)} · ${escapeHtml(e.calculation.engine.toUpperCase())} · ${escapeHtml(e.calculation.calculatedAt)} · ${km(e.calculation.distanceMeters)} · données ${escapeHtml(e.calculation.resourceVersion??'version non fournie')}${e.calculation.stop?' · arrêt '+escapeHtml(e.calculation.stop):''}. Ce calcul ne prouve pas le déplacement effectué.`:'Saisie manuelle, sans calcul d’itinéraire associé.'}</p><p>Les corrections conservent le calcul routier d’origine.</p></details>${journalCarbonMarkup(e)}<div class="dialog-actions"><button class="ghost" data-journal-edit="${e.id}" ${!journal.enabled?'disabled':''}>Modifier</button><button class="ghost" data-journal-delete="${e.id}">Supprimer</button></div></article>`).join('')||'<p class="note">Aucun trajet dans ce mois.</p>';
}
function carbonAmount(n){return n===0?'0 kg CO₂e':n<0.001?'< 0,001 kg CO₂e':fmt(n,3)+' kg CO₂e'}
function carbonDetails(c){
 if(c.status!=='estimated')return '<p>CO₂e non estimé. Une distance et un facteur compatible sont nécessaires.</p>';
 const f=c.factor,vehicle=f.unit==='kgCO2e/vehicle-km',rate=f.construction+f.energy;
 return `<p><strong>Part individuelle estimée : ${carbonAmount(c.valueKg)}</strong></p><p>${escapeHtml(f.label)} · ${fmt(c.input.distanceMeters/1000,3)} km × ${fmt(rate,6)} ${vehicle?'kg CO₂e / véhicule-km':'kg CO₂e / personne-km'}${vehicle?' ÷ '+c.occupants+' occupant(s), conducteur compris':''}.</p>${vehicle?`<p>Véhicule entier : ${carbonAmount(c.vehicleKg)}. Partage à parts égales ; ce total n’est pas ajouté à la part individuelle.</p>`:'<p>Facteur déjà exprimé par personne : aucune nouvelle division par le nombre de voyageurs.</p>'}<p>${CARBON_SCOPES[f.scope]} : fabrication ${fmt(f.construction,6)}, énergie ${fmt(f.energy,6)} kg CO₂e/km. Valeurs moyennes ; aucune correction selon la consommation réelle, la météo ou le chargement.${f.mode==='bike'?' Alimentation humaine exclue pour le vélo.':''} Aucune empreinte totale du mode n’est revendiquée.</p><p><a href="${f.source}" target="_blank" rel="noopener noreferrer">Source : ADEME / Impact CO₂</a> · jeu figé ${CARBON_DATA.retrievedAt} · version ${escapeHtml(c.dataset)} · calcul ${escapeHtml(c.calculatedAt)}.</p>`;
}
function journalCarbonMarkup(e){
 const history=e.emissionsHistory??[];
 return `<details><summary>Empreinte et méthode${history.length?' · '+history.length+' estimation(s) conservée(s)':''}</summary>${carbonDetails(e.emissions)}${history.map(h=>`<details><summary>Estimation précédente — ${escapeHtml(h.archivedAt)}</summary><p>${escapeHtml(h.reason)} · ${escapeHtml(h.estimate.input.start)} → ${escapeHtml(h.estimate.input.end)} · ${escapeHtml(h.estimate.input.date)}. Exclue du bilan courant.</p>${carbonDetails(h.estimate)}</details>`).join('')}</details>`;
}
function carbonDraftInput(){return {mode:$('journalMode').value,distanceMeters:$('journalDistance').value.trim()===''?null:Number($('journalDistance').value)*1000,start:$('journalStart').value.trim(),end:$('journalEnd').value.trim(),date:$('journalDate').value}}
function refreshCarbonChoices(){
 const mode=$('journalMode').value,factors=CARBON_DATA.factors.filter(f=>f.mode===mode),old=$('carbonFactor').value;
 $('carbonFactor').replaceChildren(new Option('Choisir le véhicule ou le transport',''),...factors.map(f=>new Option(f.label,f.id)));
 if(factors.some(f=>f.id===old))$('carbonFactor').value=old;
 $('carbonCalculate').disabled=!factors.length;if(!factors.length)$('carbonCalculate').checked=false;
 $('carbonAvailability').textContent=factors.length?'Estimation facultative, calculée sur cet appareil. Choisir le modèle correspondant au déplacement, indépendamment du profil enregistré.':'Aucun facteur qualifié pour ce mode. Les émissions restent non estimées, y compris pour la marche.';
 updateCarbonPreview();
}
function updateCarbonPreview(){
 const enabled=$('carbonCalculate').checked,factor=CARBON_DATA.factors.find(f=>f.id===$('carbonFactor').value),vehicle=factor?.unit==='kgCO2e/vehicle-km';
 $('carbonFields').hidden=!enabled;$('carbonFactor').disabled=!enabled;$('carbonFactor').required=enabled;
 $('carbonOccupantsWrap').hidden=!vehicle;$('carbonOccupants').disabled=!enabled||!vehicle;$('carbonOccupants').required=enabled&&vehicle;
 if(!enabled){const old=journalDraft?.entry;$('carbonPreview').textContent=old?.emissions.status==='estimated'?'L’estimation précédente sera conservée si les données du trajet restent identiques. Une correction de date, de lieux, de mode ou de distance l’archivera et retirera sa valeur du bilan.':'Aucune estimation ne sera ajoutée sans demande explicite.';return}
 try{const c=estimateCarbon(carbonDraftInput(),$('carbonFactor').value,Number($('carbonOccupants').value),new Date().toISOString());$('carbonPreview').innerHTML=carbonDetails(c)+'<p>Ce calcul sera enregistré après confirmation du trajet. Toute estimation précédente sera conservée dans son historique.</p>'}
 catch(e){$('carbonPreview').textContent=e.message}
}

function openJournal(){if(!$('journalMonth').value)$('journalMonth').value=journalDay().slice(0,7);$('journalMessage').textContent=journalNotice;renderJournal();if(!$('journalDialog').open)$('journalDialog').showModal()}
function journalForm(entry=null,fromRoute=false){
 if(!journal.enabled||journalBlocked)return;
 const now=new Date().toISOString();let e=entry?structuredClone(entry):{id:crypto.randomUUID(),date:journalDay(),start:'',end:'',mode:'car',distanceMeters:null,distanceSource:'unknown',note:'',createdAt:now,updatedAt:now,revision:1,calculation:null,emissions:{version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null}};
 if(fromRoute){if(!trip||busy)return;const r=selectedStop?.via||trip.base;e={...e,start:trip.places.start,end:trip.places.end,mode:trip.routing.vehicle.type==='truck'?'truck':'car',distanceMeters:r.distance,distanceSource:'route',calculation:{version:'route-snapshot-v1',engine:trip.routing.provider,start:trip.places.start,end:trip.places.end,resourceVersion:typeof r.resourceVersion==='string'?r.resourceVersion:null,calculatedAt:trip.calculatedAt,mode:trip.routing.vehicle.type==='truck'?'truck':'car',distanceMeters:r.distance,stop:selectedStop?selectedStop.station.address:null}}}
 journalDraft={entry:e,editing:!!entry};$('journalEditor').hidden=false;$('journalFormTitle').textContent=entry?'Corriger le trajet':'Confirmer un trajet effectué';
 for(const [id,k] of [['journalDate','date'],['journalStart','start'],['journalEnd','end'],['journalMode','mode'],['journalNote','note']])$(id).value=e[k];
 $('journalDistance').value=e.distanceMeters===null?'':String(Number((e.distanceMeters/1000).toFixed(3)));$('journalDate').max=journalDay();
 $('journalConfirm').checked=false;$('journalRepeat').checked=false;$('journalDuplicate').hidden=true;
 $('journalConfirmText').textContent=entry?'Je confirme ces corrections.':'J’ai effectué ce trajet.';
 $('journalOrigin').textContent=e.calculation?`Distance du trajet préparé (${e.calculation.engine.toUpperCase()})${e.calculation.stop?' avec arrêt : '+e.calculation.stop:''}. Ajuster si le déplacement réellement effectué diffère.`:'Saisie manuelle. La distance peut rester vide si elle est inconnue. Aucune émission n’est supposée nulle.';
 $('carbonCalculate').checked=false;refreshCarbonChoices();$('carbonFactor').value=e.emissions.status==='estimated'?e.emissions.factor.id:'';$('carbonOccupants').value=String(e.emissions.occupants??1);updateCarbonPreview();
 $('journalMessage').textContent='';$('journalDate').focus();
}
function saveJournalEntry(event){
 event.preventDefault();if(!journalDraft||!journal.enabled||journalBlocked)return;
 try{
  const d=journalDraft,e=structuredClone(d.entry),date=journalDate($('journalDate').value);if(date>journalDay())throw new Error('Un trajet effectué ne peut pas être daté dans le futur.');
  if(!$('journalConfirm').checked)throw new Error('Confirmer que le trajet a été effectué, ou confirmer les corrections.');
  const raw=$('journalDistance').value.trim(),distance=raw===''?null:journalNumber(Number(raw)*1000,40000000);
  Object.assign(e,{date,start:$('journalStart').value.trim(),end:$('journalEnd').value.trim(),mode:$('journalMode').value,note:$('journalNote').value.trim(),distanceMeters:distance,updatedAt:new Date().toISOString(),revision:d.editing?e.revision+1:1});
  e.distanceSource=distance===null?'unknown':e.calculation&&e.mode===e.calculation.mode&&e.start===e.calculation.start&&e.end===e.calculation.end&&distance===Number((e.calculation.distanceMeters/1000).toFixed(3))*1000?'route':'declared';
  if(e.distanceSource==='route')e.distanceMeters=e.calculation.distanceMeters;
  const candidates=journal.entries.filter(x=>x.id!==e.id&&journalIdentity(x)===journalIdentity(e));
  if(candidates.length&&!$('journalRepeat').checked){$('journalDuplicate').hidden=false;$('journalDuplicateText').textContent=`${candidates.length} trajet(s) identique(s) déjà enregistré(s) à cette date. Modifier l’entrée existante ou confirmer un autre déplacement.`;$('journalRepeat').focus();return}
  reviseCarbon(e,d.entry,$('carbonCalculate').checked?{factorId:$('carbonFactor').value,occupants:Number($('carbonOccupants').value)}:null,e.updatedAt);
  const next={...journal,entries:d.editing?journal.entries.map(x=>x.id===e.id?e:x):[...journal.entries,e]};validateJournal(next);
  if(writeJournal(next)){journalDraft=null;$('journalEditor').hidden=true;$('journalMonth').value=e.date.slice(0,7);renderJournal();$('journalMessage').textContent=d.editing?'Trajet corrigé. Bilan recalculé.':'Trajet effectué enregistré.';$('journalNew').focus()}
 }catch(e){$('journalMessage').textContent=e.message}
}
let journalImportSequence=0,pendingJournalImport=null;
function journalImportEntry(e){
 return `<p><strong>${escapeHtml(e.start)} → ${escapeHtml(e.end)}</strong></p><p>${escapeHtml(e.date)} · ${JOURNAL_MODES[e.mode]} · ${e.distanceMeters===null?'Distance inconnue':fmt(e.distanceMeters/1000,3)+' km'} · ${currentCarbon(e)?carbonAmount(e.emissions.valueKg)+' estimés':'CO₂e non estimé'}.</p>${e.note?`<p>${escapeHtml(e.note)}</p>`:''}<p class="note">${e.distanceSource==='route'?'Distance issue du trajet préparé':e.distanceSource==='declared'?'Distance déclarée':'Distance non renseignée'} · créé le ${escapeHtml(e.createdAt)} · révision ${e.revision} · mise à jour ${escapeHtml(e.updatedAt)} · ${(e.emissionsHistory??[]).length} estimation(s) historique(s).</p><details><summary>Calcul routier conservé</summary><p>${e.calculation?`${escapeHtml(e.calculation.engine.toUpperCase())} · ${escapeHtml(e.calculation.start)} → ${escapeHtml(e.calculation.end)} · ${fmt(e.calculation.distanceMeters/1000,3)} km · ${escapeHtml(e.calculation.calculatedAt)} · données ${escapeHtml(e.calculation.resourceVersion??'version non fournie')}${e.calculation.stop?' · arrêt : '+escapeHtml(e.calculation.stop):''}`:'Aucun calcul routier associé.'}</p></details>${journalCarbonMarkup(e)}`;
}
function refreshJournalImport(){
 const p=pendingJournalImport;if(!p)return;
 $('journalImportConfirm').checked=false;$('journalImportApply').disabled=true;
 try{
  const mode=$('journalImportMode').value,plan=planJournalImport(journal,p.source,mode,p.choices,i=>p.copyIds[i]);p.plan=plan;
  const dates=p.source.entries.map(e=>e.date).sort(),unknown=p.source.entries.filter(e=>e.distanceMeters===null).length,estimated=p.source.entries.filter(currentCarbon).length;
  $('journalImportSummary').textContent=`Fichier : ${p.filename}. ${p.source.entries.length} trajet(s)${dates.length?' du '+dates[0]+' au '+dates.at(-1):''} ; ${unknown} distance(s) inconnue(s), ${estimated} estimation(s) carbone conservée(s). Aucun nouveau calcul. Les champs étrangers au format reconnu ne sont pas repris.`;
  $('journalImportCurrent').textContent=`Journal actuel : ${journal.entries.length} trajet(s). Il restera ${journal.enabled?'activé':'désactivé'}, indépendamment du fichier. Le profil, les autres aperçus et la copie d’origine restent inchangés.`;
  $('journalImportOutcome').textContent=mode==='replace'?`Remplacement : les ${journal.entries.length} trajet(s) actuels seront remplacés par les ${p.source.entries.length} du fichier.${!p.source.entries.length?' Ce fichier est vide : le journal courant sera vidé.':''} Exporter le journal actuel permet de conserver une sauvegarde avant confirmation.`:`Ajout : ${plan.added} trajet(s), dont ${plan.copies} copie(s) distincte(s) ; ${plan.identical} déjà identique(s), ${plan.skipped} écarté(s), ${plan.unresolved} choix restant(s). Les trajets actuels sont conservés.`;
  $('journalImportRows').innerHTML=plan.rows.map(r=>{
   const names={restore:'À restaurer',new:'À ajouter',identical:'Déjà présent, inchangé',conflict:'Deux versions différentes du même trajet',duplicate:'Doublon possible : même date, lieux, mode et distance'};
   return `<article class="saved-row"><h3>Trajet ${r.index+1} · ${names[r.kind]}</h3><details><summary>Examiner le trajet du fichier</summary>${journalImportEntry(r.entry)}</details>${r.choice==='both'?'<p>Cette copie sera comptée comme une entrée distincte dans le bilan.</p>':''}${r.relatedCount&&r.kind!=='identical'?`<details><summary>Comparer avec les ${r.relatedCount} trajet(s) déjà retenu(s)</summary>${r.related.map(journalImportEntry).join('<hr>')}${r.relatedCount>3?'<p>Les trois premiers sont affichés. Exporter le journal actuel permet de consulter toutes ses entrées.</p>':''}</details>`:''}${['conflict','duplicate'].includes(r.kind)?`<label for="journalImportChoice${r.index}">Choix pour le trajet ${r.index+1}</label><select id="journalImportChoice${r.index}" data-journal-choice="${r.index}"><option value="">Choisir avant l’import</option><option value="skip" ${r.choice==='skip'?'selected':''}>Conserver uniquement les trajets déjà retenus</option><option value="${r.kind==='conflict'?'both':'add'}" ${['both','add'].includes(r.choice)?'selected':''}>${r.kind==='conflict'?'Conserver aussi cette version comme copie distincte':'Ajouter aussi ce déplacement'}</option></select>`:''}</article>`;
  }).join('')||'<p>Le fichier ne contient aucun trajet.</p>';
  $('journalImportMessage').textContent=plan.error||(plan.unresolved?'Résoudre les choix signalés avant de confirmer.':!plan.changed?'Aucun changement à importer.':'Vérifier le résultat, puis confirmer pour enregistrer.');
  $('journalImportConfirmText').textContent=mode==='replace'?'Je confirme le remplacement du journal actuel par le contenu du fichier.':'Je confirme les ajouts et les choix présentés.';
  $('journalImportConfirm').disabled=!plan.next||!plan.changed;
 }catch(e){p.plan=null;$('journalImportMessage').textContent='Import impossible : '+e.message;$('journalImportConfirm').disabled=true}
}
function bindJournalImport(){
 $('journalImportBtn').addEventListener('click',()=>{if(!journalBlocked)$('journalImportFile').click()});
 $('journalImportCancel').addEventListener('click',()=>$('journalImportDialog').close());
 $('journalImportDialog').addEventListener('close',()=>{pendingJournalImport=null;journalImportSequence++;$('journalImportFile').value='';if($('journalDialog').open)$('journalImportBtn').focus()});
 $('journalDialog').addEventListener('close',()=>{journalImportSequence++;pendingJournalImport=null;if($('journalImportDialog').open)$('journalImportDialog').close()});
 $('journalImportExport').addEventListener('click',()=>{if(!journalBlocked)downloadProfile(journal,'DragonRoute-journal-avant-import.json')});
 $('journalImportMode').addEventListener('change',refreshJournalImport);
 $('journalImportRows').addEventListener('change',ev=>{const i=ev.target.dataset.journalChoice;if(i===undefined||!pendingJournalImport)return;pendingJournalImport.choices[i]=ev.target.value;refreshJournalImport();$('journalImportChoice'+i)?.focus()});
 $('journalImportConfirm').addEventListener('change',()=>{$('journalImportApply').disabled=!$('journalImportConfirm').checked||!pendingJournalImport?.plan?.next||!pendingJournalImport.plan.changed});
 $('journalImportFile').addEventListener('change',async ev=>{
  const file=ev.target.files[0];ev.target.value='';if(!file)return;const seq=++journalImportSequence;pendingJournalImport=null;$('journalImportApply').disabled=true;$('journalMessage').textContent='Lecture de la sauvegarde…';
  try{
   if(journalBlocked)throw new Error('Le journal actuel ne peut pas être chargé. Son remplacement est bloqué.');
   if(file.size>2000000)throw new Error('Fichier trop volumineux : limite de 2 Mo.');
   const source=validateJournal(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));
   if(seq!==journalImportSequence||!$('journalDialog').open)return;
   const reserved=new Set([...journal.entries,...source.entries].map(e=>e.id)),copyIds=source.entries.map(()=>{let id;do{id=crypto.randomUUID()}while(reserved.has(id));reserved.add(id);return id});
   pendingJournalImport={source,filename:file.name.slice(0,200),choices:{},copyIds,base:JSON.stringify(journal),plan:null};$('journalImportMode').value='merge';refreshJournalImport();$('journalMessage').textContent='';if(!$('journalImportDialog').open)$('journalImportDialog').showModal();
  }catch(e){if(seq===journalImportSequence){$('journalMessage').textContent='Import refusé : '+e.message+' Le journal existant est conservé.';if($('journalImportDialog').open)$('journalImportMessage').textContent=$('journalMessage').textContent}}
 });
 $('journalImportApply').addEventListener('click',()=>{
  const p=pendingJournalImport;if(!p||!$('journalImportConfirm').checked)return;
  try{
   if(p.base!==JSON.stringify(journal))throw new Error('Le journal a changé depuis la lecture du fichier. Annuler et reprendre l’import.');
   const plan=planJournalImport(journal,p.source,$('journalImportMode').value,p.choices,i=>p.copyIds[i]);if(!plan.next||!plan.changed)throw new Error(plan.error||'Résoudre les choix avant de confirmer.');
   if(!writeJournal(plan.next))throw new Error($('journalMessage').textContent);
   const latest=journal.entries.map(e=>e.date).sort().at(-1);if(latest)$('journalMonth').value=latest.slice(0,7);
   pendingJournalImport=null;journalDraft=null;$('journalEditor').hidden=true;$('journalImportDialog').close();renderJournal();$('journalMessage').textContent='Sauvegarde importée. Sources, calculs et historiques conservés ; aucun nouveau calcul.';
  }catch(e){$('journalImportMessage').textContent=e.message+' Aucun remplacement effectué.'}
 });
}

function bindJournal(){
 loadJournal();bindJournalImport();$('journalBtn').addEventListener('click',openJournal);
 $('journalRecordBtn').addEventListener('click',()=>{openJournal();if(journal.enabled)journalForm(null,true);else $('journalMessage').textContent='Activer volontairement le journal, puis reprendre le trajet affiché.'});
 $('journalEnable').addEventListener('change',()=>{if(writeJournal({...journal,enabled:$('journalEnable').checked})){journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent=journal.enabled?'Journal activé. Aucun trajet ajouté automatiquement.':'Journal désactivé. Les données restent conservées.'}else $('journalEnable').checked=journal.enabled});
 $('journalNew').addEventListener('click',()=>journalForm());$('journalCopy').addEventListener('click',()=>journalForm(null,true));
 $('journalMonth').addEventListener('change',renderJournal);$('journalForm').addEventListener('submit',saveJournalEntry);
 $('journalForm').addEventListener('input',e=>{updateCarbonPreview();if(e.target.id!=='journalRepeat'){$('journalRepeat').checked=false;$('journalDuplicate').hidden=true}});
 $('journalMode').addEventListener('change',()=>{refreshCarbonChoices();if(journalDraft&&$('journalMode').value!==journalDraft.entry.mode){$('journalDistance').value='';$('journalOrigin').textContent='Mode modifié : renseigner la distance effectivement parcourue dans ce mode. Le calcul routier d’origine reste conservé comme référence.'}});
 $('carbonCalculate').addEventListener('change',updateCarbonPreview);$('carbonFactor').addEventListener('change',updateCarbonPreview);$('journalMode').addEventListener('change',updateCarbonPreview);
 $('journalExportLegacy').addEventListener('click',()=>{if(journalLegacySnapshot!==null){try{downloadProfile(JSON.parse(journalLegacySnapshot),'DragonRoute-journal-origine.json')}catch{$('journalMessage').textContent='Ancienne copie illisible, conservée dans le navigateur.'}}});
 $('journalCancel').addEventListener('click',()=>{journalDraft=null;$('journalEditor').hidden=true;$('journalNew').focus()});
 $('journalDialog').addEventListener('close',()=>{journalDraft=null;$('journalEditor').hidden=true});
 $('journalEntries').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const e=journal.entries.find(x=>x.id===(b.dataset.journalEdit||b.dataset.journalDelete));if(!e)return;if(b.dataset.journalEdit)journalForm(e);else if(confirm('Supprimer ce trajet confirmé ? Le bilan sera recalculé.')&&writeJournal({...journal,entries:journal.entries.filter(x=>x.id!==e.id)})){journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent='Trajet supprimé. Bilan recalculé.'}});
 $('journalExport').addEventListener('click',()=>{if(!journalBlocked)downloadProfile(journal,'DragonRoute-journal.json')});
 $('journalErase').addEventListener('click',()=>{
  if(!confirm('Effacer uniquement le journal de cet environnement ? Le profil et les autres aperçus seront conservés.'))return;
  try{if(localStorage.getItem(JOURNAL_KEY)!==journalSnapshot||localStorage.getItem(LEGACY_JOURNAL_KEY)!==journalLegacySnapshot)throw new Error('Journal modifié dans un autre onglet : recharger avant de l’effacer.');localStorage.removeItem(LEGACY_JOURNAL_KEY);localStorage.removeItem(JOURNAL_KEY);loadJournal();journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent='Journal effacé et désactivé.'}catch(e){$('journalMessage').textContent='Effacement impossible. '+e.message}
 });
}

function placeDescription(place){return `${place.label} · IGN · choix du ${new Date(place.resolvedAt).toLocaleDateString('fr-FR')}`}
function clearRememberedInput(field){preparationInputs[field]=null;resumePreparation=null;updateResumePreparation();rememberedInputs[field]=null;favoriteInputs[field]=null;$(field+'PlaceNote').hidden=true}
function resetRememberedInputs(){clearRememberedInput('start');clearRememberedInput('end')}
async function resolveTripPlace(value,field){
 const prepared=preparationInputs[field];if(prepared?.value===value)return structuredClone(prepared.place);
 const favorite=favoriteInputs[field];
 if(favorite?.value===value&&!temporaryAddress(value)){rememberedInputs[field]=structuredClone(favorite);return favorite.place}
 const place=await geocode(temporaryAddress(value)&&field==='start'?'__CURRENT__':value,field);
 rememberedInputs[field]=temporaryAddress(value)?null:{value,place:{...place,source:'ign',resolvedAt:new Date().toISOString()}};
 return place;
}
function resetAddressDuplicates(){$('addressDuplicates').hidden=true;$('allowAddressDuplicate').checked=false}
function updateAddressDraft(){
 $('addressPlaceStatus').textContent=addressDraft?`Lieu mémorisé : ${placeDescription(addressDraft.place)}.`:'Lieu non mémorisé : il sera recherché lors du trajet. Vérifier le lieu permet de le conserver dès maintenant.';
}
function invalidateAddressDraft(){addressLookupSequence++;addressDraft=null;$('resolveAddressBtn').disabled=false;resetAddressDuplicates();updateAddressDraft()}
function resetAddressForm(){$('addressForm').reset();$('addressId').value='';$('cancelAddressEdit').hidden=true;invalidateAddressDraft()}
async function resolveAddressDraft(){
 const value=$('addressValue').value.trim();
 if(!value||temporaryAddress(value)){$('profileMessage').textContent='Saisir une adresse fixe complète, pas le libellé GPS temporaire.';return}
 const seq=++addressLookupSequence;const current=()=>seq===addressLookupSequence&&$('profileDialog').open&&$('addressValue').value.trim()===value;
 $('resolveAddressBtn').disabled=true;$('addressPlaceStatus').textContent='Recherche du lieu…';
 try{
  const place=await geocode(value,'address',current);if(!current())return;
  addressDraft={value,place:validateSavedPlace({...place,source:'ign',resolvedAt:new Date().toISOString()})};resetAddressDuplicates();updateAddressDraft();$('profileMessage').textContent='Lieu retenu. Enregistrer l’adresse pour le conserver.';
 }catch(e){if(current()){$('profileMessage').textContent=e.message;updateAddressDraft()}}
 finally{if(current())$('resolveAddressBtn').disabled=false}
}
function applyVehicle(){
  if($("fuel").value!==profile.vehicle.fuel){$("budgetPrice").value="";budgetReference=null}
  $("fuel").value=profile.vehicle.fuel;$("cons").value=profile.vehicle.cons;$("liters").value=profile.vehicle.liters;
  $("routeVehicle").value=profile.vehicle.type;
  for(const [key,id] of Object.entries(dimensionFields))$(id).value=profile.vehicle.dimensions?.[key]??"";
  updateVehicleRouting();
  $("activeVehicle").hidden=!profile.vehicle.name&&profile.vehicle.type==="car";
  $("activeVehicle").textContent=(profile.vehicle.name||"Mon véhicule")+" · "+profile.vehicle.fuel;
  if(trip){clearResults();setStatus("Véhicule modifié. Trajet à recalculer.")}
  updateRange();
}
function renderSaved(){
  $("savedAddresses").innerHTML=profile.addresses.length?profile.addresses.map(a=>`<div class="saved-row"><strong>${escapeHtml(a.name)}</strong><p>${escapeHtml(a.value)}</p><p>${a.place?`Lieu mémorisé : ${escapeHtml(placeDescription(a.place))}`:temporaryAddress(a.value)?"Adresse GPS temporaire à remplacer.":"Lieu à rechercher lors du trajet."}</p><div class="dialog-actions"><button class="ghost" data-address-start="${escapeHtml(a.id)}">Départ</button><button class="ghost" data-address-end="${escapeHtml(a.id)}">Arrivée</button><button class="ghost" data-address-edit="${escapeHtml(a.id)}">Modifier</button><button class="ghost" data-address-remove="${escapeHtml(a.id)}">Supprimer</button></div></div>`).join(""):"<p class=note>Aucune adresse enregistrée.</p>";
  $("savedStations").innerHTML=profile.stations.length?profile.stations.map(s=>`<div class="saved-row"><strong>${escapeHtml(s.city||"Station")}</strong><p>${escapeHtml(s.address)}</p><div class="dialog-actions"><button class="ghost" data-favorite-open="${escapeHtml(s.id)}">Voir la station</button><button class="ghost" data-favorite-remove="${escapeHtml(s.id)}">Retirer</button></div></div>`).join(""):"<p class=note>Aucune station enregistrée.</p>";
}
function openProfile(){
  if(busy)return;
  $("profileMessage").textContent=storageNotice;
  for(const [id,key] of [["vehicleName","name"],["vehicleType","type"],["vehicleFuel","fuel"],["vehicleCons","cons"],["vehicleLiters","liters"]])$(id).value=profile.vehicle[key];
  $("savedDimensionsNote").textContent=profile.vehicle.dimensions?"Gabarit mémorisé : "+dimensionLabel(profile.vehicle.dimensions):"Aucun gabarit mémorisé.";
  $("exportProfileBtn").disabled=profileWriteBlocked;$("exportLegacyProfileBtn").hidden=!legacyProfile;
  renderSaved();if(!$("profileDialog").open)$("profileDialog").showModal();
}
function updateFavorite(){
  const saved=currentStation&&profile.stations.some(s=>s.id===currentStation.id);
  $("favoriteBtn").textContent=saved?"Retirer des favoris":"Enregistrer la station";
  $("favoriteBtn").setAttribute("aria-pressed",String(Boolean(saved)));
}
// BEGIN STATION HOURS MODEL
const PARIS_TIME=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function parisLocal(ms){return PARIS_TIME.format(new Date(ms)).replace(' ','T')}
function departureInstant(value){
  if(!/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return {error:'Renseigner une date et une heure de départ entre 2000 et 2099 (heure de Paris).'};
  const pseudo=Date.parse(value+'Z');
  if(!Number.isFinite(pseudo)||new Date(pseudo).toISOString().slice(0,16)!==value)return {error:'Date ou heure de départ invalide.'};
  // Europe/Paris uses UTC+1/+2 in this bounded period. Matching both candidates
  // rejects nonexistent spring times and ambiguous autumn times explicitly.
  const candidates=[pseudo-36e5,pseudo-72e5].filter(ms=>parisLocal(ms)===value);
  if(candidates.length!==1)return {error:candidates.length?'Cette heure existe deux fois au changement d’heure. Choisir une heure non ambiguë.':'Cette heure n’existe pas au changement d’heure. Choisir une autre heure.'};
  return {instant:candidates[0],error:''};
}
function stationSchedule(raw,declared){
  let h;try{h=typeof raw==='string'?JSON.parse(raw):raw}catch{}
  if(!h||typeof h!=='object'||Array.isArray(h))h={};
  const rawAuto=h['@automate-24-24'],fromRaw=rawAuto==='1'?'yes':rawAuto===''?'no':null;
  const fromField=declared==='Oui'?'yes':declared==='Non'?'no':null;
  const conflict=fromRaw&&fromField&&fromRaw!==fromField;
  const automate=conflict?'unknown':fromRaw||fromField||'unknown',days={};
  const rows=Array.isArray(h.jour)?h.jour:h.jour?[h.jour]:[];
  const minute=value=>{if(typeof value!=='string'||! /^(?:[01]?\d|2[0-3])[:.]\d{2}$|^24[:.]00$/.test(value))return null;const [hr,min]=value.split(/[:.]/).map(Number);return min<60?hr*60+min:null};
  for(const row of rows.slice(0,20)){
    if(!row||! /^(?:[1-7])$/.test(String(row['@id'])))continue;
    const id=Number(row['@id']);
    if(days[id]){days[id]={known:false,slots:[]};continue}
    const slots=Array.isArray(row.horaire)?row.horaire:row.horaire?[row.horaire]:[];
    const parsed=slots.slice(0,12).map(s=>[minute(s?.['@ouverture']),minute(s?.['@fermeture'])]);
    const valid=parsed.length>0&&slots.length<=12&&parsed.every(([a,b])=>a!==null&&b!==null&&a<1440&&a!==b);
    // Closed-day flags take precedence over stale placeholder slots in the feed.
    const closed=String(row['@ferme'])==='1';
    const validFlag=row['@ferme']==null||['','0','1'].includes(String(row['@ferme']));
    days[id]={known:validFlag&&(closed||valid),closed,slots:closed?[]:parsed.filter(([a,b])=>a!==null&&b!==null&&a<1440&&a!==b)};
  }
  return {automate,conflict:Boolean(conflict),days};
}
function counterAt(schedule,arrival){
  const local=parisLocal(arrival),weekday=new Date(local.slice(0,10)+'T12:00:00Z').getUTCDay()||7;
  const t=Number(local.slice(11,13))*60+Number(local.slice(14,16)),day=schedule.days[weekday],previous=schedule.days[weekday===1?7:weekday-1];
  const carry=previous?.known&&previous.slots.some(([a,b])=>b<a&&t<b);
  if(carry&&day?.closed)return 'unknown';
  if(day?.known&&day.slots.some(([a,b])=>a<=t&&(b<a||t<b)))return 'compatible';
  if(carry)return 'compatible';
  return day?.known&&previous?.known?'outside':'unknown';
}
function arrivalOpening(station,departure){
  const schedule=stationSchedule(station.hours,station.automate),base={state:'unknown',kind:'unknown',arrival:null,automate:schedule.automate,counter:'unknown'};
  if(!Number.isFinite(departure)||!Number.isFinite(station.accessSeconds)||station.accessSeconds<0)return {...base,reason:'Arrivée non estimée : départ ou durée d’accès manquant.'};
  if(!/^(?:0[1-9]|[1-8]\d|9[0-5])\d{3}$/.test(station.postalCode||'')||!Number.isFinite(station.lat)||!Number.isFinite(station.lon)||station.lat<41.2||station.lat>51.2||station.lon< -5.5||station.lon>9.7)return {...base,reason:'Fuseau non qualifié pour cette station ; estimation limitée à la France métropolitaine.'};
  const arrival=departure+station.accessSeconds*1000;if(!Number.isFinite(arrival)||Math.abs(arrival)>8.64e15)return base;
  const counter=counterAt(schedule,arrival),result={...base,arrival,counter};
  if(schedule.conflict)return {...result,reason:'Indications d’automate contradictoires : à vérifier.'};
  if(schedule.automate==='yes'&&station.fuel!=='GPLc')return {...result,state:'compatible',kind:'automate',reason:'Automate 24 h/24 déclaré'};
  if(counter==='compatible')return {...result,state:'compatible',kind:'counter',reason:'Dans les horaires habituels du guichet'};
  if(counter==='outside'&&schedule.automate==='no')return {...result,state:'outside',kind:'counter',reason:'Hors horaires déclarés du guichet ; aucun automate 24 h/24 déclaré'};
  return {...result,reason:station.fuel==='GPLc'&&schedule.automate==='yes'?'Guichet non confirmé à cette heure ; automate non qualifié pour le GPLc.':'Horaires à l’arrivée inconnus ou incomplets.'};
}
// END STATION HOURS MODEL

function stationOpening(s){return arrivalOpening(s,departureInstant($("stationDeparture").value).instant)}
function arrivalLabel(ms){return new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ms))}
function openingText(s){const o=stationOpening(s);return (o.arrival?`Arrivée estimée le ${arrivalLabel(o.arrival)} (Paris) · `:'')+o.reason}
function refreshArrival(){
  updateResumePreparation();
  const d=departureInstant($("stationDeparture").value);
  $("stationDeparture").setAttribute('aria-invalid',String(Boolean(d.error)));
  $("stationDepartureStatus").textContent=d.error||`Départ fixé au ${arrivalLabel(d.instant)} (Paris). Durée routière d’accès, sans pauses ni trafic en direct.${d.instant<Date.now()-60000?' Heure passée : actualiser le départ pour un trajet à venir.':''}`;
  if(stationSearch)renderStations(compared,stopWindow().mode);
  if($("stationDialog").open&&currentStation)renderStationDetails(currentStation);
}

// BEGIN PREPARED TRIPS MODEL
function preparedText(v,max,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error('Texte de préparation invalide.');return v.trim()}
function preparedNumber(v,min,max){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('Valeur de préparation invalide.');return v}
function preparedEnum(v,values){if(!values.includes(v))throw new Error('Option de préparation inconnue.');return v}
function preparedBool(v){if(typeof v!=='boolean')throw new Error('Option de préparation invalide.');return v}
function preparedDate(v){if(typeof v!=='string'||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)throw new Error('Date de préparation invalide.');return v}
function preparedPoint(p){if(!p||typeof p!=='object')throw new Error('Lieu de préparation manquant.');return {label:preparedText(p.label,1000,true),lat:preparedNumber(p.lat,-90,90),lon:preparedNumber(p.lon,-180,180)}}
function validatePreparedEntry(e){
 if(!e||!e.places||!e.vehicle||!e.preferences||!e.snapshot)throw new Error('Préparation incomplète.');
 const v=e.vehicle,p=e.preferences,r=e.snapshot,nullable=(v,min,max)=>v===null?null:preparedNumber(v,min,max);
 const vehicle={type:preparedEnum(v.type,['car','truck']),fuel:preparedEnum(v.fuel,['E10','Gazole','SP95','SP98','E85','GPLc']),cons:preparedNumber(v.cons,1,100),liters:preparedNumber(v.liters,1,2000),dimensions:null};
 if(v.type==='truck'){
  if(!v.dimensions)throw new Error('Gabarit de la préparation manquant.');
  vehicle.dimensions=Object.fromEntries(Object.entries({height:6,width:6,length:40,weight:100,axleload:30}).map(([key,max])=>[key,preparedNumber(v.dimensions[key],.01,max)]));
  if(vehicle.dimensions.axleload>vehicle.dimensions.weight)throw new Error('Charge par essieu incohérente.');
 }
 if(!Array.isArray(p.avoid)||p.avoid.length>3||new Set(p.avoid).size!==p.avoid.length||!Array.isArray(p.services)||p.services.length>50)throw new Error('Filtres de préparation invalides.');
 const preferences={avoid:p.avoid.map(x=>preparedEnum(x,['tollways','highways','ferries'])),departure:p.departure===null?null:preparedText(p.departure,16,true),stopMode:preparedEnum(p.stopMode,['soon','near','around']),stopKm:preparedNumber(p.stopKm,5,40000),rangeMode:preparedEnum(p.rangeMode,['none','km','liters']),rangeValue:nullable(p.rangeValue,0,5000),reserveKm:preparedNumber(p.reserveKm,0,500),rangeOnly:preparedBool(p.rangeOnly),maxDetourKm:nullable(p.maxDetourKm,0,1000),maxDetourMin:nullable(p.maxDetourMin,0,1440),services:p.services.map(x=>preparedText(x,200,true)),openingFilter:preparedEnum(p.openingFilter,['all','compatible','outside','unknown']),listMode:preparedEnum(p.listMode,['recommended','all','cost','price','detour'])};
 if(preferences.departure!==null&&departureInstant(preferences.departure).error)throw new Error('Heure de départ de la préparation invalide ou ambiguë.');
 if(new Set(preferences.services).size!==preferences.services.length||(preferences.rangeMode!=='none'&&preferences.rangeValue===null)||(preferences.rangeMode==='none'&&preferences.rangeOnly)||(preferences.rangeMode==='liters'&&preferences.rangeValue>2000))throw new Error('Autonomie ou services incohérents.');
 if(!Array.isArray(r.geometry)||r.geometry.length<2||r.geometry.length>25000)throw new Error('Le tracé doit contenir de 2 à 25 000 points.');
 const geometry=r.geometry.map(p=>{if(!Array.isArray(p)||p.length!==2)throw new Error('Point du tracé invalide.');return [preparedNumber(p[0],-180,180),preparedNumber(p[1],-90,90)]});
 const stop=r.stop===null?null:{id:preparedText(r.stop?.id,80,true),address:preparedText(r.stop?.address,300,true),city:preparedText(r.stop?.city,100),lat:preparedNumber(r.stop?.lat,-90,90),lon:preparedNumber(r.stop?.lon,-180,180)};
 const clean={id:preparedText(e.id,80,true),name:preparedText(e.name,80,true),savedAt:preparedDate(e.savedAt),places:{start:preparedPoint(e.places.start),end:preparedPoint(e.places.end)},vehicle,preferences,snapshot:{calculatedAt:preparedDate(r.calculatedAt),engine:preparedEnum(r.engine,['osrm','ign','ors']),distanceMeters:preparedNumber(r.distanceMeters,0,40000000),durationSeconds:preparedNumber(r.durationSeconds,0,31536000),geometry,stop}};
 if(!/^[A-Za-z0-9-]+$/.test(clean.id)||clean.snapshot.calculatedAt>clean.savedAt)throw new Error('Identité ou chronologie de préparation incohérente.');
 return clean;
}
function validatePreparedTrips(data){
 if(!data||data.kind!=='dragonroute-preparations'||data.version!==1||!Array.isArray(data.entries)||data.entries.length>20)throw new Error('Format inconnu ou limite de 20 préparations dépassée.');
 const clean={kind:'dragonroute-preparations',version:1,entries:data.entries.map(validatePreparedEntry)};
 if(new Set(clean.entries.map(e=>e.id)).size!==clean.entries.length)throw new Error('Identifiants de préparations dupliqués.');
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('Limite de 2 Mo atteinte. Exporter puis retirer des préparations avant de réessayer.');
 return clean;
}
function preparedDuplicates(entry,entries){
 const name=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR');
 const point=p=>[p.lat,p.lon];
 const key=e=>JSON.stringify([point(e.places.start),point(e.places.end),e.vehicle,e.preferences,e.snapshot.stop?.id||null]);
 return entries.filter(e=>e.id!==entry.id&&(name(e.name)===name(entry.name)||key(e)===key(entry)));
}
// END PREPARED TRIPS MODEL

const PREPARED_KEY='dragonroute.prepared.v1.'+PROFILE_SCOPE;
let preparedTrips={kind:'dragonroute-preparations',version:1,entries:[]},preparedSnapshot=null,preparedBlocked=false,preparedNotice='',preparedDraft=null,preparedSelected=null,preparedImport=null,preparedSequence=0,resumePreparation=null,preparedRangePending=false;
const preparationInputs={start:null,end:null};
function loadPreparedTrips(){
 preparedTrips={kind:'dragonroute-preparations',version:1,entries:[]};preparedBlocked=false;preparedNotice='';
 try{preparedSnapshot=localStorage.getItem(PREPARED_KEY);if(preparedSnapshot!==null)preparedTrips=validatePreparedTrips(JSON.parse(preparedSnapshot))}
 catch{preparedBlocked=true;preparedNotice='Préparations non chargées : format inconnu, contenu invalide ou stockage inaccessible. Les données restent conservées ; aucun remplacement automatique.'}
}
function writePreparedTrips(next){
 try{
  if(preparedBlocked)throw new Error('Préparations non chargées : remplacement bloqué.');
  if(localStorage.getItem(PREPARED_KEY)!==preparedSnapshot)throw new Error('Préparations modifiées dans un autre onglet. Recharger avant de réessayer.');
  const clean=validatePreparedTrips(next),raw=JSON.stringify(clean);localStorage.setItem(PREPARED_KEY,raw);preparedTrips=clean;preparedSnapshot=raw;return true;
 }catch(e){$('preparedMessage').textContent='Enregistrement impossible. '+e.message;return false}
}
function capturePreparedTrip(){
 const r=selectedStop?.via||trip?.base;if(!trip||!r)throw new Error('Calculer un trajet avant de le sauvegarder.');
 for(const id of ['cons','liters','reserveKm','maxDetourKm','maxDetourMin',...($('rangeMode').value==='none'?[]:['rangeValue'])]){const el=$(id),required=['cons','liters','reserveKm','rangeValue'].includes(id);if(!el.validity.valid||(required&&!el.value.trim()))throw new Error('Vérifier le champ « '+(el.labels?.[0]?.textContent||id)+' » avant de sauvegarder.')}
 const number=id=>$(id).value.trim()===''?null:Number($(id).value),rangeMode=$('rangeMode').value;
 const label=(value,field)=>temporaryAddress(value)?`Position ${field==='start'?'de départ':'d’arrivée'} enregistrée`:value;
 return validatePreparedEntry({id:crypto.randomUUID(),name:trip.label.slice(0,80),savedAt:new Date().toISOString(),places:{start:{label:label(trip.places.start,'start'),lat:trip.a[0],lon:trip.a[1]},end:{label:label(trip.places.end,'end'),lat:trip.b[0],lon:trip.b[1]}},
  vehicle:{type:trip.routing.vehicle.type,dimensions:trip.routing.vehicle.dimensions||null,fuel:$('fuel').value,cons:number('cons'),liters:number('liters')},
  preferences:{avoid:[...trip.routing.avoid],departure:$('stationDeparture').value||null,stopMode:stopWindow().mode,stopKm:Number($('stopKm').value),rangeMode,rangeValue:rangeMode==='none'?null:number('rangeValue'),reserveKm:number('reserveKm'),rangeOnly:$('rangeOnly').checked,maxDetourKm:number('maxDetourKm'),maxDetourMin:number('maxDetourMin'),services:serviceSelection(),openingFilter:$('stationOpeningFilter').value,listMode:$('stationListMode').value},
  snapshot:{calculatedAt:selectedStop?.confirmedAt||trip.calculatedAt,engine:trip.routing.provider,distanceMeters:r.distance,durationSeconds:r.duration,geometry:r.geometry.coordinates.map(p=>p.slice(0,2)),stop:selectedStop?{id:selectedStop.station.id,address:selectedStop.station.address,city:selectedStop.station.city,lat:selectedStop.station.lat,lon:selectedStop.station.lon}:null}});
}
function preparedSchemaSvg(e){
 const points=e.snapshot.geometry,lon=points.map(p=>p[0]),lat=points.map(p=>p[1]),minX=Math.min(...lon),minY=Math.min(...lat),dx=Math.max(.001,Math.max(...lon)-minX),dy=Math.max(.001,Math.max(...lat)-minY),scale=Math.min(520/dx,180/dy),x0=(600-dx*scale)/2,y0=(260-dy*scale)/2;
 const project=p=>[(p[0]-minX)*scale+x0,260-y0-(p[1]-minY)*scale],path=points.map(p=>project(p).map(n=>n.toFixed(2)).join(',')).join(' '),a=project(points[0]),b=project(points.at(-1)),stop=e.snapshot.stop,sp=stop?project([stop.lon,stop.lat]):null;
 return `<svg class="prepared-schema" viewBox="0 0 600 260" role="img" aria-label="Schéma du tracé enregistré, sans fond cartographique"><polyline points="${path}" fill="none" stroke="#82baff" stroke-width="5"/>${[a,b].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#fff"/>`).join('')}${sp?`<circle cx="${sp[0]}" cy="${sp[1]}" r="9" fill="#f2c66d"/>`:''}</svg>`;
}
function preparedDescription(e,withMap=false){
 const p=e.preferences,s=e.snapshot;
 return `<h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">Sauvegarde du ${escapeHtml(new Date(e.savedAt).toLocaleString('fr-FR'))}. Calcul ${s.engine.toUpperCase()} du ${escapeHtml(new Date(s.calculatedAt).toLocaleString('fr-FR'))}.</p>
 <p><strong>Instantané : ${fmt(s.distanceMeters/1000,1)} km · ${Math.round(s.durationSeconds/60)} min</strong>${s.stop?' · avec arrêt':''}</p>
 <p>${e.vehicle.type==='truck'?'Poids lourd · '+escapeHtml(dimensionLabel(e.vehicle.dimensions)):'Véhicule léger'} · ${escapeHtml(e.vehicle.fuel)} · ${fmt(e.vehicle.cons,1)} L/100 km · ${fmt(e.vehicle.liters,0)} L à acheter.</p>
 <p>Évitements : ${escapeHtml(p.avoid.length?p.avoid.map(x=>avoidLabels[x]).join(', '):'aucun')}. Départ prévu : ${escapeHtml(p.departure?p.departure.replace('T',' ')+' (Paris)':'non renseigné')}.</p>
 <p>${s.stop?'Arrêt mémorisé, à rechercher à nouveau : '+escapeHtml(s.stop.address):'Aucun arrêt mémorisé.'}</p>
 <details><summary>Préférences conservées</summary><p>${escapeHtml({soon:'Au plus tôt',near:'Bon compromis proche',around:'Vers '+p.stopKm+' km'}[p.stopMode])}. Détour maximal : ${p.maxDetourKm===null?'sans limite':fmt(p.maxDetourKm,1)+' km'} / ${p.maxDetourMin===null?'sans limite':fmt(p.maxDetourMin,1)+' min'}. Services : ${escapeHtml(p.services.join(', ')||'aucun requis')}. Filtre horaires : ${escapeHtml({all:'tous',compatible:'compatibles',unknown:'inconnus',outside:'hors guichet'}[p.openingFilter])}.</p><p>Autonomie : ${p.rangeMode==='none'?'inconnue':fmt(p.rangeValue,1)+(p.rangeMode==='km'?' km':' L')+', réserve '+fmt(p.reserveKm,0)+' km'}${p.rangeOnly?' · filtre de portée demandé':''}. L’autonomie conservée devra être actualisée au nouveau départ.</p></details>
 ${withMap?preparedSchemaSvg(e):''}<p class="note">Tracé et estimations historiques. Prix, péages, horaires, disponibilité et circulation actuels non conservés. La reprise charge les paramètres ; elle demande un nouveau calcul et une nouvelle confirmation de l’arrêt.</p>`;
}
function renderPreparedTrips(){
 $('preparedExport').disabled=preparedBlocked;$('preparedImportFile').disabled=preparedBlocked;
 $('preparedList').innerHTML=preparedTrips.entries.length?preparedTrips.entries.map(e=>`<article class="saved-row"><strong>${escapeHtml(e.name)}</strong><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">${escapeHtml(new Date(e.savedAt).toLocaleString('fr-FR'))} · instantané ${fmt(e.snapshot.distanceMeters/1000,1)} km</p><div class="row-actions"><button class="ghost" data-prepared-show="${e.id}">Consulter</button><button class="ghost" data-prepared-rename="${e.id}">Renommer</button><button class="ghost" data-prepared-delete="${e.id}">Supprimer</button></div></article>`).join(''):'<p class="note">Aucune préparation chargée.</p>';
 const selected=preparedTrips.entries.find(e=>e.id===preparedSelected);$('preparedView').hidden=!selected;
 if(selected)$('preparedDetails').innerHTML=preparedDescription(selected,true);
}
function openPreparedTrips(){
 if(busy)return;preparedDraft=null;preparedSelected=null;preparedImport=null;preparedSequence++;
 $('preparedEditor').hidden=true;$('preparedMessage').textContent=preparedNotice;renderPreparedTrips();if(!$('preparedDialog').open)$('preparedDialog').showModal();
}
function showPreparedEditor(entry,mode){
 preparedDraft={entry,mode};$('preparedEditor').hidden=false;$('preparedName').value=entry.name;$('preparedConfirm').checked=false;$('preparedDuplicate').checked=false;
 $('preparedEditorTitle').textContent=mode==='rename'?'Renommer cette préparation':'Enregistrer cette préparation';$('preparedSave').textContent=mode==='rename'?'Enregistrer le nom':'Enregistrer dans ce navigateur';$('preparedName').focus();updatePreparedDuplicates();
}
function updatePreparedDuplicates(){
 if(!preparedDraft)return;
 const entry={...preparedDraft.entry,name:$('preparedName').value},duplicates=preparedDuplicates(entry,preparedTrips.entries);
 $('preparedDuplicateRow').hidden=!duplicates.length;$('preparedDuplicateNote').textContent=duplicates.length?`${duplicates.length} préparation(s) portent déjà ce nom ou les mêmes paramètres. Aucun remplacement automatique.`:'';
 $('preparedSave').disabled=preparedBlocked||!$('preparedConfirm').checked||(duplicates.length&&!$('preparedDuplicate').checked);
}
function resumePreparedTrip(e){
 if(busy)return;if(trip&&!confirm('Remplacer les paramètres du trajet affiché par cette préparation ? Les résultats actuels seront effacés.'))return;
 clearResults();resetRememberedInputs();
 const p=e.preferences;for(const field of ['start','end']){const place=e.places[field];$(field).value=place.label;preparationInputs[field]={value:place.label,place:{lat:place.lat,lon:place.lon,label:place.label}};$(field+'PlaceNote').hidden=false;$(field+'PlaceNote').textContent='Point de la préparation sauvegardée, repris sans nouvelle recherche d’adresse.'}
 $('routeVehicle').value=e.vehicle.type;for(const [key,id] of Object.entries(dimensionFields))$(id).value=e.vehicle.dimensions?.[key]??'';
 $('fuel').value=e.vehicle.fuel;$('cons').value=e.vehicle.cons;$('liters').value=e.vehicle.liters;
 document.querySelectorAll('.avoid-options input').forEach(el=>el.checked=p.avoid.includes(el.value));
 $('budgetPrice').value='';budgetReference=null;clearTableTolls();tollState.enabled=false;resetTollQuote();
 document.querySelector(`input[name="stopMode"][value="${p.stopMode}"]`).checked=true;$('stopKm').max=String(Math.max(p.stopKm,5));$('stopKm').value=p.stopKm;
 $('rangeMode').value=p.rangeMode;$('rangeValue').value=p.rangeValue??'';$('reserveKm').value=p.reserveKm;$('rangeOnly').checked=p.rangeOnly;rangeMeasuredAt=null;
 $('maxDetourKm').value=p.maxDetourKm??'';$('maxDetourMin').value=p.maxDetourMin??'';$('stationOpeningFilter').value=p.openingFilter;$('stationListMode').value=p.listMode;
 $('serviceChoices').innerHTML=p.services.map(name=>`<label class="check-label"><input type="checkbox" data-service checked value="${escapeHtml(name)}"> ${escapeHtml(name)}</label>`).join('');
 // A previous departure is never silently moved to now. Blank it and request a choice.
 const departure=p.departure&&departureInstant(p.departure).instant,expired=!Number.isFinite(departure)||departure<Date.now()-60000;
 $('stationDeparture').value=expired?'':p.departure;resumePreparation={entry:structuredClone(e),expired,dismissed:false};$('activeVehicle').hidden=true;preparedRangePending=p.rangeMode!=='none';
 updateVehicleRouting();updateWindow();updateRange();refreshArrival();updateResumePreparation();
 $('preparedDialog').close();setStatus('Préparation reprise. Vérifier les paramètres puis calculer un nouveau trajet.');$('goBtn').focus();
}
function updateResumePreparation(){
 const e=resumePreparation?.entry;$('preparedResume').hidden=!e||resumePreparation.dismissed;if(!e)return;
 const departure=departureInstant($('stationDeparture').value).instant,expired=!Number.isFinite(departure)||departure<Date.now()-60000;
 let unavailable='';try{ensureRouting(routingPreferences())}catch(err){unavailable=' '+err.message}
 $('preparedResumeNote').textContent=`Préparation « ${e.name} » reprise. ${trip?'Nouveau trajet calculé ; vérifier les arrêts.':'Un nouveau calcul est nécessaire ; le tracé peut changer.'}${expired?' Départ passé ou absent : choisir une nouvelle heure dans les horaires des stations.':''}${preparedRangePending?' Autonomie mémorisée à actualiser pour ce départ.':''}${unavailable}`;
 const stop=e.snapshot.stop,found=stop&&compared.find(s=>s.id===stop.id);
 $('preparedStopNote').hidden=!stop;$('preparedStopNote').textContent=stop?`Arrêt souhaité : ${stop.address}. `+(selectedStop?.station.id===stop.id?'Confirmé dans ce nouveau trajet.':found?'Retrouvé dans les résultats actuels ; consulter sa fiche avant de le choisir.':stationSearch?'Non retrouvé dans cette recherche limitée : hors sélection, carburant absent ou informations indisponibles possibles. Aucun arrêt ajouté.':'Rechercher les stations après le nouveau calcul pour le retrouver. Aucun arrêt ajouté.') :'';
 $('preparedReviewStop').hidden=!found;$('preparedReviewStop').disabled=busy;
}
function bindPreparedTrips(){
 $('clearUnavailableOptions').addEventListener('click',()=>{if(busy)return;const inputs=[...document.querySelectorAll('.avoid-options input:checked')].filter(el=>el.dataset.routingAvailable==='false');if(!inputs.length||!confirm('Retirer explicitement ces exclusions du nouveau calcul : '+inputs.map(el=>avoidLabels[el.value]).join(', ')+' ? La préparation sauvegardée reste inchangée.'))return;inputs.forEach(el=>el.checked=false);invalidateRouting();updateResumePreparation()});
 for(const id of ['rangeMode','rangeValue','reserveKm'])$(id).addEventListener('input',()=>{preparedRangePending=false;updateRange();updateResumePreparation()});
 $('preparedBtn').addEventListener('click',openPreparedTrips);
 $('savePreparationBtn').addEventListener('click',()=>{if(busy)return;openPreparedTrips();try{showPreparedEditor(capturePreparedTrip(),'new')}catch(e){$('preparedMessage').textContent=e.message}});
 $('preparedName').addEventListener('input',()=>{$('preparedConfirm').checked=false;$('preparedDuplicate').checked=false;updatePreparedDuplicates()});
 for(const id of ['preparedConfirm','preparedDuplicate'])$(id).addEventListener('change',updatePreparedDuplicates);
 $('preparedForm').addEventListener('submit',ev=>{
  ev.preventDefault();if(!preparedDraft)return;
  try{
   const entry=validatePreparedEntry({...preparedDraft.entry,name:$('preparedName').value});
   if(!$('preparedConfirm').checked||(preparedDuplicates(entry,preparedTrips.entries).length&&!$('preparedDuplicate').checked))throw new Error('Confirmer l’enregistrement et le doublon éventuel.');
   const entries=preparedDraft.mode==='rename'?preparedTrips.entries.map(e=>e.id===entry.id?entry:e):[...preparedTrips.entries,entry];
   if(writePreparedTrips({kind:'dragonroute-preparations',version:1,entries})){preparedDraft=null;$('preparedEditor').hidden=true;preparedSelected=entry.id;renderPreparedTrips();$('preparedMessage').textContent='Préparation enregistrée dans ce navigateur.'}
  }catch(e){$('preparedMessage').textContent=e.message}
 });
 $('preparedList').addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;const id=b.dataset.preparedShow||b.dataset.preparedRename||b.dataset.preparedDelete,e=preparedTrips.entries.find(x=>x.id===id);if(!e)return;
  if(b.dataset.preparedShow){preparedDraft=null;$('preparedEditor').hidden=true;preparedSelected=id;renderPreparedTrips();$('preparedView').scrollIntoView({block:'start'})}
  else if(b.dataset.preparedRename)showPreparedEditor(structuredClone(e),'rename');
  else if(confirm(`Supprimer la préparation « ${e.name} » de ce navigateur ?`)&&writePreparedTrips({kind:'dragonroute-preparations',version:1,entries:preparedTrips.entries.filter(x=>x.id!==id)})){preparedSelected=null;preparedDraft=null;$('preparedEditor').hidden=true;renderPreparedTrips();$('preparedMessage').textContent='Préparation supprimée.'}
 });
 $('preparedResumeBtn').addEventListener('click',()=>{const e=preparedTrips.entries.find(x=>x.id===preparedSelected);if(e)resumePreparedTrip(e)});
 $('preparedReviewStop').addEventListener('click',()=>{const id=resumePreparation?.entry.snapshot.stop?.id;if(id)openStation(id)});
 $('preparedDismiss').addEventListener('click',()=>{if(resumePreparation)resumePreparation.dismissed=true;updateResumePreparation()});
 $('preparedExport').addEventListener('click',()=>{if(!preparedBlocked)downloadProfile(preparedTrips,'DragonRoute-preparations.json')});
 $('preparedBackup').addEventListener('click',()=>{if(!preparedBlocked)downloadProfile(preparedTrips,'DragonRoute-preparations-avant-import.json')});
 $('preparedErase').addEventListener('click',()=>{
  if(!confirm('Effacer toutes les préparations de cet environnement ? Le profil, le journal et les autres aperçus seront conservés.'))return;
  try{if(localStorage.getItem(PREPARED_KEY)!==preparedSnapshot)throw new Error('Données modifiées dans un autre onglet : recharger avant l’effacement.');localStorage.removeItem(PREPARED_KEY);loadPreparedTrips();preparedSelected=null;preparedDraft=null;$('preparedEditor').hidden=true;renderPreparedTrips();$('preparedMessage').textContent='Préparations effacées.'}catch(e){$('preparedMessage').textContent='Effacement impossible. '+e.message}
 });
 $('preparedImportFile').addEventListener('change',async ev=>{
  const seq=++preparedSequence,file=ev.target.files?.[0];ev.target.value='';preparedImport=null;if(!file)return;
  try{if(preparedBlocked)throw new Error('Stockage protégé : import indisponible.');if(file.size>2000000)throw new Error('Fichier supérieur à 2 Mo.');const data=validatePreparedTrips(JSON.parse(await file.text()));if(seq!==preparedSequence||!$('preparedDialog').open)return;
   preparedImport=data;$('preparedImportSummary').textContent=`${file.name} : ${data.entries.length} préparation(s), en remplacement des ${preparedTrips.entries.length} actuellement chargées.${data.entries.length?'':' Le fichier est vide et remplacera la liste par une liste vide.'} Lieux, tracés et paramètres sont déclaratifs ; les champs étrangers au format ne sont pas repris.`;
   $('preparedImportDetails').innerHTML=data.entries.map(e=>`<details><summary>${escapeHtml(e.name)}</summary>${preparedDescription(e)}</details>`).join('');$('preparedImportConfirm').checked=false;$('preparedImportApply').disabled=true;$('preparedImportMessage').textContent='';$('preparedImportDialog').showModal();
  }catch(e){if(seq===preparedSequence)$('preparedMessage').textContent='Import refusé. '+e.message}
 });
 $('preparedImportConfirm').addEventListener('change',()=>{$('preparedImportApply').disabled=!preparedImport||!$('preparedImportConfirm').checked});
 $('preparedImportApply').addEventListener('click',()=>{if(!preparedImport||!$('preparedImportConfirm').checked)return;if(writePreparedTrips(preparedImport)){preparedImport=null;preparedSelected=null;preparedDraft=null;$('preparedEditor').hidden=true;renderPreparedTrips();$('preparedImportDialog').close();$('preparedMessage').textContent='Sauvegarde de préparations restaurée. Aucun trajet recalculé.'}else $('preparedImportMessage').textContent=$('preparedMessage').textContent});
 $('preparedImportDialog').addEventListener('close',()=>{preparedSequence++;preparedImport=null;$('preparedImportFile').focus()});
 $('preparedDialog').addEventListener('close',()=>{preparedSequence++;preparedImport=null;preparedDraft=null});
}

function stationInfo(r){
  return {postalCode:typeof r.cp==="string"?r.cp:null,hours:r.horaires??null,automate:r.horaires_automate_24_24??null,services:Array.isArray(r.services_service)?r.services_service.filter(s=>typeof s==="string").map(s=>s.trim()).filter(Boolean).slice(0,50):[],receivedAt:new Date().toISOString()};
}
function hoursRows(raw){
  try{
    const h=typeof raw==="string"?JSON.parse(raw):raw;
    const days=Array.isArray(h?.jour)?h.jour:h?.jour?[h.jour]:[];
    return days.slice(0,7).map(day=>{
      const slots=Array.isArray(day.horaire)?day.horaire:day.horaire?[day.horaire]:[];
      const time=value=>typeof value==="string"&&/^(?:[01]?\d|2[0-3])[:h.][0-5]\d$|^24[:h.]00$/.test(value)?value.replace(/[h.]/,":"):null;
      const ranges=slots.map(slot=>[time(slot["@ouverture"]),time(slot["@fermeture"])]).filter(pair=>pair.every(Boolean)).map(pair=>pair.join(" – ")+(pair[0]===pair[1]?" (durée ambiguë — non interprétée)":""));
      return `${typeof day["@nom"]==="string"?day["@nom"]:"Jour"} : ${day["@ferme"]==="1"?"fermé":ranges.length?ranges.join(", "):"non renseigné"}`;
    });
  }catch{return []}
}
function renderStationDetails(s){
  const rows=hoursRows(s.hours);
  $("stationTitle").textContent=s.city?`Station à ${s.city}`:"Station";
  $("stationDetails").innerHTML=`<p class="detail-address">${escapeHtml(s.address)}</p><p>${Number.isFinite(s.price)?`${escapeHtml(s.fuel)} : ${fmt(s.price,3)} €/L · ${escapeHtml(age(s.updated))}`:"Prix actuel non renseigné pour le carburant choisi."}</p>${Number.isFinite(s.distanceFromStart)?`<p>${fmt(s.distanceFromStart,1)} km depuis le départ · ${escapeHtml(stationRangeText(s.distanceFromStart))}</p>`:""}
    <section class="detail-section"><h3>Horaires habituels à l’arrivée</h3><p class="station-opening" data-opening="${stationOpening(s).state}">${escapeHtml(openingText(s))}</p><p class="note">Départ + durée routière jusqu’à cette station, sans pauses ni trafic en direct. Jours fériés, fermetures exceptionnelles et disponibilité du carburant non vérifiés. L’automate déclaré ne précise pas les carburants accessibles.</p><h3>Horaires déclarés du guichet</h3><p class="note">Automate 24 h/24 : ${["Oui","Non"].includes(s.automate)?s.automate:"non renseigné"}. Le guichet, la boutique et l’automate sont distincts.</p>${rows.length?`<ul>${rows.map(row=>`<li>${escapeHtml(row)}</li>`).join("")}</ul>`:"<p>Horaires non renseignés.</p>"}</section>
    <section class="detail-section"><h3>Services déclarés</h3>${s.services?.length?`<ul>${s.services.map(service=>`<li>${escapeHtml(service)}</li>`).join("")}</ul>`:"<p>Services non renseignés.</p>"}</section>
    <p class="note">Source DGCCRF : horaires déclaratifs, sans date de mise à jour des horaires. La date du prix ne date pas les horaires. Ouverture et disponibilité à confirmer sur place.${s.receivedAt?` Données reçues le ${escapeHtml(new Date(s.receivedAt).toLocaleString("fr-FR"))}.`:""}</p><a class="detail-source" href="https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/" target="_blank" rel="noopener noreferrer">Source : données officielles des carburants ↗</a>`;
}
async function openStation(id){
  if(busy)return;
  const sequence=++detailSequence;
  const live=compared.find(s=>s.id===id),saved=profile.stations.find(s=>s.id===id);
  if(!live&&!saved)return;
  currentStation=live||saved;
  $("stationMessage").textContent="";$("favoriteBtn").disabled=false;
  $("detailChooseBtn").hidden=!live;updateFavorite();renderStationDetails(currentStation);
  if(!$("stationDialog").open)$("stationDialog").showModal();
  if(live)return;
  $("stationMessage").textContent="Actualisation de la fiche enregistrée…";
  try{
    const literal=/^\d+$/.test(id)?id:"'"+id.replaceAll("'","''")+"'";
    const q=new URLSearchParams({limit:"1",where:`id=${literal}`});
    const data=await getJSON(`${C.fuelApi}?${q}`,"Fiche station");
    if(sequence!==detailSequence)return;
    const record=data.results?.find(r=>String(r.id)===id);
    if(!record)throw new Error("Station absente de la réponse officielle.");
    currentStation=stationFrom(record,$("fuel").value)||{...saved,...stationInfo(record)};
    renderStationDetails(currentStation);$("stationMessage").textContent="Fiche actualisée. Recalcule les stations du trajet pour comparer cet arrêt.";
  }catch(e){if(sequence===detailSequence)$("stationMessage").textContent=`Informations actuelles indisponibles : ${e.message}`}
}
function dbg(...a){
  const s=a.map(v=>typeof v==="string"?v:JSON.stringify(v)).join(" ");
  log.push(new Date().toLocaleTimeString()+" "+s);
  $("diag").textContent=log.slice(-100).join("\n");
}
function setStatus(text,state=""){
  $("status").textContent=text;
  $("statusDot").className="status-dot"+(state?" "+state:"");
  dbg(text);
}
function health(id,state,label){
  const el=$(id); el.className="pill"+(state?" "+state:""); if(label) el.textContent=label;
}
function fmt(n,d=2){return Number(n).toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d})}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function valueNum(id,min,max){
  const n=Number($(id).value);
  if(!Number.isFinite(n)||n<min||n>max) throw new Error(`Valeur invalide : ${id}`);
  return n;
}
function makeTimeout(ms){
  const c=new AbortController(), t=setTimeout(()=>c.abort(),ms);
  const parent=activeAbort?.signal,onAbort=()=>c.abort();
  if(parent?.aborted)c.abort();else parent?.addEventListener("abort",onAbort,{once:true});
  return {signal:c.signal,done:()=>{clearTimeout(t);parent?.removeEventListener("abort",onAbort)}};
}
async function getJSON(url,label,ms=16000){
  dbg("GET",label,url);
  const t=makeTimeout(ms);
  try{
    const r=await fetch(url,{signal:t.signal,headers:{Accept:"application/json"}});
    if(!r.ok){
      const error=new Error(`${label} : HTTP ${r.status}`);
      error.status=r.status;
      const retry=r.headers.get("Retry-After");
      error.retryAfterMs=retry==null?0:/^\d+$/.test(retry)?Number(retry)*1000:Date.parse(retry)-Date.now();
      throw error;
    }
    return await r.json();
  }catch(e){
    if(e.name==="AbortError") throw new Error(`${label} : délai dépassé`);
    if(e instanceof TypeError) throw new Error(`${label} : requête réseau refusée`);
    throw e;
  }finally{t.done()}
}

function loadCss(href){
  return new Promise(resolve=>{
    if([...document.styleSheets].some(s=>s.href===href)) return resolve(true);
    const l=document.createElement("link"); l.rel="stylesheet"; l.href=href;
    l.onload=()=>resolve(true); l.onerror=()=>resolve(false); document.head.appendChild(l);
  });
}
function loadScript(src){
  return new Promise(resolve=>{
    const s=document.createElement("script"); s.src=src; s.async=true;
    s.onload=()=>resolve(true); s.onerror=()=>resolve(false); document.head.appendChild(s);
  });
}
async function initMap(){
  health("hMap","busy","carte…");
  const [cssOk,jsOk]=await Promise.all([loadCss(C.leafletCss),loadScript(C.leafletJs)]);
  if(!(cssOk&&jsOk&&window.L)){
    health("hMap","err","carte fallback");
    $("fallbackLabel").textContent="Carte externe indisponible — visualisation autonome active.";
    dbg("Leaflet indisponible, fallback SVG conservé.");
    return;
  }
  try{
    map=L.map("map",{zoomControl:true,attributionControl:true}).setView([46.7,2.4],6);
    L.tileLayer(C.tileUrl,{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
    markerLayer=L.featureGroup().addTo(map);
    $("mapFallback").style.display="none";
    health("hMap","ok","carte ✓");
    if(mapView)showOnMap(...mapView);
    new ResizeObserver(()=>map?.invalidateSize()).observe($("map"));
  }catch(e){
    map=null; health("hMap","err","carte fallback"); dbg("Map init",e.message);
  }
}
function makeGrid(){
  let s="";for(let x=100;x<1000;x+=100)s+=`<line class="gridline" x1="${x}" y1="0" x2="${x}" y2="700"/>`;
  for(let y=100;y<700;y+=100)s+=`<line class="gridline" x1="0" y1="${y}" x2="1000" y2="${y}"/>`;
  $("grid").innerHTML=s;
}

function choosePlace(places,field){
  const dialog=$("placeDialog");
  $("placeTitle").textContent=field==="address"?"Quelle adresse enregistrer ?":field==="start"?"Quel lieu de départ ?":"Quel lieu d’arrivée ?";
  $("placeChoices").innerHTML=`<legend>Plusieurs lieux correspondent</legend>${places.map((p,i)=>`<label><input type="radio" name="placeChoice" value="${i}"><span>${escapeHtml(p.label)}</span></label>`).join("")}`;
  $("confirmPlace").disabled=true;
  dialog.showModal();
  return new Promise((resolve,reject)=>{placePending={places,resolve,reject}});
}
function geocodedPlace(feature){
  const coordinates=feature?.geometry?.coordinates,p=feature?.properties;
  if(feature?.type!=="Feature"||feature.geometry?.type!=="Point"||!Array.isArray(coordinates)||coordinates.length!==2||
    !coordinates.every(Number.isFinite)||Math.abs(coordinates[0])>180||Math.abs(coordinates[1])>90||!p||!["address","poi"].includes(p._type))return null;
  const texts=value=>(Array.isArray(value)?value:[value]).filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim());
  const label=texts(p._type==="address"?p.label:p.toponym)[0]||texts(p.name)[0];
  if(!label)return null;
  const context=texts(p.context),categories=texts(p.category);
  const details=[...texts(p.postcode),...texts(p.city),...(context.length?context:texts(p.depcode).map(code=>"Département "+code)),
    ...(p._type==="poi"?(categories.includes("commune")?["commune"]:categories.slice(0,1)):[])];
  const parts=[label];
  for(const detail of details)if(!parts.some(part=>part.toLocaleLowerCase("fr-FR").includes(detail.toLocaleLowerCase("fr-FR"))))parts.push(detail);
  return {lat:coordinates[1],lon:coordinates[0],label:parts.join(" · ")};
}
async function geocode(q,field,isCurrent=()=>true){
  if(!isCurrent())throw new Error("Recherche du lieu annulée.");
  if(q==="__CURRENT__"){
    if(!currentPos) throw new Error("Position GPS non disponible");
    return {lat:currentPos[0],lon:currentPos[1],label:"Ma position"};
  }
  const query=q.trim().replace(/\s+/g," "),key=query.toLocaleLowerCase("fr-FR");
  const cached=geoCache.get(key);
  let places=cached&&performance.now()-cached.at<300000?cached.places:null;
  if(!places){
    const remaining=Math.ceil((geoBlockedUntil-performance.now())/1000);
    if(remaining>0)throw new Error(`Recherche d’adresses temporairement limitée. Réessayer dans ${remaining} s.`);
    await sleep(Math.max(0,250-(performance.now()-geoLastRequest)));
    if(activeAbort?.signal.aborted)throw new Error("Recherche d’adresses annulée.");
    geoLastRequest=performance.now();
    const p=new URLSearchParams({q:query,index:"address,poi",limit:"5",autocomplete:"false"});
    let d;
    try{d=await getJSON(`${C.geocodingApi}?${p}`,"Recherche d’adresses IGN")}
    catch(e){
      if(e.status===429){
        const delay=Math.max(5000,Number.isFinite(e.retryAfterMs)?e.retryAfterMs:0);
        geoBlockedUntil=performance.now()+delay;
        throw new Error(`Recherche d’adresses temporairement limitée. Réessayer dans ${Math.ceil(delay/1000)} s.`);
      }
      throw e;
    }
    if(!isCurrent())throw new Error("Recherche du lieu annulée.");
    if(d?.type!=="FeatureCollection"||!Array.isArray(d.features))throw new Error("Réponse de géocodage invalide.");
    if(!d.features.length)throw new Error(`Lieu introuvable en France : ${query}. Préciser la commune ou le code postal.`);
    places=[...new Map(d.features.map(geocodedPlace).filter(Boolean).map(p=>[`${p.lat},${p.lon},${p.label}`,p])).values()].slice(0,5);
    if(!places.length)throw new Error("Réponse de géocodage invalide : aucun lieu exploitable.");
    geoCache.delete(key);
    if(geoCache.size>=30)geoCache.delete(geoCache.keys().next().value);
    geoCache.set(key,{at:performance.now(),places});
  }
  if(!isCurrent())throw new Error("Recherche du lieu annulée.");
  return places.length===1?places[0]:choosePlace(places,field);
}
function validateDimensions(d){
  const maxima={height:6,width:6,length:40,weight:100,axleload:30};
  if(!d||Object.entries(maxima).some(([key,max])=>!Number.isFinite(d[key])||d[key]<=0||d[key]>max)||d.axleload>d.weight)throw new Error("Renseigner les cinq dimensions et charges du poids lourd. La charge par essieu ne peut pas dépasser le poids total.");
  return Object.fromEntries(Object.keys(maxima).map(key=>[key,d[key]]));
}
function dimensionLabel(d){return `H ${fmt(d.height,2)} m · l ${fmt(d.width,2)} m · L ${fmt(d.length,2)} m · ${fmt(d.weight,2)} t · essieu ${fmt(d.axleload,2)} t`}
function routeDimensions(){return validateDimensions(Object.fromEntries(Object.entries(dimensionFields).map(([key,id])=>[key,Number($(id).value)])))}
function routingEndpoint(){
  if(!C.routingApi)return null;
  try{const u=new URL(C.routingApi,location.href);if(u.username||u.password||u.search||u.hash||!(u.protocol==="https:"||(u.protocol==="http:"&&["localhost","127.0.0.1"].includes(u.hostname))))return null;return u.href}catch{return null}
}
function updateVehicleRouting(){
  const type=$("routeVehicle").value;
  const advanced=Boolean(routingEndpoint());
  for(const option of $("routeVehicle").options){
    option.disabled=option.value!=="car"&&(option.value!=="truck"||!advanced);
    if(option.value==="truck")option.textContent=advanced?"Poids lourd":"Poids lourd · indisponible";
  }
  document.querySelectorAll('.avoid-options input').forEach(el=>{
    const available=advanced||(C.ignRouting===true&&type==="car"&&el.value==="highways");
    el.disabled=busy||!available;el.dataset.routingAvailable=String(available);
    const label=el.closest('label').querySelector('.availability');
    if(label)label.textContent=available?"":"Indisponible";
  });
  $("avoidAvailability").textContent="";
  const unavailable=[...document.querySelectorAll('.avoid-options input:checked')].filter(el=>el.dataset.routingAvailable==='false');$("clearUnavailableOptions").hidden=!unavailable.length;$("clearUnavailableOptions").disabled=busy;
  $("goBtn").disabled=busy||!["car",...(advanced?["truck"]:[])].includes(type);
  $("truckDimensions").hidden=type!=="truck";
  $("vehicleRoutingNote").hidden=type==="car";
  $("vehicleRoutingNote").textContent=type==="truck"?"Restrictions calculées selon le gabarit déclaré et les données cartographiques. La signalisation et les conditions réelles restent prioritaires. Transport exceptionnel ou de matières dangereuses non pris en charge.":"Le routage spécifique aux caravanes et utilitaires n’est pas encore validé. Aucun trajet voiture ne sera substitué automatiquement.";
  $("routingAvailability").textContent=advanced?"Service public configuré : coordonnées et gabarit transmis au service de calcul puis à OpenRouteService. Aucun compte technique requis.":C.ignRouting===true?"Sans autoroute disponible en véhicule léger avec l’IGN, aucune clé à fournir. Les coordonnées du trajet et des arrêts sont transmises à l’IGN lors de la recherche.":"Évitements et poids lourds indisponibles : service non activé. Trajet léger standard disponible ; aucune clé à fournir.";
}
function routingPreferences(){
  const type=$("routeVehicle").value;
  const avoid=[...document.querySelectorAll('.avoid-options input:checked')].map(el=>el.value);
  return {provider:routingEndpoint()?"ors":C.ignRouting===true&&avoid.includes("highways")?"ign":"osrm",avoid,vehicle:{type,...(type==="truck"?{dimensions:routeDimensions()}:{})}};
}
function routingLabel(settings){
  return (settings.provider==="ors"?"OpenRouteService · service public":settings.provider==="ign"?"IGN · BD TOPO":"OSRM")+(settings.vehicle.type==="truck"?" · poids lourd · "+dimensionLabel(settings.vehicle.dimensions):" · véhicule léger")+(settings.avoid.length?" · exclusions : "+settings.avoid.map(x=>avoidLabels[x]).join(", "):" · sans exclusions");
}
function invalidateRouting(){
  clearResults();updateVehicleRouting();
  setStatus("Options modifiées. Trajet à recalculer.");
}
function ensureRouting(settings){
  if(!["car","truck"].includes(settings.vehicle.type))throw new Error("Routage spécifique non validé pour ce véhicule. Aucun trajet voiture ne sera substitué.");
  if(settings.provider==="ign"&&(settings.vehicle.type!=="car"||settings.avoid.length!==1||settings.avoid[0]!=="highways"))throw new Error("L’IGN est activé uniquement pour un véhicule léger sans autoroute. Les autres restrictions ne seront pas ignorées.");
  if(settings.provider==="osrm"&&(settings.avoid.length||settings.vehicle.type==="truck"))throw new Error("Service public de routage avancé non activé. Ces options ne seront pas ignorées. Le trajet standard reste disponible pour un véhicule léger sans exclusions.");
}
function hasRouteGeometry(r){
  return r?.geometry?.type==="LineString"&&Array.isArray(r.geometry.coordinates)&&r.geometry.coordinates.length>1&&r.geometry.coordinates.every(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90);
}
function hasRouteMetrics(r){return [r?.distance,r?.duration].every(n=>Number.isFinite(n)&&n>=0)}
async function orsRoutes(points,settings,alternatives=false){
  const endpoint=routingEndpoint();if(!endpoint)throw new Error("Service public de routage non activé.");
  await sleep(Math.max(0,1800-(performance.now()-orsLastRequest)));
  if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
  orsLastRequest=performance.now();
  const t=makeTimeout(25000);
  const body={coordinates:points.map(([lat,lon])=>[lon,lat]),avoid:[...settings.avoid],vehicle:settings.vehicle,alternatives};
  try{
    const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/geo+json"},body:JSON.stringify(body),signal:t.signal,cache:"no-store",credentials:"omit",redirect:"error",referrerPolicy:"no-referrer"});
    const data=await response.json().catch(()=>null);
    if(!response.ok||data?.error){
      const noRoute=data?.error?.code==="NO_ROUTE";
      const message=response.status===401||response.status===403?"Accès au service public refusé.":response.status===429?"Limite du service public atteinte. Réessayer plus tard.":noRoute?"Aucun trajet accessible avec ces options.":`Service public indisponible ou demande refusée (HTTP ${response.status}).`;
      throw Object.assign(new Error(message),{noRoute});
    }
    if(!Array.isArray(data?.features)||!data.features.length)throw new Error("Réponse OpenRouteService incomplète.");
    return data.features.map(feature=>{
      const p=feature.properties,r={geometry:feature.geometry,distance:p?.summary?.distance,duration:p?.summary?.duration,legs:p?.segments,alternatives:[]};
      if(!hasRouteGeometry(r)||[r.distance,r.duration].some(n=>!Number.isFinite(n)||n<0)||!Array.isArray(r.legs)||r.legs.length!==points.length-1||r.legs.some(leg=>[leg.distance,leg.duration].some(n=>!Number.isFinite(n)||n<0))||Math.abs(r.legs.reduce((s,l)=>s+l.distance,0)-r.distance)>2||Math.abs(r.legs.reduce((s,l)=>s+l.duration,0)-r.duration)>2)throw new Error("Réponse OpenRouteService incomplète ou incohérente.");
      if(p.warnings?.length)throw new Error("OpenRouteService signale une réserve sur ce trajet. Aucun trajet non vérifié n’est affiché.");
      return r;
    });
  }catch(e){
    health("hRoute","err","routage ✕");
    if(e.name==="AbortError")throw new Error(activeAbort?.signal.aborted?"Recherche interrompue.":"OpenRouteService : délai dépassé.");
    if(e instanceof TypeError)throw new Error("OpenRouteService : requête réseau refusée.");
    throw e;
  }finally{t.done()}
}
async function ignRoute(points,settings){
  ensureRouting(settings);
  const key=JSON.stringify([points,settings.avoid]),cached=ignCache.get(key);
  if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
  if(cached&&performance.now()-cached.at<300000)return structuredClone(cached.route);
  // Calls are sequential in run/scoreConstrainedCandidates. Below 5 requests/s/IP;
  // other tabs/users on the same IP may still trigger a quota: never auto-retry.
  await sleep(Math.max(0,550-(performance.now()-ignLastRequest)));
  if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
  ignLastRequest=performance.now();
  const constraint={constraintType:"banned",key:"waytype",operator:"=",value:"autoroute"};
  const query=new URLSearchParams({resource:"bdtopo-osrm",profile:"car",optimization:"fastest",start:[...points[0]].reverse().join(","),end:[...points.at(-1)].reverse().join(","),geometryFormat:"geojson",crs:"EPSG:4326",distanceUnit:"meter",timeUnit:"second",getSteps:"false",getBbox:"false",constraints:JSON.stringify(constraint)});
  if(points.length>2)query.set("intermediates",points.slice(1,-1).map(([lat,lon])=>`${lon},${lat}`).join("|"));
  let data;
  try{data=await getJSON(`https://data.geopf.fr/navigation/itineraire?${query}`,"IGN",25000)}
  catch(e){
    health("hRoute","err","routage ✕");
    if(e.message.includes("HTTP 429"))throw new Error("Limite du service IGN atteinte. Réessayer plus tard. L’exclusion des autoroutes est conservée.");
    throw new Error(`${e.message}. Aucun trajet avec autoroute ne sera substitué.`);
  }
  if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
  const r={geometry:data.geometry,distance:data.distance,duration:data.duration,legs:data.portions,alternatives:[],resourceVersion:data.resourceVersion};
  const exclusions=data.constraints;
  const echoed=Array.isArray(exclusions)&&exclusions.length===1&&exclusions[0].type==="banned"&&exclusions[0].key==="waytype"&&exclusions[0].operator==="="&&exclusions[0].value==="autoroute";
  const legs=Array.isArray(r.legs)&&r.legs.length===points.length-1&&r.legs.every(hasRouteMetrics)&&Math.abs(r.legs.reduce((s,l)=>s+l.distance,0)-r.distance)<=2&&Math.abs(r.legs.reduce((s,l)=>s+l.duration,0)-r.duration)<=2;
  const endpoints=legs&&r.legs.every((leg,i)=>[leg.start,leg.end].every((value,j)=>{
    if(typeof value!=="string"||!/^[-\d.]+,[-\d.]+$/.test(value))return false;
    const [lon,lat]=value.split(",").map(Number);
    return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180&&hav([lat,lon],points[i+j])<=1;
  }));
  const geometry=hasRouteGeometry(r)&&hav([...r.geometry.coordinates[0]].slice(0,2).reverse(),points[0])<=1&&hav([...r.geometry.coordinates.at(-1)].slice(0,2).reverse(),points.at(-1))<=1;
  if(data.resource!=="bdtopo-osrm"||data.profile!=="car"||data.optimization!=="fastest"||data.crs!=="EPSG:4326"||data.distanceUnit!=="meter"||data.timeUnit!=="second"||!echoed||!geometry||!hasRouteMetrics(r)||!legs||!endpoints){
    health("hRoute","err","routage ✕");
    throw new Error("Réponse IGN incomplète ou incohérente : unités, accès ou exclusion non confirmés. Aucun trajet de remplacement affiché.");
  }
  r.alternativeNotice="Un seul trajet sans autoroute calculé par l’IGN. Le montant des péages reste inconnu, notamment pour les ouvrages payants.";
  if(ignCache.size>=32)ignCache.delete(ignCache.keys().next().value);
  ignCache.set(key,{at:performance.now(),route:structuredClone(r)});
  return r;
}
async function route(points,overview=true,alternatives=false,settings=trip?.routing||routingPreferences()){
  health("hRoute","busy","routage…");
  ensureRouting(settings);
  if(settings.provider==="ign"){
    const r=await ignRoute(points,settings);
    health("hRoute","ok","routage ✓");return r;
  }
  if(settings.provider==="ors"){
    let base=(await orsRoutes(points,settings))[0];
    if(alternatives&&base.distance<=100000){
      try{const all=await orsRoutes(points,settings,true);base={...all[0],alternatives:all.slice(1)}}
      catch{base.alternativeNotice="Recherche d’alternatives indisponible. Le trajet calculé avec les exclusions est conservé."}
    }else if(alternatives)base.alternativeNotice="Alternatives non recherchées : limite OpenRouteService de 100 km dépassée.";
    health("hRoute","ok","routage ✓");
    return base;
  }
  if(settings.avoid.length||settings.vehicle.type!=="car")throw new Error("OSRM ne prend pas en charge ces options de véhicule ou d’exclusion.");
  const coords=points.map(p=>`${p[1]},${p[0]}`).join(";");
  const u=`${C.osrm}/route/v1/driving/${coords}?overview=${overview?"full":"false"}&geometries=geojson&steps=false&alternatives=${alternatives}`;
  const d=await getJSON(u,"Routage",20000);
  if(d.code!=="Ok"||!d.routes?.length) throw new Error("Aucun itinéraire routier trouvé");
  if(!hasRouteMetrics(d.routes[0])||(overview&&!hasRouteGeometry(d.routes[0])))throw new Error("Tracé routier incomplet. Relancer la recherche.");
  health("hRoute","ok","routage ✓");
  return {...d.routes[0],alternatives:alternatives?d.routes.slice(1).filter(r=>hasRouteGeometry(r)&&hasRouteMetrics(r)):[]};
}
async function matrix(points){
  const coords=points.map(p=>`${p[1]},${p[0]}`).join(";");
  const u=`${C.osrm}/table/v1/driving/${coords}?annotations=distance,duration`;
  const d=await getJSON(u,"Matrice routière",25000);
  if(d.code!=="Ok"||!d.distances||!d.durations) throw new Error("Matrice routière indisponible");
  return d;
}
function hav(a,b){
  const R=6371,rad=Math.PI/180,dl=(b[0]-a[0])*rad,do_=(b[1]-a[1])*rad;
  const z=Math.sin(dl/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(do_/2)**2;
  return 2*R*Math.asin(Math.sqrt(z));
}
function distSeg(p,a,b){
  const lat=p[0]*Math.PI/180,kx=111.32*Math.cos(lat),ky=110.574;
  const px=p[1]*kx,py=p[0]*ky,ax=a[1]*kx,ay=a[0]*ky,bx=b[1]*kx,by=b[0]*ky;
  const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,c=vx*vx+vy*vy,t=c?Math.max(0,Math.min(1,(wx*vx+wy*vy)/c)):0;
  return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));
}
function distRoute(p,c){
  let m=Infinity;for(let i=1;i<c.length;i++)m=Math.min(m,distSeg(p,c[i-1],c[i]));return m;
}
function sampleRoute(c,spacing=C.routeSampleEveryKm){
  const out=[c[0]];let acc=0,last=c[0];
  for(let i=1;i<c.length;i++){
    acc+=hav(last,c[i]);last=c[i];
    if(acc>=spacing){out.push(c[i]);acc=0}
  }
  if(hav(out.at(-1),c.at(-1))>2)out.push(c.at(-1));
  if(out.length<=C.maxFuelSamples)return out;
  const step=(out.length-1)/(C.maxFuelSamples-1),cut=[];
  for(let i=0;i<C.maxFuelSamples;i++)cut.push(out[Math.round(i*step)]);
  return cut;
}
function geomPoint(g){
  if(!g)return null;
  if(Array.isArray(g)&&g.length>=2)return [+g[0],+g[1]];
  if(g.lat!=null&&g.lon!=null)return [+g.lat,+g.lon];
  if(g.coordinates?.length>=2)return [+g.coordinates[1],+g.coordinates[0]];
  return null;
}
function stationFrom(r,fuel){
  const f=fuelField[fuel],p=geomPoint(r.geom),price=Number(r[`${f}_prix`]);
  if(!p||!(price>.2&&price<4))return null;
  const rupture=String(r[`${f}_rupture_type`]??"").trim().toLowerCase();
  if(rupture && rupture!=="null")return null;
  return {
    id:String(r.id),lat:p[0],lon:p[1],price,
    updated:r[`${f}_maj`]||null,
    address:[r.adresse,r.cp,r.ville].filter(Boolean).join(", "),
    city:r.ville||"",...stationInfo(r),fuel
  };
}
async function stationsAround(p,fuel,radius=C.corridorRadiusKm){
  const f=fuelField[fuel],[lat,lon]=p;
  const where=`within_distance(geom, geom'POINT(${lon} ${lat})', ${radius} km) and ${f}_prix is not null`;
  const select=`id,adresse,cp,ville,geom,horaires,horaires_automate_24_24,services_service,${f}_prix,${f}_maj,${f}_rupture_type`;
  const q=new URLSearchParams({limit:"100",where,select});
  const d=await getJSON(`${C.fuelApi}?${q}`,"Carburants",18000);
  const rows=Array.isArray(d.results)?d.results:[];
  return {stations:rows.map(r=>stationFrom(r,fuel)).filter(Boolean),limited:rows.length>=100||Number(d.total_count)>rows.length};
}
async function collectStations(coords,fuel){
  health("hFuel","busy","carburants…");
  const pts=sampleRoute(coords),all=[];let failed=0,limited=0;
  dbg("Échantillons du corridor",pts.length);
  for(let i=0;i<pts.length;i+=4){
    const batch=pts.slice(i,i+4);
    const rs=await Promise.all(batch.map(p=>stationsAround(p,fuel).catch(e=>{failed++;dbg("Carburants partiel",e.message);return {stations:[],limited:false}})));
    for(const result of rs){all.push(...result.stations);if(result.limited)limited++}
  }
  const uniq=new Map();all.forEach(s=>uniq.set(s.id,s));
  const arr=[...uniq.values()].filter(s=>distRoute([s.lat,s.lon],coords)<=C.corridorRadiusKm);
  health("hFuel",arr.length?"ok":"err",arr.length?"carburants ✓":"carburants ✕");
  if(failed===pts.length)throw new Error("Service carburants indisponible. Le trajet reste disponible.");
  return {stations:arr,partial:failed>0,failed,limited,samples:pts.length};
}
function progressKm(station,coords,totalKm){
  let length=0,best=Infinity,at=0;
  const p=[station.lat,station.lon];
  for(let i=1;i<coords.length;i++){
    const a=coords[i-1],b=coords[i],segment=hav(a,b);
    const k=Math.cos(p[0]*Math.PI/180),vx=(b[1]-a[1])*k,vy=b[0]-a[0];
    const denominator=vx*vx+vy*vy;
    const t=denominator?Math.max(0,Math.min(1,(((p[1]-a[1])*k)*vx+(p[0]-a[0])*vy)/denominator)):0;
    const distance=distSeg(p,a,b);
    if(distance<best){best=distance;at=length+segment*t}
    length+=segment;
  }
  return length?at/length*totalKm:0;
}
function stopWindow(){
  const mode=document.querySelector('input[name="stopMode"]:checked').value;
  const target=Number($("stopKm").value);
  return {mode,target,min:mode==="around"?Math.max(0,target-20):0,max:mode==="near"?50:mode==="around"?target+20:Infinity};
}
function chooseCandidates(stations,coords){
  const w=stopWindow();
  return stations.map(s=>({...s,progress:progressKm(s,coords,trip.base.distance/1000)}))
    .filter(s=>s.progress>=Math.max(0,w.min-20)&&s.progress<=w.max+20)
    .sort((a,b)=>w.mode==="around"?Math.abs(a.progress-w.target)-Math.abs(b.progress-w.target):a.progress-b.progress);
}
function scoreCandidates(cands,base,m,liters,cons){
  const endIndex=cands.length+1,out=[];
  for(let i=0;i<cands.length;i++){
    const idx=i+1,s=cands[i];
    const d1=m.distances?.[0]?.[idx],d2=m.distances?.[idx]?.[endIndex];
    const t1=m.durations?.[0]?.[idx],t2=m.durations?.[idx]?.[endIndex];
    if([d1,d2,t1,t2].some(v=>v==null||!Number.isFinite(v)||v<0))continue;
    const extraKm=(d1+d2-base.distance)/1000;
    const extraMin=(t1+t2-base.duration)/60;
    if(extraKm<0||extraMin<0)continue;
    const purchase=liters*s.price;
    const detourFuelCost=extraKm*cons/100*s.price;
    out.push({...s,distanceFromStart:d1/1000,accessSeconds:t1,extraKm,extraMin,purchase,detourFuelCost,real:purchase+detourFuelCost});
  }
  return out;
}
async function scoreConstrainedCandidates(cands,liters,cons){
  const scored=[];let unavailable=0,incomparable=0;
  for(let i=0;i<cands.length;i++){
    if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
    $("fuelStatus").textContent=`Vérification avec exclusions : station ${i+1} sur ${cands.length}…`;
    const station=cands[i];let via;
    try{via=await route([trip.a,[station.lat,station.lon],trip.b],true,false,trip.routing)}
    catch(e){if(e.noRoute){unavailable++;continue}throw e}
    const extraKm=(via.distance-trip.base.distance)/1000,extraMin=(via.duration-trip.base.duration)/60;
    // A shorter/faster recalculated route is not silently treated as a zero detour.
    if(extraKm<0||extraMin<0){incomparable++;continue}
    const purchase=liters*station.price,detourFuelCost=extraKm*cons/100*station.price;
    scored.push({...station,via,distanceFromStart:via.legs[0].distance/1000,accessSeconds:via.legs[0].duration,extraKm,extraMin,purchase,detourFuelCost,real:purchase+detourFuelCost});
  }
  return {scored,note:[unavailable?`${unavailable} station(s) sans accès calculable.`:"",incomparable?`${incomparable} trajet(s) recalculé(s) plus courts ou plus rapides : exclus du classement, comparaison à examiner.`:""].filter(Boolean).join(" ")};
}
function age(iso){
  if(!iso)return "mise à jour inconnue";
  const d=new Date(iso);if(Number.isNaN(+d))return `maj ${iso}`;
  const h=Math.max(0,(Date.now()-d)/36e5);
  return h<2?"mise à jour récente":h<24?`maj il y a ${Math.round(h)} h`:`maj il y a ${Math.round(h/24)} j`;
}
function serviceSelection(){return [...document.querySelectorAll('[data-service]:checked')].map(el=>el.value)}
function updateServiceChoices(){
  const chosen=new Set(serviceSelection());
  const names=[...new Set([...chosen,...compared.flatMap(s=>s.services)])].sort((a,b)=>a.localeCompare(b,"fr"));
  $("serviceChoices").innerHTML=names.length?names.map(name=>`<label class="check-label"><input type="checkbox" data-service value="${escapeHtml(name)}" ${chosen.has(name)?"checked":""} ${busy?"disabled":""}> ${escapeHtml(name)}</label>`).join(""):'<p class="note">Aucun service renseigné dans les stations comparées.</p>';
}
function filterStations(stations){
  const services=serviceSelection(),range=rangeEstimate(),limits={};
  for(const [id,key,max] of [["maxDetourKm","km",1000],["maxDetourMin","min",1440]]){
    const raw=$(id).value.trim(),value=Number(raw);
    if($(id).validity.badInput||(raw&&(!Number.isFinite(value)||value<0||value>max)))return {visible:[],error:`Détour maximal ${key==="km"?"en kilomètres":"en minutes"} : saisir une valeur de 0 à ${max}, ou laisser vide.`,excluded:{}};
    limits[key]=raw?value:Infinity;
  }
  const excluded={detour:0,unknown:0,undeclared:0,range:0,hoursUnknown:0,hoursOutside:0,hoursOther:0};
  const hoursFilter=$("stationOpeningFilter").value;
  const visible=stations.filter(s=>{
    if(s.extraKm>limits.km+1e-9||s.extraMin>limits.min+1e-9){excluded.detour++;return false}
    if(services.length&&!s.services.length){excluded.unknown++;return false}
    if(services.some(service=>!s.services.includes(service))){excluded.undeclared++;return false}
    if($("rangeOnly").checked&&range?.valid&&s.distanceFromStart>range.useful){excluded.range++;return false}
    const opening=stationOpening(s);
    if(hoursFilter!=="all"&&opening.state!==hoursFilter){excluded[opening.state==="unknown"?"hoursUnknown":opening.state==="outside"?"hoursOutside":"hoursOther"]++;return false}
    return true;
  });
  return {visible,excluded,error:""};
}
function refreshStationMap(visible,fit=false){
  if(!trip)return;
  const chosen=selectedStop?.station,outside=chosen&&!visible.some(s=>s.id===chosen.id);
  $("filteredStopNote").hidden=!outside;
  $("filteredStopNote").textContent=outside?`L’arrêt choisi (point ${chosen.number}) ne satisfait plus les filtres. Il reste dans le trajet et sur la carte, en plus des résultats. Utiliser « Retirer l’arrêt » pour l’enlever.`:"";
  const points=outside?[...visible,chosen]:visible;
  const coords=selectedStop?selectedStop.via.geometry.coordinates.map(([lon,lat])=>[lat,lon]):trip.coords;
  showOnMap(coords,points,chosen||null,trip.a,trip.b,chosen?`${trip.label} · arrêt ${chosen.city}`:trip.label,fit);
}
function renderStations(stations,mode,fit=false){
  updateResumePreparation();
  const range=rangeEstimate(),{visible,excluded,error}=filterStations(stations);
  $("stationListControls").hidden=!stations.length;
  $("eligibleCount").textContent=String(visible.length);
  $("stationFilterStatus").hidden=false;
  const reasons=[excluded.hoursUnknown?`${excluded.hoursUnknown} aux horaires inconnus`:"",excluded.hoursOutside?`${excluded.hoursOutside} hors horaires du guichet, sans automate déclaré`:"",excluded.hoursOther?`${excluded.hoursOther} aux horaires compatibles (hors vue choisie)`:"",excluded.detour?`${excluded.detour} au-delà du détour maximal`:"",excluded.unknown?`${excluded.unknown} aux services non renseignés`:"",excluded.undeclared?`${excluded.undeclared} sans tous les services requis déclarés`:"",excluded.range?`${excluded.range} hors portée estimée`:""].filter(Boolean);
  const hoursCount=stations.reduce((a,s)=>{a[stationOpening(s).state]++;return a},{compatible:0,outside:0,unknown:0});
  const hoursSummary=` Horaires habituels, avant filtres : ${hoursCount.compatible} compatibles, ${hoursCount.outside} hors guichet sans automate déclaré, ${hoursCount.unknown} inconnus. Aucune ouverture garantie.`;
  const baseText=error||`${visible.length} sur ${stations.length} stations comparées satisfont les filtres.${reasons.length?" Écartées : "+reasons.join(" ; ")+".":""}`+hoursSummary;
  if(!visible.length){
    $("stationFilterStatus").textContent=baseText;
    $("stationCards").innerHTML=`<p class="note">${error?"Corriger la saisie ou réinitialiser les filtres.":stations.length&&excluded.range===stations.length?"Aucune station comparée dans la portée estimée. Ne pas compter sur cette estimation pour poursuivre sans carburant.":"Aucune station comparée ne satisfait tous les filtres. Modifier ou réinitialiser les filtres sans recalculer le trajet. Aucun élargissement automatique."}</p>`;
    refreshStationMap([],fit);return;
  }
  const cost=Math.min(...visible.map(s=>Math.round(s.real*100))),price=Math.min(...visible.map(s=>Math.round(s.price*1000))),minutes=Math.min(...visible.map(s=>s.extraMin));
  const winners=[
    ["OPTIMAL",s=>Math.round(s.real*100)===cost],
    ["POMPE",s=>Math.round(s.price*1000)===price],
    ["RAPIDE",s=>Math.abs(s.extraMin-minutes)<1e-9]
  ];
  const listMode=$("stationListMode").value;
  const byDistance=(a,b)=>a.distanceFromStart-b.distanceFromStart||a.number-b.number;
  const sorts={all:byDistance,cost:(a,b)=>Math.round(a.real*100)-Math.round(b.real*100)||byDistance(a,b),price:(a,b)=>Math.round(a.price*1000)-Math.round(b.price*1000)||byDistance(a,b),detour:(a,b)=>a.extraMin-b.extraMin||a.extraKm-b.extraKm||byDistance(a,b)};
  const recommendations=[...new Map(winners.flatMap(([,wins])=>visible.filter(wins).sort(byDistance)).map(s=>[s.id,s])).values()];
  const list=listMode!=="recommended"?[...visible].sort(sorts[listMode]||byDistance):[...new Map([...(mode==="soon"?[...visible].sort(byDistance).slice(0,3):[]),...recommendations].map(s=>[s.id,s])).values()];
  $("stationFilterStatus").textContent=baseText+` Carte : ${visible.length} résultats ; liste : ${list.length} fiches. Badges calculés parmi ces ${visible.length} stations, sous les filtres actifs.`;
  $("stationCards").innerHTML=list.map(s=>`<article class="result-card" data-station="${escapeHtml(s.id)}">
    <div class="result-badges">${winners.filter(([,winner])=>winner(s)).map(([name])=>`<span class="result-badge">${name}</span>`).join("")}</div>
    <span class="station-index">Point ${s.number}</span><h3>${escapeHtml(s.city||`Station ${s.id}`)}</h3><div class="result-small">${escapeHtml(s.address)}</div>
    <div class="result-line">À ${fmt(s.distanceFromStart,1)} km du départ</div>
    <p class="station-opening" data-opening="${stationOpening(s).state}">${escapeHtml(openingText(s))}</p>
    <p class="range-badge${range?.valid&&s.distanceFromStart>range.useful?" outside":""}">${escapeHtml(stationRangeText(s.distanceFromStart,range))}</p>
    <div class="price">${fmt(s.real)} € <span class="price-note">achat + carburant du détour</span></div>
    <div class="result-line"><b>${fmt(s.price,3)} €/L</b> · +${fmt(s.extraKm,1)} km · +${Math.round(s.extraMin)} min</div>
    <div class="result-small">Achat ${fmt(s.purchase)} € · carburant du détour ${fmt(s.detourFuelCost)} €<br>${escapeHtml(age(s.updated))}</div>
    <button class="ghost station-detail-link" data-details="${escapeHtml(s.id)}">Infos et favori</button><button class="choose-station" data-select="${escapeHtml(s.id)}" aria-pressed="false">Choisir cette station</button>
    </article>`).join("");
  document.querySelectorAll('[data-station]').forEach(el=>el.classList.toggle('selected',el.dataset.station===selectedStop?.station.id));
  document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.select===selectedStop?.station.id)));
  refreshStationMap(visible,fit);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function projectSvg(coords,stations=[],best=null,label="",alternatives=[]){
  if(!coords?.length)return;
  const W=1000,H=700,pad=70;
  let minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
  const all=coords.concat(...alternatives,stations.map(s=>[s.lat,s.lon]));
  for(const [lat,lon] of all){minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat);minLon=Math.min(minLon,lon);maxLon=Math.max(maxLon,lon)}
  const latSpan=Math.max(.01,maxLat-minLat),lonSpan=Math.max(.01,maxLon-minLon);
  const scale=Math.min((W-2*pad)/lonSpan,(H-2*pad)/latSpan);
  const xoff=(W-lonSpan*scale)/2,yoff=(H-latSpan*scale)/2;
  const P=([lat,lon])=>[xoff+(lon-minLon)*scale,H-(yoff+(lat-minLat)*scale)];
  $("alternativeRoutes").replaceChildren(...alternatives.map(points=>{
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("class","route-alternative");
    path.setAttribute("d",points.map((p,i)=>{const [x,y]=P(p);return `${i?"L":"M"} ${x.toFixed(1)} ${y.toFixed(1)}`}).join(" "));
    return path;
  }));
  const step=Math.max(1,Math.floor(coords.length/350));let d="";
  coords.forEach((p,i)=>{if(i%step&&i!==coords.length-1)return;const [x,y]=P(p);d+=(d?" L ":"M ")+x.toFixed(1)+" "+y.toFixed(1)});
  $("routeLine").setAttribute("d",d);$("routeGlow").setAttribute("d",d);
  const a=P(coords[0]),b=P(coords.at(-1));
  $("startDot").setAttribute("cx",a[0]);$("startDot").setAttribute("cy",a[1]);
  $("endDot").setAttribute("cx",b[0]);$("endDot").setAttribute("cy",b[1]);
  $("stationDots").innerHTML=stations.map(s=>{const [x,y]=P([s.lat,s.lon]);const cl=s.id===best?.id?"station-best":"station-dot";return `<g class="svg-station" role="button" tabindex="0" data-details="${escapeHtml(s.id)}" aria-label="Voir la station ${s.number} : ${escapeHtml(s.address)} · ${escapeHtml(openingText(s))}"><title>${escapeHtml(openingText(s))}</title><circle class="${cl}" cx="${x}" cy="${y}" r="16"/><text x="${x}" y="${y+5}" text-anchor="middle">${s.number}</text></g>`}).join("");
  tollGuide.projection=P;drawTollMarkers();
  $("fallbackLabel").textContent=label||"Visualisation autonome";
}
function showOnMap(coords,stations,best,start,end,label,fit=true){
  mapView=[coords,stations,best,start,end,label];
  const alternatives=best?[]:(trip?.base.alternatives||[]).map(r=>r.geometry.coordinates.map(([lon,lat])=>[lat,lon]));
  $("routeAlternativesNote").hidden=Boolean(best);
  $("routeAlternativesNote").textContent=alternatives.length?`${alternatives.length} autre(s) trajet(s) disponible(s).`:"Aucun autre trajet proposé par le moteur pour cette recherche.";
  if(!best&&trip?.base.alternativeNotice)$("routeAlternativesNote").textContent=trip.base.alternativeNotice;
  if(!map){projectSvg(coords,stations,best,label,alternatives);return}
  if(routeLayer)map.removeLayer(routeLayer);
  markerLayer.clearLayers();
  routeLayer=L.featureGroup().addTo(map);
  alternatives.forEach(points=>L.polyline(points,{color:"#82baff",weight:6,opacity:1,interactive:false,className:"map-route-alternative"}).addTo(routeLayer));
  L.polyline(coords,{color:"#fff",weight:11,opacity:1,interactive:false,className:"map-route-outline"}).addTo(routeLayer);
  L.polyline(coords,{color:"#0758d9",weight:7,opacity:1,interactive:false,className:"map-route-selected"}).addTo(routeLayer);
  L.circleMarker(start,{radius:7,color:"#111",weight:3,fillColor:"#fff",fillOpacity:1}).addTo(markerLayer);
  L.circleMarker(end,{radius:7,color:"#111",weight:3,fillColor:"#fff",fillOpacity:1}).addTo(markerLayer);
  stations.forEach(s=>{
    const isBest=s.id===best?.id;
    const marker=L.marker([s.lat,s.lon],{icon:L.divIcon({className:"station-marker"+(isBest?" chosen":""),html:String(s.number),iconSize:[32,32],iconAnchor:[16,16]}),title:`Voir la station ${s.number} : ${s.address} · ${openingText(s)}`,keyboard:true}).addTo(markerLayer);
    marker.getElement().setAttribute("aria-label",`Voir la station ${s.number} : ${s.address} · ${openingText(s)}`);
    marker.on("click",()=>openStation(s.id));
  });
  drawTollMarkers();
  map.invalidateSize();if(fit)map.fitBounds(L.featureGroup([routeLayer,markerLayer]).getBounds(),{padding:[35,35]});
}

function rangeEstimate(){
  const mode=$("rangeMode").value;
  if(mode==="none")return null;
  const amount=Number($("rangeValue").value),reserve=Number($("reserveKm").value),cons=Number($("cons").value);
  if(!$("rangeValue").value.trim()||!$("reserveKm").value.trim()||!Number.isFinite(amount)||amount<0||amount>(mode==="km"?5000:2000)||!Number.isFinite(reserve)||reserve<0||reserve>500||(mode==="liters"&&(!Number.isFinite(cons)||cons<1||cons>100)))return {valid:false};
  const total=mode==="liters"?amount*100/cons:amount;
  return {valid:true,total,reserve,useful:Math.max(0,total-reserve)};
}
function stationRangeText(distance,range=rangeEstimate()){
  if(!range?.valid)return "Autonomie inconnue";
  return distance<=range.useful?"Dans la portée estimée, sans garantie d’accès":"Hors portée estimée avec la réserve choisie";
}
function updateRange(){
  const mode=$("rangeMode").value,range=rangeEstimate();
  $("rangeFields").hidden=mode==="none";
  $("rangeValueLabel").textContent=mode==="liters"?"Carburant restant (L)":"Distance restante (km)";
  $("rangeValue").max=mode==="liters"?"2000":"5000";
  $("rangeOnly").disabled=busy||!range?.valid;
  if(!range?.valid)$("rangeOnly").checked=false;
  $("rangeStatus").textContent=!range?"Autonomie inconnue. Distances depuis le départ, sans suivi en temps réel.":!range.valid?"Renseigner une autonomie et une réserve valides.":`${fmt(range.total,1)} km théoriques − ${fmt(range.reserve,0)} km de réserve : ${fmt(range.useful,1)} km utiles estimés depuis le départ. ${preparedRangePending?"Valeur mémorisée dans la préparation, à actualiser.":"Saisie à "+new Date(rangeMeasuredAt||Date.now()).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})+"."} Aucun suivi du carburant ni garantie d’accès ou d’ouverture.`;
  if(compared.length)renderStations(compared,stopWindow().mode);
}
function resetRange(){
  preparedRangePending=false;
  $("rangeMode").value="none";$("rangeValue").value="";$("rangeOnly").checked=false;rangeMeasuredAt=null;updateRange();
}
const tollState={key:'',sequence:0,abort:null,timer:null,expiry:null,quote:null,error:'',loading:false,enabled:false};
const tableTolls={key:'',segments:[],notice:'',index:new Map(),dateInitialized:false};
const tariffData=window.DRAGONROUTE_TARIFFS;
// BEGIN TOLL GUIDE GEOMETRY
function tollName(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").trim().replace(/\s+/g,' ').toUpperCase()}
function tollGateLabel(gate){return typeof gate.name==='string'&&gate.name.trim()&&!gate.name.includes('\uFFFD')?gate.name:'Nom de gare incomplet dans la source'}
function guideDistance(a,b){
 const rad=Math.PI/180,z=Math.sin((b[0]-a[0])*rad/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((b[1]-a[1])*rad/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,z)));
}
function findTollGates(coords,gates,radius){
 if(!Array.isArray(coords)||coords.length<2||!Number.isFinite(radius)||radius<=0||radius>1)throw new Error('Tracé ou rayon invalide.');
 if(coords.some(p=>!Array.isArray(p)||p.length<2||!p.slice(0,2).every(Number.isFinite)))throw new Error('Coordonnées invalides.');
 let progress=0;const segments=coords.slice(1).map((b,i)=>{const a=coords[i],length=guideDistance(a,b),s={a,b,length,progress};progress+=length;return s});
 return gates.flatMap(gate=>{
  let best=null;
  for(const position of gate.positions){
   const [lat,lon]=position,kx=111.32*Math.cos(lat*Math.PI/180),ky=110.574;
   for(const s of segments){
    const {a,b}=s;
    if(lat<Math.min(a[0],b[0])-radius/ky||lat>Math.max(a[0],b[0])+radius/ky||lon<Math.min(a[1],b[1])-radius/kx||lon>Math.max(a[1],b[1])+radius/kx)continue;
    const vx=(b[1]-a[1])*kx,vy=(b[0]-a[0])*ky,wx=(lon-a[1])*kx,wy=(lat-a[0])*ky,c=vx*vx+vy*vy;
    const t=c?Math.max(0,Math.min(1,(wx*vx+wy*vy)/c)):0,distance=Math.hypot(wx-t*vx,wy-t*vy);
    if(distance<=radius&&(!best||distance<best.distance))best={distance,progress:s.progress+t*s.length,lat,lon};
   }
  }
  return best?[{...gate,...best}]:[];
 }).sort((a,b)=>a.progress-b.progress||a.id.localeCompare(b.id));
}
// END TOLL GUIDE GEOMETRY
const tollInventory=window.DRAGONROUTE_TOLL_GATES;
const tollGuide={key:'',matches:[],total:0,shown:false,layer:null,projection:null,suggested:false};
function syncTollGuide(key){
 if(key!==tollGuide.key){
  tollGuide.key=key;tollGuide.matches=[];tollGuide.total=0;tollGuide.shown=false;
  if(tollGuide.suggested){$("tariffEntry").value='';$("tariffExit").replaceChildren(new Option('Choisir une sortie',''))}
  tollGuide.suggested=false;$("tariffGateConfirmed").checked=false;
  $("tollGateList").replaceChildren();$("tollGuideChoice").textContent="";$("tollGuideStatus").textContent=trip?'Repérage à lancer pour ce trajet.':'Calculer un trajet pour repérer les gares.';
  drawTollMarkers();
 }
 $("tollLocate").disabled=busy||!trip||tollInventory?.schemaVersion!==1;
 $("tollGuideRadius").disabled=busy||!trip;
 $("tollGuideToggle").hidden=!tollGuide.matches.length;$("tollGuideToggle").disabled=busy;
 $("tollGuideToggle").textContent=tollGuide.shown?'Masquer les gares sur la carte':'Afficher les gares sur la carte';
 $("tariffGateConfirmation").hidden=!tollGuide.suggested;
 $("tariffGateConfirmed").disabled=busy||!trip;
 document.querySelectorAll('[data-toll-propose],[data-toll-map]').forEach(el=>el.disabled=busy);
 if(!tollInventory)$("tollGuideStatus").textContent='Inventaire géographique indisponible. Le choix manuel des gares reste disponible.';
}
function gateTariffNames(gate){
 if(!gate.name?.trim()||gate.name.includes('\uFFFD'))return [];
 return Object.entries(tariffData?.networks||{}).flatMap(([network,data])=>data.gates.flatMap((name,index)=>tollName(name)===tollName(gate.name)?[{network,index,name}]:[]));
}
function renderTollGuide(){
 $("tollGateList").innerHTML=tollGuide.matches.map((gate,i)=>{
  const names=gateTariffNames(gate),match=names.length===1?names[0]:null;
  return `<article class="toll-gate-card" id="toll-card-${gate.id}" tabindex="-1"><h4>P${i+1} · ${escapeHtml(tollGateLabel(gate))}</h4><p>${escapeHtml(gate.type)} · ${gate.positions.length} position(s) recensée(s). À ${Math.round(gate.distance*1000)} m du tracé ; vers le km ${fmt(gate.progress,1)} de sa géométrie.</p><p class="note">Passage à confirmer.${match?` Nom concordant dans la grille ${match.network} : ${escapeHtml(match.name)}.`:names.length?' Plusieurs noms tarifaires concordants : choisir manuellement le réseau et les gares.':' Aucun nom concordant dans les grilles APRR/AREA embarquées. Tarif non déduit.'}</p><div class="dialog-actions"><button class="ghost" data-toll-map="${gate.id}">Voir le point P${i+1}</button>${match?`<button class="ghost" data-toll-propose="${gate.id}" data-gate-role="entry">Proposer comme entrée ${match.network}</button><button class="ghost" data-toll-propose="${gate.id}" data-gate-role="exit">Proposer comme sortie ${match.network}</button>`:''}</div></article>`;
 }).join('');
}
function locateTollGates(){
 if(busy||!trip||tollInventory?.schemaVersion!==1)return;
 const route=selectedStop?.via||trip.base;
 try{
  const radius=Number($("tollGuideRadius").value);
  const matches=findTollGates(route.geometry.coordinates.map(([lon,lat])=>[lat,lon]),tollInventory.gates,radius);
  tollGuide.total=matches.length;tollGuide.matches=matches.slice(0,80);tollGuide.shown=true;
  $("tollGuideStatus").textContent=matches.length?`${matches.length} repère(s) candidat(s) à moins de ${Math.round(radius*1000)} m du tracé.${matches.length>80?' Les 80 premiers sont affichés ; réduire le rayon pour affiner.':''} Ni le sens de circulation ni le passage effectif ne sont confirmés.`:'Aucune gare recensée trouvée dans ce rayon. Cela ne confirme pas un trajet sans péage.';
  renderTollGuide();drawTollMarkers();syncTollGuide(tollGuide.key);
 }catch(e){tollGuide.matches=[];tollGuide.shown=false;$("tollGateList").replaceChildren();drawTollMarkers();$("tollGuideStatus").textContent=`Repérage indisponible : ${e.message}`}
}
function drawTollMarkers(){
 if(tollGuide.layer&&map){map.removeLayer(tollGuide.layer);tollGuide.layer=null}
 $("tollDots")?.replaceChildren();
 if(!tollGuide.shown)return;
 if(map){
  tollGuide.layer=L.layerGroup().addTo(map);
  tollGuide.matches.forEach((gate,i)=>{
   const marker=L.marker([gate.lat,gate.lon],{icon:L.divIcon({className:'toll-marker',html:`P${i+1}`,iconSize:[36,30],iconAnchor:[18,15]}),title:`Gare candidate ${tollGateLabel(gate)}`,keyboard:true}).addTo(tollGuide.layer);
   marker.getElement().setAttribute('aria-label',`Voir la gare candidate P${i+1} : ${tollGateLabel(gate)}`);
   marker.on('click',()=>focusTollCard(gate.id));
  });
 }else if(tollGuide.projection){
  $("tollDots").innerHTML=tollGuide.matches.map((gate,i)=>{const [x,y]=tollGuide.projection([gate.lat,gate.lon]);return `<g class="svg-toll" role="button" tabindex="0" data-toll-focus="${gate.id}" aria-label="Voir la gare candidate P${i+1} : ${escapeHtml(tollGateLabel(gate))}"><rect x="${x-18}" y="${y-15}" width="36" height="30" rx="4"/><text x="${x}" y="${y+5}" text-anchor="middle">P${i+1}</text></g>`}).join('');
 }
}
function focusTollCard(id){const card=$('toll-card-'+id);if(card){$("tariffCalculator").open=true;$("tollLocator").open=true;card.scrollIntoView({block:'center'});card.focus()}}
function proposeTollGate(id,role){
 if(busy||!trip)return;
 const gate=tollGuide.matches.find(g=>g.id===id),names=gate?gateTariffNames(gate):[];
 if(names.length!==1)return;
 const match=names[0];
 if(role==='exit'){
  const entry=$("tariffEntry").value;
  if($("tariffNetwork").value!==match.network||entry===''||!tariffData.networks[match.network].rows.some(r=>String(r[0])===entry&&r[1]===match.index)){$("tollGuideChoice").textContent=`Choisir d’abord une entrée ${match.network} compatible dans le calculateur. Aucun choix n’a été remplacé.`;return}
  $("tariffExit").value=String(match.index);
 }else{
  $("tariffNetwork").value=match.network;tariffGates(true);$("tariffEntry").value=String(match.index);tariffGates();
 }
 tollGuide.suggested=true;$("tariffGateConfirmed").checked=false;$("tollGuideChoice").textContent=`${role==='exit'?'Sortie':'Entrée'} proposée : ${match.name} (${match.network}). Vérifier les gares réellement empruntées avant l’ajout au budget.`;
 updateBudget();$(role==='exit'?'tariffExit':'tariffEntry').focus();
}

function localDate(){const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)}
function tariffDateValid(){
 const d=$("tariffDate").value;
 return tariffData?.schemaVersion===1&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>=tariffData.effectiveFrom&&d<=tariffData.consultationUntil&&localDate()<=tariffData.consultationUntil;
}
function tariffNetwork(){return tariffData?.networks[$("tariffNetwork").value]}
function tariffIndex(){
 const name=$("tariffNetwork").value;
 if(!tableTolls.index.has(name)){
  const index=new Map();for(const row of tariffNetwork()?.rows||[])index.set(`${row[0]}:${row[1]}`,row.slice(2));tableTolls.index.set(name,index);
 }
 return tableTolls.index.get(name);
}
function tariffOptions(select,ids,placeholder){
 select.replaceChildren(new Option(placeholder,''));
 for(const id of ids)select.add(new Option(tariffNetwork().gates[id],String(id)));
}
function tariffGates(resetEntry=false){
 const network=tariffNetwork();
 if(resetEntry)tariffOptions($("tariffEntry"),[...new Set((network?.rows||[]).map(r=>r[0]))].sort((a,b)=>a-b),'Choisir une entrée');
 const entry=$("tariffEntry").value;
 tariffOptions($("tariffExit"),entry===''?[]:(network?.rows||[]).filter(r=>String(r[0])===entry).map(r=>r[1]).sort((a,b)=>a-b),'Choisir une sortie');
 updateBudget();
}
function tariffCandidate(){
 const entry=$("tariffEntry").value,exit=$("tariffExit").value,vehicleClass=$("tariffClass").value;
 if(!tariffDateValid()||entry===''||exit===''||! /^[1-5]$/.test(vehicleClass))return null;
 const amount=tariffIndex().get(`${entry}:${exit}`)?.[Number(vehicleClass)-1];
 if(!Number.isSafeInteger(amount)||amount<0)return null;
 return {network:$("tariffNetwork").value,entry:Number(entry),exit:Number(exit),vehicleClass,amount,date:$("tariffDate").value};
}
function clearTableTolls(message=''){
 tableTolls.segments=[];tableTolls.notice=message;$("tariffComplete").checked=false;
}
function syncTableTolls(){
 if(!tableTolls.dateInitialized){$("tariffDate").value=localDate();tableTolls.dateInitialized=true}
 const route=selectedStop?.via||trip?.base;
 const key=trip?JSON.stringify([trip.calculatedAt,trip.routing,route.geometry.coordinates,route.distance,selectedStop?.station.id]):'';
 if(key!==tableTolls.key){if(tableTolls.segments.length)clearTableTolls('Trajet modifié : les tronçons ont été retirés du budget.');tableTolls.key=key}
 syncTollGuide(key);
 if(!tariffDateValid()&&tableTolls.segments.length)clearTableTolls('Grille hors période de consultation : budget retiré.');
 $("tariffFields").disabled=busy||!trip||!tariffData;
 $("tariffExit").disabled=$("tariffEntry").value==='';
 const c=tariffCandidate(),duplicate=c&&tableTolls.segments.some(s=>s.network===c.network&&s.entry===c.entry&&s.exit===c.exit);
 $("tariffResult").textContent=!tariffData?'Grilles indisponibles.':!tariffDateValid()?'Grille non proposée pour cette date. Une mise à jour des tarifs est nécessaire.':c?`${fmt(c.amount/100)} € TTC · classe ${c.vehicleClass} · ${c.network} · tronçon choisi`:'Choisir une classe, une entrée et une sortie.';
 $("tariffAdd").disabled=busy||!trip||!c||duplicate||tableTolls.segments.length>=10||(tollGuide.suggested&&!$("tariffGateConfirmed").checked);
 $("tariffAdd").textContent=duplicate?'Tronçon déjà ajouté':'Ajouter ce tronçon au budget';
 $("tariffSource").textContent=tariffData?`Grille en vigueur au 01/02/2026, consultée le 17/11/2026. Consultation proposée jusqu’au 31/12/2026 ; ce seuil ne garantit pas le maintien des prix. Vérifier la grille officielle avant le départ.`:'';
 $("tariffPdf").href=tariffNetwork()?.source||'https://voyage.aprr.fr/tarifs-de-peage';
 $("tariffComplete").disabled=busy||!tableTolls.segments.length;
 $("tariffClear").hidden=!tableTolls.segments.length;$("tariffClear").disabled=busy;
 $("tariffSegments").replaceChildren();
 tableTolls.segments.forEach((s,i)=>{
  const n=tariffData.networks[s.network],li=document.createElement('li'),text=document.createElement('span'),button=document.createElement('button');
  text.textContent=`${s.network} · ${n.gates[s.entry]} → ${n.gates[s.exit]} · classe ${s.vehicleClass} · ${fmt(s.amount/100)} € TTC`;
  button.type='button';button.className='ghost';button.textContent='Retirer';button.disabled=busy;button.setAttribute('aria-label',`Retirer ${n.gates[s.entry]} vers ${n.gates[s.exit]}`);
  button.addEventListener('click',()=>{tableTolls.segments.splice(i,1);$("tariffComplete").checked=false;tableTolls.notice='Tronçon retiré. La couverture du trajet doit être confirmée à nouveau.';updateBudget()});
  li.append(text,button);$("tariffSegments").append(li);
 });
 $("tariffNotice").textContent=tableTolls.notice;
}
function tollEndpoint(){
 try{const u=new URL(C.tollsApi);return !u.username&&!u.password&&!u.search&&!u.hash&&(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))?u.href:null}catch{return null}
}
function tollParameters(){
 const height=Number($("tollHeight").value),weightKg=Number($("tollWeight").value),time=new Date($("tollDeparture").value).getTime();
 if(!$("tollVehicleConfirmed").checked||!trip||trip.routing.vehicle.type!=="car"||!Number.isFinite(height)||height<0.5||height>2||!Number.isFinite(weightKg)||weightKg<500||weightKg>3500||!Number.isFinite(time)||Math.abs(time-Date.now())>366*86400000)return null;
 return {vehicle:{type:'car',height,weightKg,axles:2},payment:$("tollPayment").value,departureTime:new Date(time).toISOString()};
}
function resetTollQuote(){
 tollState.sequence++;tollState.abort?.abort();clearTimeout(tollState.timer);clearTimeout(tollState.expiry);
 tollState.quote=null;tollState.loading=false;tollState.error='';
}
function validTollQuote(q,input){
 const amount=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10000;
 return q&&q.requestId===input.requestId&&/^[a-f0-9]{64}$/.test(q.routeHash)&&q.provider==='TollGuru'&&q.currency==='EUR'&&Number.isFinite(Date.parse(q.fetchedAt))&&Math.abs(Date.parse(q.fetchedAt)-Date.now())<5*60000&&q.departureTime===input.departureTime&&q.payment===input.payment&&JSON.stringify(q.vehicle)===JSON.stringify(input.vehicle)&&
  ['no_tolls','estimated','partial','unavailable'].includes(q.status)&&
  (q.status==='no_tolls'?q.amountEur===0:q.status==='estimated'?amount(q.amountEur):q.amountEur===null)&&
  (q.status==='partial'?amount(q.knownSubtotalEur):q.knownSubtotalEur===null)&&
  (q.tariffValidAt===null||typeof q.tariffValidAt==='string'&&Number.isFinite(Date.parse(q.tariffValidAt)))&&
  Array.isArray(q.items)&&q.items.length<=500&&q.items.every(x=>x&&typeof x.label==='string'&&x.label.length<=240&&(x.amountEur===null||amount(x.amountEur))&&x.payment===input.payment)&&
  Array.isArray(q.warnings)&&q.warnings.length<=20&&q.warnings.every(x=>typeof x==='string'&&x.length<=500)&&
  (!(q.status==='estimated'||q.status==='no_tolls')||q.warnings.length===0)&&
  (q.status!=='no_tolls'||q.items.length===0)&&
  (q.status!=='estimated'||q.items.length>0&&q.items.every(x=>amount(x.amountEur))&&Math.abs(q.items.reduce((sum,x)=>sum+x.amountEur,0)-q.amountEur)<0.011)&&
  (q.status!=='partial'||Math.abs(q.items.reduce((sum,x)=>sum+(x.amountEur??0),0)-q.knownSubtotalEur)<0.011);
}
function syncTolls(){
 const endpoint=tollEndpoint(),supported=trip?.routing.vehicle.type==='car';
 $("tollParameters").hidden=!endpoint||!supported;
 $("tollParameters").disabled=busy||!endpoint||!supported;
 if(endpoint&&trip&&!$("tollDeparture").value){const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);$("tollDeparture").value=d.toISOString().slice(0,16)}
 const params=tollParameters(),route=selectedStop?.via||trip?.base;
 const key=trip?JSON.stringify([trip.calculatedAt,trip.routing,route.geometry.coordinates,route.distance,params]):'';
 if(key!==tollState.key){resetTollQuote();tollState.key=key}
 $("tollAvailability").textContent=!endpoint?'Calcul automatique des péages non activé.':!supported?'Tarif de ce véhicule non pris en charge.':'Tarif voiture sans remorque. Le calcul transmet le tracé complet, le gabarit et la date au service tarifaire. Les changements de trajet actualiseront ensuite le devis.';
 $("tollCalculate").disabled=busy||!endpoint||!params||tollState.loading;
 $("tollCalculate").textContent=!endpoint?'Calculer les péages — indisponible':tollState.loading?'Calcul des péages…':tollState.enabled?'Actualiser les péages':'Calculer les péages';
 if(endpoint&&params&&tollState.enabled&&!tableTolls.segments.length&&!busy&&!tollState.quote&&!tollState.error&&!tollState.loading){
  tollState.loading=true;
  const sequence=tollState.sequence;
  tollState.timer=setTimeout(()=>fetchTolls(endpoint,params,route,sequence),500);
  $("tollCalculate").disabled=true;$("tollCalculate").textContent='Calcul des péages…';
 }
}
async function fetchTolls(endpoint,params,route,sequence){
 if(sequence!==tollState.sequence)return;
 const abort=new AbortController();tollState.abort=abort;
 const input={requestId:crypto.randomUUID(),coordinates:route.geometry.coordinates.map(p=>p.slice(0,2)),distance:route.distance,...params};
 const timeout=setTimeout(()=>abort.abort(),25000);
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:abort.signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error(response.status===429?'Quota tarifaire atteint. Réessayer plus tard.':'Service tarifaire indisponible.');
  const q=await response.json();if(sequence!==tollState.sequence)return;
  if(!validTollQuote(q,input))throw Error('Devis non concordant ou incomplet.');
  tollState.quote=q;
  tollState.expiry=setTimeout(()=>{if(sequence===tollState.sequence){tollState.quote=null;tollState.error='Estimation expirée. Actualiser les péages.';updateBudget()}},15*60000);
 }catch(e){if(sequence===tollState.sequence)tollState.error=abort.signal.aborted?'Délai du service tarifaire dépassé.':e instanceof TypeError?'Service tarifaire injoignable. Réessayer plus tard.':e.message}
 finally{clearTimeout(timeout);if(sequence===tollState.sequence){tollState.loading=false;updateBudget()}}
}
function renderTolls(fuelCost){
 if(tableTolls.segments.length){
  const amount=tableTolls.segments.reduce((sum,s)=>sum+s.amount,0)/100,complete=$("tariffComplete").checked;
  $("tollAmount").textContent=`${fmt(amount)} € · ${complete?'tronçons déclarés':'partiel'}`;
  $("budgetTotal").textContent=complete&&fuelCost!==null?`${fmt(fuelCost+amount)} € · estimation déclarée`:'Incomplet';
  $("tollNotice").textContent=complete?'Couverture du trajet déclarée par vous, non vérifiée sur la carte.':'Somme des tronçons ajoutés seulement. Les autres péages éventuels restent inconnus.';
  $("tollDetails").hidden=true;$("tollSource").textContent='';$("tollItems").replaceChildren();return;
 }
 const q=tollState.quote;
 $("tollAmount").textContent=tollState.loading?'Calcul en cours':q?.status==='no_tolls'?'0,00 € · sans péage confirmé':q?.status==='estimated'?`${fmt(q.amountEur)} € · estimation`:q?.status==='partial'?`${fmt(q.knownSubtotalEur)} € connus · partiel`:'Tarif indisponible';
 const complete=q&&['estimated','no_tolls'].includes(q.status);
 $("budgetTotal").textContent=complete&&fuelCost!==null?`${fmt(fuelCost+q.amountEur)} € · estimation`:'Incomplet';
 $("tollNotice").textContent=tollState.error||(q?.warnings.join(' ')||'');
 $("tollDetails").hidden=!q;
 $("tollSource").textContent=q?`${q.provider} · obtenu le ${new Date(q.fetchedAt).toLocaleString('fr-FR')} · départ ${new Date(q.departureTime).toLocaleString('fr-FR')} · ${q.vehicle.height} m · PTAC ${q.vehicle.weightKg} kg · 2 essieux, sans remorque · ${q.payment==='cash'?'espèces':'paiement à la plaque'}. Validité des tarifs ${q.tariffValidAt?new Date(q.tariffValidAt).toLocaleString('fr-FR'):'non fournie'}. Estimation, sans garantie de prix.`:'';
 $("tollItems").replaceChildren();
 for(const item of q?.items||[]){const li=document.createElement('li');li.textContent=`${item.label} : ${item.amountEur===null?'tarif inconnu':fmt(item.amountEur)+' €'}`;$("tollItems").append(li)}
}

function updateBudget(){
  $("navigationBtn").hidden=!trip;
  $("journalRecordBtn").hidden=!trip;$("savePreparationBtn").hidden=!trip;
  $("tripBudget").hidden=!trip;
  $("useStationPrice").disabled=busy||!selectedStop;
  syncTableTolls();syncTolls();
  if(!trip)return;
  const r=selectedStop?.via||trip.base,cons=Number($("cons").value),price=Number($("budgetPrice").value);
  const liters=Number.isFinite(cons)&&cons>=1&&cons<=100?r.distance/1000*cons/100:null;
  const validPrice=$("budgetPrice").value.trim()&&Number.isFinite(price)&&price>0&&price<=10;
  $("budgetRoute").textContent=`${fmt(r.distance/1000,1)} km · ${Math.round(r.duration/60)} min${selectedStop?" · arrêt inclus, hors temps du plein":" · sans arrêt"}`;
  renderTolls(validPrice&&liters!==null?liters*price:null);
  $("budgetFuel").textContent=liters===null?"Consommation à vérifier":`${fmt(liters,2)} L${validPrice?` · ${fmt(liters*price)} €`:" · prix à renseigner"}`;
  $("budgetSource").textContent=validPrice?(budgetReference?`${budgetReference.label} · ${$("fuel").value} · ${fmt(price,3)} €/L · ${budgetReference.at}`:`Prix saisi · ${$("fuel").value} · ${fmt(price,3)} €/L`):"Prix de référence non renseigné ou invalide. Aucun prix moyen supposé.";
}
function navigationLinks(){
  if(!trip||trip.routing.vehicle.type!=="car")return null;
  const google=new URL("https://www.google.com/maps/dir/");
  google.search=new URLSearchParams({api:"1",origin:trip.a.join(","),destination:trip.b.join(","),travelmode:"driving"}).toString();
  if(selectedStop)google.searchParams.set("waypoints",[selectedStop.station.lat,selectedStop.station.lon].join(","));
  if(trip.routing.avoid.length)google.searchParams.set("avoid",trip.routing.avoid.map(v=>v==="tollways"?"tolls":v).join(","));
  const waze=point=>{
    const url=new URL("https://www.waze.com/ul");
    url.search=new URLSearchParams({ll:point.join(","),navigate:"yes",utm_source:"dragonroute",vehicle_type:"private"}).toString();
    for(const rule of trip.routing.avoid)url.searchParams.set({tollways:"avoid_tolls",highways:"avoid_freeways",ferries:"avoid_ferries"}[rule],"true");
    return url.href;
  };
  return {google:google.href,arrival:waze(trip.b),station:selectedStop?waze([selectedStop.station.lat,selectedStop.station.lon]):null};
}
function clearNavigation(){
  $("navigationDialog").close();
  for(const id of ["googleMapsLink","wazeStationLink","wazeArrivalLink"])$(id).removeAttribute("href");
  $("navigationSummary").textContent="";$("navigationMessage").textContent="";
}
function openNavigation(){
  if(busy||!trip)return;
  const r=selectedStop?.via||trip.base,links=navigationLinks();
  $("navigationSummary").textContent=`${trip.places.start} → ${trip.places.end}${selectedStop?" · arrêt : "+selectedStop.station.address:""} · ${fmt(r.distance/1000,1)} km · ${Math.round(r.duration/60)} min, hors temps des arrêts.`;
  $("navigationCarLinks").hidden=!links;$("navigationVehicleNote").hidden=Boolean(links);
  for(const [id,url] of [["googleMapsLink",links?.google],["wazeArrivalLink",links?.arrival],["wazeStationLink",links?.station]]){
    if(url)$(id).href=url;else $(id).removeAttribute("href");
  }
  $("wazeStationLink").hidden=!links?.station;
  $("navigationAvoidNote").textContent=trip.routing.avoid.length?`Préférences transmises : éviter ${trip.routing.avoid.map(v=>avoidLabels[v]).join(", ")}. Ce sont des demandes au service externe, pas une garantie de les exclure.`:"Aucun évitement demandé ici. Vérifier les préférences de l’application externe.";
  $("navigationMessage").textContent="";$("navigationDialog").showModal();
}
function gpxSnapshot(){
  if(!trip)throw new Error("Calculer un trajet avant de l’exporter.");
  const r=selectedStop?.via||trip.base;
  if(!hasRouteGeometry(r)||!hasRouteMetrics(r))throw new Error("Tracé incomplet : export impossible.");
  const xml=value=>escapeHtml(String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,""));
  const point=([lon,lat])=>{
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||lon< -180||lon>=180)throw new Error("Coordonnées incompatibles avec le format GPX.");
    return `lat="${lat.toFixed(8)}" lon="${lon.toFixed(8)}"`;
  };
  const title=trip.places.start+" → "+trip.places.end;
  const description=`Tracé préparé, non relevé GPS. ${routingLabel(trip.routing)}. ${fmt(r.distance/1000,1)} km ; ${Math.round(r.duration/60)} min hors arrêts. Calcul initial : ${trip.calculatedAt}.${selectedStop?" Arrêt confirmé : "+selectedStop.confirmedAt+".":""} Ce fichier ne contient pas de devis de péages. Les contraintes ne sont pas des réglages de navigation GPX.`;
  const waypoints=[{coords:[trip.a[1],trip.a[0]],name:"Départ : "+trip.places.start},
    ...(selectedStop?[{coords:[selectedStop.station.lon,selectedStop.station.lat],name:"Arrêt carburant : "+selectedStop.station.address}]:[]),
    {coords:[trip.b[1],trip.b[0]],name:"Arrivée : "+trip.places.end}];
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="DragonRoute" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${xml(title)}</name><desc>${xml(description)}</desc><time>${new Date().toISOString()}</time></metadata>
${waypoints.map(p=>`<wpt ${point(p.coords)}><name>${xml(p.name)}</name></wpt>`).join("\n")}
<trk><name>${xml(title)}</name><desc>${xml(description)}</desc><src>${xml(routingLabel(trip.routing))}</src><trkseg>
${r.geometry.coordinates.map(p=>`<trkpt ${point(p)}></trkpt>`).join("\n")}
</trkseg></trk></gpx>`;
}
function exportGpx(){
  if(busy)return;
  try{
    const content=gpxSnapshot(),blob=new Blob([content],{type:"application/gpx+xml;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="DragonRoute_trajet_"+new Date().toISOString().replace(/[:.]/g,"-")+".gpx";
    document.body.appendChild(a);
    try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
    $("navigationMessage").textContent="Téléchargement demandé. Ce fichier décrit le trajet préparé ; il ne met pas à jour les conditions de circulation.";
  }catch(e){$("navigationMessage").textContent=e.message}
}
function invalidateStationPrice(){
  if(budgetReference?.stationId){budgetReference=null;$("budgetPrice").value=""}
}
function updateTripMetrics(){
  if(!trip)return;
  const r=selectedStop?.via||trip.base;
  $("tripKm").textContent=`${fmt(r.distance/1000,1)} km`;$("tripTime").textContent=`${Math.round(r.duration/60)} min`;
  updateBudget();
}
function renderRouteChoices(){
  const choices=trip?.choices||[];
  $("routeChoices").hidden=choices.length<2;
  $("routeChoices").innerHTML=choices.length<2?"":`<legend>Choisir le trajet</legend>${choices.map((r,i)=>`<label><input type="radio" name="routeChoice" value="${i}" ${i===trip.choice?"checked":""}> Trajet ${i+1} · ${fmt(r.distance/1000,1)} km · ${Math.round(r.duration/60)} min</label>`).join("")}`;
}
function chooseRoute(index){
  if(busy||!trip||!trip.choices[index]||index===trip.choice)return;
  if(compared.length&&!confirm("Changer de trajet effacera les stations comparées et l’arrêt choisi. Continuer ?")){renderRouteChoices();document.querySelector('input[name=routeChoice]:checked')?.focus();return}
  trip.choice=index;trip.base={...trip.choices[index],alternatives:trip.choices.filter((_,i)=>i!==index)};
  trip.coords=trip.base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
  clearStations();renderRouteChoices();
  document.querySelector('input[name=routeChoice]:checked')?.focus();
  $("tripKm").textContent=`${fmt(trip.base.distance/1000,1)} km`;$("tripTime").textContent=`${Math.round(trip.base.duration/60)} min`;
  $("stopKm").max=String(Math.max(5,Math.ceil(trip.base.distance/1000/5)*5));updateWindow();
  setStatus("Trajet choisi. Les stations seront recherchées sur ce trajet.","ok");
}
function clearStations(){
  selectedStop=null;invalidateStationPrice();
  compared=[];stationSearch=null;updateResumePreparation();
  for(const id of ["stationCoverage","stationFilterStatus","filteredStopNote"])$(id).hidden=true;
  $("eligibleCount").textContent="—";
  $("stationCards").replaceChildren();$("stationSummary").hidden=true;$("selectedStop").hidden=true;
  $("removeStopBtn").hidden=true;
  $("stationListControls").hidden=true;
  $("stationCount").textContent="—";$("testedCount").textContent="—";$("fuelStatus").textContent="";
  health("hFuel","","carburants");
  if(trip)showOnMap(trip.coords,[],null,trip.a,trip.b,trip.label);
  updateTripMetrics();updateBudget();
}
function clearResults(){
  clearNavigation();
  trip=null;mapView=null;clearStations();
  renderRouteChoices();
  $("summary").hidden=true;$("stops").hidden=true;
  $("resolvedPlaces").hidden=true;
  $("tripKm").textContent="—";$("tripTime").textContent="—";
  for(const id of ["routeLine","routeGlow"])$(id).setAttribute("d","");
  $("alternativeRoutes").replaceChildren();$("routeAlternativesNote").hidden=true;
  $("appliedRouting").hidden=true;$("routingAttribution").textContent="OSRM / IGN / OpenRouteService";
  $("stationDots").replaceChildren();
  for(const id of ["startDot","endDot"]){$(id).setAttribute("cx","-50");$(id).setAttribute("cy","-50")}
  $("fallbackLabel").textContent="En attente du nouveau trajet.";
  if(map&&routeLayer){map.removeLayer(routeLayer);routeLayer=null}
  if(markerLayer)markerLayer.clearLayers();
  $("diagWrap").open=false;
}
function lock(value){
  busy=value;
  $("profileBtn").disabled=value;$("preparedBtn").disabled=value;
  document.querySelectorAll('#sheet input,#sheet select,#sheet button').forEach(el=>el.disabled=value);
  if(!value){updateVehicleRouting();updateRange();updateBudget();updateResumePreparation()}
}
function updateWindow(){
  const w=stopWindow();$("distanceControl").hidden=w.mode!=="around";
  $("stopKmLabel").textContent=`${w.target} km`;
  $("windowNote").textContent=w.mode==="soon"?"Stations classées par distance routière depuis le départ.":w.mode==="near"?"Comparaison dans les 50 premiers kilomètres depuis le départ.":`Entre ${w.min} et ${w.max} km depuis le départ. Aucun élargissement automatique.`;
}
async function run(){
  if(busy)return;
  if(activeAbort)activeAbort.abort();activeAbort=new AbortController();
  clearResults();lock(true);log.length=0;
  health("hGeo","","géocodage");health("hRoute","","routage");
  try{
    const routing=routingPreferences();ensureRouting(routing);
    const sv=$("start").value.trim(),ev=$("end").value.trim();
    if(!sv||!ev)throw new Error("Départ et arrivée requis.");
    setStatus("Recherche du départ…","busy");health("hGeo","busy","géocodage…");
    const ga=await resolveTripPlace(sv,"start");
    setStatus("Recherche de l’arrivée…","busy");const gb=await resolveTripPlace(ev,"end");
    health("hGeo","ok","géocodage ✓");
    const a=[ga.lat,ga.lon],b=[gb.lat,gb.lon];
    setStatus("Calcul du trajet…","busy");
    const base=await route([a,b],true,true,routing);
    const coords=base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
    const label=`${ga.label.split(",")[0]} → ${gb.label.split(",")[0]}`;
    const choices=[base,...base.alternatives];
    trip={a,b,base,coords,label,routing,choices,choice:0,places:{start:ga.label,end:gb.label},calculatedAt:new Date().toISOString()};renderRouteChoices();
    $("resolvedPlaces").textContent=`Départ : ${ga.label}. Arrivée : ${gb.label}.`;
    $("resolvedPlaces").hidden=false;
    $("appliedRouting").textContent=routingLabel(routing);$("appliedRouting").hidden=false;
    $("routingAttribution").innerHTML=routing.provider==="ors"?'<a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">© openrouteservice.org by HeiGIT</a> · © OpenStreetMap contributors':routing.provider==="ign"?'<a href="https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/" target="_blank" rel="noopener noreferrer">IGN · BD TOPO · Licence Ouverte 2.0</a>':"OSRM";
    if(routing.provider==="ign"&&typeof base.resourceVersion==="string")$("routingAttribution").append(document.createTextNode(" · données "+base.resourceVersion));
    showOnMap(coords,[],null,a,b,label);
    $("tripKm").textContent=`${fmt(base.distance/1000,1)} km`;
    $("tripTime").textContent=`${Math.round(base.duration/60)} min`;
    $("summary").hidden=false;$("stops").hidden=false;
    $("stopKm").max=String(Math.max(5,Math.ceil(base.distance/1000/5)*5));
    $("stopKm").value=String(Math.min(Number($("stopKm").value),Number($("stopKm").max)));
    updateWindow();$("rideTrip").textContent=label;
    setStatus("Trajet prêt. Choisis maintenant tes arrêts.","ok");
  }catch(e){
    dbg(e.stack||e.message);setStatus(`⚠️ ${e.message}`,"err");$("diagWrap").open=true;
  }finally{lock(false);activeAbort=null}
}
async function searchStations(){
  if(busy||!trip)return;
  activeAbort=new AbortController();
  clearStations();lock(true);
  $("cancelStationsBtn").hidden=false;$("cancelStationsBtn").disabled=false;
  try{
    const fuel=$("fuel").value,liters=valueNum("liters",1,2000),cons=valueNum("cons",1,100),w=stopWindow();
    $("fuelStatus").textContent="Recherche des stations…";
    const found=await collectStations(trip.coords,fuel);
    if(activeAbort.signal.aborted)throw new Error("Recherche interrompue.");
    $("stationCount").textContent=String(found.stations.length);$("stationSummary").hidden=false;
    const candidates=chooseCandidates(found.stations,trip.coords),cands=candidates.slice(0,C.maxCandidates);
    stationSearch={found,candidates:candidates.length,examined:cands.length};
    $("stationCoverage").hidden=false;
    $("stationCoverage").textContent=`Recherche par échantillons : ${found.samples} points, corridor de ${C.corridorRadiusKm} km. ${cands.length} candidates à examiner sur ${candidates.length} dans la zone approchée.${candidates.length>cands.length?" Limite atteinte : comparaison partielle. Choisir une distance plus précise puis relancer la recherche.":""}${found.limited?` ${found.limited} réponse(s) limitée(s) par le service : couverture partielle.`:""}${found.failed?` ${found.failed} point(s) en échec : couverture partielle.`:""} Les filtres s’appliquent aux accès calculés, sans nouvelle recherche ni garantie d’exhaustivité.`;
    if(!cands.length)throw new Error(`Aucune station ${fuel} reçue dans la zone demandée.`);
    $("fuelStatus").textContent=`Calcul des accès et détours de ${cands.length} stations…`;
    let scored,note="";
    if(trip.routing.provider!=="osrm")({scored,note}=await scoreConstrainedCandidates(cands,liters,cons));
    else{const mat=await matrix([trip.a,...cands.map(s=>[s.lat,s.lon]),trip.b]);scored=scoreCandidates(cands,trip.base,mat,liters,cons);if(scored.length<cands.length)note=`${cands.length-scored.length} accès indisponible(s) ou trajet(s) recalculé(s) non comparable(s) : exclus du classement.`}
    if(activeAbort.signal.aborted)throw new Error("Recherche interrompue.");
    $("stationCoverage").textContent=$("stationCoverage").textContent.replace("candidates à examiner", "candidates examinées");
    compared=scored.filter(s=>s.distanceFromStart>=w.min&&s.distanceFromStart<=w.max);
    $("testedCount").textContent=String(compared.length);
    updateServiceChoices();
    if(!compared.length)throw new Error(`${note} Aucune station comparable dans cette plage de distance. Modifie la distance choisie.`.trim());
    compared.forEach((s,i)=>s.number=i+1);
    renderStations(compared,w.mode,true);
    $("fuelStatus").textContent=`${compared.length} stations comparées parmi ${found.stations.length} reçues. ${note?note+" ":""}${found.partial?"Réponse partielle du service. ":""}Distances depuis le départ choisi ; pas de suivi GPS continu.`;
  }catch(e){dbg(e.stack||e.message);$("fuelStatus").textContent=activeAbort.signal.aborted?"Recherche interrompue. Le trajet reste disponible.":e.message;health("hFuel","err","carburants ✕")}
  finally{activeAbort=null;lock(false);$("cancelStationsBtn").hidden=true}
}
async function selectStation(id){
  if(busy||!trip)return;
  const station=compared.find(s=>s.id===id);if(!station)return;
  const range=rangeEstimate();
  if(range?.valid&&station.distanceFromStart>range.useful&&!confirm("Cette station est hors de la portée estimée avec la réserve choisie. Conserver néanmoins cet arrêt dans la préparation du trajet ?"))return;
  if((station.via||trip.choice>0)&&!confirm(`Ajouter cet arrêt ? Le trajet sera recalculé via la station et peut changer de routes. ${routingLabel(trip.routing)}.${station.via?` Total : ${fmt(station.via.distance/1000,1)} km, ${Math.round(station.via.duration/60)} min, hors temps du plein.`:""}`))return;
  lock(true);$("fuelStatus").textContent="Vérification du trajet avec cet arrêt…";
  try{
    const via=station.via||await route([trip.a,[station.lat,station.lon],trip.b]);
    const changed=Math.abs(via.distance-(trip.base.distance+station.extraKm*1000))>100||Math.abs(via.duration-(trip.base.duration+station.extraMin*60))>60;
    if(changed&&!confirm(`Le recalcul diffère de la comparaison : ${fmt(via.distance/1000,1)} km, ${Math.round(via.duration/60)} min. Confirmer ce trajet avec arrêt ?`)){$("fuelStatus").textContent="Arrêt non confirmé. Le trajet précédent est conservé.";return}
    invalidateStationPrice();selectedStop={station,via,confirmedAt:new Date().toISOString()};
    updateTripMetrics();
    renderStations(compared,stopWindow().mode,true);
    document.querySelectorAll('[data-station]').forEach(el=>el.classList.toggle('selected',el.dataset.station===id));
    document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.select===id)));
    $("selectedStop").hidden=false;
    $("removeStopBtn").hidden=false;
    $("selectedStop").textContent=`Arrêt choisi : ${station.address}. Trajet avec arrêt : ${fmt(via.distance/1000,1)} km · ${Math.round(via.duration/60)} min, hors temps du plein.`;
    $("fuelStatus").textContent="Trajet avec la station sélectionnée affiché sur la carte.";
  }catch(e){dbg(e.message);$("fuelStatus").textContent=`Arrêt non confirmé : ${e.message}`}
  finally{lock(false)}
}
function selectTab(name){
  for(const tab of ["stations","rides"]){
    $(tab+"Tab").setAttribute("aria-selected",String(tab===name));
    $(tab+"Tab").tabIndex=tab===name?0:-1;$(tab+"Panel").hidden=tab!==name;
  }
}
function gps(){
  if(busy)return;
  if(!navigator.geolocation){setStatus("⚠️ GPS non pris en charge.","err");return}
  setStatus("Demande de position GPS…","busy");
  navigator.geolocation.getCurrentPosition(p=>{
    if(busy)return;
    if(p.coords.accuracy>200&&!confirm(`Position imprécise (±${Math.round(p.coords.accuracy)} m). Utiliser ce point comme départ ?`)){setStatus("Position non retenue. Saisie manuelle disponible.");return}
    clearResults();
    resetRange();
    clearRememberedInput("start");currentPos=[p.coords.latitude,p.coords.longitude];$("start").value="Ma position";
    setStatus(`Position reçue (±${Math.round(p.coords.accuracy)} m).`,"ok");
  },e=>setStatus(`⚠️ GPS : ${e.message}`,"err"),{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
}
function initPwa(){
  if(document.body.dataset.preview === "true") return;
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").then(()=>dbg("Service worker enregistré")).catch(e=>dbg("SW",e.message));
  }
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false});
  $("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").hidden=true});
}
function bindProfile(){
  $("profileBtn").addEventListener("click",openProfile);
  document.querySelectorAll('.close-dialog').forEach(button=>button.addEventListener("click",()=>button.closest('dialog').close()));
  $("stationDialog").addEventListener("close",()=>{detailSequence++});
  for(const id of ["stationCards","stationDots"]){
    $(id).addEventListener("click",e=>{const target=e.target.closest('[data-details]');if(target)openStation(target.dataset.details)});
    $(id).addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches('.svg-station')){e.preventDefault();openStation(e.target.dataset.details)}});
  }
  $("favoriteBtn").addEventListener("click",()=>{
    if(!currentStation)return;const next=structuredClone(profile),s=currentStation;
    const found=next.stations.some(station=>station.id===s.id);
    next.stations=found?next.stations.filter(station=>station.id!==s.id):[...next.stations,{id:s.id,address:s.address,city:s.city,lat:s.lat,lon:s.lon}];
    if(saveProfile(next))$("stationMessage").textContent=found?"Station retirée des favoris.":"Station enregistrée dans ce navigateur.";
  });
  $("detailChooseBtn").addEventListener("click",()=>{const id=currentStation?.id;$("stationDialog").close();if(id)selectStation(id)});
  $("vehicleForm").addEventListener("submit",e=>{
    e.preventDefault();const next=structuredClone(profile);
    next.vehicle={...next.vehicle,name:$("vehicleName").value.trim(),type:$("vehicleType").value,fuel:$("vehicleFuel").value,cons:Number($("vehicleCons").value),liters:Number($("vehicleLiters").value)};
    if(saveProfile(next)){applyVehicle();$("profileMessage").textContent="Véhicule enregistré. Paramètres carburant appliqués."}
  });
  $("saveTruckDimensions").addEventListener("click",()=>{
    try{const next=structuredClone(profile);next.vehicle.dimensions=routeDimensions();if(saveProfile(next)){$("savedDimensionsNote").textContent="Gabarit mémorisé : "+dimensionLabel(next.vehicle.dimensions);$("profileMessage").textContent="Gabarit du trajet enregistré."}}
    catch(e){$("profileMessage").textContent=e.message}
  });
  $('profileDialog').addEventListener('close',()=>{addressLookupSequence++;profileImportSequence++;$('resolveAddressBtn').disabled=false;updateAddressDraft()});
  $('cancelAddressEdit').addEventListener('click',resetAddressForm);
  $('addressValue').addEventListener('input',invalidateAddressDraft);
  $('addressName').addEventListener('input',resetAddressDuplicates);
  $('resolveAddressBtn').addEventListener('click',resolveAddressDraft);
  for(const [button,input] of [['copyStartBtn','start'],['copyEndBtn','end']])$(button).addEventListener('click',()=>{
    const value=$(input).value.trim();
    if(temporaryAddress(value)){$('profileMessage').textContent='Saisir une adresse fixe complète pour enregistrer ce point GPS.';return}
    invalidateAddressDraft();$('addressValue').value=value;
    const resolved=rememberedInputs[input];addressDraft=resolved?.value===value?structuredClone(resolved):null;updateAddressDraft();
  });
  $('addressForm').addEventListener('submit',e=>{
    e.preventDefault();const next=structuredClone(profile),value=$('addressValue').value.trim();
    if(temporaryAddress(value)){$('profileMessage').textContent='Saisir une adresse complète, pas le libellé GPS temporaire.';return}
    const entry={id:$('addressId').value||crypto.randomUUID(),name:$('addressName').value.trim(),value,...(addressDraft?.value===value?{place:structuredClone(addressDraft.place)}:{})};
    const duplicates=duplicateAddresses(entry,next.addresses);
    if(duplicates.length&&!$('allowAddressDuplicate').checked){$('addressDuplicates').hidden=false;$('addressDuplicateNote').textContent='Doublon possible avec : '+duplicates.map(a=>a.name).join(', ')+'. Aucun favori existant ne sera remplacé.';$('allowAddressDuplicate').focus();return}
    const index=next.addresses.findIndex(a=>a.id===entry.id);if(index<0)next.addresses.push(entry);else next.addresses[index]=entry;
    if(saveProfile(next)){resetAddressForm();$('profileMessage').textContent='Adresse enregistrée.'}
  });
  $('savedAddresses').addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    for(const [key,input] of [['addressStart','start'],['addressEnd','end']])if(button.dataset[key]){
      const a=profile.addresses.find(a=>a.id===button.dataset[key]);if(!a)return;
      if(temporaryAddress(a.value)){$('profileMessage').textContent='Cette adresse GPS temporaire doit être remplacée par une adresse fixe.';return}
      $(input).value=a.value;clearRememberedInput(input);
      if(a.place){favoriteInputs[input]={value:a.value,place:structuredClone(a.place)};rememberedInputs[input]=structuredClone(favoriteInputs[input]);$(input+'PlaceNote').textContent='Lieu mémorisé : '+placeDescription(a.place)+'.';$(input+'PlaceNote').hidden=false}
      clearResults();if(input==='start')resetRange();setStatus('Adresse choisie. Trajet à recalculer.');$('profileDialog').close();$(input).focus();return;
    }
    if(button.dataset.addressEdit){const a=profile.addresses.find(a=>a.id===button.dataset.addressEdit);if(a){invalidateAddressDraft();$('addressId').value=a.id;$('addressName').value=a.name;$('addressValue').value=a.value;addressDraft=a.place?{value:a.value,place:structuredClone(a.place)}:null;updateAddressDraft();$('cancelAddressEdit').hidden=false;$('addressName').focus()}}
    if(button.dataset.addressRemove){const next=structuredClone(profile);next.addresses=next.addresses.filter(a=>a.id!==button.dataset.addressRemove);if(saveProfile(next)){$('profileMessage').textContent='Adresse supprimée.';if($('addressId').value===button.dataset.addressRemove)resetAddressForm()}}
  });
  $("savedStations").addEventListener("click",e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.dataset.favoriteOpen){$("profileDialog").close();openStation(button.dataset.favoriteOpen)}
    if(button.dataset.favoriteRemove){const next=structuredClone(profile);next.stations=next.stations.filter(s=>s.id!==button.dataset.favoriteRemove);if(saveProfile(next))$("profileMessage").textContent="Station retirée des favoris."}
  });
  $('exportProfileBtn').addEventListener('click',()=>{if(!profileWriteBlocked)downloadProfile(profile)});
  $('exportLegacyProfileBtn').addEventListener('click',()=>{if(legacyProfile)downloadProfile(legacyProfile,'DragonRoute-profil-origine-v1.json')});
  $('importProfileBtn').addEventListener('click',()=>$('importProfileFile').click());
  $('exportBeforeImport').addEventListener('click',()=>{if(!profileWriteBlocked)downloadProfile(profile)});
  $('cancelProfileImport').addEventListener('click',()=>$('profileImportDialog').close());
  $('profileImportDialog').addEventListener('close',()=>{pendingProfileImport=null;profileImportSequence++;if($('profileDialog').open)$('importProfileBtn').focus()});
  $('importProfileFile').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;const seq=++profileImportSequence;addressLookupSequence++;$('resolveAddressBtn').disabled=false;
    try{
      if(file.size>100000)throw new Error('Fichier trop volumineux');
      const next=validateProfile(JSON.parse(await file.text()));
      if(seq!==profileImportSequence||!$('profileDialog').open)return;
      if(profileWriteBlocked)throw new Error('Le profil existant n’a pas pu être chargé. Son remplacement est bloqué.');
      pendingProfileImport=next;
      const duplicates=duplicateAddressCount(next.addresses),located=next.addresses.filter(a=>a.place).length;
      $('profileImportSummary').textContent=`${next.addresses.length} adresse(s), dont ${located} avec un lieu mémorisé ; ${next.stations.length} station(s) favorite(s). Véhicule : ${next.vehicle.name||'Sans nom'} · ${({car:'voiture',caravan:'voiture avec caravane',van:'utilitaire',truck:'camion'})[next.vehicle.type]} · ${next.vehicle.fuel}, ${next.vehicle.cons} L/100 km ; ${next.vehicle.liters} L par défaut${next.vehicle.dimensions?", gabarit : "+dimensionLabel(next.vehicle.dimensions):""}. ${duplicates?duplicates+' doublon(s) possible(s) dans les adresses.':'Aucun doublon apparent dans les adresses.'}`;
      $('profileImportCurrent').textContent=`Le profil actuel contient ${profile.addresses.length} adresse(s) et ${profile.stations.length} station(s). Il sera remplacé après confirmation.`;
      $('profileImportNames').replaceChildren(...next.addresses.map(a=>{const li=document.createElement('li');li.textContent=a.name+' — '+a.value+(a.place?' · Lieu mémorisé : '+a.place.label:'');return li}));
      $('profileImportMessage').textContent='';$('profileImportDialog').showModal();
    }catch(e){if(seq===profileImportSequence)$('profileMessage').textContent='Import refusé : '+e.message+'. Le profil existant est conservé.'}
    finally{e.target.value=''}
  });
  $('confirmProfileImport').addEventListener('click',()=>{
    if(!pendingProfileImport)return;
    if(saveProfile(pendingProfileImport)){resetRememberedInputs();resetAddressForm();applyVehicle();$('profileImportDialog').close();openProfile();$('profileMessage').textContent='Profil importé.'}
    else $('profileImportMessage').textContent=$('profileMessage').textContent+' Le profil précédent est conservé.';
  });
  $('eraseProfileBtn').addEventListener('click',()=>{
    if(!confirm('Effacer le véhicule, les adresses et les stations de ce profil local, ainsi que sa copie d’origine ? Les autres applications et aperçus seront conservés.'))return;
    try{
      if(localStorage.getItem(PROFILE_KEY)!==profileSnapshot||localStorage.getItem(LEGACY_PROFILE_KEY)!==legacySnapshot)throw new Error('Profil modifié dans un autre onglet. Recharger avant de réessayer.');
      localStorage.removeItem(LEGACY_PROFILE_KEY);localStorage.removeItem(PROFILE_KEY);loadProfile();resetRememberedInputs();applyVehicle();resetAddressForm();openProfile();$('profileMessage').textContent='Profil local effacé.';
    }catch(e){loadProfile();resetRememberedInputs();applyVehicle();resetAddressForm();openProfile();$('profileMessage').textContent='Suppression non terminée : '+e.message+'. Vérifier les données restantes avant de réessayer.'}
  });
}
function bind(){
  for(const id of ["tollHeight","tollWeight","tollPayment","tollDeparture","tollVehicleConfirmed"])$(id).addEventListener("input",updateBudget);
  $("tollCalculate").addEventListener("click",()=>{if(busy||!tollEndpoint()||!tollParameters())return;clearTableTolls('Calcul automatique demandé : les tronçons manuels ont été retirés.');tollState.enabled=true;tollState.key='';updateBudget()});
  $("tollLocate").addEventListener('click',locateTollGates);
  $("tollGuideRadius").addEventListener('change',()=>{if(!busy&&trip)locateTollGates()});
  $("tollGuideToggle").addEventListener('click',()=>{if(!busy){tollGuide.shown=!tollGuide.shown;drawTollMarkers();syncTollGuide(tollGuide.key)}});
  $("tariffGateConfirmed").addEventListener('change',updateBudget);
  for(const id of ['tariffNetwork','tariffEntry','tariffExit'])$(id).addEventListener('change',()=>{$("tariffGateConfirmed").checked=false});
  $("tollGateList").addEventListener('click',e=>{const b=e.target.closest('button');if(!b||busy)return;if(b.dataset.tollPropose)proposeTollGate(b.dataset.tollPropose,b.dataset.gateRole);if(b.dataset.tollMap){const g=tollGuide.matches.find(g=>g.id===b.dataset.tollMap);if(!g)return;tollGuide.shown=true;drawTollMarkers();syncTollGuide(tollGuide.key);if(map)map.setView([g.lat,g.lon],Math.max(map.getZoom(),13));$(map?'map':'mapFallback').scrollIntoView({block:'center'})}});
  document.addEventListener('click',e=>{const el=e.target.closest('[data-toll-focus]');if(el)focusTollCard(el.dataset.tollFocus)});
  document.addEventListener('keydown',e=>{const el=e.target.closest('[data-toll-focus]');if(el&&['Enter',' '].includes(e.key)){e.preventDefault();focusTollCard(el.dataset.tollFocus)}});
  $("tariffNetwork").addEventListener('change',()=>tariffGates(true));
  $("tariffEntry").addEventListener('change',()=>tariffGates());
  $("tariffExit").addEventListener('change',updateBudget);
  for(const id of ['tariffClass','tariffDate'])$(id).addEventListener('input',()=>{if(tableTolls.segments.length)clearTableTolls('Classe ou date modifiée : sélectionner à nouveau les tronçons.');updateBudget()});
  $("tariffComplete").addEventListener('change',updateBudget);
  $("tariffClear").addEventListener('click',()=>{clearTableTolls('Tronçons retirés.');updateBudget()});
  $("tariffAdd").addEventListener('click',()=>{
   const c=tariffCandidate();if(busy||!trip||!c||(tollGuide.suggested&&!$("tariffGateConfirmed").checked)||tableTolls.segments.length>=10||tableTolls.segments.some(s=>s.network===c.network&&s.entry===c.entry&&s.exit===c.exit))return;
   resetTollQuote();tollState.enabled=false;tableTolls.segments.push(c);$("tariffComplete").checked=false;tableTolls.notice='Tronçon ajouté au budget. Jusqu’à dix tronçons, sans doublon identique. Vérifier les éventuels chevauchements.';updateBudget();
  });
  tariffGates(true);
  setInterval(()=>{if(tableTolls.segments.length&&!tariffDateValid())updateBudget()},60000);
  $("navigationBtn").addEventListener("click",openNavigation);
  $("exportGpxBtn").addEventListener("click",exportGpx);
  $("navigationDialog").addEventListener("close",()=>{if(!$("navigationDialog").open)for(const id of ["googleMapsLink","wazeStationLink","wazeArrivalLink"])$(id).removeAttribute("href")});
  $("placeChoices").addEventListener("change",()=>{$("confirmPlace").disabled=false});
  $("confirmPlace").addEventListener("click",()=>{
    const choice=document.querySelector('input[name=placeChoice]:checked');
    if(!placePending||!choice)return;
    placePending.result=placePending.places[Number(choice.value)];$("placeDialog").close();
  });
  $("cancelPlace").addEventListener("click",()=>$("placeDialog").close());
  $("placeDialog").addEventListener("close",()=>{
    if(!placePending)return;
    const pending=placePending;placePending=null;
    if(pending.result)pending.resolve(pending.result);
    else pending.reject(new Error("Choix du lieu annulé. Préciser l’adresse puis relancer."));
  });
  $("budgetPrice").addEventListener("input",()=>{budgetReference={label:"Prix saisi",at:new Date().toLocaleString("fr-FR")};updateBudget()});
  $("useStationPrice").addEventListener("click",()=>{
    if(!selectedStop)return;
    const s=selectedStop.station;$("budgetPrice").value=s.price;
    budgetReference={stationId:s.id,label:`Prix de l’arrêt : ${s.address}`,at:age(s.updated)};updateBudget();
  });
  for(const id of ["rangeMode","rangeValue","reserveKm","rangeOnly"]){
    $(id).addEventListener("input",()=>{
      if(id==="rangeMode")$("rangeValue").value="";
      rangeMeasuredAt=Date.now();updateRange();
    });
  }
  for(const id of ["maxDetourKm","maxDetourMin","serviceChoices","stationOpeningFilter"]){$(id).addEventListener("input",()=>{if(!busy&&stationSearch)renderStations(compared,stopWindow().mode)})}
  $("resetStationFilters").addEventListener("click",()=>{
    if(busy)return;
    $("maxDetourKm").value="";$("maxDetourMin").value="";$("stationOpeningFilter").value="all";$("rangeOnly").checked=false;
    document.querySelectorAll('[data-service]').forEach(el=>el.checked=false);
    $("stationListMode").value="recommended";
    if(stationSearch)renderStations(compared,stopWindow().mode);
  });
  $("stationListMode").addEventListener("change",()=>{if(compared.length)renderStations(compared,stopWindow().mode)});
  document.querySelectorAll('.avoid-options input,#routeVehicle,#truckDimensions input').forEach(el=>el.addEventListener("change",()=>{if(!busy)invalidateRouting()}));
  $("cancelStationsBtn").addEventListener("click",()=>activeAbort?.abort());
  $("routeChoices").addEventListener("change",e=>{if(e.target.name==="routeChoice")chooseRoute(Number(e.target.value))});
  $("removeStopBtn").addEventListener("click",()=>{if(!busy&&trip){selectedStop=null;invalidateStationPrice();updateTripMetrics();renderStations(compared,stopWindow().mode);$("selectedStop").hidden=true;$("removeStopBtn").hidden=true;document.querySelectorAll('[data-station]').forEach(el=>el.classList.remove('selected'));document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed','false'));$("fuelStatus").textContent="Arrêt retiré. Trajet choisi restauré."}});
  $("goBtn").addEventListener("click",run);$("gpsBtn").addEventListener("click",gps);
  ["start","end"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter")run()}));
  ["start","end"].forEach(id=>$(id).addEventListener("input",()=>{clearRememberedInput(id);if(!busy){clearResults();if(id==="start")resetRange();setStatus("Trajet à recalculer.")}}));
  $("stationDeparture").addEventListener("input",()=>{if(!busy)refreshArrival()});
  $("stationDepartureNow").addEventListener("click",()=>{if(!busy){$("stationDeparture").value=parisLocal(Date.now());refreshArrival()}});
  $("stationsBtn").addEventListener("click",searchStations);
  $("stationCards").addEventListener("click",e=>{const button=e.target.closest('[data-select]');if(button)selectStation(button.dataset.select)});
  document.querySelectorAll('input[name="stopMode"],#stopKm,#fuel,#liters,#cons').forEach(el=>el.addEventListener("input",()=>{if(!busy){
    if(el.id==="fuel"){$("budgetPrice").value="";budgetReference=null}
    clearStations();updateWindow();updateRange();updateBudget();
  }}));
  for(const name of ["stations","rides"]){
    $(name+"Tab").addEventListener("click",()=>selectTab(name));
    $(name+"Tab").addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const next=e.key==="Home"?"stations":e.key==="End"?"rides":name==="stations"?"rides":"stations";selectTab(next);$(next+"Tab").focus()}});
  }
}

loadPreparedTrips();makeGrid();bind();bindProfile();bindJournal();bindPreparedTrips();applyVehicle();updateRange();initPwa();
$("stationDeparture").value=parisLocal(Date.now());refreshArrival();
health("hJS","ok","JS ✓");
setStatus("Moteur chargé. Prêt pour un trajet réel.","ok");
initMap();
window.addEventListener("unhandledrejection",e=>dbg("Unhandled",e.reason?.message||String(e.reason)));
})();
