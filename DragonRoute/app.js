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
const JOURNAL_MODES={car:'Voiture',truck:'Poids lourd',train:'Train',bus:'Bus / car',bike:'Vélo',walk:'Marche',other:'Autre'};
function journalDay(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
function journalDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||!Number.isFinite(Date.parse(value+'T12:00:00Z'))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)throw new Error('Date invalide.');return value}
function journalText(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Texte du journal invalide.');return value.trim()}
function journalNumber(value,max){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max)throw new Error('Distance invalide.');return value}
function journalInstant(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw new Error('Horodatage invalide.');return value}
function journalIdentity(e){const norm=s=>s.trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR');return JSON.stringify([e.date,e.mode,norm(e.start),norm(e.end),e.distanceMeters])}
function emptyJournal(){return {version:1,enabled:false,entries:[]}}
function validateJournal(data){
 if(!data||data.version!==1||typeof data.enabled!=='boolean'||!Array.isArray(data.entries)||data.entries.length>1000)throw new Error('Format ou capacité du journal invalide.');
 const entries=data.entries.map(e=>{
  if(!e||!Object.hasOwn(JOURNAL_MODES,e.mode)||!['route','declared','unknown'].includes(e.distanceSource)||!Number.isSafeInteger(e.revision)||e.revision<1||e.revision>100000)throw new Error('Entrée de journal invalide.');
  const clean={id:journalText(e.id,80,true),date:journalDate(e.date),start:journalText(e.start,1000,true),end:journalText(e.end,1000,true),mode:e.mode,distanceMeters:e.distanceMeters===null?null:journalNumber(e.distanceMeters,40000000),distanceSource:e.distanceSource,note:journalText(e.note,500),createdAt:journalInstant(e.createdAt),updatedAt:journalInstant(e.updatedAt),revision:e.revision,calculation:null,emissions:{version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null}};
  if(!/^[A-Za-z0-9-]+$/.test(clean.id)||clean.updatedAt<clean.createdAt||(clean.distanceMeters===null)!==(clean.distanceSource==='unknown'))throw new Error('Entrée incohérente.');
  if(e.calculation!==null){const c=e.calculation;if(!c||c.version!=='route-snapshot-v1'||!['car','truck'].includes(c.mode)||!['ign','osrm','ors'].includes(c.engine))throw new Error('Calcul historique inconnu.');clean.calculation={version:c.version,engine:c.engine,start:journalText(c.start,1000,true),end:journalText(c.end,1000,true),resourceVersion:c.resourceVersion===null?null:journalText(c.resourceVersion,150,true),calculatedAt:journalInstant(c.calculatedAt),mode:c.mode,distanceMeters:journalNumber(c.distanceMeters,40000000),stop:c.stop===null?null:journalText(c.stop,500,true)}}
  if(clean.distanceSource==='route'&&(!clean.calculation||clean.distanceMeters!==clean.calculation.distanceMeters||clean.mode!==clean.calculation.mode||clean.start!==clean.calculation.start||clean.end!==clean.calculation.end))throw new Error('Distance incohérente avec le calcul.');
  if(!e.emissions||e.emissions.version!=='unavailable-v1'||e.emissions.status!=='unavailable'||e.emissions.valueKg!==null||e.emissions.factor!==null)throw new Error('Version de calcul carbone non reconnue.');
  return clean;
 });
 if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('Identifiants de journal dupliqués.');
 const clean={version:1,enabled:data.enabled,entries};if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('Journal trop volumineux : exporter avant de libérer de la place.');return clean;
}
function journalMonthly(entries,month){
 const rows=entries.filter(e=>e.date.slice(0,7)===month),modes={};
 for(const e of rows){const m=modes[e.mode]??={count:0,meters:0,unknown:0};m.count++;if(e.distanceMeters===null)m.unknown++;else m.meters+=e.distanceMeters}
 return {count:rows.length,meters:rows.reduce((s,e)=>s+(e.distanceMeters??0),0),unknown:rows.filter(e=>e.distanceMeters===null).length,carbonUnknown:rows.length,modes};
}
// END JOURNAL MODEL
const JOURNAL_KEY='dragonroute.journal.v1.'+PROFILE_SCOPE;
let journal=emptyJournal(),journalSnapshot=null,journalBlocked=false,journalNotice='',journalDraft=null;
function loadJournal(){
 journal=emptyJournal();journalBlocked=false;journalNotice='';
 try{journalSnapshot=localStorage.getItem(JOURNAL_KEY);if(journalSnapshot!==null)journal=validateJournal(JSON.parse(journalSnapshot))}
 catch{journalBlocked=true;journalNotice='Journal non chargé : format inconnu, données invalides ou stockage inaccessible. L’original est conservé. Recharger avec une version compatible ou effacer explicitement le journal.'}
}
function writeJournal(next){
 try{
  if(journalBlocked)throw new Error('Journal non chargé : écriture bloquée.');
  if(localStorage.getItem(JOURNAL_KEY)!==journalSnapshot)throw new Error('Journal modifié dans un autre onglet. Recharger avant de réessayer.');
  const clean=validateJournal(next),raw=JSON.stringify(clean);localStorage.setItem(JOURNAL_KEY,raw);journalSnapshot=raw;journal=clean;journalNotice='';return true;
 }catch(e){$('journalMessage').textContent='Enregistrement impossible. '+(journalBlocked||e.message.includes('autre onglet')||e.message.includes('volumineux')?e.message:'Stockage indisponible, plein ou données invalides. Le formulaire et les données précédentes sont conservés.');return false}
}
function renderJournal(){
 $('journalEnable').checked=journal.enabled;$('journalEnable').disabled=journalBlocked;
 $('journalNew').disabled=!journal.enabled||journalBlocked;$('journalCopy').disabled=!journal.enabled||journalBlocked||!trip||busy;
 $('journalExport').disabled=journalBlocked;
 $('journalState').textContent=journal.enabled?'Journal activé. Chaque ajout reste volontaire.':'Journal désactivé. Les entrées déjà enregistrées restent consultables et exportables.';
 const month=$('journalMonth').value;if(!/^\d{4}-\d{2}$/.test(month)){$('journalSummary').textContent='Choisir un mois valide.';$('journalModes').replaceChildren();$('journalEntries').replaceChildren();return}
 const total=journalMonthly(journal.entries,month),km=n=>fmt(n/1000,2)+' km';
 $('journalSummary').textContent=`${total.count} trajet(s) confirmé(s) · ${km(total.meters)} renseignés${total.unknown?` · bilan partiel : ${total.unknown} distance(s) non renseignée(s)`:''}. ${total.count?'CO₂e non estimé : aucun facteur qualifié disponible pour ces entrées.':'Aucun déplacement confirmé ce mois-ci.'}`;
 $('journalModes').replaceChildren();for(const [mode,m] of Object.entries(total.modes)){const li=document.createElement('li');li.textContent=`${JOURNAL_MODES[mode]} : ${m.count} trajet(s), ${km(m.meters)} renseignés${m.unknown?`, ${m.unknown} distance(s) manquante(s)`:''}. CO₂e non estimé.`;$('journalModes').append(li)}
 $('journalEntries').innerHTML=journal.entries.filter(e=>e.date.slice(0,7)===month).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id)).map(e=>`<article class="saved-row"><h3>${escapeHtml(e.start)} → ${escapeHtml(e.end)}</h3><p>${escapeHtml(e.date.split('-').reverse().join('/'))} · ${JOURNAL_MODES[e.mode]} · ${e.distanceMeters===null?'Distance non renseignée':km(e.distanceMeters)}</p><p>${e.distanceSource==='route'?'Distance issue du trajet préparé, confirmée par la personne':e.distanceSource==='declared'?'Distance déclarée par la personne':'Distance à compléter'} · CO₂e non estimé.</p>${e.note?`<p>${escapeHtml(e.note)}</p>`:''}<details><summary>Provenance et révision</summary><p>Confirmé le ${escapeHtml(new Date(e.createdAt).toLocaleString('fr-FR'))}. Révision ${e.revision}, mise à jour ${escapeHtml(new Date(e.updatedAt).toLocaleString('fr-FR'))}.</p><p>${e.calculation?`Calcul d’origine ${escapeHtml(e.calculation.start)} → ${escapeHtml(e.calculation.end)} · ${escapeHtml(e.calculation.engine.toUpperCase())} · ${escapeHtml(e.calculation.calculatedAt)} · ${km(e.calculation.distanceMeters)} · données ${escapeHtml(e.calculation.resourceVersion??'version non fournie')}${e.calculation.stop?' · arrêt '+escapeHtml(e.calculation.stop):''}. Ce calcul ne prouve pas le déplacement effectué.`:'Saisie manuelle, sans calcul d’itinéraire associé.'}</p><p>Empreinte non estimée : aucun facteur disponible. Les corrections conservent le calcul d’origine.</p></details><div class="dialog-actions"><button class="ghost" data-journal-edit="${e.id}" ${!journal.enabled?'disabled':''}>Modifier</button><button class="ghost" data-journal-delete="${e.id}">Supprimer</button></div></article>`).join('')||'<p class="note">Aucun trajet dans ce mois.</p>';
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
  const next={...journal,entries:d.editing?journal.entries.map(x=>x.id===e.id?e:x):[...journal.entries,e]};validateJournal(next);
  if(writeJournal(next)){journalDraft=null;$('journalEditor').hidden=true;$('journalMonth').value=e.date.slice(0,7);renderJournal();$('journalMessage').textContent=d.editing?'Trajet corrigé. Bilan recalculé.':'Trajet effectué enregistré.';$('journalNew').focus()}
 }catch(e){$('journalMessage').textContent=e.message}
}
function bindJournal(){
 loadJournal();$('journalBtn').addEventListener('click',openJournal);
 $('journalRecordBtn').addEventListener('click',()=>{openJournal();if(journal.enabled)journalForm(null,true);else $('journalMessage').textContent='Activer volontairement le journal, puis reprendre le trajet affiché.'});
 $('journalEnable').addEventListener('change',()=>{if(writeJournal({...journal,enabled:$('journalEnable').checked})){journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent=journal.enabled?'Journal activé. Aucun trajet ajouté automatiquement.':'Journal désactivé. Les données restent conservées.'}else $('journalEnable').checked=journal.enabled});
 $('journalNew').addEventListener('click',()=>journalForm());$('journalCopy').addEventListener('click',()=>journalForm(null,true));
 $('journalMonth').addEventListener('change',renderJournal);$('journalForm').addEventListener('submit',saveJournalEntry);
 $('journalForm').addEventListener('input',e=>{if(e.target.id!=='journalRepeat'){$('journalRepeat').checked=false;$('journalDuplicate').hidden=true}});
 $('journalMode').addEventListener('change',()=>{if(journalDraft&&$('journalMode').value!==journalDraft.entry.mode){$('journalDistance').value='';$('journalOrigin').textContent='Mode modifié : renseigner la distance effectivement parcourue dans ce mode. Le calcul routier d’origine reste conservé comme référence.'}});
 $('journalCancel').addEventListener('click',()=>{journalDraft=null;$('journalEditor').hidden=true;$('journalNew').focus()});
 $('journalDialog').addEventListener('close',()=>{journalDraft=null;$('journalEditor').hidden=true});
 $('journalEntries').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const e=journal.entries.find(x=>x.id===(b.dataset.journalEdit||b.dataset.journalDelete));if(!e)return;if(b.dataset.journalEdit)journalForm(e);else if(confirm('Supprimer ce trajet confirmé ? Le bilan sera recalculé.')&&writeJournal({...journal,entries:journal.entries.filter(x=>x.id!==e.id)})){journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent='Trajet supprimé. Bilan recalculé.'}});
 $('journalExport').addEventListener('click',()=>{if(!journalBlocked)downloadProfile(journal,'DragonRoute-journal.json')});
 $('journalErase').addEventListener('click',()=>{
  if(!confirm('Effacer uniquement le journal de cet environnement ? Le profil et les autres aperçus seront conservés.'))return;
  try{if(localStorage.getItem(JOURNAL_KEY)!==journalSnapshot)throw new Error('Journal modifié dans un autre onglet : recharger avant de l’effacer.');localStorage.removeItem(JOURNAL_KEY);loadJournal();journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent='Journal effacé et désactivé.'}catch(e){$('journalMessage').textContent='Effacement impossible. '+e.message}
 });
}

