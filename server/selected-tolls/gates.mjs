import {selectedTariffNetworks} from './tariffs.mjs';
import {meters} from './route-adapter.mjs';
const name=value=>typeof value==='string'&&!value.includes('\uFFFD')?value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/’/g,"'").trim().replace(/\s+/g,' ').toUpperCase():'';
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
// Explicit label correspondence only. The inventory supplies no tariff/network ID.
// Source rows 228/229: Valence Nord, 26A900710CD. ASF label: A7 · VALENCE-N.
// This alias is not a claim about access, direction or actual passage.
const aliases=[{id:'mte2025-228',name:'VALENCE NORD',road:'26A900710CD',network:'ASF',label:'A7 · VALENCE-N'}];
export function gateTariffCandidates(gate,catalogue){
 const label=name(gate?.name);if(!label)return [];
 return Object.entries(selectedTariffNetworks(catalogue)).flatMap(([network,n])=>n.gates.flatMap((text,index)=>{
  const comparable=network==='ASF'?text.replace(/^[A-Z0-9]+ · /,''):text;
  const alias=aliases.some(a=>a.id===gate.id&&a.name===label&&a.road===gate.road&&a.network===network&&a.label===text);
  return name(comparable)===label||alias?[{network,index,label:text,match:alias?'documented-label':'same-label'}]:[];
 }));
}
/** Geographic hints only, in selected-portion order. Never promotes price coverage.
 * A fixed 30m corridor deliberately excludes many nearby ramps. No result is not
 * evidence of absence. Separated visits to a gate are ambiguous, never reordered.
 */
export function locateSectionGates(section,inventory,catalogue){
 if(!section?.key||!Array.isArray(section.coordinates)||section.coordinates.length<2||section.coordinates.length>100000||!section.coordinates.every(point))throw Error('Portion invalide pour le repérage des gares.');
 if(inventory?.schemaVersion!==1||!Array.isArray(inventory.gates)||inventory.gates.length>10000)throw Error('Inventaire des gares indisponible. Le choix manuel reste possible.');
 const radius=30;let total=0;
 const segments=section.coordinates.slice(1).map((b,i)=>{const a=section.coordinates[i],length=meters(a,b),s={a,b,length,start:total};total+=length;return s}).filter(s=>s.length>0);
 if(!segments.length)throw Error('Portion sans longueur.');
 const found=[];const ids=new Set();
 for(const gate of inventory.gates){
  if(!gate||typeof gate.id!=='string'||ids.has(gate.id))throw Error('Inventaire des gares ambigu. Le choix manuel reste possible.');ids.add(gate.id);
  if(!name(gate.name)||!Array.isArray(gate.positions))continue;
  const hits=[];
  for(const p of gate.positions){
   if(!Array.isArray(p)||!point([p[1],p[0]]))continue;
   const [lat,lon]=p,kx=111320*Math.cos(lat*Math.PI/180),ky=110574;if(kx<1000)continue;
   for(const s of segments){
    const {a,b}=s;if(lat<Math.min(a[1],b[1])-radius/ky||lat>Math.max(a[1],b[1])+radius/ky||lon<Math.min(a[0],b[0])-radius/kx||lon>Math.max(a[0],b[0])+radius/kx)continue;
    const vx=(b[0]-a[0])*kx,vy=(b[1]-a[1])*ky,wx=(lon-a[0])*kx,wy=(lat-a[1])*ky,den=vx*vx+vy*vy,t=den?Math.max(0,Math.min(1,(wx*vx+wy*vy)/den)):0;
    const distance=Math.hypot(wx-t*vx,wy-t*vy);if(distance<=radius)hits.push({distance,progress:s.start+t*s.length,point:[lon,lat],sourceLine:p[3]});
   }
  }
  if(!hits.length)continue;
  const best=hits.reduce((a,b)=>a.distance<=b.distance?a:b),ambiguous=hits.reduce((n,x)=>Math.max(n,x.progress),-Infinity)-hits.reduce((n,x)=>Math.min(n,x.progress),Infinity)>150;
  found.push({id:gate.id,name:gate.name,type:gate.type,road:gate.road,...best,ambiguous,matches:gateTariffCandidates(gate,catalogue)});
 }
 found.sort((a,b)=>a.progress-b.progress||a.id.localeCompare(b.id));
 const rows=found.slice(0,40).map((g,i)=>({...g,number:i+1}));let pair=null;
 if(found.length===2&&found.every(g=>!g.ambiguous&&g.matches.length===1)&&found[1].progress-found[0].progress>150){
  const [a,b]=found.map(g=>g.matches[0]),n=selectedTariffNetworks(catalogue)[a.network];
  if(a.network===b.network&&a.index!==b.index&&n.rows.filter(r=>r[0]===a.index&&r[1]===b.index).length===1)pair={network:a.network,entry:a.index,exit:b.index,entryLabel:a.label,exitLabel:b.label};
 }
 return {sectionKey:section.key,source:inventory.source,referenceDate:inventory.referenceDate,radius,total:found.length,rows,pair,coverage:'GEOGRAPHIC_CANDIDATES_ONLY'};
}
