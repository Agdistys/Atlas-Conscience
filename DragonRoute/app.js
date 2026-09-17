(()=>{"use strict";
const C=window.DRAGONROUTE_CONFIG;
const $=id=>document.getElementById(id);
const fuelField={E10:"e10",Gazole:"gazole",SP98:"sp98",SP95:"sp95",E85:"e85",GPLc:"gplc"};
const log=[];
let map=null, routeLayer=null, markerLayer=null, currentPos=null, activeAbort=null, deferredInstall=null;
let trip=null, compared=[], busy=false;
let mapView=null,currentStation=null,detailSequence=0;
let orsKey="",orsLastRequest=-Infinity;
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
  return {version:1,vehicle:{name:text(v.name,80),type:v.type,fuel:v.fuel,cons:number(v.cons,1,30),liters:number(v.liters,1,150)},addresses,stations};
}
function saveProfile(next){
  try{const clean=validateProfile(next);localStorage.setItem(PROFILE_KEY,JSON.stringify(clean));profile=clean;storageNotice="";renderSaved();updateFavorite();return true}
  catch{const message="Enregistrement impossible : stockage indisponible, plein ou données invalides.";$("profileMessage").textContent=message;$("stationMessage").textContent=message;return false}
}
function applyVehicle(){
  $("fuel").value=profile.vehicle.fuel;$("cons").value=profile.vehicle.cons;$("liters").value=profile.vehicle.liters;
  $("activeVehicle").hidden=!profile.vehicle.name&&profile.vehicle.type==="car";
  $("activeVehicle").textContent=(profile.vehicle.name||"Mon véhicule")+" · "+profile.vehicle.fuel+(profile.vehicle.type!=="car"?" · itinéraire voiture, gabarit non contrôlé":"");
  if(trip)clearStations();
}
function renderSaved(){
  $("savedAddresses").innerHTML=profile.addresses.length?profile.addresses.map(a=>`<div class="saved-row"><strong>${escapeHtml(a.name)}</strong><p>${escapeHtml(a.value)}</p><div class="dialog-actions"><button class="ghost" data-address-start="${escapeHtml(a.id)}">Départ</button><button class="ghost" data-address-end="${escapeHtml(a.id)}">Arrivée</button><button class="ghost" data-address-edit="${escapeHtml(a.id)}">Modifier</button><button class="ghost" data-address-remove="${escapeHtml(a.id)}">Supprimer</button></div></div>`).join(""):"<p class=note>Aucune adresse enregistrée.</p>";
  $("savedStations").innerHTML=profile.stations.length?profile.stations.map(s=>`<div class="saved-row"><strong>${escapeHtml(s.city||"Station")}</strong><p>${escapeHtml(s.address)}</p><div class="dialog-actions"><button class="ghost" data-favorite-open="${escapeHtml(s.id)}">Voir la station</button><button class="ghost" data-favorite-remove="${escapeHtml(s.id)}">Retirer</button></div></div>`).join(""):"<p class=note>Aucune station enregistrée.</p>";
}
function openProfile(){
  if(busy)return;
  $("profileMessage").textContent=storageNotice;
  for(const [id,key] of [["vehicleName","name"],["vehicleType","type"],["vehicleFuel","fuel"],["vehicleCons","cons"],["vehicleLiters","liters"]])$(id).value=profile.vehicle[key];
  renderSaved();if(!$("profileDialog").open)$("profileDialog").showModal();
}
function updateFavorite(){
  const saved=currentStation&&profile.stations.some(s=>s.id===currentStation.id);
  $("favoriteBtn").textContent=saved?"Retirer des favoris":"Enregistrer la station";
  $("favoriteBtn").setAttribute("aria-pressed",String(Boolean(saved)));
}
function stationInfo(r){
  return {hours:r.horaires??null,automate:r.horaires_automate_24_24??null,services:Array.isArray(r.services_service)?r.services_service.filter(s=>typeof s==="string").slice(0,50):[],receivedAt:new Date().toISOString()};
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
  $("stationDetails").innerHTML=`<p class="detail-address">${escapeHtml(s.address)}</p><p>${Number.isFinite(s.price)?`${escapeHtml(s.fuel)} : ${fmt(s.price,3)} €/L · ${escapeHtml(age(s.updated))}`:"Prix actuel non renseigné pour le carburant choisi."}</p>
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
    if(!r.ok) throw new Error(`${label} : HTTP ${r.status}`);
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

async function geocode(q){
  if(q==="__CURRENT__"){
    if(!currentPos) throw new Error("Position GPS non disponible");
    return {lat:currentPos[0],lon:currentPos[1],label:"Ma position"};
  }
  const p=new URLSearchParams({format:"jsonv2",limit:"1",countrycodes:"fr",q});
  const d=await getJSON(`${C.nominatim}/search?${p}`,"Géocodage");
  if(!d?.length) throw new Error(`Lieu introuvable : ${q}`);
  return {lat:+d[0].lat,lon:+d[0].lon,label:d[0].display_name||q};
}
function routingPreferences(){
  return {provider:$("routeProvider").value,avoid:[...document.querySelectorAll('.avoid-options input:checked')].map(el=>el.value)};
}
function routingLabel(settings){
  return (settings.provider==="ors"?"OpenRouteService":"OSRM")+(settings.avoid.length?" · exclusions : "+settings.avoid.map(x=>avoidLabels[x]).join(", "):" · sans exclusions");
}
function invalidateRouting(){
  clearResults();$("orsConnection").hidden=$("routeProvider").value!=="ors";
  setStatus("Options modifiées. Trajet à recalculer.");
}
function ensureRouting(settings){
  if(settings.provider==="osrm"&&settings.avoid.length)throw new Error("Ces exclusions nécessitent OpenRouteService. Aucune option ne sera ignorée.");
  if(settings.provider==="ors"){
    const entered=$("orsKey").value.trim();
    if(entered)orsKey=entered;
    $("orsKey").value="";
    if(!/^[!-~]{8,512}$/.test(orsKey)){orsKey="";$("routingOptions").open=true;throw new Error("Clé OpenRouteService requise dans les options du trajet.")}
    $("orsKeyStatus").textContent="Clé présente pour cette page uniquement ; validation au prochain calcul.";
  }
}
function hasRouteGeometry(r){
  return r?.geometry?.type==="LineString"&&Array.isArray(r.geometry.coordinates)&&r.geometry.coordinates.length>1&&r.geometry.coordinates.every(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90);
}
async function orsRoutes(points,settings,alternatives=false){
  if(!orsKey)throw new Error("Clé OpenRouteService absente.");
  await sleep(Math.max(0,1800-(performance.now()-orsLastRequest)));
  if(activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
  orsLastRequest=performance.now();
  const t=makeTimeout(25000);
  const body={coordinates:points.map(([lat,lon])=>[lon,lat]),preference:"fastest",units:"m",instructions:false,radiuses:points.map(()=>200),options:{avoid_features:[...settings.avoid]}};
  if(alternatives)body.alternative_routes={target_count:2};
  try{
    // Keep credentials out of URLs, diagnostics, storage and provider error messages.
    const response=await fetch("https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/geo+json",Authorization:orsKey},body:JSON.stringify(body),signal:t.signal,cache:"no-store",credentials:"omit",redirect:"error",referrerPolicy:"no-referrer"});
    const data=await response.json().catch(()=>null);
    if(!response.ok||data?.error){
      const noRoute=[2009,2010].includes(data?.error?.code);
      const message=response.status===401||response.status===403?"Clé refusée ou accès OpenRouteService non autorisé.":response.status===429?"Quota OpenRouteService atteint. Réessayer plus tard.":noRoute?"Aucun trajet accessible avec ces options.":`OpenRouteService indisponible ou demande refusée (HTTP ${response.status}).`;
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
async function route(points,overview=true,alternatives=false,settings=trip?.routing||routingPreferences()){
  health("hRoute","busy","routage…");
  if(settings.provider==="ors"){
    let base=(await orsRoutes(points,settings))[0];
    if(alternatives&&base.distance<=100000){
      try{const all=await orsRoutes(points,settings,true);base={...all[0],alternatives:all.slice(1)}}
      catch{base.alternativeNotice="Recherche d’alternatives indisponible. Le trajet calculé avec les exclusions est conservé."}
    }else if(alternatives)base.alternativeNotice="Alternatives non recherchées : limite OpenRouteService de 100 km dépassée.";
    health("hRoute","ok","routage ✓");$("orsKeyStatus").textContent="Clé acceptée lors du dernier calcul. Conservée dans cette page uniquement.";
    return base;
  }
  if(settings.avoid.length)throw new Error("OSRM ne prend pas en charge ces exclusions.");
  const coords=points.map(p=>`${p[1]},${p[0]}`).join(";");
  const u=`${C.osrm}/route/v1/driving/${coords}?overview=${overview?"full":"false"}&geometries=geojson&steps=false&alternatives=${alternatives}`;
  const d=await getJSON(u,"Routage",20000);
  if(d.code!=="Ok"||!d.routes?.length) throw new Error("Aucun itinéraire routier trouvé");
  if(overview&&!hasRouteGeometry(d.routes[0]))throw new Error("Tracé routier incomplet. Relancer la recherche.");
  health("hRoute","ok","routage ✓");
  return {...d.routes[0],alternatives:alternatives?d.routes.slice(1).filter(hasRouteGeometry):[]};
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
  return (d.results||[]).map(r=>stationFrom(r,fuel)).filter(Boolean);
}
async function collectStations(coords,fuel){
  health("hFuel","busy","carburants…");
  const pts=sampleRoute(coords),all=[];let failed=0;
  dbg("Échantillons du corridor",pts.length);
  for(let i=0;i<pts.length;i+=4){
    const batch=pts.slice(i,i+4);
    const rs=await Promise.all(batch.map(p=>stationsAround(p,fuel).catch(e=>{failed++;dbg("Carburants partiel",e.message);return []})));
    all.push(...rs.flat());
  }
  const uniq=new Map();all.forEach(s=>uniq.set(s.id,s));
  const arr=[...uniq.values()].filter(s=>distRoute([s.lat,s.lon],coords)<=C.corridorRadiusKm);
  health("hFuel",arr.length?"ok":"err",arr.length?"carburants ✓":"carburants ✕");
  if(failed===pts.length)throw new Error("Service carburants indisponible. Le trajet reste disponible.");
  return {stations:arr,partial:failed>0};
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
    .sort((a,b)=>w.mode==="around"?Math.abs(a.progress-w.target)-Math.abs(b.progress-w.target):a.progress-b.progress)
    .slice(0,C.maxCandidates);
}
function scoreCandidates(cands,base,m,liters,cons){
  const endIndex=cands.length+1,out=[];
  for(let i=0;i<cands.length;i++){
    const idx=i+1,s=cands[i];
    const d1=m.distances?.[0]?.[idx],d2=m.distances?.[idx]?.[endIndex];
    const t1=m.durations?.[0]?.[idx],t2=m.durations?.[idx]?.[endIndex];
    if([d1,d2,t1,t2].some(v=>v==null||!Number.isFinite(v)))continue;
    const extraKm=Math.max(0,(d1+d2-base.distance)/1000);
    const extraMin=Math.max(0,(t1+t2-base.duration)/60);
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
function renderStations(stations,mode){
  const winners=[
    ["OPTIMAL",[...stations].sort((a,b)=>a.real-b.real)[0]],
    ["POMPE",[...stations].sort((a,b)=>a.price-b.price||a.real-b.real)[0]],
    ["RAPIDE",[...stations].sort((a,b)=>a.extraMin-b.extraMin||a.extraKm-b.extraKm)[0]]
  ];
  const list=mode==="soon"?[...stations].sort((a,b)=>a.distanceFromStart-b.distanceFromStart).slice(0,3):[...new Map(winners.map(([,s])=>[s.id,s])).values()];
  $("stationCards").innerHTML=list.map(s=>`<article class="result-card" data-station="${escapeHtml(s.id)}">
    <div class="result-badges">${winners.filter(([,winner])=>winner.id===s.id).map(([name])=>`<span class="result-badge">${name}</span>`).join("")}</div>
    <span class="station-index">Point ${s.number}</span><h3>${escapeHtml(s.city||`Station ${s.id}`)}</h3><div class="result-small">${escapeHtml(s.address)}</div>
    <div class="result-line">À ${fmt(s.distanceFromStart,1)} km du départ</div>
    <div class="price">${fmt(s.real)} € <span class="price-note">plein + détour</span></div>
    <div class="result-line"><b>${fmt(s.price,3)} €/L</b> · +${fmt(s.extraKm,1)} km · +${Math.round(s.extraMin)} min</div>
    <div class="result-small">Achat ${fmt(s.purchase)} € · carburant du détour ${fmt(s.detourFuelCost)} €<br>${escapeHtml(age(s.updated))}</div>
    <button class="ghost station-detail-link" data-details="${escapeHtml(s.id)}">Infos et favori</button><button class="choose-station" data-select="${escapeHtml(s.id)}" aria-pressed="false">Choisir cette station</button>
    </article>`).join("");
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
function showOnMap(coords,stations,best,start,end,label){
  mapView=[coords,stations,best,start,end,label];
  const alternatives=best?[]:(trip?.base.alternatives||[]).map(r=>r.geometry.coordinates.map(([lon,lat])=>[lat,lon]));
  $("routeAlternativesNote").hidden=Boolean(best);
  $("routeAlternativesNote").textContent=alternatives.length===1?"1 alternative indicative, non sélectionnable pour le moment.":alternatives.length?`${alternatives.length} alternatives indicatives, non sélectionnables pour le moment.`:"Aucun autre trajet proposé par le moteur pour cette recherche.";
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
  map.invalidateSize();map.fitBounds(L.featureGroup([routeLayer,markerLayer]).getBounds(),{padding:[35,35]});
}

function clearStations(){
  compared=[];
  $("stationCards").replaceChildren();$("stationSummary").hidden=true;$("selectedStop").hidden=true;
  $("stationCount").textContent="—";$("testedCount").textContent="—";$("fuelStatus").textContent="";
  health("hFuel","","carburants");
  if(trip)showOnMap(trip.coords,[],null,trip.a,trip.b,trip.label);
}
function clearResults(){
  trip=null;mapView=null;clearStations();
  $("summary").hidden=true;$("stops").hidden=true;
  $("tripKm").textContent="—";$("tripTime").textContent="—";
  for(const id of ["routeLine","routeGlow"])$(id).setAttribute("d","");
  $("alternativeRoutes").replaceChildren();$("routeAlternativesNote").hidden=true;
  $("appliedRouting").hidden=true;$("routingAttribution").textContent="OSRM / OpenRouteService";
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
    const ga=await geocode(sv==="Ma position"?"__CURRENT__":sv);
    if(sv!=="Ma position")await sleep(1100);
    setStatus("Recherche de l’arrivée…","busy");const gb=await geocode(ev);
    health("hGeo","ok","géocodage ✓");
    const a=[ga.lat,ga.lon],b=[gb.lat,gb.lon];
    setStatus("Calcul du trajet…","busy");
    const base=await route([a,b],true,true,routing);
    const coords=base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
    const label=`${ga.label.split(",")[0]} → ${gb.label.split(",")[0]}`;
    trip={a,b,base,coords,label,routing};
    $("appliedRouting").textContent=routingLabel(routing);$("appliedRouting").hidden=false;
    $("routingAttribution").innerHTML=routing.provider==="ors"?'<a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">© openrouteservice.org by HeiGIT</a> · © OpenStreetMap contributors':"OSRM";
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
  }finally{lock(false)}
}
async function searchStations(){
  if(busy||!trip)return;
  activeAbort=new AbortController();
  clearStations();lock(true);
  $("cancelStationsBtn").hidden=false;$("cancelStationsBtn").disabled=false;
  try{
    const fuel=$("fuel").value,liters=valueNum("liters",1,150),cons=valueNum("cons",1,30),w=stopWindow();
    $("fuelStatus").textContent="Recherche des stations…";
    const found=await collectStations(trip.coords,fuel);
    if(activeAbort.signal.aborted)throw new Error("Recherche interrompue.");
    $("stationCount").textContent=String(found.stations.length);$("stationSummary").hidden=false;
    const cands=chooseCandidates(found.stations,trip.coords);
    if(!cands.length)throw new Error(`Aucune station ${fuel} reçue dans la zone demandée.`);
    $("fuelStatus").textContent=`Calcul des accès et détours de ${cands.length} stations…`;
    let scored,note="";
    if(trip.routing.provider==="ors")({scored,note}=await scoreConstrainedCandidates(cands,liters,cons));
    else{const mat=await matrix([trip.a,...cands.map(s=>[s.lat,s.lon]),trip.b]);scored=scoreCandidates(cands,trip.base,mat,liters,cons)}
    if(activeAbort.signal.aborted)throw new Error("Recherche interrompue.");
    compared=scored.filter(s=>s.distanceFromStart>=w.min&&s.distanceFromStart<=w.max);
    $("testedCount").textContent=String(compared.length);
    if(!compared.length)throw new Error(`${note} Aucune station comparable dans cette plage de distance. Modifie la distance choisie.`.trim());
    compared.forEach((s,i)=>s.number=i+1);
    renderStations(compared,w.mode);
    showOnMap(trip.coords,compared,null,trip.a,trip.b,trip.label);
    $("fuelStatus").textContent=`${compared.length} stations comparées parmi ${found.stations.length} reçues. ${note?note+" ":""}${found.partial?"Réponse partielle du service. ":""}Distances depuis le départ choisi ; pas de suivi GPS continu.`;
  }catch(e){dbg(e.stack||e.message);$("fuelStatus").textContent=activeAbort.signal.aborted?"Recherche interrompue. Le trajet reste disponible.":e.message;health("hFuel","err","carburants ✕")}
  finally{activeAbort=null;lock(false);$("cancelStationsBtn").hidden=true}
}
async function selectStation(id){
  if(busy||!trip)return;
  const station=compared.find(s=>s.id===id);if(!station)return;
  if(station.via&&!confirm(`Ajouter cet arrêt ? Le trajet sera recalculé via la station et peut changer de routes. ${routingLabel(trip.routing)}. Total : ${fmt(station.via.distance/1000,1)} km, ${Math.round(station.via.duration/60)} min, hors temps du plein.`))return;
  lock(true);$("fuelStatus").textContent="Vérification du trajet avec cet arrêt…";
  try{
    const via=station.via||await route([trip.a,[station.lat,station.lon],trip.b]);
    const coords=via.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
    showOnMap(coords,compared,station,trip.a,trip.b,`${trip.label} · arrêt ${station.city}`);
    document.querySelectorAll('[data-station]').forEach(el=>el.classList.toggle('selected',el.dataset.station===id));
    document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.select===id)));
    $("selectedStop").hidden=false;
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
    clearResults();
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
    next.vehicle={name:$("vehicleName").value.trim(),type:$("vehicleType").value,fuel:$("vehicleFuel").value,cons:Number($("vehicleCons").value),liters:Number($("vehicleLiters").value)};
    if(saveProfile(next)){applyVehicle();$("profileMessage").textContent="Véhicule enregistré. Paramètres carburant appliqués."}
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
      $(input).value=a.value;clearResults();setStatus("Adresse choisie. Trajet à recalculer.");$("profileDialog").close();$(input).focus();return;
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
  document.querySelectorAll('.avoid-options input').forEach(el=>el.addEventListener("change",()=>{if(busy)return;if(el.checked)$("routeProvider").value="ors";invalidateRouting()}));
  $("routeProvider").addEventListener("change",()=>{if(!busy)invalidateRouting()});
  $("orsKey").addEventListener("input",()=>{if(!busy){orsKey="";$("orsKeyStatus").textContent="Nouvelle clé à vérifier.";invalidateRouting()}});
  $("forgetOrsKey").addEventListener("click",()=>{if(busy)return;orsKey="";$("orsKey").value="";$("orsKeyStatus").textContent="Clé effacée de cette page.";invalidateRouting()});
  $("cancelStationsBtn").addEventListener("click",()=>activeAbort?.abort());
  $("goBtn").addEventListener("click",run);$("gpsBtn").addEventListener("click",gps);
  ["start","end"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter")run()}));
  ["start","end"].forEach(id=>$(id).addEventListener("input",()=>{if(!busy){clearResults();setStatus("Trajet à recalculer.")}}));
  $("stationsBtn").addEventListener("click",searchStations);
  $("stationCards").addEventListener("click",e=>{const button=e.target.closest('[data-select]');if(button)selectStation(button.dataset.select)});
  document.querySelectorAll('input[name="stopMode"],#stopKm,#fuel,#liters,#cons').forEach(el=>el.addEventListener("input",()=>{if(!busy){clearStations();updateWindow()}}));
  for(const name of ["stations","rides"]){
    $(name+"Tab").addEventListener("click",()=>selectTab(name));
    $(name+"Tab").addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const next=e.key==="Home"?"stations":e.key==="End"?"rides":name==="stations"?"rides":"stations";selectTab(next);$(next+"Tab").focus()}});
  }
}

makeGrid();bind();bindProfile();applyVehicle();initPwa();
health("hJS","ok","JS ✓");
setStatus("Moteur chargé. Prêt pour un trajet réel.","ok");
initMap();
window.addEventListener("unhandledrejection",e=>dbg("Unhandled",e.reason?.message||String(e.reason)));
})();