function placeDescription(place){return `${place.label} · IGN · choix du ${new Date(place.resolvedAt).toLocaleDateString('fr-FR')}`}
function clearRememberedInput(field){rememberedInputs[field]=null;favoriteInputs[field]=null;$(field+'PlaceNote').hidden=true}
function resetRememberedInputs(){clearRememberedInput('start');clearRememberedInput('end')}
async function resolveTripPlace(value,field){
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
function stationInfo(r){
  return {hours:r.horaires??null,automate:r.horaires_automate_24_24??null,services:Array.isArray(r.services_service)?r.services_service.filter(s=>typeof s==="string").map(s=>s.trim()).filter(Boolean).slice(0,50):[],receivedAt:new Date().toISOString()};
}
function hoursRows(raw){
  try{
    const h=typeof raw==="string"?JSON.parse(raw):raw;
    const days=Array.isArray(h?.jour)?h.jour:h?.jour?[h.jour]:[];
    return days.slice(0,7).map(day=>{
      const slots=Array.isArray(day.horaire)?day.horaire:day.horaire?[day.horaire]:[];
      const time=value=>typeof value==="string"&&/^(?:[01]?\d|2[0-3])[:h.][0-5]\d$|^24[:h.]00$/.test(value)?value.replace(/[h.]/,":"):null;
      const ranges=slots.map(slot=>[time(slot["@ouverture"]),time(slot["@fermeture"])]).filter(pair=>pair.every(Boolean)).map(pair=>pair.join(" – "));
      return `${typeof day["@nom"]==="string"?day["@nom"]:"Jour"} : ${day["@ferme"]==="1"?"fermé":ranges.length?ranges.join(", "):"non renseigné"}`;
    });
  }catch{return []}
}
function renderStationDetails(s){
  const rows=hoursRows(s.hours);
  $("stationTitle").textContent=s.city?`Station à ${s.city}`:"Station";
  $("stationDetails").innerHTML=`<p class="detail-address">${escapeHtml(s.address)}</p><p>${Number.isFinite(s.price)?`${escapeHtml(s.fuel)} : ${fmt(s.price,3)} €/L · ${escapeHtml(age(s.updated))}`:"Prix actuel non renseigné pour le carburant choisi."}</p>${Number.isFinite(s.distanceFromStart)?`<p>${fmt(s.distanceFromStart,1)} km depuis le départ · ${escapeHtml(stationRangeText(s.distanceFromStart))}</p>`:""}
    <section class="detail-section"><h3>Horaires déclarés</h3><p class="note">Automate 24 h/24 : ${["Oui","Non"].includes(s.automate)?s.automate:"non renseigné"}. Les horaires de la boutique peuvent différer.</p>${rows.length?`<ul>${rows.map(row=>`<li>${escapeHtml(row)}</li>`).join("")}</ul>`:"<p>Horaires non renseignés.</p>"}</section>
    <section class="detail-section"><h3>Services déclarés</h3>${s.services?.length?`<ul>${s.services.map(service=>`<li>${escapeHtml(service)}</li>`).join("")}</ul>`:"<p>Services non renseignés.</p>"}</section>
    <p class="note">Informations déclaratives, ouverture et disponibilité à confirmer sur place.${s.receivedAt?` Données reçues le ${escapeHtml(new Date(s.receivedAt).toLocaleString("fr-FR"))}.`:""}</p><a class="detail-source" href="https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/" target="_blank" rel="noopener noreferrer">Source : données officielles des carburants ↗</a>`;
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
    el.disabled=busy||!available;
    const label=el.closest('label').querySelector('.availability');
    if(label)label.textContent=available?"":"Indisponible";
  });
  $("avoidAvailability").textContent="";
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
    out.push({...s,distanceFromStart:d1/1000,extraKm,extraMin,purchase,detourFuelCost,real:purchase+detourFuelCost});
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
    scored.push({...station,via,distanceFromStart:via.legs[0].distance/1000,extraKm,extraMin,purchase,detourFuelCost,real:purchase+detourFuelCost});
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
  const excluded={detour:0,unknown:0,undeclared:0,range:0};
  const visible=stations.filter(s=>{
    if(s.extraKm>limits.km+1e-9||s.extraMin>limits.min+1e-9){excluded.detour++;return false}
    if(services.length&&!s.services.length){excluded.unknown++;return false}
    if(services.some(service=>!s.services.includes(service))){excluded.undeclared++;return false}
    if($("rangeOnly").checked&&range?.valid&&s.distanceFromStart>range.useful){excluded.range++;return false}
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
  const range=rangeEstimate(),{visible,excluded,error}=filterStations(stations);
  $("stationListControls").hidden=!stations.length;
  $("eligibleCount").textContent=String(visible.length);
  $("stationFilterStatus").hidden=false;
  const reasons=[excluded.detour?`${excluded.detour} au-delà du détour maximal`:"",excluded.unknown?`${excluded.unknown} aux services non renseignés`:"",excluded.undeclared?`${excluded.undeclared} sans tous les services requis déclarés`:"",excluded.range?`${excluded.range} hors portée estimée`:""].filter(Boolean);
  const baseText=error||`${visible.length} sur ${stations.length} stations comparées satisfont les filtres.${reasons.length?" Écartées : "+reasons.join(" ; ")+".":""}`;
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
  $("stationDots").innerHTML=stations.map(s=>{const [x,y]=P([s.lat,s.lon]);const cl=s.id===best?.id?"station-best":"station-dot";return `<g class="svg-station" role="button" tabindex="0" data-details="${escapeHtml(s.id)}" aria-label="Voir la station ${s.number} : ${escapeHtml(s.address)}"><circle class="${cl}" cx="${x}" cy="${y}" r="16"/><text x="${x}" y="${y+5}" text-anchor="middle">${s.number}</text></g>`}).join("");
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
    const marker=L.marker([s.lat,s.lon],{icon:L.divIcon({className:"station-marker"+(isBest?" chosen":""),html:String(s.number),iconSize:[32,32],iconAnchor:[16,16]}),title:`Voir la station ${s.number} : ${s.address}`,keyboard:true}).addTo(markerLayer);
    marker.getElement().setAttribute("aria-label",`Voir la station ${s.number} : ${s.address}`);
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
  $("rangeStatus").textContent=!range?"Autonomie inconnue. Distances depuis le départ, sans suivi en temps réel.":!range.valid?"Renseigner une autonomie et une réserve valides.":`${fmt(range.total,1)} km théoriques − ${fmt(range.reserve,0)} km de réserve : ${fmt(range.useful,1)} km utiles estimés depuis le départ. Saisie à ${new Date(rangeMeasuredAt||Date.now()).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}. Aucun suivi du carburant ni garantie d’accès ou d’ouverture.`;
  if(compared.length)renderStations(compared,stopWindow().mode);
}
function resetRange(){
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
  $("journalRecordBtn").hidden=!trip;
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
  compared=[];stationSearch=null;
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
  $("profileBtn").disabled=value;
  document.querySelectorAll('#sheet input,#sheet select,#sheet button').forEach(el=>el.disabled=value);
  if(!value){updateVehicleRouting();updateRange();updateBudget()}
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
  for(const id of ["maxDetourKm","maxDetourMin","serviceChoices"]){$(id).addEventListener("input",()=>{if(!busy&&stationSearch)renderStations(compared,stopWindow().mode)})}
  $("resetStationFilters").addEventListener("click",()=>{
    if(busy)return;
    $("maxDetourKm").value="";$("maxDetourMin").value="";$("rangeOnly").checked=false;
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

makeGrid();bind();bindProfile();bindJournal();applyVehicle();updateRange();initPwa();
health("hJS","ok","JS ✓");
setStatus("Moteur chargé. Prêt pour un trajet réel.","ok");
initMap();
window.addEventListener("unhandledrejection",e=>dbg("Unhandled",e.reason?.message||String(e.reason)));
})();
