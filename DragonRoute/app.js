(()=>{"use strict";
const C=window.DRAGONROUTE_CONFIG;
const $=id=>document.getElementById(id);
const fuelField={E10:"e10",Gazole:"gazole",SP98:"sp98",SP95:"sp95",E85:"e85",GPLc:"gplc"};
const log=[];
let map=null, routeLayer=null, markerLayer=null, currentPos=null, activeAbort=null, deferredInstall=null;
let trip=null, compared=[], busy=false,stationSearch=null;
let comparison=null;
let mapView=null,currentStation=null,detailSequence=0;
let orsLastRequest=-Infinity;
let ignLastRequest=-Infinity;
const ignCache=new Map();
let geoLastRequest=-Infinity,geoBlockedUntil=0,placePending=null,selectedStop=null,budgetReference=null,rangeMeasuredAt=null;
const geoCache=new Map();
const dimensionFields={height:"truckHeight",width:"truckWidth",length:"truckLength",weight:"truckWeight",axleload:"truckAxleload"};
const avoidLabels={tollways:"péages",highways:"autoroutes",ferries:"ferries"};
const PROFILE_SCOPE=document.body.dataset.preview==="true"?"preview:"+new URL('.',location.href).pathname:"public";
const PROFILE_KEY="dragonroute.profile.v3."+PROFILE_SCOPE;
const PROFILE_SOURCES=[3,2,1].map(version=>({version,key:`dragonroute.profile.v${version}.${PROFILE_SCOPE}`}));
let profile,storageNotice="",profileSnapshots={},profileWriteBlocked=false,legacyProfiles=[];
let tripVehicleId=null,vehicleDraftId=null;
let addressDraft=null,addressLookupSequence=0,profileImportSequence=0,pendingProfileImport=null;
const rememberedInputs={start:null,end:null},favoriteInputs={start:null,end:null};
// BEGIN PROFILE VALIDATION
function defaultVehicle(){return {name:"",type:"car",fuel:"E10",cons:6.2,liters:40}}
function emptyProfile(){return {version:3,vehicles:[],activeVehicleId:null,addresses:[],stations:[]}}
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
 if(!data||![1,2,3].includes(data.version)||!Array.isArray(data.addresses)||!Array.isArray(data.stations)||data.addresses.length>50||data.stations.length>100)throw new Error("Format de profil invalide");
 if(data.version===3&&(!Array.isArray(data.vehicles)||data.vehicles.length>10))throw new Error('Conserver au maximum dix véhicules par profil.');
 const vehicles=data.version===3?data.vehicles.map(v=>({...validateVehicle(v),id:profileText(v.id,80)})):[{...validateVehicle(data.vehicle),id:'legacy-vehicle'}];
 if(vehicles.some(v=>!v.id)||new Set(vehicles.map(v=>v.id)).size!==vehicles.length)throw new Error('Identifiants de véhicules invalides.');
 const activeVehicleId=data.version===3?data.activeVehicleId:'legacy-vehicle';
 if(activeVehicleId!==null&&(typeof activeVehicleId!=='string'||!vehicles.some(v=>v.id===activeVehicleId)))throw new Error('Véhicule actif absent du profil.');
 const addresses=data.addresses.map(a=>{
  const entry={id:profileText(a.id,80),name:profileText(a.name,80),value:profileText(a.value,250)};
  if(data.version>=2&&a.place!=null){if(temporaryAddress(entry.value))throw new Error('Position GPS temporaire non réutilisable');entry.place=validateSavedPlace(a.place)}
  return entry;
 });
 const stations=data.stations.map(s=>({id:profileText(s.id,80),address:profileText(s.address,300),city:profileText(s.city,100),lat:profileNumber(s.lat,-90,90),lon:profileNumber(s.lon,-180,180)}));
 for(const list of [addresses,stations]){if(list.some(x=>!x.id)||new Set(list.map(x=>x.id)).size!==list.length)throw new Error("Identifiants invalides")}
 if(addresses.some(a=>!a.name||!a.value))throw new Error("Adresse incomplète");
 const clean={version:3,vehicles,activeVehicleId,addresses,stations};
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>100000)throw new Error('Profil trop volumineux');
 return clean;
}
function validateVehicle(v){
 if(!v||!["car","caravan","van","truck"].includes(v.type)||!Object.hasOwn(fuelField,v.fuel))throw new Error('Véhicule invalide');
 const dimensions=v.dimensions==null?undefined:validateDimensions(v.dimensions);
 return {name:profileText(v.name,80),type:v.type,fuel:v.fuel,cons:profileNumber(v.cons,1,100),liters:profileNumber(v.liters,1,2000),...(dimensions?{dimensions}:{})};
}
function legacyProfileExport(data){
 if(![1,2].includes(data?.version))throw new Error('Ancien format non reconnu.');
 const clean=validateProfile(data),{id,...vehicle}=clean.vehicles[0];
 return {version:data.version,vehicle,addresses:clean.addresses,stations:clean.stations};
}
function duplicateVehicles(v,vehicles){return v.name.trim()?vehicles.filter(x=>x.id!==v.id&&addressKey(x.name)===addressKey(v.name)):[]}
function duplicateAddresses(entry,addresses){
 return addresses.filter(a=>a.id!==entry.id&&(addressKey(a.name)===addressKey(entry.name)||(a.place&&entry.place?Math.abs(a.place.lat-entry.place.lat)<1e-6&&Math.abs(a.place.lon-entry.place.lon)<1e-6:addressKey(a.value)===addressKey(entry.value))));
}
function duplicateAddressCount(addresses){return addresses.reduce((n,a,i)=>n+duplicateAddresses(a,addresses.slice(0,i)).length,0)}
// END PROFILE VALIDATION
function loadProfile(){
 profile=emptyProfile();storageNotice="";profileWriteBlocked=false;legacyProfiles=[];profileSnapshots={};
 try{
  for(const {key} of PROFILE_SOURCES)profileSnapshots[key]=localStorage.getItem(key);
  for(const {key,version} of PROFILE_SOURCES.slice(1)){try{const data=JSON.parse(profileSnapshots[key]);if(data?.version===version)legacyProfiles.push(legacyProfileExport(data))}catch{}}
  const source=PROFILE_SOURCES.find(({key})=>profileSnapshots[key]!==null);
  if(source){const data=JSON.parse(profileSnapshots[source.key]);if(data.version!==source.version)throw new Error('Version incohérente avec le stockage.');profile=validateProfile(data)}
  if(source&&source.version<3)storageNotice="Ancien profil repris. Les copies d’origine restent conservées dans ce navigateur et peuvent être exportées.";
 }catch{profileWriteBlocked=true;storageNotice="Profil non chargé : format inconnu, données invalides ou stockage inaccessible. L’original est conservé ; aucun enregistrement ne le remplacera. Réouvrir avec une version compatible, ou effacer explicitement ce profil pour repartir."}
}
loadProfile();
function profileUnchanged(){return PROFILE_SOURCES.every(({key})=>localStorage.getItem(key)===profileSnapshots[key])}
function saveProfile(next){
 try{
  if(profileWriteBlocked)throw new Error('Profil non chargé : remplacement bloqué.');
  if(!profileUnchanged())throw new Error('Profil modifié dans un autre onglet. Recharger avant de réessayer.');
  const clean=validateProfile(next),raw=JSON.stringify(clean);
  localStorage.setItem(PROFILE_KEY,raw);profileSnapshots[PROFILE_KEY]=raw;profile=clean;storageNotice="";renderSaved();updateFavorite();return true;
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
  if(e.calculation!==null){const c=e.calculation;if(!c||c.version!=='route-snapshot-v1'||!['car','truck','walk'].includes(c.mode)||!['ign','osrm','ors'].includes(c.engine))throw new Error('Calcul historique inconnu.');clean.calculation={version:c.version,engine:c.engine,start:journalText(c.start,1000,true),end:journalText(c.end,1000,true),resourceVersion:c.resourceVersion===null?null:journalText(c.resourceVersion,150,true),calculatedAt:journalInstant(c.calculatedAt),mode:c.mode,distanceMeters:journalNumber(c.distanceMeters,40000000),stop:c.stop===null?null:journalText(c.stop,500,true)}}
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
 if(fromRoute){if(!trip||busy)return;const r=selectedStop?.via||trip.base;e={...e,start:trip.places.start,end:trip.places.end,mode:trip.routing.vehicle.type,distanceMeters:r.distance,distanceSource:'route',calculation:{version:'route-snapshot-v1',engine:trip.routing.provider,start:trip.places.start,end:trip.places.end,resourceVersion:typeof r.resourceVersion==='string'?r.resourceVersion:null,calculatedAt:trip.calculatedAt,mode:trip.routing.vehicle.type,distanceMeters:r.distance,stop:selectedStop?selectedStop.station.address:null}}}
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
function activeProfileVehicle(){return profile.vehicles.find(v=>v.id===profile.activeVehicleId)||defaultVehicle()}
function vehicleLabel(v){return (v.name||'Sans nom')+' · '+({car:'voiture',caravan:'voiture avec caravane',van:'utilitaire',truck:'camion'})[v.type]+' · '+v.fuel}
function renderVehiclePicker(){
 const select=$('savedVehicleSelect');select.replaceChildren(new Option('Réglages ponctuels',''),...profile.vehicles.map(v=>new Option(vehicleLabel(v),v.id)));
 const saved=profile.vehicles.find(v=>v.id===tripVehicleId);select.value=saved?.id||'';select.disabled=busy||profileWriteBlocked;
 $('vehiclePicker').hidden=isWalking();$('activeVehicle').hidden=isWalking();
 $('activeVehicle').textContent=saved?`Véhicule mémorisé appliqué : ${vehicleLabel(saved)}.`:'Réglages pour ce trajet uniquement. Les véhicules mémorisés restent inchangés.';
}
function detachTripVehicle(){tripVehicleId=null;renderVehiclePicker()}
function applyVehicle(){
 const v=activeProfileVehicle(),hadTrip=Boolean(trip);
 clearResults();resetProspective();resetRange();resumePreparation=null;preparedRangePending=false;updateResumePreparation();
 $('tariffClass').value='';$('tollHeight').value='';$('tollWeight').value='';$('tollVehicleConfirmed').checked=false;
 $('budgetPrice').value='';budgetReference=null;
 $('fuel').value=v.fuel;$('cons').value=v.cons;$('liters').value=v.liters;$('routeVehicle').value=v.type;
 for(const [key,id] of Object.entries(dimensionFields))$(id).value=v.dimensions?.[key]??'';
 tripVehicleId=profile.activeVehicleId;updateVehicleRouting();updateRange();updateBudget();renderVehiclePicker();
 if(hadTrip)setStatus('Véhicule modifié. Trajet à recalculer.');
}
function useSavedVehicle(id){
 if(busy)return;
 if(!id){detachTripVehicle();return}
 if(!profile.vehicles.some(v=>v.id===id)){renderVehiclePicker();return}
 const next=structuredClone(profile);next.activeVehicleId=id;
 if(saveProfile(next)){$('travelMode').value='car';applyVehicle();setStatus('Véhicule choisi. Calculer un nouveau trajet.');$('profileMessage').textContent='Véhicule choisi pour ce trajet et les prochains démarrages.'}
 else{renderVehiclePicker();setStatus($('profileMessage').textContent,true)}
}
function resetVehicleDuplicate(){$('allowVehicleDuplicate').checked=false;$('vehicleDuplicates').hidden=true}
function vehicleFormDimensions(){
 const raw=Object.fromEntries(Object.keys(dimensionFields).map(k=>[k,$('vehicleDim-'+k).value]));
 if(Object.values(raw).every(v=>v===''))return undefined;
 return validateDimensions(Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Number(v)])));
}
function showVehicleDimensions(d){
 for(const k of Object.keys(dimensionFields))$('vehicleDim-'+k).value=d?.[k]??'';
 $('savedDimensionsNote').textContent=d?'Gabarit dans le formulaire : '+dimensionLabel(d)+'. Enregistrer pour le conserver.':'Aucun gabarit renseigné.';
}
function editVehicle(id=null){
 const v=profile.vehicles.find(x=>x.id===id)||defaultVehicle();vehicleDraftId=v.id||null;
 for(const [el,key] of [['vehicleName','name'],['vehicleType','type'],['vehicleFuel','fuel'],['vehicleCons','cons'],['vehicleLiters','liters']])$(el).value=v[key];
 $('vehicleEditorTitle').textContent=vehicleDraftId?'Modifier un véhicule':'Ajouter un véhicule';showVehicleDimensions(v.dimensions);resetVehicleDuplicate();
}
function renderVehicles(){
 $('savedVehicles').innerHTML=profile.vehicles.length?profile.vehicles.map(v=>`<div class="saved-row"><strong>${escapeHtml(vehicleLabel(v))}</strong><p>${v.cons} L/100 km · ${v.liters} L à acheter par défaut${v.id===profile.activeVehicleId?' · Choisi au démarrage':''}</p><p>${v.dimensions?escapeHtml(dimensionLabel(v.dimensions)):'Gabarit non renseigné.'}</p><div class="dialog-actions"><button class="ghost" data-vehicle-use="${escapeHtml(v.id)}">Utiliser ce véhicule</button><button class="ghost" data-vehicle-edit="${escapeHtml(v.id)}">Modifier le véhicule</button><button class="ghost" data-vehicle-remove="${escapeHtml(v.id)}">Supprimer le véhicule</button></div></div>`).join(''):'<p class="note">Aucun véhicule enregistré. La préparation reste disponible avec des réglages ponctuels.</p>';
 $('newVehicleBtn').disabled=busy||profile.vehicles.length>=10;
 renderVehiclePicker();
}
function renderSaved(){
  renderVehicles();
  $("savedAddresses").innerHTML=profile.addresses.length?profile.addresses.map(a=>`<div class="saved-row"><strong>${escapeHtml(a.name)}</strong><p>${escapeHtml(a.value)}</p><p>${a.place?`Lieu mémorisé : ${escapeHtml(placeDescription(a.place))}`:temporaryAddress(a.value)?"Adresse GPS temporaire à remplacer.":"Lieu à rechercher lors du trajet."}</p><div class="dialog-actions"><button class="ghost" data-address-start="${escapeHtml(a.id)}">Départ</button><button class="ghost" data-address-end="${escapeHtml(a.id)}">Arrivée</button><button class="ghost" data-address-edit="${escapeHtml(a.id)}">Modifier</button><button class="ghost" data-address-remove="${escapeHtml(a.id)}">Supprimer</button></div></div>`).join(""):"<p class=note>Aucune adresse enregistrée.</p>";
  $("savedStations").innerHTML=profile.stations.length?profile.stations.map(s=>`<div class="saved-row"><strong>${escapeHtml(s.city||"Station")}</strong><p>${escapeHtml(s.address)}</p><div class="dialog-actions"><button class="ghost" data-favorite-open="${escapeHtml(s.id)}">Voir la station</button><button class="ghost" data-favorite-remove="${escapeHtml(s.id)}">Retirer</button></div></div>`).join(""):"<p class=note>Aucune station enregistrée.</p>";
}
function openProfile(){
  if(busy)return;
  $("profileMessage").textContent=storageNotice;
  editVehicle(profile.activeVehicleId);
  $('exportProfileBtn').disabled=profileWriteBlocked;
  for(const [id,version] of [['exportLegacyProfileBtn',1],['exportV2ProfileBtn',2]])$(id).hidden=!legacyProfiles.some(p=>p.version===version);
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
  updateResumePreparation();updateRides();updateTripTiming();
  const d=departureInstant($("stationDeparture").value);
  $("stationDeparture").setAttribute('aria-invalid',String(Boolean(d.error)));
  $("stationDepartureStatus").textContent=d.error||`Départ fixé au ${arrivalLabel(d.instant)} (Paris). Durée routière d’accès, sans pauses ni trafic en direct.${d.instant<Date.now()-60000?' Heure passée : actualiser le départ pour un trajet à venir.':''}`;
  if(stationSearch)renderStations(compared,stopWindow().mode);
  if($("stationDialog").open&&currentStation)renderStationDetails(currentStation);
}

// BEGIN TIMING MODEL
function timingHypotheses(raw){
 if(!raw||typeof raw.onlyBefore!=='boolean')throw new Error('Filtre horaire invalide.');
 const read=(value,label)=>{if(value===null||value==='')return null;if(typeof value!=='string')throw new Error(label+' invalide.');const d=departureInstant(value);if(d.error)throw new Error(label+' : '+d.error);return d.instant};
 const departure=read(raw.departure,'Départ'),arriveBy=read(raw.arriveBy,'Heure limite');
 if(departure!==null&&arriveBy!==null&&arriveBy<departure)throw new Error('L’heure limite doit suivre le départ ou lui être égale.');
 if(raw.onlyBefore&&arriveBy===null)throw new Error('Renseigner une heure limite avant d’activer le filtre.');
 return {departure,arriveBy,onlyBefore:raw.onlyBefore};
}
function timingEstimate(duration,h){
 const known=typeof duration==='number'&&Number.isFinite(duration)&&duration>=0&&duration<=31536000;
 const arrival=known&&h.departure!==null?h.departure+duration*1000:null;
 const state=arrival===null?'unknown':h.arriveBy===null?'unconstrained':arrival<=h.arriveBy?'compatible':'late';
 return {arrival,state,lateSeconds:state==='late'?(arrival-h.arriveBy)/1000:null,admissible:state==='compatible'};
}
function timingRecord(raw){const h=timingHypotheses(raw);return {departure:h.departure===null?null:parisLocal(h.departure),arriveBy:h.arriveBy===null?null:parisLocal(h.arriveBy),onlyBefore:h.onlyBefore}}
function resumeTiming(t,now){
 const h=timingHypotheses(t),expired=h.departure===null||h.departure<now-60000;
 // Keep the original snapshot untouched. A changed departure requires reviewing its deadline too.
 return {departure:expired?null:t.departure,arriveBy:expired?null:t.arriveBy,onlyBefore:expired?false:t.onlyBefore,review:expired};
}
// END TIMING MODEL
function routeTimingRaw(){return {departure:$('stationDeparture').value,arriveBy:$('routeArriveBy').value,onlyBefore:$('routeOnlyBefore').checked}}
function timingText(result){
 const arrival=result.arrival===null?'Arrivée non estimée : départ ou durée absent.':`Arrivée estimée : ${arrivalLabel(result.arrival)} (Paris).`;
 return arrival+' '+({unknown:'Compatibilité avec l’heure limite inconnue.',unconstrained:'Aucune heure limite demandée.',compatible:'Compatible avec l’heure limite selon la durée estimée.',late:`Heure limite dépassée d’environ ${result.lateSeconds<60?Math.ceil(result.lateSeconds)+' s':Math.ceil(result.lateSeconds/60)+' min'} selon la durée estimée.`}[result.state]);
}
function updateTripTiming(){
 $('tripTiming').hidden=!trip;
 try{const h=timingHypotheses(routeTimingRaw());$('routeTimingStatus').textContent=h.onlyBefore?'Filtre d’heure limite repris à l’ouverture de la comparaison. Le trajet affiché reste consultable.':'';$('routeArriveBy').setAttribute('aria-invalid','false');
 if(trip){const r=selectedStop?.via||trip.base;const result=timingEstimate(r.duration,h);$('tripTiming').textContent=timingText(result)+(selectedStop?' Arrêt routier inclus ; temps du plein non inclus.':'')+' Hors pauses et trafic en direct. Aucune garantie d’arrivée.';$('tripTiming').dataset.timingState=result.state;}}
 catch(e){$('routeArriveBy').setAttribute('aria-invalid','true');$('routeTimingStatus').textContent=e.message;if(trip){$('tripTiming').textContent='Horaire à vérifier : '+e.message;$('tripTiming').dataset.timingState='invalid'}}
}
function preparedTimingText(e){const t=e.timing;return `<p>Départ prévu : ${escapeHtml(t.departure?.replace('T',' ')||'non renseigné')}. Heure limite : ${escapeHtml(t.arriveBy?.replace('T',' ')||'non renseignée')} (Paris). ${t.onlyBefore?'Filtre d’heure limite demandé.':''}</p>`}

