// The exception has a lifecycle: upcoming, currently traversed, then permanently passed.
import {detailedRoute,joinInstructions,meters} from './route-adapter.mjs';
const copy=v=>structuredClone(v),finite=n=>typeof n==='number'&&Number.isFinite(n),point=p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
const same=(a,b)=>point(a)&&point(b)&&a.every((n,i)=>Math.abs(n-b[i])<=1e-7);
const fail=(code,message)=>{throw Object.assign(new Error(message),{code})};
const need=(v,message)=>{if(!v)fail('INVALID_SELECTION',message)};
const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o)}return o};
const issued=new WeakMap();
const check=s=>{if(s?.aborted)fail('CANCELLED','Calcul annulé.')};
function selected(selection){
 need(selection?.kind==='selected-toll-section'&&typeof selection.sectionKey==='string'&&selection.sectionKey.length>0&&selection.context?.vehicle==='car'&&Array.isArray(selection.context.avoid)&&selection.context.avoid.includes('tollways')&&new Set(selection.context.avoid).size===selection.context.avoid.length&&selection.context.avoid.every(v=>['tollways','highways','ferries'].includes(v))&&typeof selection.allowHighwayOnSection==='boolean','Portion payante non confirmée.');
 const paid=selection.parts?.[1];need(paid?.source==='ors'&&Number.isFinite(Date.parse(paid.graphDate))&&Array.isArray(paid.coordinates)&&paid.coordinates.length>=2&&paid.coordinates.every(point)&&paid.tolls?.length===paid.coordinates.length-1&&paid.tolls.every(t=>t===1),'Tracé payant absent.');
 need(same(selection.section?.entry,paid.coordinates[0])&&same(selection.section?.exit,paid.coordinates.at(-1)),'Limites de la portion incohérentes.');return paid;
}
function bounds(route){
 const coords=route?.geometry?.coordinates,tolls=route?.tollAttributes?.tolls,categories=route?.tollAttributes?.categories;
 need(route?.geometry?.type==='LineString'&&Array.isArray(coords)&&coords.length>=2&&coords.length<=150000&&coords.every(point)&&Array.isArray(tolls)&&tolls.length===coords.length-1&&tolls.every(t=>t===0||t===1)&&Array.isArray(categories)&&categories.length===tolls.length&&categories.every(v=>Number.isInteger(v)&&v>=0&&v<=31),'Attributs du parcours absents.');
 const first=tolls.indexOf(1),last=tolls.lastIndexOf(1);
 if(first>=0)need(tolls.slice(first,last+1).every(Boolean),'Plusieurs portions payantes dans le parcours.');
 const distances=[0];for(let i=1;i<coords.length;i++){const length=meters(coords[i-1],coords[i]);distances.push(distances.at(-1)+(length>.05?length:0))}
 return {coords,tolls,categories,first,last,distances};
}
function projection(p,a,b){
 const x=111195*Math.cos((p[1]+a[1]+b[1])/3*Math.PI/180),y=111195,dx=(b[0]-a[0])*x,dy=(b[1]-a[1])*y,px=(p[0]-a[0])*x,py=(p[1]-a[1])*y,den=dx*dx+dy*dy;if(!den)return {fraction:0,distance:meters(p,a)};
 const fraction=(px*dx+py*dy)/den;return {fraction,distance:Math.hypot(px-fraction*dx,py-fraction*dy)};
}
// A start snapped inside the first remaining edge is accepted only on that same edge,
// with all subsequent vertices exactly equal and no reversal or skipped internal edge.
export function suffixEdge(expected,actual,minimum=0){
 need(Array.isArray(expected)&&expected.length>=2&&expected.every(point)&&Array.isArray(actual)&&actual.length>=2&&actual.every(point)&&Number.isInteger(minimum)&&minimum>=0&&minimum<expected.length-1,'Suffixe payant invalide.');
 for(let i=minimum;i<expected.length-1;i++){
  if(actual.length!==expected.length-i||!actual.slice(1).every((p,j)=>same(p,expected[i+j+1])))continue;
  const p=projection(actual[0],expected[i],expected[i+1]);
  if(same(actual[0],expected[i])||p.fraction>=0&&p.fraction<1&&p.distance<=1)return i;
 }
 fail('SECTION_CHANGED','La portion restante ne suit plus le tracé et le sens autorisés.');
}
export function selectedProgress(selection,route,state,previous,revision,now=Date.now()){
 const paid=selected(selection),b=bounds(route);need(typeof revision==='string'&&revision.length>0&&revision.length<=256&&finite(now),'Révision du guidage absente.');
 const prior=previous?copy(previous):{binding:selection.sectionKey,revision,phase:'before',minimumEdge:0,at:null,progress:0};
 need(prior.binding===selection.sectionKey&&prior.revision===revision&&['before','within','after'].includes(prior.phase)&&Number.isInteger(prior.minimumEdge)&&prior.minimumEdge>=0&&prior.minimumEdge<paid.coordinates.length-1,'Progression liée à un autre trajet.');
 if(state?.ignored||!['active','stop','arrived'].includes(state?.status))return freeze(prior);
 const fix=state.last;
 if(!fix||!point(fix.point)||!point(state.snapped)||!finite(fix.at)||!finite(fix.accuracy)||fix.accuracy<0||fix.accuracy>50||fix.at>now||now-fix.at>15000||!finite(state.progress)||state.progress<0||state.progress>b.distances.at(-1)+1)return freeze(prior);
 if(prior.at!==null&&(fix.at<=prior.at||state.progress<prior.progress-1||state.progress-prior.progress>(fix.at-prior.at)/1000*70+100))return freeze(prior);
 let edge=b.distances.findIndex((d,i)=>i<b.distances.length-1&&state.progress>=d-.01&&state.progress<=b.distances[i+1]+.01);if(edge<0)edge=b.coords.length-2;
 const p=projection(state.snapped,b.coords[edge],b.coords[edge+1]);if(p.fraction<-.001||p.fraction>1.001||p.distance>1.5||meters(fix.point,state.snapped)>Math.max(40,fix.accuracy*2))return freeze(prior);
 const projected=b.distances[edge]+Math.max(0,Math.min(1,p.fraction))*(b.distances[edge+1]-b.distances[edge]);if(Math.abs(projected-state.progress)>2)return freeze(prior);
 if(b.first<0){need(prior.phase==='after','La portion a disparu avant son passage confirmé.');return freeze({...prior,at:fix.at,progress:state.progress})}
 const firstOriginal=suffixEdge(paid.coordinates,b.coords.slice(b.first,b.last+2),0),margin=Math.max(10,fix.accuracy);
 let phase=prior.phase,minimumEdge=prior.minimumEdge;
 if(phase!=='after'&&state.progress>=b.distances[b.last+1]+margin)phase='after';
 else if(phase==='before'&&state.progress>=b.distances[b.first]+margin)phase='within';
 if(phase==='within'){
  const conservative=state.progress-margin;
  let local=b.first;for(let i=b.first;i<=b.last;i++)if(b.distances[i]<=conservative)local=i;
  minimumEdge=Math.max(minimumEdge,Math.min(paid.coordinates.length-2,firstOriginal+local-b.first));
 }
 return freeze({...prior,phase,minimumEdge,at:fix.at,progress:state.progress});
}
function validateDetails(raw){
 need(raw?.source==='ors'&&Array.isArray(raw.coordinates)&&Array.isArray(raw.tolls)&&Array.isArray(raw.categories),'Réponse de recalcul incomplète.');
 const runs=a=>a.map((v,i)=>[i,i+1,v]);return detailedRoute({type:'FeatureCollection',metadata:{query:{profile:'driving-car'},engine:{graph_date:raw.graphDate}},features:[{geometry:{type:'LineString',coordinates:raw.coordinates},properties:{summary:{distance:raw.distance,duration:raw.duration},segments:[{distance:raw.distance,duration:raw.duration,steps:raw.steps}],extras:{tollways:{values:runs(raw.tolls)},waycategory:{values:runs(raw.categories)}}}}]},raw.observedAt);
}
/** Propose a remaining route; caller must bind/adopt it only if its revision is still current.
 * position is an already validated device fix, progress only comes from selectedProgress.
 * A single pending genuine stop is supported; an in-section stop is never guessed.
 */
