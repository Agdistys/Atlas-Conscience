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
const PROFILE_KEY="dragonroute.profile.v1."+(document.body.dataset.preview==="true"?"preview:"+new URL('.',location.href).pathname:"public");
let profile=emptyProfile(),storageNotice="";
try{const raw=localStorage.getItem(PROFILE_KEY);if(raw)profile=validateProfile(JSON.parse(raw))}
catch{storageNotice="Profil non chargé : stockage indisponible ou données invalides. Les réglages par défaut sont utilisés."}

function emptyProfile(){return {version:1,vehicle:{name:"",type:"car",fuel:"E10",cons:6.2,liters:40},addresses:[],stations:[]}}
function validateProfile(data){
  const text=(value,max)=>{if(typeof value!=="string"||value.length>max)throw new Error("Texte de profil invalide");return value.trim()};
  const number=(value,min,max)=>{if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new Error("Valeur de profil invalide");return value};
  if(!data||data.version!==1||!data.vehicle||!Array.isArray(data.addresses)||!Array.isArray(data.stations)||data.addresses.length>50||data.stations.length>100)throw new Error("Format de profil invalide");
  const v=data.vehicle;
  if(!["car","caravan","van","truck"].includes(v.type)||!Object.hasOwn(fuelField,v.fuel))throw new Error("Véhicule invalide");
  const addresses=data.addresses.map(a=>({id:text(a.id,80),name:text(a.name,80),value:text(a.value,250)}));
  const stations=data.stations.map(s=>({id:text(s.id,80),address:text(s.address,300),city:text(s.city,100),lat:number(s.lat,-90,90),lon:number(s.lon,-180,180)}));
  for(const list of [addresses,stations]){if(list.some(x=>!x.id)||new Set(list.map(x=>x.id)).size!==list.length)throw new Error("Identifiants invalides")}
  if(addresses.some(a=>!a.name||!a.value))throw new Error("Adresse incomplète");
  const dimensions=v.dimensions==null?undefined:validateDimensions(v.dimensions);
  return {version:1,vehicle:{name:text(v.name,80),type:v.type,fuel:v.fuel,cons:number(v.cons,1,100),liters:number(v.liters,1,2000),...(dimensions?{dimensions}:{})},addresses,stations};
}
function saveProfile(next){
  try{const clean=validateProfile(next);localStorage.setItem(PROFILE_KEY,JSON.stringify(clean));profile=clean;storageNotice="";renderSaved();updateFavorite();return true}
  catch{const message="Enregistrement impossible : stockage indisponible, plein ou données invalides.";$("profileMessage").textContent=message;$("stationMessage").textContent=message;return false}
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
  $("savedAddresses").innerHTML=profile.addresses.length?profile.addresses.map(a=>`<div class="saved-row"><strong>${escapeHtml(a.name)}</strong><p>${escapeHtml(a.value)}</p><div class="dialog-actions"><button class="ghost" data-address-start="${escapeHtml(a.id)}">Départ</button><button class="ghost" data-address-end="${escapeHtml(a.id)}">Arrivée</button><button class="ghost" data-address-edit="${escapeHtml(a.id)}">Modifier</button><button class="ghost" data-address-remove="${escapeHtml(a.id)}">Supprimer</button></div></div>`).join(""):"<p class=note>Aucune adresse enregistrée.</p>";
  $("savedStations").innerHTML=profile.stations.length?profile.stations.map(s=>`<div class="saved-row"><strong>${escapeHtml(s.city||"Station")}</strong><p>${escapeHtml(s.address)}</p><div class="dialog-actions"><button class="ghost" data-favorite-open="${escapeHtml(s.id)}">Voir la station</button><button class="ghost" data-favorite-remove="${escapeHtml(s.id)}">Retirer</button></div></div>`).join(""):"<p class=note>Aucune station enregistrée.</p>";
}
function openProfile(){
  if(busy)return;
  $("profileMessage").textContent=storageNotice;
  for(const [id,key] of [["vehicleName","name"],["vehicleType","type"],["vehicleFuel","fuel"],["vehicleCons","cons"],["vehicleLiters","liters"]])$(id).value=profile.vehicle[key];
  $("savedDimensionsNote").textContent=profile.vehicle.dimensions?"Gabarit mémorisé : "+dimensionLabel(profile.vehicle.dimensions):"Aucun gabarit mémorisé.";
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
  $("placeTitle").textContent=field==="start"?"Quel lieu de départ ?":"Quel lieu d’arrivée ?";
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
async function geocode(q,field){
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
    if(d?.type!=="FeatureCollection"||!Array.isArray(d.features))throw new Error("Réponse de géocodage invalide.");
    if(!d.features.length)throw new Error(`Lieu introuvable en France : ${query}. Préciser la commune ou le code postal.`);
    places=[...new Map(d.features.map(geocodedPlace).filter(Boolean).map(p=>[`${p.lat},${p.lon},${p.label}`,p])).values()].slice(0,5);
    if(!places.length)throw new Error("Réponse de géocodage invalide : aucun lieu exploitable.");
    geoCache.delete(key);
    if(geoCache.size>=30)geoCache.delete(geoCache.keys().next().value);
    geoCache.set(key,{at:performance.now(),places});
  }
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
 if(!tariffDateValid()&&tableTolls.segments.length)clearTableTolls('Grille hors période de consultation : budget retiré.');
 $("tariffFields").disabled=busy||!trip||!tariffData;
 $("tariffExit").disabled=$("tariffEntry").value==='';
 const c=tariffCandidate(),duplicate=c&&tableTolls.segments.some(s=>s.network===c.network&&s.entry===c.entry&&s.exit===c.exit);
 $("tariffResult").textContent=!tariffData?'Grilles indisponibles.':!tariffDateValid()?'Grille non proposée pour cette date. Une mise à jour des tarifs est nécessaire.':c?`${fmt(c.amount/100)} € TTC · classe ${c.vehicleClass} · ${c.network} · tronçon choisi`:'Choisir une classe, une entrée et une sortie.';
 $("tariffAdd").disabled=busy||!trip||!c||duplicate||tableTolls.segments.length>=10;
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
    const ga=await geocode(sv==="Ma position"?"__CURRENT__":sv,"start");
    setStatus("Recherche de l’arrivée…","busy");const gb=await geocode(ev,"end");
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
    currentPos=[p.coords.latitude,p.coords.longitude];$("start").value="Ma position";
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
  const resetAddress=()=>{$("addressForm").reset();$("addressId").value="";$("cancelAddressEdit").hidden=true};
  $("cancelAddressEdit").addEventListener("click",resetAddress);
  for(const [button,input] of [["copyStartBtn","start"],["copyEndBtn","end"]])$(button).addEventListener("click",()=>{
    if($(input).value==="Ma position"){$("profileMessage").textContent="Saisis une adresse complète pour enregistrer ce point GPS.";return}
    $("addressValue").value=$(input).value;
  });
  $("addressForm").addEventListener("submit",e=>{
    e.preventDefault();const next=structuredClone(profile),value=$("addressValue").value.trim();
    if(value==="Ma position"){$("profileMessage").textContent="Saisis une adresse complète, pas le libellé GPS temporaire.";return}
    const entry={id:$("addressId").value||crypto.randomUUID(),name:$("addressName").value.trim(),value};
    const index=next.addresses.findIndex(a=>a.id===entry.id);if(index<0)next.addresses.push(entry);else next.addresses[index]=entry;
    if(saveProfile(next)){resetAddress();$("profileMessage").textContent="Adresse enregistrée."}
  });
  $("savedAddresses").addEventListener("click",e=>{
    const button=e.target.closest('button');if(!button)return;
    for(const [key,input] of [["addressStart","start"],["addressEnd","end"]])if(button.dataset[key]){
      const a=profile.addresses.find(a=>a.id===button.dataset[key]);if(!a)return;
      $(input).value=a.value;clearResults();if(input==="start")resetRange();setStatus("Adresse choisie. Trajet à recalculer.");$("profileDialog").close();$(input).focus();return;
    }
    if(button.dataset.addressEdit){const a=profile.addresses.find(a=>a.id===button.dataset.addressEdit);if(a){$("addressId").value=a.id;$("addressName").value=a.name;$("addressValue").value=a.value;$("cancelAddressEdit").hidden=false;$("addressName").focus()}}
    if(button.dataset.addressRemove){const next=structuredClone(profile);next.addresses=next.addresses.filter(a=>a.id!==button.dataset.addressRemove);if(saveProfile(next))$("profileMessage").textContent="Adresse supprimée."}
  });
  $("savedStations").addEventListener("click",e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.dataset.favoriteOpen){$("profileDialog").close();openStation(button.dataset.favoriteOpen)}
    if(button.dataset.favoriteRemove){const next=structuredClone(profile);next.stations=next.stations.filter(s=>s.id!==button.dataset.favoriteRemove);if(saveProfile(next))$("profileMessage").textContent="Station retirée des favoris."}
  });
  $("exportProfileBtn").addEventListener("click",()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:"application/json"}));
    const link=document.createElement('a');link.href=url;link.download="DragonRoute-profil.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $("importProfileBtn").addEventListener("click",()=>$("importProfileFile").click());
  $("importProfileFile").addEventListener("change",async e=>{
    const file=e.target.files[0];if(!file)return;
    try{
      if(file.size>100000)throw new Error("Fichier trop volumineux");
      const next=validateProfile(JSON.parse(await file.text()));
      if(confirm("Remplacer ce profil local par le contenu du fichier ?")&&saveProfile(next)){applyVehicle();openProfile();$("profileMessage").textContent="Profil importé."}
    }catch{$("profileMessage").textContent="Import refusé : fichier invalide ou trop volumineux. Le profil existant est conservé."}
    finally{e.target.value=""}
  });
  $("eraseProfileBtn").addEventListener("click",()=>{
    if(!confirm("Effacer le véhicule, les adresses et les stations de ce profil local ?"))return;
    try{localStorage.removeItem(PROFILE_KEY);profile=emptyProfile();storageNotice="";applyVehicle();resetAddress();openProfile();$("profileMessage").textContent="Profil local effacé."}
    catch{$("profileMessage").textContent="Suppression impossible : stockage indisponible."}
  });
}
function bind(){
  for(const id of ["tollHeight","tollWeight","tollPayment","tollDeparture","tollVehicleConfirmed"])$(id).addEventListener("input",updateBudget);
  $("tollCalculate").addEventListener("click",()=>{if(busy||!tollEndpoint()||!tollParameters())return;clearTableTolls('Calcul automatique demandé : les tronçons manuels ont été retirés.');tollState.enabled=true;tollState.key='';updateBudget()});
  $("tariffNetwork").addEventListener('change',()=>tariffGates(true));
  $("tariffEntry").addEventListener('change',()=>tariffGates());
  $("tariffExit").addEventListener('change',updateBudget);
  for(const id of ['tariffClass','tariffDate'])$(id).addEventListener('input',()=>{if(tableTolls.segments.length)clearTableTolls('Classe ou date modifiée : sélectionner à nouveau les tronçons.');updateBudget()});
  $("tariffComplete").addEventListener('change',updateBudget);
  $("tariffClear").addEventListener('click',()=>{clearTableTolls('Tronçons retirés.');updateBudget()});
  $("tariffAdd").addEventListener('click',()=>{
   const c=tariffCandidate();if(busy||!trip||!c||tableTolls.segments.length>=10||tableTolls.segments.some(s=>s.network===c.network&&s.entry===c.entry&&s.exit===c.exit))return;
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
  ["start","end"].forEach(id=>$(id).addEventListener("input",()=>{if(!busy){clearResults();if(id==="start")resetRange();setStatus("Trajet à recalculer.")}}));
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

makeGrid();bind();bindProfile();applyVehicle();updateRange();initPwa();
health("hJS","ok","JS ✓");
setStatus("Moteur chargé. Prêt pour un trajet réel.","ok");
initMap();
window.addEventListener("unhandledrejection",e=>dbg("Unhandled",e.reason?.message||String(e.reason)));
})();