// BEGIN PREPARED TRIPS MODEL
function preparedText(v,max,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error('Texte de préparation invalide.');return v.trim()}
function preparedNumber(v,min,max){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('Valeur de préparation invalide.');return v}
function preparedEnum(v,values){if(!values.includes(v))throw new Error('Option de préparation inconnue.');return v}
function preparedBool(v){if(typeof v!=='boolean')throw new Error('Option de préparation invalide.');return v}
function preparedDate(v){if(typeof v!=='string'||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)throw new Error('Date de préparation invalide.');return v}
function preparedPoint(p){if(!p||typeof p!=='object')throw new Error('Lieu de préparation manquant.');return {label:preparedText(p.label,1000,true),lat:preparedNumber(p.lat,-90,90),lon:preparedNumber(p.lon,-180,180)}}
function preparedMeetings(plan){
 if(plan==null)return null;
 if(!plan.limits)throw new Error('Limites de rencontre manquantes.');
 const pickup=preparedPoint(plan.pickup),dropoff=preparedPoint(plan.dropoff);
 if(pickup.lat===dropoff.lat&&pickup.lon===dropoff.lon)throw new Error('Prise en charge et dépose confondues.');
 return {pickup,dropoff,limits:{km:preparedNumber(plan.limits.km,0,1000),minutes:preparedNumber(plan.limits.minutes,0,1440)},stationPosition:preparedEnum(plan.stationPosition,['before','during','after'])};
}
function validatePreparedEntry(e){
 if(!e||!e.places||!e.vehicle||!e.preferences||!e.snapshot)throw new Error('Préparation incomplète.');
 const v=e.vehicle,p=e.preferences,r=e.snapshot,walking=v.type==='walk',nullable=(v,min,max)=>v===null?null:preparedNumber(v,min,max);
 const vehicle=walking?{type:'walk'}:{type:preparedEnum(v.type,['car','truck']),fuel:preparedEnum(v.fuel,['E10','Gazole','SP95','SP98','E85','GPLc']),cons:preparedNumber(v.cons,1,100),liters:preparedNumber(v.liters,1,2000),dimensions:null};
 if(v.type==='truck'){
  if(!v.dimensions)throw new Error('Gabarit de la préparation manquant.');
  vehicle.dimensions=Object.fromEntries(Object.entries({height:6,width:6,length:40,weight:100,axleload:30}).map(([key,max])=>[key,preparedNumber(v.dimensions[key],.01,max)]));
  if(vehicle.dimensions.axleload>vehicle.dimensions.weight)throw new Error('Charge par essieu incohérente.');
 }
 let preferences;
 if(walking){
  const max=p.maxWalkKm===null?null:preparedNumber(p.maxWalkKm,.1,500);
  if((p.avoid&&p.avoid.length)||r.stop!==null||r.engine!=='ign')throw new Error('Une préparation à pied ne contient ni arrêt carburant ni options automobiles.');
  preferences={maxWalkKm:max};
 }else{
 if(!Array.isArray(p.avoid)||p.avoid.length>3||new Set(p.avoid).size!==p.avoid.length||!Array.isArray(p.services)||p.services.length>50)throw new Error('Filtres de préparation invalides.');
 preferences={avoid:p.avoid.map(x=>preparedEnum(x,['tollways','highways','ferries'])),departure:p.departure===null?null:preparedText(p.departure,16,true),stopMode:preparedEnum(p.stopMode,['soon','near','around']),stopKm:preparedNumber(p.stopKm,5,40000),rangeMode:preparedEnum(p.rangeMode,['none','km','liters']),rangeValue:nullable(p.rangeValue,0,5000),reserveKm:preparedNumber(p.reserveKm,0,500),rangeOnly:preparedBool(p.rangeOnly),maxDetourKm:nullable(p.maxDetourKm,0,1000),maxDetourMin:nullable(p.maxDetourMin,0,1440),services:p.services.map(x=>preparedText(x,200,true)),openingFilter:preparedEnum(p.openingFilter,['all','compatible','outside','unknown']),listMode:preparedEnum(p.listMode,['recommended','all','cost','price','detour'])};
 if(preferences.departure!==null&&departureInstant(preferences.departure).error)throw new Error('Heure de départ de la préparation invalide ou ambiguë.');
 if(new Set(preferences.services).size!==preferences.services.length||(preferences.rangeMode!=='none'&&preferences.rangeValue===null)||(preferences.rangeMode==='none'&&preferences.rangeOnly)||(preferences.rangeMode==='liters'&&preferences.rangeValue>2000))throw new Error('Autonomie ou services incohérents.');
 }
 if(!Array.isArray(r.geometry)||r.geometry.length<2||r.geometry.length>25000)throw new Error('Le tracé doit contenir de 2 à 25 000 points.');
 const geometry=r.geometry.map(p=>{if(!Array.isArray(p)||p.length!==2)throw new Error('Point du tracé invalide.');return [preparedNumber(p[0],-180,180),preparedNumber(p[1],-90,90)]});
 const stop=r.stop===null?null:{id:preparedText(r.stop?.id,80,true),address:preparedText(r.stop?.address,300,true),city:preparedText(r.stop?.city,100),lat:preparedNumber(r.stop?.lat,-90,90),lon:preparedNumber(r.stop?.lon,-180,180)};
 if(walking&&e.meetings!=null)throw new Error('Rencontres automobiles incompatibles avec une préparation à pied.');
 const clean={meetings:preparedMeetings(e.meetings),optimization:e.optimization==null?null:preparedEnum(e.optimization,['fastest','shortest']),id:preparedText(e.id,80,true),name:preparedText(e.name,80,true),savedAt:preparedDate(e.savedAt),places:{start:preparedPoint(e.places.start),end:preparedPoint(e.places.end)},vehicle,preferences,snapshot:{calculatedAt:preparedDate(r.calculatedAt),engine:preparedEnum(r.engine,['osrm','ign','ors']),distanceMeters:preparedNumber(r.distanceMeters,0,40000000),durationSeconds:preparedNumber(r.durationSeconds,0,31536000),geometry,stop}};
 if(!/^[A-Za-z0-9-]+$/.test(clean.id)||clean.snapshot.calculatedAt>clean.savedAt)throw new Error('Identité ou chronologie de préparation incohérente.');
 clean.timing=timingRecord(e.timing??{departure:walking?null:preferences.departure,arriveBy:null,onlyBefore:false});
 if(!walking&&clean.timing.departure!==preferences.departure)throw new Error('Départs incohérents dans la préparation.');
 return clean;
}
function validatePreparedTrips(data){
 if(!data||data.kind!=='dragonroute-preparations'||![1,2,3,4,5].includes(data.version)||!Array.isArray(data.entries)||data.entries.length>20)throw new Error('Format inconnu ou limite de 20 préparations dépassée.');
 if(data.version===1&&data.entries.some(e=>e?.vehicle?.type==='walk'))throw new Error('Le format 1 ne prend pas en charge la marche.');
 if(data.version>=3&&data.entries.some(e=>!e?.timing))throw new Error('Horaires de préparation manquants.');
 if(data.version>=4&&data.entries.some(e=>!e||!Object.hasOwn(e,'optimization')))throw new Error('Critère de préparation manquant.');
 if(data.version===5&&data.entries.some(e=>!e||!Object.hasOwn(e,'meetings')))throw new Error('Champ rencontres manquant.');
 const clean={kind:'dragonroute-preparations',version:5,entries:data.entries.map(e=>validatePreparedEntry({...e,...(data.version<3?{timing:undefined}:{}),...(data.version<4?{optimization:null}:{}),...(data.version<5?{meetings:null}:{})}))};
 if(new Set(clean.entries.map(e=>e.id)).size!==clean.entries.length)throw new Error('Identifiants de préparations dupliqués.');
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('Limite de 2 Mo atteinte. Exporter puis retirer des préparations avant de réessayer.');
 return clean;
}
function preparedDuplicates(entry,entries){
 const name=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR');
 const point=p=>[p.lat,p.lon];
 const key=e=>JSON.stringify([point(e.places.start),point(e.places.end),e.vehicle,e.preferences,e.timing??null,e.optimization??null,e.meetings??null,e.snapshot.stop?.id||null]);
 return entries.filter(e=>e.id!==entry.id&&(name(e.name)===name(entry.name)||key(e)===key(entry)));
}
// END PREPARED TRIPS MODEL