export async function recalculateSelected({selection,progress,position,destination,stop=null,revision},{calculate,now=Date.now,signal}={}){
 selection=copy(selection);progress=copy(progress);position=copy(position);destination=copy(destination);stop=copy(stop);check(signal);const paid=selected(selection),avoid=[...selection.context.avoid],allowHighway=selection.allowHighwayOnSection,started=now();
 need(typeof calculate==='function'&&typeof now==='function'&&point(destination)&&typeof revision==='string'&&revision,'Recalcul non configuré.');
 need(progress?.binding===selection.sectionKey&&progress.revision===revision&&['before','within','after'].includes(progress.phase)&&finite(progress.at)&&progress.at<=started&&started-progress.at<=60000&&Number.isInteger(progress.minimumEdge)&&progress.minimumEdge>=0&&progress.minimumEdge<paid.coordinates.length-1,'Passage de la portion insuffisamment confirmé.');
 need(point(position?.point)&&finite(position.at)&&position.at<=started&&started-position.at<=15000&&finite(position.accuracy)&&position.accuracy>=0&&position.accuracy<=50,'Position de recalcul non fiable.');
 if(stop)need(['before','after'].includes(stop.side)&&point(stop.point)&&(progress.phase==='before'||stop.side==='after'),'Arrêt restant incompatible avec la progression.');
 const entry=paid.coordinates[0],exit=paid.coordinates.at(-1),parts=[],stopAfter=[],requests=[];
 let current=copy(position.point),first=true;
 const fresh=r=>{const age=now()-Date.parse(r.observedAt);if(!finite(age)||age<0||age>300000)fail('STALE_ROUTE','Recalcul trop ancien.')};
 const request=async(target,kind,realStop=false)=>{
  check(signal);need(!same(current,target),'Étape restante dégénérée.');const from=copy(current),constraints=kind==='free'?avoid:avoid.filter(x=>x!=='tollways'&&!(allowHighway&&x==='highways'));
  const response=await calculate({coordinates:[from,copy(target)],avoid:[...constraints],vehicle:{type:'car'},alternatives:false},{signal,purpose:'remaining-'+kind});check(signal);const r=validateDetails(response);fresh(r);need(r.graphDate===paid.graphDate,'Le réseau a changé : nouvelle comparaison nécessaire.');
  need(first?meters(r.coordinates[0],from)<=20:same(r.coordinates[0],from),'Départ du recalcul non raccordé.');need(realStop?meters(r.coordinates.at(-1),target)<=20:same(r.coordinates.at(-1),target),'Arrivée du recalcul non raccordée.');
  for(const [name,flag] of [['highways',1],['ferries',8]])if(avoid.includes(name)&&r.categories.some((v,i)=>(v&flag)&&!(name==='highways'&&allowHighway&&kind!=='free'&&r.tolls[i]===1)))fail('EXCLUSION_LOST','Un évitement a changé pendant le recalcul.');
  if(kind==='free'){if(r.tolls.some(Boolean)||r.categories.some(v=>v&2))fail('TOLL_OUTSIDE','Un péage apparaît hors de la portion autorisée.')}
  else{
   const b=bounds({geometry:{type:'LineString',coordinates:r.coordinates},tollAttributes:r});need(b.first>=0&&b.last===r.tolls.length-1,'La portion payante restante n’est pas confirmée.');
   need(!r.categories.slice(0,b.first).some(v=>v&2),'Attribut de péage contradictoire.');
   const i=suffixEdge(paid.coordinates,r.coordinates.slice(b.first),kind==='paid'?0:progress.minimumEdge);
   if(kind==='paid')need(i===0&&b.first===0&&r.coordinates.length===paid.coordinates.length&&r.coordinates.every((p,j)=>same(p,paid.coordinates[j])),'La portion payante entière a changé.');
  }
  parts.push(r);requests.push({kind,from,to:copy(target)});current=copy(r.coordinates.at(-1));first=false;if(realStop)stopAfter.push(parts.length-1);
 };
 if(progress.phase==='before'){
  if(stop?.side==='before')await request(stop.point,'free',true);
  if(!same(current,entry))await request(entry,'free');
  await request(exit,'paid');
 }else if(progress.phase==='within'){
  need(!same(current,exit),'Sortie proche : passage à confirmer avant recalcul.');await request(exit,'remaining-paid');
 }
 if(stop?.side==='after')await request(stop.point,'free',true);
 await request(destination,'free');
 const route=await joinInstructions(parts,{calculate,stopAfter,avoid,allowHighwayOnSection:allowHighway,now,signal});check(signal);need(now()>=started&&now()-started<=300000,'Recalcul périmé.');
 const proposal=freeze({kind:'selected-toll-recalculation',binding:selection.sectionKey,revision,progressAt:progress.at,phase:progress.phase,minimumEdge:progress.minimumEdge,route,parts,stopAfter,requests,price:null,origin:position,proposedAt:now(),expiresAt:now()+300000,qualification:'CALCULATION_ONLY_NOT_ANDROID'});issued.set(proposal,{used:false});return proposal;
}
export function confirmRecalculation(proposal,selection,progress,revision,{now=Date.now(),position}={}){
 selected(selection);const receipt=issued.get(proposal);need(receipt&&!receipt.used,'Recalcul inconnu ou déjà adopté.');need(proposal?.kind==='selected-toll-recalculation'&&proposal.binding===selection.sectionKey&&progress?.binding===selection.sectionKey&&proposal.revision===revision&&progress.revision===revision&&proposal.progressAt===progress.at&&proposal.phase===progress.phase,'La progression ou le trajet a changé pendant le recalcul.');
 need(finite(now)&&now>=proposal.proposedAt&&now<=proposal.expiresAt,'Recalcul périmé.');
 need(point(position?.point)&&finite(position.at)&&position.at>=proposal.origin.at&&position.at<=now&&now-position.at<=15000&&finite(position.accuracy)&&position.accuracy>=0&&position.accuracy<=50&&meters(position.point,proposal.origin.point)<=50,'Position modifiée pendant le calcul : nouvelle proposition nécessaire.');receipt.used=true;return copy(proposal.route);
}

export function bindRecalculation(proposal,newRevision){const receipt=issued.get(proposal);need(receipt?.used&&!receipt.bound&&typeof newRevision==='string'&&newRevision&&newRevision.length<=256&&newRevision!==proposal.revision,'Nouvelle révision requise après adoption.');receipt.bound=true;return freeze({binding:proposal.binding,revision:newRevision,phase:proposal.phase,minimumEdge:proposal.minimumEdge,at:null,progress:0})}
