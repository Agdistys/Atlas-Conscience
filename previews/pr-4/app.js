(()=>{"use strict";
const C=window.DRAGONROUTE_CONFIG;
const $=id=>document.getElementById(id);
const fuelField={E10:"e10",Gazole:"gazole",SP98:"sp98",SP95:"sp95",E85:"e85",GPLc:"gplc"};
const log=[];
let map=null, routeLayer=null, markerLayer=null, currentPos=null, activeAbort=null, deferredInstall=null;

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
  if(activeAbort) activeAbort.signal.addEventListener("abort",()=>c.abort(),{once:true});
  return {signal:c.signal,done:()=>clearTimeout(t)};
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
    markerLayer=L.layerGroup().addTo(map);
    $("mapFallback").style.display="none";
    health("hMap","ok","carte ✓");
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
async function route(points,overview=true){
  health("hRoute","busy","routage…");
  const coords=points.map(p=>`${p[1]},${p[0]}`).join(";");
  const u=`${C.osrm}/route/v1/driving/${coords}?overview=${overview?"full":"false"}&geometries=geojson&steps=false&alternatives=false`;
  const d=await getJSON(u,"Routage",20000);
  if(d.code!=="Ok"||!d.routes?.length) throw new Error("Aucun itinéraire routier trouvé");
  health("hRoute","ok","routage ✓");
  return d.routes[0];
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
    city:r.ville||""
  };
}
async function stationsAround(p,fuel,radius=C.corridorRadiusKm){
  const f=fuelField[fuel],[lat,lon]=p;
  const where=`within_distance(geom, geom'POINT(${lon} ${lat})', ${radius} km) and ${f}_prix is not null`;
  const select=`id,adresse,cp,ville,geom,${f}_prix,${f}_maj,${f}_rupture_type`;
  const q=new URLSearchParams({limit:"100",where,select});
  const d=await getJSON(`${C.fuelApi}?${q}`,"Carburants",18000);
  return (d.results||[]).map(r=>stationFrom(r,fuel)).filter(Boolean);
}
async function collectStations(coords,fuel){
  health("hFuel","busy","carburants…");
  const pts=sampleRoute(coords),all=[];
  dbg("Échantillons du corridor",pts.length);
  for(let i=0;i<pts.length;i+=4){
    const batch=pts.slice(i,i+4);
    const rs=await Promise.all(batch.map(p=>stationsAround(p,fuel).catch(e=>{dbg("Carburants partiel",e.message);return []})));
    all.push(...rs.flat());
  }
  const uniq=new Map();all.forEach(s=>uniq.set(s.id,s));
  const arr=[...uniq.values()].filter(s=>distRoute([s.lat,s.lon],coords)<=C.corridorRadiusKm);
  health("hFuel",arr.length?"ok":"err",arr.length?"carburants ✓":"carburants ✕");
  return arr;
}
function chooseCandidates(stations,coords){
  const a=stations.map(s=>({...s,airCorridor:distRoute([s.lat,s.lon],coords)}));
  const near=[...a].sort((x,y)=>x.airCorridor-y.airCorridor).slice(0,14);
  const cheap=[...a].sort((x,y)=>x.price-y.price).slice(0,14);
  const u=new Map();[...near,...cheap].forEach(s=>u.set(s.id,s));
  return [...u.values()].sort((x,y)=>x.airCorridor-y.airCorridor).slice(0,C.maxCandidates);
}
function scoreCandidates(cands,base,m,liters,cons,timeValue){
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
    const timeCost=extraMin/60*timeValue;
    out.push({...s,extraKm,extraMin,purchase,detourFuelCost,timeCost,real:purchase+detourFuelCost+timeCost});
  }
  return out;
}
function age(iso){
  if(!iso)return "mise à jour inconnue";
  const d=new Date(iso);if(Number.isNaN(+d))return `maj ${iso}`;
  const h=Math.max(0,(Date.now()-d)/36e5);
  return h<2?"mise à jour récente":h<24?`maj il y a ${Math.round(h)} h`:`maj il y a ${Math.round(h/24)} j`;
}
function renderCard(id,s,title){
  const e=$(id);
  if(!s){e.innerHTML=`<h3>${title}</h3><p>Aucun résultat exploitable.</p>`;return}
  e.innerHTML=`<h3>${title}</h3>
    <div class="price">${fmt(s.real)} € <span class="price-note">coût comparé</span></div>
    <div class="result-line"><b>${fmt(s.price,3)} €/L</b> · +${fmt(s.extraKm,1)} km · +${Math.round(s.extraMin)} min</div>
    <div class="result-small">${escapeHtml(s.address||`Station ${s.id}`)}<br>
    Achat ${fmt(s.purchase)} € · détour ${fmt(s.detourFuelCost)} €${s.timeCost?` · temps ${fmt(s.timeCost)} €`:""}<br>${age(s.updated)}</div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function projectSvg(coords,stations=[],best=null,label=""){
  if(!coords?.length)return;
  const W=1000,H=700,pad=70;
  let minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
  const all=coords.concat(stations.map(s=>[s.lat,s.lon]));
  for(const [lat,lon] of all){minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat);minLon=Math.min(minLon,lon);maxLon=Math.max(maxLon,lon)}
  const latSpan=Math.max(.01,maxLat-minLat),lonSpan=Math.max(.01,maxLon-minLon);
  const scale=Math.min((W-2*pad)/lonSpan,(H-2*pad)/latSpan);
  const xoff=(W-lonSpan*scale)/2,yoff=(H-latSpan*scale)/2;
  const P=([lat,lon])=>[xoff+(lon-minLon)*scale,H-(yoff+(lat-minLat)*scale)];
  const step=Math.max(1,Math.floor(coords.length/350));let d="";
  coords.forEach((p,i)=>{if(i%step&&i!==coords.length-1)return;const [x,y]=P(p);d+=(d?" L ":"M ")+x.toFixed(1)+" "+y.toFixed(1)});
  $("routeLine").setAttribute("d",d);$("routeGlow").setAttribute("d",d);
  const a=P(coords[0]),b=P(coords.at(-1));
  $("startDot").setAttribute("cx",a[0]);$("startDot").setAttribute("cy",a[1]);
  $("endDot").setAttribute("cx",b[0]);$("endDot").setAttribute("cy",b[1]);
  $("stationDots").innerHTML=stations.map(s=>{const [x,y]=P([s.lat,s.lon]);const cl=s.id===best?.id?"station-best":"station-dot";return `<circle class="${cl}" cx="${x}" cy="${y}" r="${s.id===best?.id?8:5}"><title>${escapeHtml(s.address)} — ${fmt(s.price,3)} €/L</title></circle>`}).join("");
  $("fallbackLabel").textContent=label||"Visualisation autonome";
}
function showOnMap(coords,stations,best,start,end,label){
  if(!map){projectSvg(coords,stations,best,label);return}
  if(routeLayer)map.removeLayer(routeLayer);
  markerLayer.clearLayers();
  routeLayer=L.polyline(coords,{color:"#f2c66d",weight:5,opacity:.95}).addTo(map);
  L.circleMarker(start,{radius:7,color:"#111",weight:3,fillColor:"#fff",fillOpacity:1}).addTo(markerLayer);
  L.circleMarker(end,{radius:7,color:"#111",weight:3,fillColor:"#fff",fillOpacity:1}).addTo(markerLayer);
  stations.forEach(s=>{
    const isBest=s.id===best?.id;
    L.circleMarker([s.lat,s.lon],{radius:isBest?8:5,color:isBest?"#fff1bc":"#111",weight:isBest?3:2,fillColor:isBest?"#f2c66d":"#8cb9ff",fillOpacity:1})
      .bindPopup(`<b>${escapeHtml(s.address)}</b><br>${fmt(s.price,3)} €/L<br>+${fmt(s.extraKm,1)} km · +${Math.round(s.extraMin)} min`)
      .addTo(markerLayer);
  });
  map.fitBounds(routeLayer.getBounds(),{padding:[35,35]});
}

function clearResults(){
  $("summary").hidden=true;
  for(const id of ["tripKm","tripTime","stationCount","testedCount"])$(id).textContent="—";
  renderCard("optimal",null,"🏆 OPTIMAL");
  renderCard("cheap",null,"💶 POMPE");
  renderCard("fast",null,"⚡ RAPIDE");
  for(const id of ["routeLine","routeGlow"])$(id).setAttribute("d","");
  $("stationDots").replaceChildren();
  for(const id of ["startDot","endDot"]){$(id).setAttribute("cx","-50");$(id).setAttribute("cy","-50")}
  $("fallbackLabel").textContent="En attente du nouveau trajet.";
  if(map&&routeLayer){map.removeLayer(routeLayer);routeLayer=null}
  if(markerLayer)markerLayer.clearLayers();
  $("diagWrap").open=false;
}
async function run(){
  if($("goBtn").disabled)return;
  if(activeAbort)activeAbort.abort();activeAbort=new AbortController();
  $("goBtn").disabled=true;log.length=0;
  clearResults();
  health("hGeo","","géocodage");health("hRoute","","routage");health("hFuel","","carburants");
  try{
    const fuel=$("fuel").value,liters=valueNum("liters",1,150),cons=valueNum("cons",1,30),timeValue=valueNum("timeValue",0,200);
    const sv=$("start").value.trim(),ev=$("end").value.trim();
    if(!sv||!ev)throw new Error("Départ et arrivée requis.");

    setStatus("1/4 — géocodage du départ…","busy");health("hGeo","busy","géocodage…");
    const ga=await geocode(sv==="Ma position"?"__CURRENT__":sv);
    if(sv!=="Ma position")await sleep(1100);
    setStatus("1/4 — géocodage de l’arrivée…","busy");
    const gb=await geocode(ev);
    health("hGeo","ok","géocodage ✓");
    const a=[ga.lat,ga.lon],b=[gb.lat,gb.lon];

    setStatus("2/4 — calcul du trajet routier…","busy");
    const base=await route([a,b],true);
    const coords=base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
    projectSvg(coords,[],null,`${ga.label.split(",")[0]} → ${gb.label.split(",")[0]}`);
    $("summary").hidden=false;$("tripKm").textContent=`${fmt(base.distance/1000,1)} km`;$("tripTime").textContent=`${Math.round(base.duration/60)} min`;

    setStatus("3/4 — recherche des prix autour du trajet…","busy");
    const stations=await collectStations(coords,fuel);$("stationCount").textContent=stations.length;
    if(!stations.length)throw new Error(`Aucune station ${fuel} reçue dans le corridor.`);

    const cands=chooseCandidates(stations,coords);
    setStatus(`4/4 — mesure de ${cands.length} détours…`,"busy");
    const mat=await matrix([a,...cands.map(s=>[s.lat,s.lon]),b]);
    const scored=scoreCandidates(cands,base,mat,liters,cons,timeValue);
    $("testedCount").textContent=scored.length;
    if(!scored.length)throw new Error("Stations trouvées mais détours non calculables.");

    const optimal=[...scored].sort((x,y)=>x.real-y.real)[0];
    const cheap=[...scored].sort((x,y)=>x.price-y.price||x.real-y.real)[0];
    const fast=[...scored].sort((x,y)=>x.extraMin-y.extraMin||x.extraKm-y.extraKm)[0];
    renderCard("optimal",optimal,"🏆 OPTIMAL");renderCard("cheap",cheap,"💶 POMPE");renderCard("fast",fast,"⚡ RAPIDE");
    showOnMap(coords,scored,optimal,a,b,`${ga.label.split(",")[0]} → ${gb.label.split(",")[0]} · ${scored.length} stations · ${fuel}`);
    setStatus(`✅ ${scored.length} stations comparées sur le vrai trajet.`,"ok");
  }catch(e){
    console.error(e);dbg(e.stack||e.message);setStatus(`⚠️ ${e.message}`,"err");
    $("diagWrap").open=true;
  }finally{$("goBtn").disabled=false}
}
function gps(){
  if(!navigator.geolocation){setStatus("⚠️ GPS non pris en charge.","err");return}
  setStatus("Demande de position GPS…","busy");
  navigator.geolocation.getCurrentPosition(p=>{
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
function bind(){
  $("goBtn").addEventListener("click",run);$("gpsBtn").addEventListener("click",gps);
  ["start","end"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter")run()}));
}

makeGrid();bind();initPwa();
health("hJS","ok","JS ✓");
setStatus("Moteur chargé. Prêt pour un trajet réel.","ok");
initMap();
window.addEventListener("unhandledrejection",e=>dbg("Unhandled",e.reason?.message||String(e.reason)));
})();