const PREPARED_KEY='dragonroute.prepared.v5.'+PROFILE_SCOPE,PREPARED_V4_KEY='dragonroute.prepared.v4.'+PROFILE_SCOPE,PREPARED_V3_KEY='dragonroute.prepared.v3.'+PROFILE_SCOPE,PREPARED_V2_KEY='dragonroute.prepared.v2.'+PROFILE_SCOPE,PREPARED_LEGACY_KEY='dragonroute.prepared.v1.'+PROFILE_SCOPE;
let preparedV4Snapshot=null,preparedLegacySnapshot=null,preparedV2Snapshot=null,preparedV3Snapshot=null;
let preparedTrips={kind:'dragonroute-preparations',version:5,entries:[]},preparedSnapshot=null,preparedBlocked=false,preparedNotice='',preparedDraft=null,preparedSelected=null,preparedImport=null,preparedSequence=0,resumePreparation=null,preparedRangePending=false;
const preparationInputs={start:null,end:null};
function loadPreparedTrips(){
 preparedTrips={kind:'dragonroute-preparations',version:5,entries:[]};preparedBlocked=false;preparedNotice='';
 try{preparedSnapshot=localStorage.getItem(PREPARED_KEY);preparedV4Snapshot=localStorage.getItem(PREPARED_V4_KEY);preparedV3Snapshot=localStorage.getItem(PREPARED_V3_KEY);preparedV2Snapshot=localStorage.getItem(PREPARED_V2_KEY);preparedLegacySnapshot=localStorage.getItem(PREPARED_LEGACY_KEY);const raw=preparedSnapshot??preparedV4Snapshot??preparedV3Snapshot??preparedV2Snapshot??preparedLegacySnapshot;if(raw!==null){const sourceVersion=preparedSnapshot!==null?5:preparedV4Snapshot!==null?4:preparedV3Snapshot!==null?3:preparedV2Snapshot!==null?2:1;const data=JSON.parse(raw);if(data.version!==sourceVersion)throw new Error('Version incohérente avec le stockage.');preparedTrips=validatePreparedTrips(data)}if(preparedSnapshot===null&&(preparedV4Snapshot!==null||preparedV3Snapshot!==null||preparedV2Snapshot!==null||preparedLegacySnapshot!==null))preparedNotice='Anciennes préparations reprises en lecture. Un prochain enregistrement créera une nouvelle sauvegarde ; l’original restera conservé et exportable.';}
 catch{preparedBlocked=true;preparedNotice='Préparations non chargées : format inconnu, contenu invalide ou stockage inaccessible. Les données restent conservées ; aucun remplacement automatique.'}
}
function writePreparedTrips(next){
 try{
  if(preparedBlocked)throw new Error('Préparations non chargées : remplacement bloqué.');
  if(localStorage.getItem(PREPARED_KEY)!==preparedSnapshot||localStorage.getItem(PREPARED_V4_KEY)!==preparedV4Snapshot||localStorage.getItem(PREPARED_V3_KEY)!==preparedV3Snapshot||localStorage.getItem(PREPARED_V2_KEY)!==preparedV2Snapshot||localStorage.getItem(PREPARED_LEGACY_KEY)!==preparedLegacySnapshot)throw new Error('Préparations modifiées dans un autre onglet. Recharger avant de réessayer.');
  const clean=validatePreparedTrips(next),raw=JSON.stringify(clean);localStorage.setItem(PREPARED_KEY,raw);preparedTrips=clean;preparedSnapshot=raw;return true;
 }catch(e){$('preparedMessage').textContent='Enregistrement impossible. '+e.message;return false}
}
function capturePreparedTrip(){
 const r=selectedStop?.via||trip?.base;if(!trip||!r)throw new Error('Calculer un trajet avant de le sauvegarder.');
 if(!trip.meetings&&($('meetingPickup').value.trim()||$('meetingDropoff').value.trim()))throw new Error('Rencontres encore en préparation : les adopter ou les effacer avant de sauvegarder.');
 const walking=trip.routing.vehicle.type==='walk';
 if(!walking)for(const id of ['cons','liters','reserveKm','maxDetourKm','maxDetourMin',...($('rangeMode').value==='none'?[]:['rangeValue'])]){const el=$(id),required=['cons','liters','reserveKm','rangeValue'].includes(id);if(!el.validity.valid||(required&&!el.value.trim()))throw new Error('Vérifier le champ « '+(el.labels?.[0]?.textContent||id)+' » avant de sauvegarder.')}
 const number=id=>$(id).value.trim()===''?null:Number($(id).value),rangeMode=$('rangeMode').value;
 const label=(value,field)=>temporaryAddress(value)?`Position ${field==='start'?'de départ':'d’arrivée'} enregistrée`:value;
 return validatePreparedEntry({meetings:trip.meetings?preparedMeetings(trip.meetings):null,optimization:trip.routing.optimization,id:crypto.randomUUID(),name:trip.label.slice(0,80),savedAt:new Date().toISOString(),places:{start:{label:label(trip.places.start,'start'),lat:trip.a[0],lon:trip.a[1]},end:{label:label(trip.places.end,'end'),lat:trip.b[0],lon:trip.b[1]}},
  timing:timingRecord(routeTimingRaw()),
  vehicle:walking?{type:'walk'}:{type:trip.routing.vehicle.type,dimensions:trip.routing.vehicle.dimensions||null,fuel:$('fuel').value,cons:number('cons'),liters:number('liters')},
  preferences:walking?{maxWalkKm:walkLimit($('maxWalkKm').value)}:{avoid:[...trip.routing.avoid],departure:$('stationDeparture').value||null,stopMode:stopWindow().mode,stopKm:Number($('stopKm').value),rangeMode,rangeValue:rangeMode==='none'?null:number('rangeValue'),reserveKm:number('reserveKm'),rangeOnly:$('rangeOnly').checked,maxDetourKm:number('maxDetourKm'),maxDetourMin:number('maxDetourMin'),services:serviceSelection(),openingFilter:$('stationOpeningFilter').value,listMode:$('stationListMode').value},
  snapshot:{calculatedAt:selectedStop?.confirmedAt||trip.calculatedAt,engine:trip.routing.provider,distanceMeters:r.distance,durationSeconds:r.duration,geometry:r.geometry.coordinates.map(p=>p.slice(0,2)),stop:selectedStop?{id:selectedStop.station.id,address:selectedStop.station.address,city:selectedStop.station.city,lat:selectedStop.station.lat,lon:selectedStop.station.lon}:null}});
}
function preparedSchemaSvg(e){
 const points=e.snapshot.geometry,lon=points.map(p=>p[0]),lat=points.map(p=>p[1]),minX=Math.min(...lon),minY=Math.min(...lat),dx=Math.max(.001,Math.max(...lon)-minX),dy=Math.max(.001,Math.max(...lat)-minY),scale=Math.min(520/dx,180/dy),x0=(600-dx*scale)/2,y0=(260-dy*scale)/2;
 const project=p=>[(p[0]-minX)*scale+x0,260-y0-(p[1]-minY)*scale],path=points.map(p=>project(p).map(n=>n.toFixed(2)).join(',')).join(' '),a=project(points[0]),b=project(points.at(-1)),stop=e.snapshot.stop,sp=stop?project([stop.lon,stop.lat]):null;
 return `<svg class="prepared-schema" viewBox="0 0 600 260" role="img" aria-label="Schéma du tracé enregistré, sans fond cartographique"><polyline points="${path}" fill="none" stroke="#82baff" stroke-width="5"/>${[a,b].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#fff"/>`).join('')}${sp?`<circle cx="${sp[0]}" cy="${sp[1]}" r="9" fill="#f2c66d"/>`:''}</svg>`;
}
function preparedDescription(e,withMap=false){
 const p=e.preferences,s=e.snapshot,criterion='<p>Critère enregistré : '+escapeHtml(optimizationLabel(e.optimization))+'.'+(e.optimization===null?' Il devra être choisi avant le nouveau calcul.':'')+'</p>';
 if(e.vehicle.type==='walk')return `<h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">Sauvegarde du ${escapeHtml(new Date(e.savedAt).toLocaleString('fr-FR'))}. Calcul IGN du ${escapeHtml(new Date(s.calculatedAt).toLocaleString('fr-FR'))}.</p><p><strong>Instantané à pied : ${fmt(s.distanceMeters/1000,1)} km · ${Math.round(s.durationSeconds/60)} min, hors pauses.</strong></p><p>Limite souhaitée : ${p.maxWalkKm===null?'non renseignée':fmt(p.maxWalkKm,1)+' km'+(s.distanceMeters>p.maxWalkKm*1000?' · dépassée par ce tracé':'')}. Aucun véhicule ni arrêt carburant associé.</p>${criterion}${preparedTimingText(e)}${withMap?preparedSchemaSvg(e):''}<p class="note">Tracé historique déclaré. Pente, escaliers, terrain et accessibilité non vérifiés. La reprise charge les paramètres et exige un nouveau calcul à pied ; aucun ancien résultat présenté comme actuel.</p>`;
 return `<h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">Sauvegarde du ${escapeHtml(new Date(e.savedAt).toLocaleString('fr-FR'))}. Calcul ${s.engine.toUpperCase()} du ${escapeHtml(new Date(s.calculatedAt).toLocaleString('fr-FR'))}.</p>
 <p><strong>Instantané : ${fmt(s.distanceMeters/1000,1)} km · ${Math.round(s.durationSeconds/60)} min</strong>${s.stop?' · avec arrêt':''}</p>
 <p>${e.vehicle.type==='truck'?'Poids lourd · '+escapeHtml(dimensionLabel(e.vehicle.dimensions)):'Véhicule léger'} · ${escapeHtml(e.vehicle.fuel)} · ${fmt(e.vehicle.cons,1)} L/100 km · ${fmt(e.vehicle.liters,0)} L à acheter.</p>
 <p>Évitements : ${escapeHtml(p.avoid.length?p.avoid.map(x=>avoidLabels[x]).join(', '):'aucun')}. Départ prévu : ${escapeHtml(p.departure?p.departure.replace('T',' ')+' (Paris)':'non renseigné')}.</p>
 <p>${s.stop?'Arrêt mémorisé, à rechercher à nouveau : '+escapeHtml(s.stop.address):'Aucun arrêt mémorisé.'}</p>
 <details><summary>Préférences conservées</summary><p>${escapeHtml({soon:'Au plus tôt',near:'Bon compromis proche',around:'Vers '+p.stopKm+' km'}[p.stopMode])}. Détour maximal : ${p.maxDetourKm===null?'sans limite':fmt(p.maxDetourKm,1)+' km'} / ${p.maxDetourMin===null?'sans limite':fmt(p.maxDetourMin,1)+' min'}. Services : ${escapeHtml(p.services.join(', ')||'aucun requis')}. Filtre horaires : ${escapeHtml({all:'tous',compatible:'compatibles',unknown:'inconnus',outside:'hors guichet'}[p.openingFilter])}.</p><p>Autonomie : ${p.rangeMode==='none'?'inconnue':fmt(p.rangeValue,1)+(p.rangeMode==='km'?' km':' L')+', réserve '+fmt(p.reserveKm,0)+' km'}${p.rangeOnly?' · filtre de portée demandé':''}. L’autonomie conservée devra être actualisée au nouveau départ.</p></details>
 ${e.meetings?`<p>Rencontres mémorisées : prise en charge ${escapeHtml(e.meetings.pickup.label)} → dépose ${escapeHtml(e.meetings.dropoff.label)}. Plein ${meetingPositionText(e.meetings)}. Limites totales : +${e.meetings.limits.km} km / +${e.meetings.limits.minutes} min. À recalculer puis adopter après le nouveau trajet ; anciens frais non repris.</p>`:''}${criterion}${preparedTimingText(e)}${withMap?preparedSchemaSvg(e):''}<p class="note">Tracé et estimations historiques. Prix, péages, horaires des stations, disponibilité et circulation actuels non conservés. La reprise charge les paramètres ; elle demande un nouveau calcul et une nouvelle confirmation de l’arrêt.</p>`;
}
function renderPreparedTrips(){
 $('preparedV4Export').hidden=preparedV4Snapshot===null;
 $('preparedLegacyExport').hidden=preparedLegacySnapshot===null;
 $('preparedV2Export').hidden=preparedV2Snapshot===null;$('preparedV3Export').hidden=preparedV3Snapshot===null;
 $('preparedExport').disabled=preparedBlocked;$('preparedImportFile').disabled=preparedBlocked;
 $('preparedList').innerHTML=preparedTrips.entries.length?preparedTrips.entries.map(e=>`<article class="saved-row"><strong>${escapeHtml(e.name)}</strong><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">${escapeHtml(new Date(e.savedAt).toLocaleString('fr-FR'))} · ${e.vehicle.type==='walk'?'à pied':e.vehicle.type==='truck'?'poids lourd':'véhicule léger'} · instantané ${fmt(e.snapshot.distanceMeters/1000,1)} km</p><div class="row-actions"><button class="ghost" data-prepared-show="${e.id}">Consulter</button><button class="ghost" data-prepared-rename="${e.id}">Renommer</button><button class="ghost" data-prepared-delete="${e.id}">Supprimer</button></div></article>`).join(''):'<p class="note">Aucune préparation chargée.</p>';
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
 clearResults();clearMeetingDraft();resetProspective();resetRememberedInputs();detachTripVehicle();
 if(e.meetings){const plan=e.meetings;for(const [key,id] of [["pickup","meetingPickup"],["dropoff","meetingDropoff"]]){$(id).value=plan[key].label;meetingInputs[key]={value:plan[key].label,place:{...plan[key]}}}$("meetingMaxKm").value=plan.limits.km;$("meetingMaxMin").value=plan.limits.minutes;$("meetingStationPosition").value=plan.stationPosition;meetingEndpoints=JSON.stringify([[e.places.start.lat,e.places.start.lon],[e.places.end.lat,e.places.end.lon]]);}
 const timing=resumeTiming(e.timing,Date.now());$('stationDeparture').value=timing.departure??'';$('routeArriveBy').value=timing.arriveBy??'';$('routeOnlyBefore').checked=timing.onlyBefore;
 const p=e.preferences,walking=e.vehicle.type==='walk';$('travelMode').value=walking?'walk':'car';$('routeOptimization').value=e.optimization??'';
 for(const field of ['start','end']){const place=e.places[field];$(field).value=place.label;preparationInputs[field]={value:place.label,place:{lat:place.lat,lon:place.lon,label:place.label}};$(field+'PlaceNote').hidden=false;$(field+'PlaceNote').textContent='Point de la préparation sauvegardée, repris sans nouvelle recherche d’adresse.'}
 if(!walking){
 $('routeVehicle').value=e.vehicle.type;for(const [key,id] of Object.entries(dimensionFields))$(id).value=e.vehicle.dimensions?.[key]??'';
 $('fuel').value=e.vehicle.fuel;$('cons').value=e.vehicle.cons;$('liters').value=e.vehicle.liters;
 document.querySelectorAll('.avoid-options input').forEach(el=>el.checked=p.avoid.includes(el.value));
 $('budgetPrice').value='';budgetReference=null;clearTableTolls();tollState.enabled=false;resetTollQuote();
 document.querySelector(`input[name="stopMode"][value="${p.stopMode}"]`).checked=true;$('stopKm').max=String(Math.max(p.stopKm,5));$('stopKm').value=p.stopKm;
 $('rangeMode').value=p.rangeMode;$('rangeValue').value=p.rangeValue??'';$('reserveKm').value=p.reserveKm;$('rangeOnly').checked=p.rangeOnly;rangeMeasuredAt=null;
 $('maxDetourKm').value=p.maxDetourKm??'';$('maxDetourMin').value=p.maxDetourMin??'';$('stationOpeningFilter').value=p.openingFilter;$('stationListMode').value=p.listMode;
 $('serviceChoices').innerHTML=p.services.map(name=>`<label class="check-label"><input type="checkbox" data-service checked value="${escapeHtml(name)}"> ${escapeHtml(name)}</label>`).join('');
 resumePreparation={entry:structuredClone(e),expired:timing.review,dismissed:false};$('activeVehicle').hidden=true;preparedRangePending=p.rangeMode!=='none';
 updateVehicleRouting();updateWindow();updateRange();refreshArrival();updateResumePreparation();
 }else{
  $('maxWalkKm').value=p.maxWalkKm??'';resumePreparation={entry:structuredClone(e),expired:timing.review,dismissed:false};preparedRangePending=false;updateVehicleRouting();refreshArrival();updateResumePreparation();
 }
 $('preparedDialog').close();setStatus('Préparation reprise. Vérifier les paramètres puis calculer un nouveau trajet.');$(e.optimization===null?'routeOptimization':'goBtn').focus();
}
function updateResumePreparation(){
 const e=resumePreparation?.entry;$('preparedResume').hidden=!e||resumePreparation.dismissed;if(!e)return;
 const departure=departureInstant($('stationDeparture').value).instant,expired=!Number.isFinite(departure)||departure<Date.now()-60000;
 if(e.vehicle.type==='walk'){$('preparedResumeNote').textContent=(e.optimization===null?'Critère ancien non renseigné : choisir avant de recalculer. ':'')+`Préparation à pied « ${e.name} » reprise. ${trip?'Nouveau trajet calculé.':'Calculer un nouvel itinéraire à pied avant de partir.'}${expired?' Départ passé ou absent : vérifier les horaires du trajet et l’heure limite.':''}`;$('preparedStopNote').hidden=true;$('preparedReviewStop').hidden=true;return}
 let unavailable='';try{ensureRouting(routingPreferences())}catch(err){unavailable=' '+err.message}
 $('preparedResumeNote').textContent=`Préparation « ${e.name} » reprise. ${trip?'Nouveau trajet calculé ; vérifier les arrêts.':'Un nouveau calcul est nécessaire ; le tracé peut changer.'}${expired?' Départ passé ou absent : choisir une nouvelle heure dans les horaires du trajet et vérifier l’heure limite.':''}${preparedRangePending?' Autonomie mémorisée à actualiser pour ce départ.':''}${unavailable}${e.meetings&&!trip?.meetings?' Rencontres mémorisées à recalculer puis adopter dans Covoiturage ; elles ne sont pas encore incluses.':''}`;
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
   if(writePreparedTrips({kind:'dragonroute-preparations',version:5,entries})){preparedDraft=null;$('preparedEditor').hidden=true;preparedSelected=entry.id;renderPreparedTrips();$('preparedMessage').textContent='Préparation enregistrée dans ce navigateur.'}
  }catch(e){$('preparedMessage').textContent=e.message}
 });
 $('preparedList').addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;const id=b.dataset.preparedShow||b.dataset.preparedRename||b.dataset.preparedDelete,e=preparedTrips.entries.find(x=>x.id===id);if(!e)return;
  if(b.dataset.preparedShow){preparedDraft=null;$('preparedEditor').hidden=true;preparedSelected=id;renderPreparedTrips();$('preparedView').scrollIntoView({block:'start'})}
  else if(b.dataset.preparedRename)showPreparedEditor(structuredClone(e),'rename');
  else if(confirm(`Supprimer la préparation « ${e.name} » de ce navigateur ?`)&&writePreparedTrips({kind:'dragonroute-preparations',version:5,entries:preparedTrips.entries.filter(x=>x.id!==id)})){preparedSelected=null;preparedDraft=null;$('preparedEditor').hidden=true;renderPreparedTrips();$('preparedMessage').textContent='Préparation supprimée.'}
 });
 $('preparedResumeBtn').addEventListener('click',()=>{const e=preparedTrips.entries.find(x=>x.id===preparedSelected);if(e)resumePreparedTrip(e)});
 $('preparedReviewStop').addEventListener('click',()=>{const id=resumePreparation?.entry.snapshot.stop?.id;if(id)openStation(id)});
 $('preparedDismiss').addEventListener('click',()=>{if(resumePreparation)resumePreparation.dismissed=true;updateResumePreparation()});
 $('preparedV4Export').addEventListener('click',()=>{if(preparedV4Snapshot===null)return;try{downloadProfile(JSON.parse(preparedV4Snapshot),'DragonRoute-preparations-originales-v4.json')}catch{$('preparedMessage').textContent='Original illisible : aucun export JSON effectué.'}});
 $('preparedV3Export').addEventListener('click',()=>{if(preparedV3Snapshot===null)return;try{downloadProfile(JSON.parse(preparedV3Snapshot),'DragonRoute-preparations-originales-v3.json')}catch{$('preparedMessage').textContent='Original illisible : aucun export JSON effectué.'}});
 $('preparedV2Export').addEventListener('click',()=>{if(preparedV2Snapshot===null)return;try{downloadProfile(JSON.parse(preparedV2Snapshot),'DragonRoute-preparations-originales-v2.json')}catch{$('preparedMessage').textContent='Original illisible : aucun export JSON effectué.'}});
 $('preparedLegacyExport').addEventListener('click',()=>{if(preparedLegacySnapshot===null)return;try{downloadProfile(JSON.parse(preparedLegacySnapshot),'DragonRoute-preparations-originales-v1.json')}catch{$('preparedMessage').textContent='Original illisible : aucun export JSON effectué.'}});
 $('preparedExport').addEventListener('click',()=>{if(!preparedBlocked)downloadProfile(preparedTrips,'DragonRoute-preparations.json')});
 $('preparedBackup').addEventListener('click',()=>{if(!preparedBlocked)downloadProfile(preparedTrips,'DragonRoute-preparations-avant-import.json')});
 $('preparedErase').addEventListener('click',()=>{
  if(!confirm('Effacer toutes les préparations de cet environnement, y compris les anciennes sauvegardes originales ? Le profil, le journal et les autres aperçus seront conservés.'))return;
  try{if(localStorage.getItem(PREPARED_KEY)!==preparedSnapshot||localStorage.getItem(PREPARED_V4_KEY)!==preparedV4Snapshot||localStorage.getItem(PREPARED_V3_KEY)!==preparedV3Snapshot||localStorage.getItem(PREPARED_V2_KEY)!==preparedV2Snapshot||localStorage.getItem(PREPARED_LEGACY_KEY)!==preparedLegacySnapshot)throw new Error('Données modifiées dans un autre onglet : recharger avant l’effacement.');localStorage.removeItem(PREPARED_LEGACY_KEY);localStorage.removeItem(PREPARED_V2_KEY);localStorage.removeItem(PREPARED_V4_KEY);localStorage.removeItem(PREPARED_V3_KEY);localStorage.removeItem(PREPARED_KEY);loadPreparedTrips();preparedSelected=null;preparedDraft=null;$('preparedEditor').hidden=true;renderPreparedTrips();$('preparedMessage').textContent='Préparations effacées.'}catch(e){$('preparedMessage').textContent='Effacement impossible. '+e.message}
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
 const cancelPreparedImport=()=>{preparedSequence++;preparedImport=null};
 $('preparedImportDialog').addEventListener('cancel',cancelPreparedImport);
 $('preparedImportDialog').querySelector('.close-dialog').addEventListener('click',cancelPreparedImport);
 $('preparedImportDialog').addEventListener('close',()=>{if($('preparedImportDialog').open)return;preparedImport=null;if($('preparedDialog').open)$('preparedImportFile').focus()});
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
  $("placeTitle").textContent=field==="pickup"?"Quel lieu de prise en charge ?":field==="dropoff"?"Quel lieu de dépose ?":field==="address"?"Quelle adresse enregistrer ?":field==="start"?"Quel lieu de départ ?":"Quel lieu d’arrivée ?";
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
// BEGIN WALKING MODEL
function walkLimit(value){
 if(value===null||value==='')return null;
 const n=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;
 if(!Number.isFinite(n)||n<.1||n>500)throw new Error('Indiquer une limite de marche entre 0,1 et 500 km, ou laisser vide.');
 return n;
}
function walkingDistance(distance,limit){
 if(typeof distance!=='number'||!Number.isFinite(distance)||distance<0)throw new Error('Distance de marche invalide.');
 const max=walkLimit(limit);return {limit:max,exceeded:max!==null&&distance>max*1000};
}
// END WALKING MODEL
function optimizationLabel(value){return {fastest:'Plus rapide · durée estimée',shortest:'Plus court · distance'}[value]||'Critère non renseigné'}
function routingSettings(type,avoid,dimensions){
 const optimization=$('routeOptimization').value;
 const provider=type==='walk'||optimization==='shortest'?'ign':routingEndpoint()?'ors':C.ignRouting===true&&avoid.includes('highways')?'ign':'osrm';
 return {provider,optimization,avoid,vehicle:{type,...(dimensions?{dimensions}:{})}};
}
function updateOptimization(){
 const value=$('routeOptimization').value,walking=isWalking();
 const available=C.ignRouting===true&&(walking||($('routeVehicle').value==='car'&&[...document.querySelectorAll('.avoid-options input:checked')].every(el=>el.value==='highways')));
 $('routeOptimization').disabled=busy;$('routeOptimization').querySelector('[value="shortest"]').disabled=!available;
 $('optimizationNote').textContent=!value?'Cette ancienne préparation ne conserve pas son critère. Choisir la durée ou la distance avant de recalculer.':value==='shortest'&&!available?'Le calcul au plus court est indisponible avec ce véhicule, ces évitements ou le service actuel. Modifier explicitement le choix pour continuer.':'La durée reste une estimation sans trafic en direct. Plus court peut être plus lent et ne signifie pas moins cher. Le moteur utilisé est indiqué avec le résultat.';
 return ['fastest','shortest'].includes(value)&&(value!=='shortest'||available);
}
function isWalking(){return $('travelMode').value==='walk'}
function updateWalking(){
 const walking=isWalking();$('walkingOptions').hidden=!walking;$('routingOptions').hidden=walking;
 if(walking)$('activeVehicle').hidden=true;
 $('walkingStatus').hidden=!trip||trip.routing.vehicle.type!=='walk';
 if($('walkingStatus').hidden)return;
 try{const state=walkingDistance(trip.base.distance,$('maxWalkKm').value);$('maxWalkKm').setAttribute('aria-invalid','false');$('walkingStatus').textContent=state.limit===null?'Marche · aucune limite personnelle renseignée.':state.exceeded?`Limite souhaitée dépassée : ${fmt(trip.base.distance/1000,1)} km pour une limite de ${fmt(state.limit,1)} km. Le trajet reste affiché ; ajuster le départ, l’arrivée ou la limite avant de le retenir.`:`Distance calculée dans la limite souhaitée de ${fmt(state.limit,1)} km. Cela ne confirme pas la difficulté ni l’accessibilité du terrain.`}
 catch(e){$('maxWalkKm').setAttribute('aria-invalid','true');$('walkingStatus').textContent=e.message}
}
function updateVehicleRouting(){
  updateWalking();
  renderVehiclePicker();const criterionReady=updateOptimization();
  if(isWalking()){
    document.querySelectorAll('#routingOptions input,#routingOptions select,#routingOptions button').forEach(el=>el.disabled=true);
    $('goBtn').disabled=busy||C.ignRouting!==true||!criterionReady;
    if(C.ignRouting!==true)setStatus('Calcul à pied indisponible : service IGN non activé.');
    return;
  }
  document.querySelectorAll('#routingOptions input,#routingOptions select,#routingOptions button').forEach(el=>el.disabled=busy);
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
  $("goBtn").disabled=busy||!criterionReady||!["car",...(advanced?["truck"]:[])].includes(type);
  $("truckDimensions").hidden=type!=="truck";
  $("vehicleRoutingNote").hidden=type==="car";
  $("vehicleRoutingNote").textContent=type==="truck"?"Restrictions calculées selon le gabarit déclaré et les données cartographiques. La signalisation et les conditions réelles restent prioritaires. Transport exceptionnel ou de matières dangereuses non pris en charge.":"Le routage spécifique aux caravanes et utilitaires n’est pas encore validé. Aucun trajet voiture ne sera substitué automatiquement.";
  $("routingAvailability").textContent=advanced?"Service public configuré : coordonnées et gabarit transmis au service de calcul puis à OpenRouteService. Aucun compte technique requis.":C.ignRouting===true?"Plus court et sans autoroute disponibles en véhicule léger avec l’IGN, aucune clé à fournir. Les coordonnées du trajet et des arrêts sont transmises à l’IGN lors de la recherche.":"Évitements et poids lourds indisponibles : service non activé. Trajet léger standard disponible ; aucune clé à fournir.";
}
function routingPreferences(){
  if(isWalking()){walkLimit($('maxWalkKm').value);return routingSettings('walk',[])}
  const type=$("routeVehicle").value;
  const avoid=[...document.querySelectorAll('.avoid-options input:checked')].map(el=>el.value);
  return routingSettings(type,avoid,type==="truck"?routeDimensions():undefined);
}
function routingLabel(settings){
  if(settings.vehicle.type==='walk')return 'IGN · BD TOPO · à pied · '+optimizationLabel(settings.optimization);
  return (settings.provider==="ors"?"OpenRouteService · service public":settings.provider==="ign"?"IGN · BD TOPO":"OSRM")+(settings.vehicle.type==="truck"?" · poids lourd · "+dimensionLabel(settings.vehicle.dimensions):" · véhicule léger")+(settings.avoid.length?" · exclusions : "+settings.avoid.map(x=>avoidLabels[x]).join(", "):" · sans exclusions")+" · "+optimizationLabel(settings.optimization);
}
function invalidateRouting(){
  clearResults();updateVehicleRouting();
  setStatus("Options modifiées. Trajet à recalculer.");
}
function ensureRouting(settings){
  if(!['fastest','shortest'].includes(settings.optimization))throw new Error('Choisir un critère de trajet avant de calculer.');
  if(!['ign','osrm','ors'].includes(settings.provider))throw new Error('Moteur de calcul non reconnu.');
  if(settings.optimization==='shortest'&&settings.provider!=='ign')throw new Error('Le calcul au plus court n’est pas pris en charge par ce moteur. Aucun autre critère ne sera substitué.');
  if(settings.vehicle.type==='walk'){
    if(C.ignRouting!==true||settings.provider!=='ign'||settings.avoid.length||settings.vehicle.dimensions)throw new Error('Calcul à pied indisponible ou options incompatibles. Aucun trajet voiture ne sera substitué.');
    return;
  }
  if(!["car","truck"].includes(settings.vehicle.type))throw new Error("Routage spécifique non validé pour ce véhicule. Aucun trajet voiture ne sera substitué.");
  if(settings.provider==="ign"&&(C.ignRouting!==true||settings.vehicle.type!=="car"||settings.avoid.length>1||settings.avoid.some(x=>x!=="highways")))throw new Error("L’IGN est activé pour le véhicule léger, avec ou sans autoroute. Service ou options incompatibles : les restrictions ne seront pas ignorées, ni le critère remplacé.");
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
  const walking=settings.vehicle.type==='walk',profileName=walking?'pedestrian':'car',snapKm=walking?.15:1;
  const key=JSON.stringify([points,settings.avoid,profileName,settings.optimization]),cached=ignCache.get(key);
  if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
  if(cached&&performance.now()-cached.at<300000)return structuredClone(cached.route);
  // Calls are sequential in run/scoreConstrainedCandidates. Below 5 requests/s/IP;
  // other tabs/users on the same IP may still trigger a quota: never auto-retry.
  await sleep(Math.max(0,550-(performance.now()-ignLastRequest)));
  if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
  ignLastRequest=performance.now();
  const constraint={constraintType:"banned",key:"waytype",operator:"=",value:"autoroute"};
  const query=new URLSearchParams({resource:"bdtopo-osrm",profile:profileName,optimization:settings.optimization,start:[...points[0]].reverse().join(","),end:[...points.at(-1)].reverse().join(","),geometryFormat:"geojson",crs:"EPSG:4326",distanceUnit:"meter",timeUnit:"second",getSteps:"false",getBbox:"false"});
  if(settings.avoid.includes("highways"))query.set("constraints",JSON.stringify(constraint));
  if(points.length>2)query.set("intermediates",points.slice(1,-1).map(([lat,lon])=>`${lon},${lat}`).join("|"));
  let data;
  try{data=await getJSON(`https://data.geopf.fr/navigation/itineraire?${query}`,"IGN",25000)}
  catch(e){
    health("hRoute","err","routage ✕");
    if(e.message.includes("HTTP 429"))throw new Error("Limite du service IGN atteinte. Réessayer plus tard. "+"Le critère et les contraintes sont conservés.");
    throw new Error(`${e.message}. ${walking?"Aucun trajet voiture ne sera substitué.":settings.avoid.length?"Aucun trajet avec autoroute ne sera substitué.":"Aucun autre critère ne sera substitué."}`);
  }
  if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
  const r={geometry:data.geometry,distance:data.distance,duration:data.duration,legs:data.portions,alternatives:[],resourceVersion:data.resourceVersion};
  const exclusions=data.constraints;
  const echoed=!settings.avoid.length?Array.isArray(exclusions)&&exclusions.length===0:Array.isArray(exclusions)&&exclusions.length===1&&exclusions[0].type==="banned"&&exclusions[0].key==="waytype"&&exclusions[0].operator==="="&&exclusions[0].value==="autoroute";
  const legs=Array.isArray(r.legs)&&r.legs.length===points.length-1&&r.legs.every(hasRouteMetrics)&&Math.abs(r.legs.reduce((s,l)=>s+l.distance,0)-r.distance)<=2&&Math.abs(r.legs.reduce((s,l)=>s+l.duration,0)-r.duration)<=2;
  const endpoints=legs&&r.legs.every((leg,i)=>[leg.start,leg.end].every((value,j)=>{
    if(typeof value!=="string"||!/^[-\d.]+,[-\d.]+$/.test(value))return false;
    const [lon,lat]=value.split(",").map(Number);
    return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180&&hav([lat,lon],points[i+j])<=snapKm;
  }));
  const geometry=hasRouteGeometry(r)&&hav([...r.geometry.coordinates[0]].slice(0,2).reverse(),points[0])<=snapKm&&hav([...r.geometry.coordinates.at(-1)].slice(0,2).reverse(),points.at(-1))<=snapKm;
  if(data.resource!=="bdtopo-osrm"||data.profile!==profileName||(walking&&(typeof data.resourceVersion!=="string"||!data.resourceVersion.trim()))||data.optimization!==settings.optimization||data.crs!=="EPSG:4326"||data.distanceUnit!=="meter"||data.timeUnit!=="second"||!echoed||!geometry||!hasRouteMetrics(r)||!legs||!endpoints){
    health("hRoute","err","routage ✕");
    throw new Error("Réponse IGN incomplète ou incohérente : critère, unités, accès ou exclusion non confirmés. Aucun trajet de remplacement affiché.");
  }
  r.alternativeNotice=walking?"Un itinéraire à pied calculé par l’IGN. Aucune alternative demandée ; durée estimée hors pauses. Pente, escaliers, revêtement et accessibilité non vérifiés.":`Un seul trajet ${settings.avoid.length?"sans autoroute ":""}calculé par l’IGN. Le montant des péages reste inconnu, notamment pour les ouvrages payants.`;
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
  if(points.length>=4){
    meetingLegs(d.routes[0],points.map(point=>({point})));
    if(!Array.isArray(d.waypoints)||d.waypoints.length!==points.length||d.waypoints.some((w,i)=>!Array.isArray(w.location)||w.location.length!==2||!w.location.every(Number.isFinite)||hav([w.location[1],w.location[0]],points[i])>.5))throw new Error('Accès aux points de rencontre non confirmés par le moteur.');
  }
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
  const scored=[];let unavailable=0,incomparable=0,overLimit=0;
  for(let i=0;i<cands.length;i++){
    if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
    $("fuelStatus").textContent=`Vérification avec exclusions : station ${i+1} sur ${cands.length}…`;
    const station=cands[i];let via;
    try{via=await route(routePlanNodes(station).map(n=>n.point),true,false,trip.routing);if(trip.meetings)meetingLegs(via,routePlanNodes(station))}
    catch(e){if(e.noRoute){unavailable++;continue}throw e}
    const extraKm=(via.distance-trip.base.distance)/1000,extraMin=(via.duration-trip.base.duration)/60;
    // A shorter/faster recalculated route is not silently treated as a zero detour.
    if(extraKm<0||extraMin<0){incomparable++;continue}
    if(trip.meetings&&!meetingDetour(via,trip.meetings.reference.base,trip.meetings.limits).allowed){overLimit++;continue}
    const access=trip.meetings?meetingLegs(via,routePlanNodes(station)):{accessDistance:via.legs[0].distance,accessSeconds:via.legs[0].duration};
    const purchase=liters*station.price,detourFuelCost=extraKm*cons/100*station.price;
    scored.push({...station,via,distanceFromStart:access.accessDistance/1000,accessSeconds:access.accessSeconds,extraKm,extraMin,purchase,detourFuelCost,real:purchase+detourFuelCost});
  }
  return {scored,note:[overLimit?`${overLimit} station(s) au-delà de la limite totale des rencontres : exclues.`:"",unavailable?`${unavailable} station(s) sans accès calculable.`:"",incomparable?`${incomparable} trajet(s) recalculé(s) plus courts ou plus rapides : exclus du classement, comparaison à examiner.`:""].filter(Boolean).join(" ")};
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
  $('meetingDots').innerHTML=trip?.meetings?['pickup','dropoff'].map((key,i)=>{const place=trip.meetings[key],[x,y]=P([place.lat,place.lon]);return `<g><title>${escapeHtml((i?'Dépose : ':'Prise en charge : ')+place.label)}</title><circle cx="${x}" cy="${y}" r="18" fill="#5030a0" stroke="white" stroke-width="3"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="white">${i?'D':'P'}</text></g>`}).join(''):'';
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
  if(trip?.meetings)for(const [key,letter] of [['pickup','P'],['dropoff','D']]){const place=trip.meetings[key],title=(key==='pickup'?'Prise en charge : ':'Dépose : ')+place.label;
   const marker=L.marker([place.lat,place.lon],{icon:L.divIcon({className:'meeting-marker',html:letter,iconSize:[36,36],iconAnchor:[18,18]}),title,keyboard:true}).addTo(markerLayer);marker.getElement().setAttribute('aria-label',title);const text=document.createElement('p');text.textContent=title;marker.bindPopup(text);
  }
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
 return Object.entries(tariffData?.networks||{}).flatMap(([network,data])=>(data.kind==='passage'?[]:data.gates).flatMap((name,index)=>tollName(name)===tollName(gate.name)?[{network,index,name}]:[]));
}
function renderTollGuide(){
 $("tollGateList").innerHTML=tollGuide.matches.map((gate,i)=>{
  const names=gateTariffNames(gate),match=names.length===1?names[0]:null;
  return `<article class="toll-gate-card" id="toll-card-${gate.id}" tabindex="-1"><h4>P${i+1} · ${escapeHtml(tollGateLabel(gate))}</h4><p>${escapeHtml(gate.type)} · ${gate.positions.length} position(s) recensée(s). À ${Math.round(gate.distance*1000)} m du tracé ; vers le km ${fmt(gate.progress,1)} de sa géométrie.</p><p class="note">Passage à confirmer.${match?` Nom concordant dans la grille ${match.network} : ${escapeHtml(match.name)}.`:names.length?' Plusieurs noms tarifaires concordants : choisir manuellement le réseau et les gares.':' Aucun nom concordant dans les grilles entrée–sortie embarquées. Tarif non déduit.'}</p><div class="dialog-actions"><button class="ghost" data-toll-map="${gate.id}">Voir le point P${i+1}</button>${match?`<button class="ghost" data-toll-propose="${gate.id}" data-gate-role="entry">Proposer comme entrée ${match.network}</button><button class="ghost" data-toll-propose="${gate.id}" data-gate-role="exit">Proposer comme sortie ${match.network}</button>`:''}</div></article>`;
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
function tariffDateValid(network=tariffNetwork(),d=$("tariffDate").value){
 return tariffData?.schemaVersion===2&&!!network&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d&&d>=network.effectiveFrom&&d<=network.consultationUntil&&localDate()<=network.consultationUntil;
}
function tariffNetwork(){return tariffData?.networks[$("tariffNetwork").value]}
function tariffBudgetValid(){return tableTolls.segments.every(s=>tariffDateValid(tariffData?.networks[s.network],s.date))}
function tariffDuplicate(c){return c&&tableTolls.segments.some(s=>s.network===c.network&&(c.kind==='passage'||s.entry===c.entry&&s.exit===c.exit))}
function tariffSegmentLabel(s){const n=tariffData.networks[s.network];return s.kind==='passage'?`${n.label} · un passage payant`:`${s.network} · ${n.gates[s.entry]} → ${n.gates[s.exit]}`}
function tariffDisplayDate(d){return String(d).split('-').reverse().join('/')}
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
 if(resetEntry){tollGuide.suggested=false;$("tariffGateConfirmed").checked=false;$("tariffPassageConfirmed").checked=false}
 if(resetEntry)tariffOptions($("tariffEntry"),[...new Set((network?.rows||[]).map(r=>r[0]))].sort((a,b)=>a-b),'Choisir une entrée');
 const entry=$("tariffEntry").value;
 tariffOptions($("tariffExit"),entry===''?[]:(network?.rows||[]).filter(r=>String(r[0])===entry).map(r=>r[1]).sort((a,b)=>a-b),'Choisir une sortie');
 updateBudget();
}
function tariffCandidate(){
 const n=tariffNetwork(),entry=$("tariffEntry").value,exit=$("tariffExit").value,vehicleClass=$("tariffClass").value;
 if(!tariffDateValid()||! /^[1-5]$/.test(vehicleClass))return null;
 if(n.kind!=='passage'&&(entry===''||exit===''))return null;
 const amount=n.kind==='passage'?n.amountsCents?.[Number(vehicleClass)-1]:tariffIndex().get(`${entry}:${exit}`)?.[Number(vehicleClass)-1];
 if(!Number.isSafeInteger(amount)||amount<0)return null;
 return {network:$("tariffNetwork").value,kind:n.kind,entry:n.kind==='passage'?null:Number(entry),exit:n.kind==='passage'?null:Number(exit),vehicleClass,amount,date:$("tariffDate").value};
}
function clearTableTolls(message=''){
 tableTolls.segments=[];tableTolls.notice=message;$("tariffPassageConfirmed").checked=false;$("tariffComplete").checked=false;
}
function syncTableTolls(){
 if(!tableTolls.dateInitialized){$("tariffDate").value=localDate();tableTolls.dateInitialized=true}
 const route=selectedStop?.via||trip?.base;
 const key=trip?JSON.stringify([trip.calculatedAt,trip.routing,route.geometry.coordinates,route.distance,selectedStop?.station.id]):'';
 if(key!==tableTolls.key){$("tariffPassageConfirmed").checked=false;if(tableTolls.segments.length)clearTableTolls('Trajet modifié : les tronçons ont été retirés du budget.');tableTolls.key=key}
 syncTollGuide(key);
 if(!tariffBudgetValid()&&tableTolls.segments.length)clearTableTolls('Grille hors période de consultation : budget retiré.');
 $("tariffFields").disabled=busy||!trip||trip.routing.vehicle.type==="walk"||!tariffData;
 $("tariffExit").disabled=$("tariffEntry").value==='';
 const n=tariffNetwork(),passage=n?.kind==='passage';
 $("tariffPairFields").hidden=passage;$("tariffPassageFields").hidden=!passage;
 $("tariffDate").min=n?.effectiveFrom||'';$("tariffDate").max=n?.consultationUntil||'';
 const c=tariffCandidate(),duplicate=tariffDuplicate(c);
 $("tariffResult").textContent=!tariffData?'Grilles indisponibles.':!tariffDateValid()?'Grille non proposée pour cette date. Une mise à jour des tarifs est nécessaire.':c?`${fmt(c.amount/100)} € TTC · classe ${c.vehicleClass} · ${c.network} · ${passage?'un passage payant':'tronçon choisi'}`:passage?(/^[1-5]$/.test($("tariffClass").value)?'Tarif indisponible pour cette classe.':'Choisir une classe tarifaire.'):'Choisir une classe, une entrée et une sortie.';
 $("tariffAdd").disabled=busy||!trip||trip.routing.vehicle.type==="walk"||!c||duplicate||tableTolls.segments.length>=10||(tollGuide.suggested&&!$("tariffGateConfirmed").checked)||(passage&&!$("tariffPassageConfirmed").checked);
 $("tariffAdd").textContent=duplicate?'Déjà ajouté au budget':passage?'Ajouter ce passage au budget':'Ajouter ce tronçon au budget';
 $("tariffSource").textContent=n?`Tarifs au ${tariffDisplayDate(n.effectiveFrom)}, consultés le ${tariffDisplayDate(n.lastReviewed)}. Consultation proposée jusqu’au ${tariffDisplayDate(n.consultationUntil)} ; vérifier la source avant le départ. ${passage?'Un passage ne constitue pas un aller-retour.':'Ce seuil ne garantit pas le maintien des prix.'}`:'';
 $("tariffAttribution").replaceChildren();
 if(passage)$("tariffAttribution").textContent=n.sourceTitle+'. Plein tarif par passage.';
 else{for(const [label,url] of [['Données : Pierlou Ramade','https://www.data.gouv.fr/datasets/tarifs-autoroutes-aprr'],['Licence Ouverte 2.0','https://www.etalab.gouv.fr/licence-ouverte-open-licence/']]){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';$("tariffAttribution").append(a,document.createTextNode(' · '))}$("tariffAttribution").append(document.createTextNode('Noms corrigés d’après les PDF APRR/AREA.'))}
 $("tariffPdf").href=tariffNetwork()?.source||'https://voyage.aprr.fr/tarifs-de-peage';
 $("tariffComplete").disabled=busy||!tableTolls.segments.length;
 $("tariffClear").hidden=!tableTolls.segments.length;$("tariffClear").disabled=busy;
 $("tariffSegments").replaceChildren();
 tableTolls.segments.forEach((s,i)=>{
  const n=tariffData.networks[s.network],li=document.createElement('li'),text=document.createElement('span'),button=document.createElement('button');
  text.textContent=`${tariffSegmentLabel(s)} · classe ${s.vehicleClass} · ${fmt(s.amount/100)} € TTC · trajet ${tariffDisplayDate(s.date)} · tarif au ${tariffDisplayDate(n.effectiveFrom)}. `;
  const source=document.createElement('a');source.textContent='Source officielle';source.href=n.source;source.target='_blank';source.rel='noopener noreferrer';text.append(source);
  button.type='button';button.className='ghost';button.textContent='Retirer';button.disabled=busy;button.setAttribute('aria-label',`Retirer ${tariffSegmentLabel(s)}`);
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

// BEGIN MEETINGS MODEL
function meetingNodes(a,b,plan,station=null){
 const nodes=[{kind:'start',point:a}];
 if(plan){
  if(station&&plan.stationPosition==='before')nodes.push({kind:'station',point:[station.lat,station.lon]});
  nodes.push({kind:'pickup',point:[plan.pickup.lat,plan.pickup.lon]});
  if(station&&plan.stationPosition==='during')nodes.push({kind:'station',point:[station.lat,station.lon]});
  nodes.push({kind:'dropoff',point:[plan.dropoff.lat,plan.dropoff.lon]});
  if(station&&plan.stationPosition==='after')nodes.push({kind:'station',point:[station.lat,station.lon]});
 }else if(station)nodes.push({kind:'station',point:[station.lat,station.lon]});
 nodes.push({kind:'end',point:b});return nodes;
}
function meetingLegs(route,nodes){
 if(!route||!Array.isArray(route.legs)||route.legs.length!==nodes.length-1||[route.distance,route.duration,...route.legs.flatMap(l=>[l?.distance,l?.duration])].some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0))throw new Error('Distances ou durées des étapes manquantes. Aucun partage calculé.');
 const sum=(from,to,key)=>route.legs.slice(from,to).reduce((n,l)=>n+l[key],0);
 for(const key of ['distance','duration'])if(Math.abs(sum(0,nodes.length-1,key)-route[key])>2)throw new Error('Étapes incohérentes avec le total du trajet.');
 const pickup=nodes.findIndex(n=>n.kind==='pickup'),dropoff=nodes.findIndex(n=>n.kind==='dropoff'),station=nodes.findIndex(n=>n.kind==='station');
 return {sharedDistance:pickup>=0&&dropoff>pickup?sum(pickup,dropoff,'distance'):null,sharedDuration:pickup>=0&&dropoff>pickup?sum(pickup,dropoff,'duration'):null,accessDistance:station>=0?sum(0,station,'distance'):null,accessSeconds:station>=0?sum(0,station,'duration'):null};
}
function meetingDetour(route,reference,limits){
 const km=(route.distance-reference.distance)/1000,minutes=(route.duration-reference.duration)/60;
 if(!Number.isFinite(km)||!Number.isFinite(minutes)||!limits||!Number.isFinite(limits.km)||!Number.isFinite(limits.minutes)||limits.km<0||limits.km>1000||limits.minutes<0||limits.minutes>1440)throw new Error('Limites de détour invalides.');
 return {km,minutes,allowed:km<=limits.km&&minutes<=limits.minutes};
}
// END MEETINGS MODEL
let meetingProposal=null,meetingInputs={pickup:null,dropoff:null},meetingEndpoints='';
const meetingFields=['meetingPickup','meetingDropoff','meetingMaxKm','meetingMaxMin','meetingStationPosition'];
function routePlanNodes(station=null){return meetingNodes(trip.a,trip.b,trip.meetings,station)}
function meetingPositionText(plan){return {before:'avant la prise en charge',during:'entre la prise en charge et la dépose',after:'après la dépose'}[plan.stationPosition]}
function meetingRouteSummary(route,plan,reference){
 const detail=meetingLegs(route,meetingNodes(trip.a,trip.b,plan,selectedStop?.station)),delta=meetingDetour(route,reference,plan.limits);
 return `${fmt(route.distance/1000,1)} km au total, dont ${fmt(detail.sharedDistance/1000,1)} km partagés. Écart au trajet initial : ${delta.km>=0?'+':''}${fmt(delta.km,1)} km / ${delta.minutes>=0?'+':''}${fmt(delta.minutes,1)} min. Limites : +${plan.limits.km} km / +${plan.limits.minutes} min, arrêt carburant compris. Plein prévu ${meetingPositionText(plan)}. Durées hors embarquement et pauses.`;
}
function clearMeetingDraft(){
 meetingProposal=null;meetingInputs={pickup:null,dropoff:null};meetingEndpoints='';
 $('meetingPickup').value='';$('meetingDropoff').value='';$('meetingStatus').textContent='';$('meetingApply').hidden=true;
}
function updateMeetings(){
 const plan=trip?.meetings;$('meetingSummary').hidden=!plan;
 $('meetingApply').hidden=!meetingProposal;$('meetingApply').disabled=busy||!meetingProposal;
 $('meetingCalculate').disabled=busy||!trip||trip.routing.vehicle.type==='walk';$('meetingDiscard').disabled=busy;
 if(plan){$('meetingOrder').textContent='Départ → '+routePlanNodes(selectedStop?.station).slice(1,-1).map(n=>n.kind==='pickup'?'Prise en charge : '+plan.pickup.label:n.kind==='dropoff'?'Dépose : '+plan.dropoff.label:'Station : '+selectedStop.station.address).join(' → ')+' → Arrivée';$('meetingMetrics').textContent=meetingRouteSummary(selectedStop?.via||trip.base,plan,plan.reference.base)}
 $('meetingPending').hidden=!trip||Boolean(plan)||!($('meetingPickup').value.trim()||$('meetingDropoff').value.trim());
}
function removeMeetings(message='Rencontres retirées. Trajet initial rétabli ; stations à rechercher à nouveau.'){
 if(busy)return;
 if(trip?.meetings){const ref=trip.meetings.reference;Object.assign(trip,ref,{meetings:null});clearComparison();clearNavigation();tollState.enabled=false;resetTollQuote();clearTableTolls();clearStations();renderRouteChoices();}
 meetingProposal=null;$('meetingApply').hidden=true;$('meetingStatus').textContent=message;updateBudget();
}
function meetingEdited(){
 if(busy)return;
 removeMeetings('Paramètres de rencontre modifiés : recalculer puis adopter le nouveau trajet.');
 for(const [key,id] of [['pickup','meetingPickup'],['dropoff','meetingDropoff']])if(meetingInputs[key]?.value!==$(id).value)meetingInputs[key]=null;
 updateMeetings();
}
async function calculateMeetings(){
 if(busy||!trip||trip.routing.vehicle.type==='walk')return;
 meetingProposal=null;const source=trip,controller=new AbortController();activeAbort=controller;lock(true);$('meetingCancel').hidden=false;$('meetingCancel').disabled=false;
 const current=()=>trip===source&&!controller.signal.aborted;
 try{
  const read=(id,max)=>{const e=$(id),n=Number(e.value);if(!e.value.trim()||!e.validity.valid||n<0||n>max)throw new Error('Renseigner les deux limites de détour.');return n};
  const limits={km:read('meetingMaxKm',1000),minutes:read('meetingMaxMin',1440)},places={};
  for(const [key,id] of [['pickup','meetingPickup'],['dropoff','meetingDropoff']]){
   const value=$(id).value.trim();if(!value)throw new Error('Renseigner la prise en charge et la dépose.');
   $('meetingStatus').textContent=key==='pickup'?'Recherche de la prise en charge…':'Recherche de la dépose…';
   places[key]=meetingInputs[key]?.value===$(id).value?meetingInputs[key].place:await geocode(value,key,current);
   if(!current())throw new Error('Calcul annulé.');meetingInputs[key]={value:$(id).value,place:places[key]};
  }
  const plan={...places,limits,stationPosition:$('meetingStationPosition').value},nodes=meetingNodes(trip.a,trip.b,plan);
  if(nodes.some((n,i)=>i&&hav(n.point,nodes[i-1].point)<.02))throw new Error('Deux étapes successives sont confondues. Choisir des lieux distincts.');
  $('meetingStatus').textContent='Calcul du trajet avec les rencontres…';const via=await route(nodes.map(n=>n.point),true,false,trip.routing);if(!current())throw new Error('Calcul annulé.');
  meetingLegs(via,nodes);const reference=trip.meetings?.reference||{base:trip.base,coords:trip.coords,choices:trip.choices,choice:trip.choice,calculatedAt:trip.calculatedAt};
  const delta=meetingDetour(via,reference.base,limits);
  const message=`Prise en charge : ${plan.pickup.label}. Dépose : ${plan.dropoff.label}. `;
  // The proposal excludes any former station; it will be chosen again in the explicit slot.
  const detail=meetingLegs(via,nodes);
  $('meetingStatus').textContent=message+`${fmt(via.distance/1000,1)} km, ${Math.round(via.duration/60)} min ; ${fmt(detail.sharedDistance/1000,1)} km partagés. Écart : ${delta.km>=0?'+':''}${fmt(delta.km,1)} km / ${delta.minutes>=0?'+':''}${fmt(delta.minutes,1)} min. `+(delta.allowed?'Adopter pour remplacer le trajet et retirer l’ancien arrêt carburant.':'Limite de détour dépassée : proposition non adoptable, trajet précédent conservé.');
  if(delta.allowed)meetingProposal={source,via,plan:{...plan,reference},at:new Date().toISOString()};
 }catch(e){$('meetingStatus').textContent=controller.signal.aborted?'Calcul des rencontres annulé. Trajet précédent conservé.':'Rencontres non ajoutées : '+e.message}
 finally{activeAbort=null;$('meetingCancel').hidden=true;lock(false);updateMeetings()}
}
function applyMeetings(){
 const proposal=meetingProposal;if(busy||!proposal||proposal.source!==trip)return;
 if(!confirm('Adopter le trajet avec ces rencontres ? Les stations, l’arrêt et les péages précédents seront retirés. Le plein sera recherché dans l’ordre indiqué.'))return;
 clearComparison();clearNavigation();tollState.enabled=false;resetTollQuote();clearTableTolls();
 trip.meetings=proposal.plan;trip.base={...proposal.via,alternatives:[]};trip.coords=trip.base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);trip.choices=[trip.base];trip.choice=0;trip.calculatedAt=proposal.at;meetingProposal=null;
 clearStations();renderRouteChoices();updateWindow();$('meetingStatus').textContent='Rencontres intégrées au trajet. Rechercher les stations si nécessaire.';updateBudget();$('meetingEdit').focus();
}
function bindMeetings(){
 meetingFields.forEach(id=>$(id).addEventListener('input',meetingEdited));
 $('meetingCalculate').addEventListener('click',calculateMeetings);$('meetingApply').addEventListener('click',applyMeetings);
 $('meetingCancel').addEventListener('click',()=>{activeAbort?.abort();if(placePending){placePending.reject(new Error('Calcul annulé.'));placePending=null;$('placeDialog').close()}});
 $('meetingRemove').addEventListener('click',()=>{removeMeetings();clearMeetingDraft();updateMeetings()});
 $('meetingDiscard').addEventListener('click',()=>{removeMeetings();clearMeetingDraft();updateMeetings()});
 for(const id of ['meetingEdit','meetingReview'])$(id).addEventListener('click',()=>{selectTab('rides');document.querySelector('input[name="rideRole"][value="driver"]').checked=true;updateRides();$('meetingPickup').focus()});
}

// BEGIN CARPOOL MODEL
function rideInteger(v,min,max){if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw new Error('Nombre de places invalide.');return v}
function rideCents(v){if(v===null)return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>4000000)throw new Error('Montant de frais invalide.');return Math.round((v+Number.EPSILON)*100)}
function splitRideCosts(cost,passengers,seats){
 rideInteger(seats,1,8);rideInteger(passengers,0,seats);
 const fuel=rideCents(cost.fuelEuro),tolls=rideCents(cost.tollEuro);
 if(!['unknown','partial','complete'].includes(cost.tollState)||(cost.tollState==='unknown'?tolls!==null:tolls===null))throw new Error('État des péages incohérent.');
 if(cost.shared){
  const sharedFuel=rideCents(cost.shared.fuelEuro);
  if(sharedFuel!==null&&(fuel===null||sharedFuel>fuel))throw new Error('Carburant partagé incohérent avec le trajet total.');
  const total=fuel===null&&tolls===null?null:(fuel??0)+(tolls??0),perPassenger=sharedFuel===null?null:Math.floor(sharedFuel/(passengers+1)),passengerTotal=passengers===0?0:perPassenger===null?null:perPassenger*passengers;
  return {fuel,tolls,sharedFuel,known:total!==null,total,complete:fuel!==null&&cost.tollState==='complete',sharedComplete:sharedFuel!==null&&cost.tollState==='complete'&&tolls===0,occupants:passengers+1,passengers,seats,perPassenger,passengerTotal,driver:total===null||passengerTotal===null?null:total-passengerTotal};
 }
 const known=fuel!==null||tolls!==null,total=known?(fuel??0)+(tolls??0):null,perPassenger=total===null?null:Math.floor(total/(passengers+1));
 return {fuel,tolls,known,total,complete:fuel!==null&&cost.tollState==='complete',occupants:passengers+1,passengers,seats,perPassenger,passengerTotal:perPassenger===null?null:perPassenger*passengers,driver:total===null?null:total-perPassenger*passengers};
}
function ridePlain(v,max,required=false){if(typeof v!=='string'||v.length>max||/[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/.test(v)||(required&&!v.trim()))throw new Error('Libellé de partage vide, trop long ou contenant un caractère de contrôle.');return v.trim()}
// END CARPOOL MODEL

let rideFingerprint='',rideRevision=0,rideDraft=null,rideCopying=false,rideEndpoints='';
const rideMoney=c=>fmt(c/100)+' €';
function rideBudgetSnapshot(){
 if(!trip||trip.routing.vehicle.type==='walk')return null;
 const route=selectedStop?.via||trip.base,cons=Number($('cons').value),price=Number($('budgetPrice').value);
 const fuelEuro=$('cons').validity.valid&&cons>=1&&cons<=100&&$('budgetPrice').value.trim()&&$('budgetPrice').validity.valid&&price>0&&price<=10?route.distance/1000*cons/100*price:null;
 let tollEuro=null,tollStateName='unknown',tollSource='Péages indisponibles';
 if(tableTolls.segments.length){tollEuro=tableTolls.segments.reduce((n,s)=>n+s.amount,0)/100;tollStateName=$('tariffComplete').checked?'complete':'partial';tollSource='Tarifs '+[...new Set(tableTolls.segments.map(s=>s.network))].join(' / ')+' · '+(tollStateName==='complete'?'couverture déclarée par la personne':'tronçons partiels seulement')}
 else if(tollState.quote){const q=tollState.quote;if(['estimated','no_tolls'].includes(q.status)){tollEuro=q.amountEur;tollStateName='complete'}else if(q.status==='partial'){tollEuro=q.knownSubtotalEur;tollStateName='partial'}tollSource=q.provider+' · '+(q.status==='no_tolls'?'absence de péage confirmée par le service':'estimation du service')}
 const planned=departureInstant($('stationDeparture').value);
 if(tableTolls.segments.length&&$('tariffDate').value!==$('stationDeparture').value.slice(0,10)){tollEuro=null;tollStateName='unknown';tollSource='Date des tronçons différente du départ prévu : actualiser le budget des péages'}
 else if(!tableTolls.segments.length&&tollState.quote&&(!Number.isFinite(planned.instant)||Math.floor(Date.parse(tollState.quote.departureTime)/60000)!==Math.floor(planned.instant/60000))){tollEuro=null;tollStateName='unknown';tollSource='Départ du devis différent du départ prévu : actualiser les péages'}
 const detail=trip.meetings?meetingLegs(route,routePlanNodes(selectedStop?.station)):null;
 return {shared:detail?{km:detail.sharedDistance/1000,fuelEuro:fuelEuro===null?null:detail.sharedDistance/1000*cons/100*price}:null,fuelEuro,tollEuro,tollState:tollStateName,tollSource,routeKm:route.distance/1000,durationMinutes:Math.round(route.duration/60),fuel:$('fuel').value,price:fuelEuro===null?null:price,cons:cons,stop:Boolean(selectedStop),calculatedAt:selectedStop?.confirmedAt||trip.calculatedAt};
}
function rideCounts(){
 const number=id=>{const el=$(id);if(!el.value.trim()||!el.validity.valid)throw new Error('Vérifier les places et le nombre de passagers.');return Number(el.value)};
 const role=document.querySelector('input[name="rideRole"]:checked').value;
 if(role==='passenger')return {role,wanted:rideInteger(number('rideWanted'),1,8)};
 const seats=rideInteger(number('rideSeats'),1,8),passengers=rideInteger(number('ridePassengers'),0,seats);return {role,seats,passengers};
}
function invalidateRideDraft(message='Paramètres modifiés : préparer un nouveau récapitulatif.'){
 rideRevision++;if(rideDraft)$('rideMessage').textContent=message;rideDraft=null;$('rideShare').hidden=true;$('rideText').value='';$('rideConsent').checked=false;$('rideCopy').disabled=true;
}
function updateRides(){
 const role=document.querySelector('input[name="rideRole"]:checked').value,cost=rideBudgetSnapshot();
 $('rideDriver').hidden=role!=='driver';$('ridePassenger').hidden=role!=='passenger';$('rideDeparture').value=$('stationDeparture').value;
 if(trip){const endpoints=JSON.stringify([trip.a,trip.b]);if(rideEndpoints&&rideEndpoints!==endpoints){for(const id of ['rideFrom','rideTo','rideNeeds'])$(id).value='';$('rideMessage').textContent='Nouveaux lieux de trajet : renseigner à nouveau les secteurs à partager.'}rideEndpoints=endpoints}
 const fields=['rideSeats','ridePassengers','rideWanted','rideFrom','rideTo','rideNeeds'].map(id=>$(id).value);
 const fingerprint=JSON.stringify([trip?.calculatedAt,trip?.choice,selectedStop?.confirmedAt,trip?.routing,trip?.a,trip?.b,role,fields,$('stationDeparture').value,cost]);
 if(fingerprint!==rideFingerprint){invalidateRideDraft();rideFingerprint=fingerprint}
 $('ridePrepare').disabled=busy||!trip||trip.routing.vehicle.type==='walk';$('rideCopy').disabled=busy||rideCopying||!rideDraft||!$('rideConsent').checked;
 $('rideTrip').textContent=trip?`${trip.label} · itinéraire préparé, aucune offre intégrée.`:'Calculer un trajet pour préparer le covoiturage.';
 const departure=departureInstant($('stationDeparture').value),future=!departure.error&&departure.instant>=Date.now()-60000;
 if(rideDraft&&!future)invalidateRideDraft('Départ passé ou invalide : actualiser avant de partager.');
 $('rideDeparture').setAttribute('aria-invalid',String(!future));$('rideDepartureNote').textContent=departure.error||(!future?'Départ passé : choisir une heure à venir.':'Même départ prévu que pour les horaires des stations. Durées sans trafic en direct.');
 $('rideCostLines').replaceChildren();$('rideCostNote').textContent='';
 if(!cost)return;
 try{
  const counts=rideCounts();
  if(counts.role==='passenger'){$('ridePassengerNote').textContent=`Recherche de ${counts.wanted} place(s), sans disponibilité confirmée. Le prix sera celui de l’offre du fournisseur ; le budget du véhicule préparé n’est pas un prix passager.`;return}
  const s=splitRideCosts(cost,counts.passengers,counts.seats),line=(label,value)=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);$('rideCostLines').append(div)};
  if(cost.shared){
   line('Carburant du trajet complet',s.fuel===null?'À renseigner':rideMoney(s.fuel));line('Carburant de la portion partagée',s.sharedFuel===null?'À renseigner':rideMoney(s.sharedFuel));
   line('Péages du trajet complet',s.tolls===null?'Inconnus':rideMoney(s.tolls)+(cost.tollState==='partial'?' · partiels':''));
   line('Par passager · portion partagée',!counts.passengers?'Aucun passager prévu':s.perPassenger===null?'Indisponible':rideMoney(s.perPassenger)+(s.sharedComplete?' · proposition':' · carburant seulement'));
   line('Reste conducteur sur frais connus',s.driver===null?'Indisponible':rideMoney(s.driver));
   $('rideCostNote').textContent=sharedRideNote(cost,s);return;
  }
  line('Carburant consommé',s.fuel===null?'À renseigner':rideMoney(s.fuel));line('Péages',s.tolls===null?'Inconnus':rideMoney(s.tolls)+(s.complete||cost.tollState==='complete'?' · estimation':' · partiels'));
  line(s.complete?'Carburant + péages estimés':'Montant connu · incomplet',s.total===null?'Indisponible':rideMoney(s.total));
  line(s.complete?'Par passager · proposition':'Par passager · sur montant connu',s.perPassenger===null?'Indisponible':!counts.passengers?'Aucun passager prévu':rideMoney(s.perPassenger));
  line('Part du conducteur',s.driver===null?'Indisponible':rideMoney(s.driver)+(s.complete?'':' · partielle'));
  $('rideCostNote').textContent=`Hypothèse : ${counts.passengers} passager(s) + le conducteur, soit ${s.occupants} personne(s), sur tout le trajet de ${fmt(cost.routeKm,1)} km${cost.stop?', arrêt station inclus':''}. ${s.complete?'Montants estimés ; couverture des péages selon le budget.':'Frais incomplets : aucune participation totale calculable.'} Parts égales au centime inférieur ; le conducteur garde le reliquat. ${cost.tollSource}.`;
 }catch(e){$('rideCostNote').textContent=e.message;$('ridePassengerNote').textContent=e.message}
}
function sharedRideNote(cost,s){return `${s.passengers} passager(s) + le conducteur sur ${fmt(cost.shared.km,1)} km partagés, pour ${fmt(cost.routeKm,1)} km au total. Carburant hors portion commune laissé au conducteur. Parts égales au centime inférieur ; reliquat au conducteur. ${s.sharedComplete?'Péages nuls sur le trajet selon le budget ; proposition estimée.':'Péages non attribuables à la portion commune : aucune participation totale calculable. Les montants connus restent provisoirement dans le reste conducteur.'} ${cost.tollSource}.`}
function prepareRideText(){
 try{
  updateBudget();if(busy||!trip)throw new Error('Calculer un trajet avant de préparer le récapitulatif.');
  if(!trip.meetings&&($('meetingPickup').value.trim()||$('meetingDropoff').value.trim()))throw new Error('Rencontres encore en préparation : les adopter ou les effacer avant de préparer le récapitulatif.');
  const counts=rideCounts(),cost=rideBudgetSnapshot(),from=ridePlain($('rideFrom').value,160,true),to=ridePlain($('rideTo').value,160,true),needs=ridePlain($('rideNeeds').value,300),departure=departureInstant($('stationDeparture').value);
  if(departure.error||departure.instant<Date.now()-60000)throw new Error(departure.error||'Choisir une heure de départ à venir.');
  const lines=['Préparation de covoiturage — à convenir',counts.role==='driver'?'Rôle : conducteur':'Rôle : recherche de place',`Secteurs saisis : ${from} → ${to}`,`Départ envisagé : ${arrivalLabel(departure.instant)} (Europe/Paris).`];
  if(counts.role==='driver'){
   const s=splitRideCosts(cost,counts.passengers,counts.seats);
   if(cost.shared){lines.push(`Places proposées : ${counts.seats}, hors conducteur.`,sharedRideNote(cost,s),`Durée totale estimée : ${cost.durationMinutes} min, hors pauses et embarquement.`,`Péages du trajet complet : ${s.tolls===null?'inconnus':rideMoney(s.tolls)}${cost.tollState==='partial'?' · partiels':''}.`,`Carburant du trajet : ${s.fuel===null?'inconnu':rideMoney(s.fuel)} ; carburant partagé : ${s.sharedFuel===null?'inconnu':rideMoney(s.sharedFuel)}.`,s.perPassenger===null?'Contribution indisponible.':`Proposition carburant par passager : ${rideMoney(s.perPassenger)} ; total passagers : ${rideMoney(s.passengerTotal)}.`,`Reste conducteur sur frais connus : ${s.driver===null?'inconnu':rideMoney(s.driver)}.`,`Référence carburant : ${cost.fuel}, ${fmt(cost.cons,1)} L/100 km ; prix ${cost.price===null?'non renseigné':fmt(cost.price,3)+' €/L'}.`)}else{
   lines.push(`Places proposées : ${counts.seats}, hors conducteur, à confirmer avec le véhicule.`,`Simulation : ${counts.passengers} passager(s) + 1 conducteur, sur l’ensemble de l’itinéraire routier préparé (${fmt(cost.routeKm,1)} km, ${cost.durationMinutes} min de route, hors pauses${cost.stop?', détour station inclus':''}).`,`Carburant consommé estimé : ${s.fuel===null?'inconnu':rideMoney(s.fuel)+' ; '+cost.fuel+', '+fmt(cost.cons,1)+' L/100 km, prix de référence '+fmt(cost.price,3)+' €/L'}.`,`Péages : ${s.tolls===null?'inconnus':rideMoney(s.tolls)}. ${cost.tollSource}.`);
   if(s.total===null)lines.push('Frais indisponibles : aucune contribution calculable.');
   else lines.push(`${s.complete?'Carburant + péages estimés':'Montant connu seulement — incomplet'} : ${rideMoney(s.total)}.`,counts.passengers?`Part ${s.complete?'indicative':'partielle sur montant connu'} par passager : ${rideMoney(s.perPassenger)} ; total passagers : ${rideMoney(s.passengerTotal)}.`:'Aucun passager prévu dans la simulation.',`Part ${s.complete?'indicative':'partielle'} du conducteur : ${rideMoney(s.driver)}. Parts égales au centime inférieur ; reliquat laissé au conducteur.`);
   if(!s.complete)lines.push('Des frais restent inconnus : aucune participation totale calculable.');
   }
   lines.push('Durées sans trafic en direct ; pauses et embarquement non comptés. Périmètre : carburant consommé et péages de l’aller simple. Plein acheté, stationnement, ferries et autres coûts exclus. Partage de frais à convenir, pas un tarif d’offre ni un paiement.');
  }else lines.push(`Places recherchées : ${counts.wanted}, disponibilité à confirmer. Prix de l’offre : inconnu. Aucun prix n’est déduit du budget du véhicule préparé.`);
  lines.push(`Besoins ou conditions à convenir : ${needs||'non précisés'}.`,trip.meetings&&counts.role==='driver'?'Rencontres calculées séparément. Leurs adresses ne sont pas recopiées ici ; vérifier manuellement la correspondance des secteurs à partager.':'Secteurs saisis non vérifiés sur la carte ; prise en charge intermédiaire et détour supplémentaire non calculés.','Aucune offre publiée, mise en relation ou réservation effectuée. Contact et réservation restent chez le fournisseur.',`Récapitulatif préparé le ${arrivalLabel(Date.now())} (Europe/Paris).`);
  $('rideText').value=lines.join('\n');rideDraft={text:$('rideText').value,revision:rideRevision};$('rideShare').hidden=false;$('rideConsent').checked=false;$('rideCopy').disabled=true;$('rideMessage').textContent='Relire le récapitulatif avant de le copier. Aucune transmission effectuée.';$('rideText').focus();
 }catch(e){invalidateRideDraft();$('rideMessage').textContent=e.message}
}
function bindRides(){
 for(const el of document.querySelectorAll('input[name="rideRole"],#rideSeats,#ridePassengers,#rideWanted,#rideFrom,#rideTo,#rideNeeds'))el.addEventListener('input',updateRides);
 $('rideDeparture').addEventListener('input',()=>{$('stationDeparture').value=$('rideDeparture').value;refreshArrival()});
 $('ridePrepare').addEventListener('click',prepareRideText);
 $('rideConsent').addEventListener('change',()=>{$('rideCopy').disabled=busy||rideCopying||!rideDraft||!$('rideConsent').checked});
 $('rideCopy').addEventListener('click',async()=>{
  updateBudget();if(busy||rideCopying||!rideDraft||!$('rideConsent').checked)return;
  const d=rideDraft;rideCopying=true;$('rideCopy').disabled=true;
  try{if(!navigator.clipboard?.writeText)throw new Error('Presse-papiers indisponible');await navigator.clipboard.writeText(d.text);$('rideMessage').textContent=d.revision===rideRevision?'Récapitulatif copié. Aucun message envoyé.':'Une version précédente a été copiée ; les paramètres ont changé entre-temps. Préparer un nouveau récapitulatif.'}
  catch{if(d.revision===rideRevision){$('rideText').focus();$('rideText').select();$('rideMessage').textContent='Copie automatique indisponible. Le texte est sélectionné : utiliser la commande Copier du navigateur.'}}
  finally{rideCopying=false;$('rideCopy').disabled=busy||!rideDraft||!$('rideConsent').checked}
 });
}

// BEGIN PROSPECTIVE CARBON MODEL
function prospectiveFactors(fuel){
 const family=['E10','SP95','SP98'].includes(fuel)?'essence':fuel==='Gazole'?'diesel':null;
 return family?CARBON_DATA.factors.filter(f=>f.mode==='car'&&f.unit==='kgCO2e/vehicle-km'&&f.scope==='construction-energy'&&f.id.endsWith('-'+family)):[];
}
function prospectiveChoice(raw){return {enabled:raw?.enabled===true,factorId:typeof raw?.factorId==='string'?raw.factorId:'',occupants:raw?.occupants??''}}
function prospectiveCarbon(mode,distance,fuel,choice,group=null){
 const missing=reason=>({status:'unavailable',reason,vehicleKg:null,individualKg:null,groupKg:null,factor:null,dataset:null});
 if(mode!=='car')return missing('Aucun facteur qualifié pour ce mode ou véhicule ; aucune émission nulle supposée.');
 if(!prospectiveFactors(fuel).length)return missing('Aucun facteur qualifié pour ce carburant. Aucun modèle de substitution.');
 if(choice?.enabled!==true)return missing('Estimation non demandée.');
 const factor=prospectiveFactors(fuel).find(f=>f.id===choice.factorId);
 if(!factor)return missing('Choisir un modèle compatible avec le carburant du trajet.');
 const occupants=typeof choice.occupants==='number'?choice.occupants:typeof choice.occupants==='string'&&choice.occupants.trim()?Number(choice.occupants):NaN;
 if(!Number.isInteger(occupants)||occupants<1||occupants>9)return missing('Indiquer de 1 à 9 occupants, conducteur compris.');
 if(group!==null&&(!Number.isInteger(group)||group<1||group>occupants))return missing('Le groupe doit compter de 1 au nombre total d’occupants du véhicule.');
 if(typeof distance!=='number'||!Number.isFinite(distance)||distance<0||distance>40000000)return missing('Distance inconnue ou invalide.');
 const vehicleKg=distance/1000*(factor.construction+factor.energy),individualKg=vehicleKg/occupants;
 return {status:'estimated',reason:'',distanceMeters:distance,occupants,group,vehicleKg,individualKg,groupKg:group===null?null:individualKg*group,factor:structuredClone(factor),dataset:CARBON_DATA.version};
}
// END PROSPECTIVE CARBON MODEL
function prospectiveMarkup(c){
 if(c.status!=='estimated')return `<p class="note">CO₂e non estimé. ${escapeHtml(c.reason)}</p>`;
 const f=c.factor;
 return `<p><strong>Véhicule entier : ${carbonAmount(c.vehicleKg)}</strong></p><p>Par occupant : ${carbonAmount(c.individualKg)} · partage égal entre ${c.occupants} occupant(s), conducteur compris.</p>${c.group===null?'':`<p><strong>Part attribuée au groupe : ${carbonAmount(c.groupKg)}</strong> · ${c.group} personne(s) parmi ${c.occupants} occupants. Cette part n’est pas ajoutée au total véhicule.</p>`}<details><summary>Facteur, source et méthode</summary><p>${escapeHtml(f.label)} · ${fmt(c.distanceMeters/1000,3)} km × ${fmt(f.construction+f.energy,6)} kg CO₂e/véhicule-km.</p><p>${CARBON_SCOPES[f.scope]} : construction ${fmt(f.construction,6)}, énergie ${fmt(f.energy,6)} kg CO₂e/véhicule-km. Valeurs moyennes, sans ajustement selon la consommation réelle, le chargement ou la météo. Infrastructures et alimentation humaine non modélisées ; aucune empreinte exhaustive.</p><p><a href="${f.source}" target="_blank" rel="noopener noreferrer">Source : ADEME / Impact CO₂</a> · jeu extrait le ${CARBON_DATA.retrievedAt} · version ${escapeHtml(c.dataset)}. Calcul local sur l’appareil, sans transmission des lieux pour cette estimation.</p></details>`;
}
function fillProspectiveChoices(prefix){
 const select=$(prefix+'Factor'),old=select.value,factors=prospectiveFactors($('fuel').value);
 const signature=factors.map(f=>f.id).join('|');
 if(select.dataset.options!==signature){select.replaceChildren(new Option('Choisir un modèle',''),...factors.map(f=>new Option(f.label,f.id)));select.dataset.options=signature;if(factors.some(f=>f.id===old))select.value=old}
 return factors.length>0;
}
function prospectiveRaw(prefix){return {enabled:$(prefix+'Enabled').checked,factorId:$(prefix+'Factor').value,occupants:$(prefix+'Occupants').value}}
function updateProspectiveControls(prefix,available){
 fillProspectiveChoices(prefix);$(prefix+'Enabled').disabled=busy||!available;$(prefix+'Fields').hidden=!available||!$(prefix+'Enabled').checked;
 for(const suffix of ['Factor','Occupants'])$(prefix+suffix).disabled=busy||!available||!$(prefix+'Enabled').checked;
}
function updateRouteCarbon(){
 $('routeCarbon').hidden=!trip;if(!trip)return;
 const mode=trip.routing.vehicle.type,available=mode==='car'&&prospectiveFactors($('fuel').value).length>0;
 updateProspectiveControls('routeCarbon',available);
 const r=selectedStop?.via||trip.base,c=prospectiveCarbon(mode,r.distance,$('fuel').value,prospectiveRaw('routeCarbon'));
 $('routeCarbonAvailability').textContent=available?'Choisir la taille du véhicule et le nombre total d’occupants. Le carburant sert à proposer des modèles compatibles, sans sélectionner un modèle automatiquement.':'Aucun modèle compatible disponible pour ce mode ou carburant.';
 $('routeCarbonResult').innerHTML=prospectiveMarkup(c);$('routeCarbonResult').dataset.carbonState=c.status;
 $('routeCarbonDistance').textContent=`${fmt(r.distance/1000,1)} km${selectedStop?' · détour par la station inclus':' · trajet affiché'}. Hypothèses de préparation, pas un déplacement effectué.${trip.meetings?' Occupation supposée constante sur tout le trajet pour cette simulation carbone ; les changements de passagers aux rencontres ne sont pas modélisés.':''}`;
}
function resetProspective(){for(const prefix of ['routeCarbon','comparisonCarbon']){$(prefix+'Enabled').checked=false;$(prefix+'Factor').value='';$(prefix+'Occupants').value=''}updateRouteCarbon()}
function bindProspective(){
 fillProspectiveChoices('routeCarbon');fillProspectiveChoices('comparisonCarbon');
 for(const suffix of ['Enabled','Factor','Occupants'])$('routeCarbon'+suffix).addEventListener('input',()=>{updateRouteCarbon();comparisonChanged()});
 $('comparisonCarbonEnabled').addEventListener('input',()=>updateProspectiveControls('comparisonCarbon',$('routeVehicle').value==='car'&&prospectiveFactors($('fuel').value).length>0));
}

// BEGIN COMPARISON MODEL
function comparisonNumber(value,min,max,optional=false){
 if(optional&&(value===''||value===null))return null;
 const n=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;
 if(!Number.isFinite(n)||n<min||n>max)throw new Error('Hypothèse numérique invalide.');return n;
}
function comparisonHypotheses(raw){
 const travelers=comparisonNumber(raw.travelers,1,9);if(!Number.isInteger(travelers))throw new Error('Indiquer un groupe de 1 à 9 personnes.');
 const timing=timingHypotheses({departure:raw.departure,arriveBy:raw.arriveBy??null,onlyBefore:raw.onlyBefore??false});
 return {travelers,...timing,carbon:prospectiveChoice(raw.carbon),cons:comparisonNumber(raw.cons,1,100),price:comparisonNumber(raw.price,.001,10,true),maxWalkKm:walkLimit(raw.maxWalkKm)};
}
function comparisonCost(mode,distance,h){
 if(!['car','walk'].includes(mode)||typeof distance!=='number'||!Number.isFinite(distance)||distance<0)throw new Error('Trajet de comparaison invalide.');
 // No complete budget is available: neither missing tolls nor walking costs are zero.
 const liters=mode==='car'?distance/1000*h.cons/100:null;
 const fuel=liters!==null&&h.price!==null?liters*h.price:null;
 return {status:fuel===null?'unknown':'partial',fuel,liters,total:null,carbonKg:null};
}
function orderComparison(entries,criterion){
 if(!['duration','distance'].includes(criterion))throw new Error('Critère de comparaison indisponible.');
 const value=e=>e.status==='ready'&&Number.isFinite(e.route?.[criterion])?Math.round(e.route[criterion]/(criterion==='duration'?60:100)):Infinity;
 return [...entries].sort((a,b)=>value(a)-value(b)||a.mode.localeCompare(b.mode));
}
// END COMPARISON MODEL
const comparisonFields=['comparisonTravelers','comparisonDeparture','comparisonCons','comparisonPrice','comparisonWalkLimit','comparisonArriveBy'];
function comparisonRaw(){return {...Object.fromEntries(['travelers','departure','cons','price','maxWalkKm','arriveBy'].map((k,i)=>[k,$(comparisonFields[i]).value])),onlyBefore:$('comparisonOnlyBefore').checked,carbon:prospectiveRaw('comparisonCarbon')}}
function comparisonSignature(){return JSON.stringify({a:trip?.a,b:trip?.b,fields:['start','end','routeOptimization','routeVehicle','cons','fuel','budgetPrice','maxWalkKm','stationDeparture','routeArriveBy',...comparisonFields].map(id=>$(id).value),onlyBefore:$('routeOnlyBefore').checked,carbon:['routeCarbon','comparisonCarbon'].map(p=>prospectiveRaw(p)),avoid:[...document.querySelectorAll('.avoid-options input')].map(el=>[el.value,el.checked])})}
function comparisonCarSettings(){const avoid=[...document.querySelectorAll('.avoid-options input:checked')].map(el=>el.value);return routingSettings($('routeVehicle').value,avoid)}
function clearComparison(message=''){
 if(comparison?.running){comparison.cancelled=true;comparison.controller?.abort()}
 comparison=null;$('comparisonCards').replaceChildren();$('comparisonExcluded').replaceChildren();$('comparisonExcludedWrap').hidden=true;$('comparisonTimingStatus').textContent='';$('comparisonContext').textContent='';$('comparisonSortWrap').hidden=true;
 $('comparisonStatus').textContent=message;
 if(!message){$('comparisonPanel').hidden=true;$('compareBtn').setAttribute('aria-expanded','false')}
}
function comparisonChanged(){if(comparison)clearComparison('Paramètres modifiés : relancer la comparaison. Les anciens résultats ont été retirés.')}
function openComparison(){
 if(busy||!trip)return;
 if(!$('comparisonPanel').hidden){$('comparisonHeading').focus();return}
 clearComparison();$('comparisonPanel').hidden=false;$('compareBtn').setAttribute('aria-expanded','true');
 $('comparisonArriveBy').value=$('routeArriveBy').value;$('comparisonOnlyBefore').checked=$('routeOnlyBefore').checked;
 fillProspectiveChoices('comparisonCarbon');
 for(const suffix of ['Enabled','Factor','Occupants']){const from=$('routeCarbon'+suffix),to=$('comparisonCarbon'+suffix);if(suffix==='Enabled')to.checked=from.checked;else to.value=from.value}
 const carbonAvailable=$('routeVehicle').value==='car'&&prospectiveFactors($('fuel').value).length>0;updateProspectiveControls('comparisonCarbon',carbonAvailable);$('comparisonCarbonAvailability').textContent=carbonAvailable?'Le groupe est supposé voyager dans le même véhicule. Les occupants incluent le conducteur et les éventuelles personnes hors groupe. Capacité du véhicule non vérifiée.':'Aucun modèle compatible pour le véhicule ou carburant choisi.';
 $('comparisonDeparture').value=$('stationDeparture').value;$('comparisonCons').value=$('cons').value;$('comparisonPrice').value='';$('comparisonWalkLimit').value=$('maxWalkKm').value;
 $('comparisonStatus').textContent='Vérifier les hypothèses, puis calculer les deux modes directs, sans rencontres ni arrêt carburant. Le trajet affiché reste en place jusqu’au choix.';
 $('comparisonHeading').focus();
}
function renderComparison(op){
 if(comparison!==op)return;
 const available=op.entries.filter(e=>e.status==='ready').length;
 $('comparisonStatus').textContent=op.running?'Calcul des deux modes…':op.cancelled?'Comparaison annulée. Aucun nouveau trajet sélectionné.':`${available}/2 trajets disponibles. ${available===2?'Comparaison des distances et durées disponible.':'Comparaison partielle.'} Coûts totaux et empreintes incomplets.`;
 $('comparisonSortWrap').hidden=!available;
 const h=op.hypotheses;
 $('comparisonContext').textContent=`${op.source.places.start} → ${op.source.places.end}. Aller simple, sans arrêt. Groupe de ${h.travelers} personne(s), capacité du véhicule non vérifiée. ${h.departure===null?'Départ non renseigné.':`Départ souhaité : ${arrivalLabel(h.departure)} (Paris).`} ${h.arriveBy===null?'Heure limite non renseignée.':`Heure limite : ${arrivalLabel(h.arriveBy)} (Paris).`} ${h.departure!==null&&h.departure<Date.now()-60000?'Départ passé : actualiser pour un trajet à venir.':''} Estimations sans garantie d’arrivée. Calculs hors trafic temps réel et pauses ; la date et le nombre de personnes ne sont pas transmis aux moteurs. Résultats obtenus le ${new Date(op.at).toLocaleString('fr-FR')}, cache de calcul possible.`;
 const cards=[],excluded=[];let compatible=0;
 orderComparison(op.entries,$('comparisonSort').value).forEach(e=>{
  const title=e.mode==='car'?'Véhicule léger':'À pied';
  if(e.status!=='ready'){cards.push(`<article class="comparison-card" data-compare-mode="${e.mode}"><h3>${title}</h3><p>${escapeHtml(e.status==='pending'?'Calcul en attente…':e.error)}</p></article>`);return}
  const emission=prospectiveCarbon(e.mode,e.route.distance,op.fuel,h.carbon,h.travelers),cost=comparisonCost(e.mode,e.route.distance,h),w=e.mode==='walk'?walkingDistance(e.route.distance,h.maxWalkKm):null;
  const time=timingEstimate(e.route.duration,h),hidden=h.onlyBefore&&!time.admissible;if(time.admissible)compatible++;
  const html=`<article class="comparison-card" data-compare-mode="${e.mode}" data-timing-state="${time.state}"><h3>${title}</h3><p class="station-selection">${escapeHtml(timingText(time))}</p><dl class="budget-lines"><div><dt>Distance</dt><dd>${fmt(e.route.distance/1000,1)} km</dd></div><div><dt>Durée estimée</dt><dd>${Math.round(e.route.duration/60)} min</dd></div><div><dt>Carburant du véhicule</dt><dd>${e.mode==='walk'?'Sans objet':cost.fuel===null?'Prix non renseigné':`${fmt(cost.fuel)} € · partiel`}</dd></div><div><dt>Coût total du groupe</dt><dd>${cost.status==='partial'?'Incomplet':'Non estimé'}</dd></div><div><dt>CO₂e du groupe (allocation)</dt><dd>${emission.status==='estimated'?carbonAmount(emission.groupKg):'Non estimée'}</dd></div></dl><div class="prospective-carbon" data-carbon-state="${emission.status}">${prospectiveMarkup(emission)}</div><p class="note">${e.mode==='car'?`${fmt(cost.liters)} L estimés · ${escapeHtml(op.fuel)} · ${h.price===null?'prix absent':`${fmt(h.price,3)} €/L saisi`}. Péages, stationnement et autres frais inconnus. Aucun prix de station ni péage d’un autre tracé repris.`:'Budget de marche non estimé. Pente, escaliers, revêtement et accessibilité non vérifiés.'}</p>${w?`<p class="station-selection">${w.limit===null?'Limite de marche non renseignée.':w.exceeded?`Limite souhaitée dépassée (${fmt(w.limit,1)} km). ${hidden?'Sélection écartée par le filtre horaire.':'Cette limite de distance reste une préférence souple.'}`:`Dans la limite souhaitée de ${fmt(w.limit,1)} km ; difficulté non évaluée.`}</p>`:''}<p class="note">${escapeHtml(routingLabel(e.settings))}${e.route.resourceVersion?' · données '+escapeHtml(e.route.resourceVersion):''}</p><button type="button" class="ghost navigation-button" data-compare-select="${e.mode}" aria-pressed="${op.selected===e.mode}" ${op.running||hidden?'disabled':''}>${op.selected===e.mode?'Trajet affiché':'Afficher ce trajet'}</button></article>`;
 (hidden?excluded:cards).push(html);
 });
 $('comparisonCards').innerHTML=cards.join('');$('comparisonExcluded').innerHTML=excluded.join('');$('comparisonExcludedWrap').hidden=!excluded.length;
 $('comparisonTimingStatus').textContent=h.onlyBefore?`${compatible} trajet(s) compatibles selon l’estimation. ${excluded.length} écarté(s), consultables ci-dessous.${!compatible?' Aucun trajet ne satisfait ce filtre ; aucun mode sélectionné automatiquement.':''}`:'Filtre horaire désactivé : tous les résultats restent visibles.';
 updateProspectiveControls('comparisonCarbon',$('routeVehicle').value==='car'&&prospectiveFactors($('fuel').value).length>0);
 $('comparisonCalculate').disabled=op.running;$('comparisonCancel').hidden=!op.running;$('comparisonCancel').disabled=op.cancelled;
}
async function runComparison(){
 if(busy||!trip)return;
 let hypotheses;try{hypotheses=comparisonHypotheses(comparisonRaw())}catch(e){clearComparison('Vérifier les hypothèses : '+e.message);return}
 const source={a:[...trip.a],b:[...trip.b],places:{...trip.places}},car=comparisonCarSettings();
 const op={source,hypotheses,fuel:$('fuel').value,signature:comparisonSignature(),at:new Date().toISOString(),running:true,cancelled:false,entries:[{mode:'car',settings:car,status:'pending'},{mode:'walk',settings:routingSettings('walk',[]),status:'pending'}],controller:new AbortController()};
 comparison=op;activeAbort=op.controller;lock(true);renderComparison(op);$('comparisonCancel').disabled=false;
 let ignQuota=false;
 try{
  for(const entry of op.entries){
   if(op.cancelled||comparison!==op)break;
   try{
    if(entry.mode==='car'&&car.vehicle.type!=='car')throw new Error('Comparaison véhicule léger indisponible pour le profil choisi. Aucun poids lourd ou caravane remplacé par une voiture.');
    if(ignQuota&&entry.settings.provider==='ign')throw new Error('Quota IGN atteint : ce second calcul n’a pas été demandé. Relancer plus tard.');
    ensureRouting(entry.settings);
    const r=await route([source.a,source.b],true,false,entry.settings);
    if(op.cancelled||comparison!==op)break;
    if(op.signature!==comparisonSignature()){clearComparison('Paramètres modifiés pendant le calcul : relancer la comparaison.');break}
    entry.route=r;entry.status='ready';
   }catch(e){if(op.cancelled||comparison!==op)break;entry.status='unavailable';entry.error=e.message;if(e.message.includes('Limite du service IGN'))ignQuota=true}
  }
 }finally{
  op.running=false;op.at=new Date().toISOString();if(activeAbort===op.controller)activeAbort=null;lock(false);
  if(comparison===op){if(op.cancelled)op.entries=[];renderComparison(op)}
  $('comparisonCancel').hidden=true;
 }
}
function chooseComparison(mode){
 const op=comparison;if(busy||!op||op.running||op.cancelled)return;
 if(op.signature!==comparisonSignature()){comparisonChanged();return}
 const entry=op.entries.find(e=>e.mode===mode&&e.status==='ready');if(!entry||op.selected===mode||(op.hypotheses.onlyBefore&&!timingEstimate(entry.route.duration,op.hypotheses).admissible))return;
 if((trip?.meetings||selectedStop||compared.length||tableTolls.segments.length||tollState.quote)&&!confirm('Afficher ce trajet direct retire les rencontres, les stations, l’arrêt et les péages précédents. Continuer ?'))return;
 clearMeetingDraft();
 clearNavigation();tollState.enabled=false;tollState.key='';resetTollQuote();clearTableTolls('Nouveau trajet sélectionné : péages à vérifier.');clearStations();
 $('routeCarbonEnabled').checked=op.hypotheses.carbon.enabled;$('routeCarbonFactor').value=op.hypotheses.carbon.factorId;$('routeCarbonOccupants').value=op.hypotheses.carbon.occupants;
 $('travelMode').value=mode==='walk'?'walk':'car';$('routeOptimization').value=entry.settings.optimization;$('activeVehicle').hidden=true;
 if(mode==='walk')$('maxWalkKm').value=op.hypotheses.maxWalkKm??'';
 else{$('cons').value=op.hypotheses.cons;$('budgetPrice').value=op.hypotheses.price??'';budgetReference=op.hypotheses.price===null?null:{label:'Prix saisi pour la comparaison',at:new Date(op.at).toLocaleString('fr-FR')}}
 resumePreparation=null;preparedRangePending=false;$('routeArriveBy').value=op.hypotheses.arriveBy===null?'':parisLocal(op.hypotheses.arriveBy);$('routeOnlyBefore').checked=op.hypotheses.onlyBefore;$('stationDeparture').value=op.hypotheses.departure===null?'':parisLocal(op.hypotheses.departure);refreshArrival();updateResumePreparation();
 const base={...structuredClone(entry.route),alternatives:[]};displayTrip(base,structuredClone(entry.settings),op.source.a,op.source.b,{label:op.source.places.start},{label:op.source.places.end});
 trip.calculatedAt=op.at;op.selected=mode;updateVehicleRouting();updateBudget();op.signature=comparisonSignature();renderComparison(op);
 setStatus(`Trajet ${mode==='walk'?'à pied':'en véhicule léger'} sélectionné dans la comparaison.`, 'ok');$('compareBtn').focus();
}
function bindComparison(){
 for(const id of ['useStationPrice','stationDepartureNow'])$(id).addEventListener('click',comparisonChanged);
 for(const id of ['routeArriveBy','routeOnlyBefore'])$(id).addEventListener('input',updateTripTiming);
 $('compareBtn').addEventListener('click',openComparison);$('comparisonCalculate').addEventListener('click',runComparison);
 $('comparisonClose').addEventListener('click',()=>{if(!busy){clearComparison();$('compareBtn').focus()}});
 $('comparisonCancel').addEventListener('click',()=>{if(comparison?.running){comparison.cancelled=true;comparison.controller.abort();$('comparisonStatus').textContent='Annulation en cours…';$('comparisonCancel').disabled=true}});
 $('comparisonOnlyBefore').addEventListener('change',()=>{if(comparison&&!comparison.running){if($('comparisonOnlyBefore').checked&&comparison.hypotheses.arriveBy===null){$('comparisonOnlyBefore').checked=false;$('comparisonTimingStatus').textContent='Renseigner une heure limite puis relancer la comparaison.';return}comparison.hypotheses.onlyBefore=$('comparisonOnlyBefore').checked;renderComparison(comparison)}});
 $('comparisonSort').addEventListener('change',()=>{if(comparison&&!comparison.running)renderComparison(comparison)});
 $('comparisonCards').addEventListener('click',e=>{const b=e.target.closest('[data-compare-select]');if(b)chooseComparison(b.dataset.compareSelect)});
 for(const id of [...comparisonFields,'comparisonCarbonEnabled','comparisonCarbonFactor','comparisonCarbonOccupants'])$(id).addEventListener('input',comparisonChanged);
 const fields=['start','end','travelMode','routeOptimization','routeVehicle','maxWalkKm','fuel','cons','budgetPrice','stationDeparture','routeArriveBy','routeOnlyBefore','tollDeparture','tariffDate','tariffClass'];
 for(const event of ['input','change'])$('sheet').addEventListener(event,e=>{if(fields.includes(e.target.id)||e.target.matches('.avoid-options input,#truckDimensions input'))comparisonChanged()});
}

function updateBudget(){
  updateTripTiming();updateRouteCarbon();updateMeetings();
  $("compareBtn").hidden=!trip;
  $("navigationBtn").hidden=!trip;
  $("journalRecordBtn").hidden=!trip;$("savePreparationBtn").hidden=!trip;
  $("tripBudget").hidden=!trip||trip.routing.vehicle.type==="walk";
  updateWalking();
  $("useStationPrice").disabled=busy||!selectedStop;
  syncTableTolls();syncTolls();
  updateRides();
  if(!trip||trip.routing.vehicle.type==="walk")return;
  const r=selectedStop?.via||trip.base,cons=Number($("cons").value),price=Number($("budgetPrice").value);
  const liters=Number.isFinite(cons)&&cons>=1&&cons<=100?r.distance/1000*cons/100:null;
  const validPrice=$("budgetPrice").value.trim()&&Number.isFinite(price)&&price>0&&price<=10;
  $("budgetRoute").textContent=`${fmt(r.distance/1000,1)} km · ${Math.round(r.duration/60)} min${trip.meetings?" · rencontres incluses":""}${selectedStop?" · arrêt inclus, hors temps du plein":trip.meetings?" · sans arrêt carburant":" · sans arrêt"}`;
  renderTolls(validPrice&&liters!==null?liters*price:null);
  $("budgetFuel").textContent=liters===null?"Consommation à vérifier":`${fmt(liters,2)} L${validPrice?` · ${fmt(liters*price)} €`:" · prix à renseigner"}`;
  $("budgetSource").textContent=validPrice?(budgetReference?`${budgetReference.label} · ${$("fuel").value} · ${fmt(price,3)} €/L · ${budgetReference.at}`:`Prix saisi · ${$("fuel").value} · ${fmt(price,3)} €/L`):"Prix de référence non renseigné ou invalide. Aucun prix moyen supposé.";
}
function navigationLinks(){
  if(!trip||!["car","walk"].includes(trip.routing.vehicle.type))return null;
  const google=new URL("https://www.google.com/maps/dir/");
  google.search=new URLSearchParams({api:"1",origin:trip.a.join(","),destination:trip.b.join(","),travelmode:trip.routing.vehicle.type==="walk"?"walking":"driving"}).toString();
  const steps=routePlanNodes(selectedStop?.station).slice(1,-1);if(steps.length)google.searchParams.set("waypoints",steps.map(n=>n.point.join(",")).join("|"));
  if(trip.routing.avoid.length)google.searchParams.set("avoid",trip.routing.avoid.map(v=>v==="tollways"?"tolls":v).join(","));
  const waze=point=>{
    const url=new URL("https://www.waze.com/ul");
    url.search=new URLSearchParams({ll:point.join(","),navigate:"yes",utm_source:"dragonroute",vehicle_type:"private"}).toString();
    for(const rule of trip.routing.avoid)url.searchParams.set({tollways:"avoid_tolls",highways:"avoid_freeways",ferries:"avoid_ferries"}[rule],"true");
    return url.href;
  };
  return {pickup:trip.meetings?waze([trip.meetings.pickup.lat,trip.meetings.pickup.lon]):null,dropoff:trip.meetings?waze([trip.meetings.dropoff.lat,trip.meetings.dropoff.lon]):null,google:google.href,arrival:trip.routing.vehicle.type==="walk"?null:waze(trip.b),station:selectedStop?waze([selectedStop.station.lat,selectedStop.station.lon]):null};
}
function clearNavigation(){
  $("navigationDialog").close();
  for(const id of ["googleMapsLink","wazeStationLink","wazeArrivalLink","wazePickupLink","wazeDropoffLink"])$(id).removeAttribute("href");
  $("navigationSummary").textContent="";$("navigationOptimizationNote").textContent="";$("navigationMessage").textContent="";
}
function openNavigation(){
  if(busy||!trip)return;
  const r=selectedStop?.via||trip.base,links=navigationLinks();
  $("navigationSummary").textContent=`${trip.places.start} → ${trip.places.end}${selectedStop?" · arrêt : "+selectedStop.station.address:""} · ${fmt(r.distance/1000,1)} km · ${Math.round(r.duration/60)} min, hors temps des arrêts.`;
  if(trip.meetings)$("navigationSummary").textContent+=" Ordre : "+$("meetingOrder").textContent;
  $("navigationCarLinks").hidden=!links;$("navigationVehicleNote").hidden=Boolean(links);
  for(const [id,url] of [["wazePickupLink",links?.pickup],["wazeDropoffLink",links?.dropoff],["googleMapsLink",links?.google],["wazeArrivalLink",links?.arrival],["wazeStationLink",links?.station]]){
    if(url)$(id).href=url;else $(id).removeAttribute("href");
  }
  $("wazeStationLink").hidden=!links?.station;$("wazePickupLink").hidden=!links?.pickup;$("wazeDropoffLink").hidden=!links?.dropoff;
  $('navigationWaze').hidden=trip.routing.vehicle.type==='walk';
  $('googleMapsNote').textContent=trip.routing.vehicle.type==='walk'?'Reçoit le départ, l’arrivée et le mode à pied. Google Maps recalcule son propre trajet : le tracé, la limite personnelle et l’accessibilité ne sont pas transmis.':'Reçoit le départ, l’arrivée et les étapes dans l’ordre indiqué (rencontres et station, au maximum trois). Le parcours est recalculé : vérifier que chaque étape est conservée.';
  $("navigationAvoidNote").textContent=trip.routing.vehicle.type==="walk"?"Mode à pied demandé. Vérifier le parcours proposé et les conditions sur place.":trip.routing.avoid.length?`Préférences transmises : éviter ${trip.routing.avoid.map(v=>avoidLabels[v]).join(", ")}. Ce sont des demandes au service externe, pas une garantie de les exclure.`:"Aucun évitement demandé ici. Vérifier les préférences de l’application externe.";
  $("navigationOptimizationNote").textContent=optimizationLabel(trip.routing.optimization)+". Les liens Google Maps et Waze ne transmettent pas ce critère : vérifier leur nouveau parcours. Le fichier GPX conserve le tracé et décrit le critère, sans imposer de réglage à l’application destinataire.";$("navigationMessage").textContent="";$("navigationDialog").showModal();
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
  const labels={start:'Départ : '+trip.places.start,end:'Arrivée : '+trip.places.end,pickup:'Prise en charge : '+trip.meetings?.pickup.label,dropoff:'Dépose : '+trip.meetings?.dropoff.label,station:'Arrêt carburant : '+selectedStop?.station.address};
  const waypoints=routePlanNodes(selectedStop?.station).map(n=>({coords:[n.point[1],n.point[0]],name:labels[n.kind]}));
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
  clearComparison();
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
  clearComparison();
  clearNavigation();
  trip=null;meetingProposal=null;mapView=null;clearStations();
  renderRouteChoices();
  $("summary").hidden=true;$("stops").hidden=true;
  $("resolvedPlaces").hidden=true;
  $("tripKm").textContent="—";$("tripTime").textContent="—";
  for(const id of ["routeLine","routeGlow"])$(id).setAttribute("d","");
  $("alternativeRoutes").replaceChildren();$("routeAlternativesNote").hidden=true;
  $("appliedRouting").hidden=true;$("routingAttribution").textContent="OSRM / IGN / OpenRouteService";
  $("stationDots").replaceChildren();$("meetingDots").replaceChildren();
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
function displayTrip(base,routing,a,b,ga,gb){
    const coords=base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
    const label=`${ga.label.split(",")[0]} → ${gb.label.split(",")[0]}`;
    const choices=[base,...base.alternatives];
    const endpoints=JSON.stringify([a,b]);if(routing.vehicle.type==='walk'||meetingEndpoints&&meetingEndpoints!==endpoints)clearMeetingDraft();meetingEndpoints=endpoints;meetingProposal=null;
    trip={a,b,base,coords,label,routing,choices,choice:0,places:{start:ga.label,end:gb.label},calculatedAt:new Date().toISOString()};renderRouteChoices();
    $("resolvedPlaces").textContent=`Départ : ${ga.label}. Arrivée : ${gb.label}.`;
    $("resolvedPlaces").hidden=false;
    $("appliedRouting").textContent=routingLabel(routing);$("appliedRouting").hidden=false;
    $("routingAttribution").innerHTML=routing.provider==="ors"?'<a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">© openrouteservice.org by HeiGIT</a> · © OpenStreetMap contributors':routing.provider==="ign"?'<a href="https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/" target="_blank" rel="noopener noreferrer">IGN · BD TOPO · Licence Ouverte 2.0</a>':"OSRM";
    if(routing.provider==="ign"&&typeof base.resourceVersion==="string")$("routingAttribution").append(document.createTextNode(" · données "+base.resourceVersion));
    showOnMap(coords,[],null,a,b,label);
    $("tripKm").textContent=`${fmt(base.distance/1000,1)} km`;
    $("tripTime").textContent=`${Math.round(base.duration/60)} min`;
    $("summary").hidden=false;$("stops").hidden=routing.vehicle.type==="walk";
    if(routing.vehicle.type!=='walk'){
      $("stopKm").max=String(Math.max(5,Math.ceil(base.distance/1000/5)*5));
      $("stopKm").value=String(Math.min(Number($("stopKm").value),Number($("stopKm").max)));
    }
    updateWindow();$("rideTrip").textContent=label;
    setStatus(routing.vehicle.type==="walk"?"Trajet prêt · à pied. Vérifier la distance et les conditions du parcours.":"Trajet prêt. Choisis maintenant tes arrêts.","ok");
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
    displayTrip(base,routing,a,b,ga,gb);
  }catch(e){
    dbg(e.stack||e.message);setStatus(`⚠️ ${e.message}`,"err");$("diagWrap").open=true;
  }finally{lock(false);activeAbort=null}
}
async function searchStations(){
  if(busy||!trip||trip.routing.vehicle.type==='walk')return;
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
    if(trip.routing.provider!=="osrm"||trip.meetings)({scored,note}=await scoreConstrainedCandidates(cands,liters,cons));
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
  if(busy||!trip||trip.routing.vehicle.type==='walk')return;
  const station=compared.find(s=>s.id===id);if(!station)return;
  const range=rangeEstimate();
  if(range?.valid&&station.distanceFromStart>range.useful&&!confirm("Cette station est hors de la portée estimée avec la réserve choisie. Conserver néanmoins cet arrêt dans la préparation du trajet ?"))return;
  if((station.via||trip.choice>0)&&!confirm(`Ajouter cet arrêt ? Le trajet sera recalculé via la station et peut changer de routes. ${routingLabel(trip.routing)}.${station.via?` Total : ${fmt(station.via.distance/1000,1)} km, ${Math.round(station.via.duration/60)} min, hors temps du plein.`:""}`))return;
  lock(true);$("fuelStatus").textContent="Vérification du trajet avec cet arrêt…";
  try{
    const via=station.via||await route(routePlanNodes(station).map(n=>n.point));
    if(trip.meetings){meetingLegs(via,routePlanNodes(station));if(!meetingDetour(via,trip.meetings.reference.base,trip.meetings.limits).allowed)throw new Error("Limite totale de détour des rencontres dépassée.");}
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
  const preview=document.body.dataset.preview==="true";
  const network=()=>{
    const offline=navigator.onLine===false;
    $("connectionNotice").hidden=!offline;
    $("connectionNotice").textContent="Connexion signalée indisponible. Mes trajets, Mon profil et Mon journal restent consultables. Nouveaux calculs, prix et fonds de carte nécessitent le réseau.";
    $("networkStatus").textContent=offline?"Le navigateur signale une absence de connexion.":"Le navigateur signale une connexion. La disponibilité de chaque service reste à vérifier lors de son utilisation.";
  };
  network();window.addEventListener("online",network);window.addEventListener("offline",network);
  if(preview){$("pwaStatus").textContent="Version d’essai : installation et préparation au redémarrage hors ligne désactivées. Les données locales restent consultables tant que cette page est chargée.";$("installHelp").hidden=true;return}
  if(!("serviceWorker" in navigator)||!window.isSecureContext){$("pwaStatus").textContent="Préparation hors ligne indisponible dans ce navigateur ou à cette adresse. La page déjà chargée reste utilisable pour consulter les données locales.";return}
  const ready=()=>{$("pwaStatus").textContent="Interface préparée pour une réouverture hors ligne dans ce navigateur, tant que ses données sont conservées. Cartes et services en ligne non enregistrés."};
  navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"}).then(registration=>{
    const showUpdate=()=>{
      $("pwaUpdateNotice").hidden=registration.waiting?.state!=="installed";
      if(!$("pwaUpdateNotice").hidden){$("pwaUpdateNotice").textContent="Nouvelle version prête. Enregistrer les préparations utiles, puis fermer toutes les fenêtres de cette application et la rouvrir. Aucun rechargement imposé ; les données enregistrées sont conservées.";}
    };
    const watch=worker=>{if(!worker)return;const changed=()=>{if(worker.state==="activated")ready();if(worker.state==="installed")setTimeout(showUpdate,0);if(worker.state==="redundant"){setTimeout(showUpdate,0);$("pwaStatus").textContent=registration.active?"Préparation de la nouvelle version interrompue. La version déjà installée reste disponible ; réessayer la vérification plus tard.":"L’interface n’a pas pu être préparée pour une réouverture hors ligne. Réessayer avec une connexion disponible."}};worker.addEventListener("statechange",changed);changed()};
    if(registration.active)ready();else $("pwaStatus").textContent="Préparation de l’interface en cours. Garder cette page ouverte jusqu’à confirmation avant de compter sur une réouverture hors ligne.";
    const observe=()=>{watch(registration.installing);registration.addEventListener("updatefound",()=>watch(registration.installing))};
    showUpdate();observe();
    $("checkUpdateBtn").hidden=false;
    $("checkUpdateBtn").addEventListener("click",async()=>{
      if(busy){$("pwaStatus").textContent="Attendre la fin de l’opération en cours avant de vérifier les mises à jour.";return}
      $("checkUpdateBtn").disabled=true;
      try{if(!registration.active&&!registration.waiting&&!registration.installing){registration=await navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"});observe()}else await registration.update();showUpdate();if(registration.active&&!registration.waiting&&!registration.installing)$("pwaStatus").textContent="Vérification terminée : aucune nouvelle version détectée. La disponibilité des services de trajet reste indépendante."}
      catch(e){$("pwaStatus").textContent="Vérification impossible. La version et les données déjà enregistrées restent conservées. Réessayer avec une connexion disponible.";dbg("Mise à jour",e.message)}
      finally{$("checkUpdateBtn").disabled=false}
    });
  }).catch(e=>{$("pwaStatus").textContent="L’interface n’a pas pu être préparée pour une réouverture hors ligne. Les données locales de la page chargée restent consultables.";dbg("SW",e.message)});
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false});
  window.addEventListener("appinstalled",()=>{deferredInstall=null;$("installBtn").hidden=true;$("installHelp").textContent="Installation signalée par le navigateur. L’accès hors ligne dépend de la préparation de l’interface indiquée ci-dessus."});
  $("installBtn").addEventListener("click",async()=>{
    if(!deferredInstall)return;const prompt=deferredInstall;deferredInstall=null;$("installBtn").hidden=true;
    try{await prompt.prompt();const choice=await prompt.userChoice;$("installHelp").textContent=choice.outcome==="accepted"?"Installation demandée. Attendre la confirmation du navigateur.":"Installation non demandée. L’application reste accessible dans le navigateur."}
    catch(e){$("installHelp").textContent="Installation non proposée pour le moment. Consulter le menu du navigateur."}
  });
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
    e.preventDefault();if(busy)return;
    try{
      const dimensions=vehicleFormDimensions(),next=structuredClone(profile);
      const vehicle={id:vehicleDraftId||crypto.randomUUID(),...validateVehicle({name:$('vehicleName').value.trim(),type:$('vehicleType').value,fuel:$('vehicleFuel').value,cons:Number($('vehicleCons').value),liters:Number($('vehicleLiters').value),...(dimensions?{dimensions}:{})})};
      const duplicates=duplicateVehicles(vehicle,next.vehicles);
      if(duplicates.length&&!$('allowVehicleDuplicate').checked){$('vehicleDuplicates').hidden=false;$('vehicleDuplicateNote').textContent='Ce nom existe déjà. Les véhicules resteront distincts ; aucun ne sera remplacé.';$('allowVehicleDuplicate').focus();return}
      const index=next.vehicles.findIndex(v=>v.id===vehicle.id);if(index<0)next.vehicles.push(vehicle);else next.vehicles[index]=vehicle;
      next.activeVehicleId=vehicle.id;
      if(saveProfile(next)){$('travelMode').value='car';applyVehicle();editVehicle(vehicle.id);$('profileMessage').textContent='Véhicule enregistré et choisi. Paramètres appliqués, trajet à recalculer.'}
    }catch(err){$('profileMessage').textContent='Enregistrement impossible : '+err.message}
  });
  $("saveTruckDimensions").addEventListener("click",()=>{
    try{showVehicleDimensions(routeDimensions());resetVehicleDuplicate();$('profileMessage').textContent='Gabarit repris dans le formulaire. Enregistrer le véhicule pour le conserver.'}
    catch(e){$("profileMessage").textContent=e.message}
  });
  $('newVehicleBtn').addEventListener('click',()=>{editVehicle();$('vehicleName').focus();$('profileMessage').textContent='Nouveau véhicule. Les autres restent conservés.'});
  $('clearVehicleDimensions').addEventListener('click',()=>{showVehicleDimensions();resetVehicleDuplicate()});
  $('vehicleForm').addEventListener('input',e=>{if(e.target.id!=='allowVehicleDuplicate')resetVehicleDuplicate()});
  $('savedVehicleSelect').addEventListener('change',e=>useSavedVehicle(e.target.value));
  $('savedVehicles').addEventListener('click',e=>{
    if(busy)return;const b=e.target.closest('button');if(!b)return;
    if(b.dataset.vehicleUse){useSavedVehicle(b.dataset.vehicleUse);editVehicle(profile.activeVehicleId)}
    if(b.dataset.vehicleEdit){editVehicle(b.dataset.vehicleEdit);$('vehicleName').focus()}
    if(b.dataset.vehicleRemove){
      const id=b.dataset.vehicleRemove,v=profile.vehicles.find(v=>v.id===id);if(!v)return;
      const active=id===profile.activeVehicleId;
      if(!confirm(`Supprimer « ${v.name||'Sans nom'} » ?${active?' Les réglages ponctuels par défaut remplaceront ce véhicule et le trajet sera à recalculer.':''} Les préparations et le journal restent conservés.`))return;
      const next=structuredClone(profile);next.vehicles=next.vehicles.filter(v=>v.id!==id);if(active)next.activeVehicleId=null;
      if(saveProfile(next)){if(active)applyVehicle();if(vehicleDraftId===id)editVehicle(profile.activeVehicleId);$('profileMessage').textContent='Véhicule supprimé. Aucun autre véhicule sélectionné automatiquement.'}
    }
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
  for(const [id,version] of [['exportLegacyProfileBtn',1],['exportV2ProfileBtn',2]])$(id).addEventListener('click',()=>{const original=legacyProfiles.find(p=>p.version===version);if(original)downloadProfile(original,`DragonRoute-profil-origine-v${version}.json`)});
  $('importProfileBtn').addEventListener('click',()=>$('importProfileFile').click());
  $('exportBeforeImport').addEventListener('click',()=>{if(!profileWriteBlocked)downloadProfile(profile)});
  $('cancelProfileImport').addEventListener('click',()=>{pendingProfileImport=null;profileImportSequence++;$('profileImportDialog').close()});
  $('profileImportDialog').addEventListener('cancel',()=>{pendingProfileImport=null;profileImportSequence++});
  $('profileImportDialog').addEventListener('close',()=>{if($('profileImportDialog').open)return;pendingProfileImport=null;if($('profileDialog').open)$('importProfileBtn').focus()});
  $('importProfileFile').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;const seq=++profileImportSequence;addressLookupSequence++;$('resolveAddressBtn').disabled=false;
    try{
      if(file.size>100000)throw new Error('Fichier trop volumineux');
      const next=validateProfile(JSON.parse(await file.text()));
      if(seq!==profileImportSequence||!$('profileDialog').open)return;
      if(profileWriteBlocked)throw new Error('Le profil existant n’a pas pu être chargé. Son remplacement est bloqué.');
      pendingProfileImport=next;
      const duplicates=duplicateAddressCount(next.addresses),located=next.addresses.filter(a=>a.place).length;
      const active=next.vehicles.find(v=>v.id===next.activeVehicleId),vehicleDuplicates=next.vehicles.reduce((n,v,i)=>n+duplicateVehicles(v,next.vehicles.slice(0,i)).length,0);
      $('profileImportSummary').textContent=`${next.addresses.length} adresse(s), dont ${located} avec un lieu mémorisé ; ${next.stations.length} station(s) favorite(s). ${next.vehicles.length} véhicule(s), actif au démarrage : ${active?vehicleLabel(active):'aucun, réglages ponctuels'}. ${vehicleDuplicates} nom(s) de véhicules répété(s), conservés distincts. ${duplicates?duplicates+' doublon(s) possible(s) dans les adresses.':'Aucun doublon apparent dans les adresses.'}`;
      $('profileImportCurrent').textContent=`Le profil actuel contient ${profile.vehicles.length} véhicule(s), ${profile.addresses.length} adresse(s) et ${profile.stations.length} station(s). Il sera remplacé après confirmation.`;
      $('profileImportVehicles').replaceChildren(...next.vehicles.map(v=>{const li=document.createElement('li');li.textContent=vehicleLabel(v)+` · ${v.cons} L/100 km, ${v.liters} L à acheter par défaut`+(v.dimensions?' · '+dimensionLabel(v.dimensions):' · Gabarit inconnu')+(v.id===next.activeVehicleId?' · Actif':'');return li}));
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
    if(!confirm('Effacer les véhicules, les adresses et les stations de ce profil local, ainsi que ses copies d’origine ? Le journal, les préparations, les autres applications et aperçus seront conservés.'))return;
    try{
      if(!profileUnchanged())throw new Error('Profil modifié dans un autre onglet. Recharger avant de réessayer.');
      for(const {key} of [...PROFILE_SOURCES].reverse())localStorage.removeItem(key);
      loadProfile();resetRememberedInputs();applyVehicle();resetAddressForm();openProfile();$('profileMessage').textContent='Profil local effacé.';
    }catch(e){loadProfile();resetRememberedInputs();applyVehicle();resetAddressForm();openProfile();$('profileMessage').textContent='Suppression non terminée : '+e.message+'. Vérifier les données restantes avant de réessayer.'}
  });
}
function bind(){
  $('routeOptimization').addEventListener('change',()=>{if(!busy){invalidateRouting();updateResumePreparation()}});
  for(const id of ['fuel','cons','liters','routeVehicle',...Object.values(dimensionFields)])$(id).addEventListener('input',()=>{if(!busy)detachTripVehicle()});
  $('travelMode').addEventListener('change',()=>{if(busy)return;resumePreparation=null;preparedRangePending=false;invalidateRouting();setStatus(isWalking()?(C.ignRouting===true?'Mode à pied choisi. Calculer un nouveau trajet.':'Calcul à pied indisponible : service IGN non activé.'):'Mode véhicule choisi. Options conservées ; calculer un nouveau trajet.')});
  $('maxWalkKm').addEventListener('input',updateWalking);
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
  $("tariffPassageConfirmed").addEventListener('change',updateBudget);
  for(const id of ['tariffClass','tariffDate'])$(id).addEventListener('input',()=>{$("tariffPassageConfirmed").checked=false;if(tableTolls.segments.length)clearTableTolls('Classe ou date modifiée : sélectionner à nouveau les tronçons.');updateBudget()});
  $("tariffComplete").addEventListener('change',updateBudget);
  $("tariffClear").addEventListener('click',()=>{clearTableTolls('Tronçons retirés.');updateBudget()});
  $("tariffAdd").addEventListener('click',()=>{
   const c=tariffCandidate();if(busy||!trip||trip.routing.vehicle.type==='walk'||!c||(c.kind==='passage'&&!$("tariffPassageConfirmed").checked)||(tollGuide.suggested&&!$("tariffGateConfirmed").checked)||tableTolls.segments.length>=10||tariffDuplicate(c))return;
   resetTollQuote();tollState.enabled=false;tableTolls.segments.push(c);$("tariffComplete").checked=false;tableTolls.notice='Tronçon ajouté au budget. Jusqu’à dix tronçons, sans doublon identique. Vérifier les éventuels chevauchements.';updateBudget();
  });
  tariffGates(true);
  setInterval(()=>{if(tableTolls.segments.length&&!tariffBudgetValid())updateBudget()},60000);
  $("navigationBtn").addEventListener("click",openNavigation);
  $("exportGpxBtn").addEventListener("click",exportGpx);
  $("navigationDialog").addEventListener("close",()=>{if(!$("navigationDialog").open)for(const id of ["googleMapsLink","wazeStationLink","wazeArrivalLink","wazePickupLink","wazeDropoffLink"])$(id).removeAttribute("href")});
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

loadPreparedTrips();makeGrid();bind();bindProfile();bindJournal();bindPreparedTrips();bindRides();bindMeetings();bindComparison();bindProspective();applyVehicle();updateRange();initPwa();
$("stationDeparture").value=parisLocal(Date.now());refreshArrival();
health("hJS","ok","JS ✓");
setStatus("Moteur chargé. Prêt pour un trajet réel.","ok");
initMap();
window.addEventListener("unhandledrejection",e=>dbg("Unhandled",e.reason?.message||String(e.reason)));
})();
