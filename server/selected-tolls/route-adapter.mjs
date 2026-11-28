// ORS instructions remain attributable to the provider. No inferred turn at a join.
import {normalizeOrs} from './planner.mjs';
const copy=v=>structuredClone(v),finite=n=>typeof n==='number'&&Number.isFinite(n);
const fail=(code,message)=>{throw Object.assign(new Error(message),{code})};
const require=(v,message)=>{if(!v)fail('INVALID_INSTRUCTIONS',message)};
const same=(a,b)=>a?.length===2&&b?.length===2&&a.every((n,i)=>Math.abs(n-b[i])<=1e-7);
const check=signal=>{if(signal?.aborted)fail('CANCELLED','Calcul annulé.')};
const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o)}return o};
export function meters(a,b){const rad=Math.PI/180,x=Math.sin((b[1]-a[1])*rad/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin((b[0]-a[0])*rad/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(x)))}
export function detailedRoute(data,receivedAt){
 const route=normalizeOrs(data,receivedAt),raw=data.features[0].properties.segments[0].steps,n=route.coordinates.length-1;
 require(Array.isArray(raw)&&raw.length>=2&&raw.length<=3000,'Manœuvres absentes ou trop nombreuses.');let cursor=0;
 const steps=raw.map((s,i)=>{
  const w=s.way_points;
  require(Array.isArray(w)&&w.length===2&&w.every(Number.isSafeInteger)&&w[0]===cursor&&w[1]>=cursor&&w[1]<=n,'Coupure dans les instructions.');
  require(finite(s.distance)&&s.distance>=0&&finite(s.duration)&&s.duration>=0&&Number.isInteger(s.type)&&s.type>=0&&s.type<=13,'Mesures ou type de manœuvre invalides.');
  require(i===0?s.type===11:i===raw.length-1?s.type===10:![10,11].includes(s.type),'Ordre des manœuvres incohérent.');
  require(i===raw.length-1?w[0]===w[1]&&s.distance===0&&s.duration===0:w[1]>w[0],'Étendue de manœuvre invalide.');
  require(typeof s.instruction==='string'&&s.instruction.trim()&&s.instruction.length<=1000&&typeof s.name==='string'&&s.name.length<=500,'Texte de manœuvre invalide.');
  if(s.type===7)require(Number.isInteger(s.exit_number)&&s.exit_number>=1&&s.exit_number<=99,'Sortie de rond-point non renseignée.');
  const coords=route.coordinates.slice(w[0],w[1]+1),length=coords.slice(1).reduce((sum,p,j)=>sum+meters(coords[j],p),0);
  require(Math.abs(length-s.distance)<=Math.max(8,s.distance*.06),'Distance de manœuvre incohérente avec le tracé.');
  cursor=w[1];return {distance:s.distance,duration:s.duration,type:s.type,instruction:s.instruction,name:s.name,way_points:[...w],...(s.type===7?{exit_number:s.exit_number}:{})};
 });
 require(cursor===n&&Math.abs(steps.reduce((a,s)=>a+s.distance,0)-route.distance)<=Math.max(2,steps.length*.11)&&Math.abs(steps.reduce((a,s)=>a+s.duration,0)-route.duration)<=Math.max(2,steps.length*.11),'Totaux ou couverture des manœuvres incohérents.');
 return freeze({...route,steps});
}
const types={0:['turn','left'],1:['turn','right'],2:['turn','sharp left'],3:['turn','sharp right'],4:['turn','slight left'],5:['turn','slight right'],6:['continue','straight'],7:['roundabout'],8:['exit roundabout'],9:['turn','uturn'],10:['arrive'],11:['depart'],12:['fork','slight left'],13:['fork','slight right']};
export function maneuver(step,location){
 const value=types[step.type];require(value,'Type de manœuvre non reconnu.');
 if(step.type===7)require(Number.isInteger(step.exit_number)&&step.exit_number>=1&&step.exit_number<=99,'Sortie de rond-point non renseignée.');
 return {type:value[0],...(value[1]?{modifier:value[1]}:{}),...(step.type===7?{exit:step.exit_number}:{}),location:[...location]};
}
function validatePart(part){
 // Revalidate even trusted callback values; preserve no caller-owned references.
 const r=copy(part),runs=values=>{const out=[];for(let i=0;i<values.length;){let j=i+1;while(j<values.length&&values[j]===values[i])j++;out.push([i,j,values[i]]);i=j}return out};
 require(Array.isArray(r?.coordinates)&&Array.isArray(r?.tolls)&&Array.isArray(r?.categories),'Partie de trajet incomplète.');
 return detailedRoute({type:'FeatureCollection',metadata:{query:{profile:'driving-car'},engine:{graph_date:r.graphDate}},features:[{geometry:{type:'LineString',coordinates:r.coordinates},properties:{summary:{distance:r.distance,duration:r.duration},segments:[{distance:r.distance,duration:r.duration,steps:r.steps}],extras:{tollways:{values:runs(r.tolls)},waycategory:{values:runs(r.categories)}}}}]},r.observedAt);
}
function exactGeometry(a,b){return a.length===b.length&&a.every((p,i)=>same(p,b[i]))}
/** Resolve the instructions across calculation boundaries by querying overlapping road segments.
 * Real passenger/station stops retain arrive/depart; computational toll boundaries do not.
 * calculate receives only public route fields, never a key, name or profile record.
 */
export async function joinInstructions(input,{calculate,stopAfter=[],avoid=['tollways'],allowHighwayOnSection=false,now=Date.now,signal}={}){
 require(typeof calculate==='function'&&typeof now==='function'&&Array.isArray(input)&&input.length>=1&&input.length<=10,'Assemblage de trajet invalide.');
 require(Array.isArray(stopAfter)&&new Set(stopAfter).size===stopAfter.length&&stopAfter.every(i=>Number.isInteger(i)&&i>=0&&i<input.length-1),'Arrêts intermédiaires invalides.');
 require(Array.isArray(avoid)&&new Set(avoid).size===avoid.length&&avoid.every(x=>['tollways','highways','ferries'].includes(x))&&typeof allowHighwayOnSection==='boolean','Évitements invalides.');
 input=copy(input);stopAfter=[...stopAfter];avoid=[...avoid];const started=now();
 const fresh=r=>{const age=now()-Date.parse(r.observedAt);if(!finite(age)||age<0||age>300000)fail('STALE_ROUTE','Instructions anciennes : recalculer le trajet.')};
 check(signal);const parts=input.map(validatePart);for(const p of parts)fresh(p);
 const graph=parts[0].graphDate,coordinates=[],tolls=[],categories=[],raw=[],boundaries=[];let offset=0;
 parts.forEach((p,i)=>{
  require(p.graphDate===graph,'Le réseau a changé.');
  if(i)require(same(coordinates.at(-1),p.coordinates[0]),'Raccordement routier non exact.');
  coordinates.push(...p.coordinates.slice(i?1:0));tolls.push(...p.tolls);categories.push(...p.categories);
  for(const s of p.steps)raw.push({...s,way_points:s.way_points.map(n=>n+offset),part:i});
  offset+=p.coordinates.length-1;if(i<parts.length-1)boundaries.push({index:offset,part:i,stop:stopAfter.includes(i)});
 });
 require(coordinates.length<=150000&&raw.length<=6000,'Parcours trop volumineux pour le guidage.');
 for(const [name,flag] of [['highways',1],['ferries',8]])if(avoid.includes(name)&&categories.some((v,i)=>(v&flag)&&!(name==='highways'&&allowHighwayOnSection&&tolls[i]===1)))fail('EXCLUSION_LOST','Un évitement initial n’est pas respecté.');
 const windows=[];
 for(const seam of boundaries.filter(x=>!x.stop)){
  const before=raw.filter(s=>s.part===seam.part&&s.type!==10).at(-1),after=raw.find(s=>s.part===seam.part+1&&s.type===11);
  const w={from:before.way_points[0],to:after.way_points[1]},last=windows.at(-1);
  // Touching windows stay separate: the second original instruction is preserved.
  if(last&&w.from<last.to)last.to=Math.max(last.to,w.to);else windows.push(w);
 }
 let stitched=raw.map(copy);const bridges=[];
 for(const w of windows){
  check(signal);for(const p of parts)fresh(p);
  const expected=coordinates.slice(w.from,w.to+1),targetTolls=tolls.slice(w.from,w.to),targetCategories=categories.slice(w.from,w.to);
  const paid=targetTolls.some(Boolean),insideAvoid=avoid.filter(x=>!(paid&&x==='tollways')&&!(paid&&allowHighwayOnSection&&x==='highways'));
  const response=await calculate({coordinates:[copy(expected[0]),copy(expected.at(-1))],avoid:insideAvoid,vehicle:{type:'car'},alternatives:false},{signal,purpose:'instruction-join'});
  check(signal);const bridge=validatePart(response);fresh(bridge);
  if(bridge.graphDate!==graph||!exactGeometry(bridge.coordinates,expected)||bridge.tolls.some((v,i)=>v!==targetTolls[i])||bridge.categories.some((v,i)=>v!==targetCategories[i]))fail('JOIN_CHANGED','Les instructions de raccordement ne suivent pas exactement le trajet choisi.');
  for(const [name,flag] of [['tollways',2],['highways',1],['ferries',8]])if(insideAvoid.includes(name)&&(bridge.categories.some(v=>v&flag)||name==='tollways'&&bridge.tolls.some(Boolean)))fail('EXCLUSION_LOST','Un évitement a changé pendant le raccordement.');
  const first=raw.find(s=>s.way_points[0]===w.from&&s.type!==10);
  require(first&&first.type!==10,'Première manœuvre du raccordement absente.');
  const replacement=bridge.steps.slice(0,-1).map((s,i)=>({...s,...(!i?{type:first.type,instruction:first.instruction,name:first.name,...(first.exit_number?{exit_number:first.exit_number}:{})}:{}),way_points:s.way_points.map(n=>n+w.from),part:first.part}));
  const start=stitched.findIndex(s=>s.way_points[0]===w.from&&s.type!==10);
  let end=start;while(end<stitched.length&&stitched[end].way_points[0]<w.to)end++;
  require(start>=0&&end>start&&stitched[end]?.way_points[0]===w.to,'Fenêtre de raccordement incomplète.');
  stitched.splice(start,end-start,...replacement);bridges.push({from:w.from,to:w.to,observedAt:bridge.observedAt});
 }
 check(signal);for(const p of parts)fresh(p);require(now()>=started&&now()-started<=300000,'Assemblage périmé.');
 // User stops are the only internal arrive/depart pairs permitted in the final route.
 const ends=[...boundaries.filter(x=>x.stop).map(x=>x.index),coordinates.length-1];let start=0,pos=0;
 const legs=ends.map(end=>{
  const steps=[];while(pos<stitched.length){const s=stitched[pos++],[a,b]=s.way_points;require(a>=start&&b<=end,'Manœuvre hors de son étape.');const points=coordinates.slice(a,b+1);if(points.length===1)points.push([...points[0]]);steps.push({distance:s.distance,duration:s.duration,name:s.name==='-'?'':s.name,providerInstruction:s.instruction,maneuver:maneuver(s,coordinates[a]),geometry:{type:'LineString',coordinates:points}});if(s.type===10)break}
  require(steps.length>=2&&steps[0].maneuver.type==='depart'&&steps.at(-1).maneuver.type==='arrive'&&steps.slice(1,-1).every(s=>!['depart','arrive'].includes(s.maneuver.type)),'Départ ou arrivée artificielle dans le guidage.');
  const leg={distance:steps.reduce((a,s)=>a+s.distance,0),duration:steps.reduce((a,s)=>a+s.duration,0),steps};start=end;return leg;
 });
 require(pos===stitched.length&&stitched.length<=6000,'Manœuvres restantes ou trop nombreuses.');
 return freeze({geometry:{type:'LineString',coordinates},distance:legs.reduce((a,l)=>a+l.distance,0),duration:legs.reduce((a,l)=>a+l.duration,0),legs,alternatives:[],provider:'openrouteservice',graphDate:graph,observedAt:new Date(now()).toISOString(),tollAttributes:{tolls,categories},instructionJoins:bridges,qualification:'INSTRUCTIONS_JOINED_NOT_PHYSICAL_VALIDATION'});
}

/** Propose one genuine stop outside the paid range. No adoption, price transfer or GPS inference. */
export async function withOutsideStop(input,stop,{calculate,avoid=['tollways'],allowHighwayOnSection=false,now=Date.now,signal}={}){
 input=copy(input);stop=copy(stop);avoid=[...avoid];check(signal);
 require(typeof calculate==='function'&&typeof now==='function'&&input?.length===3,'Trois parties de trajet sont nécessaires.');
 require(['before','after'].includes(stop?.side)&&Array.isArray(stop.point)&&stop.point.length===2&&stop.point.every(finite)&&Math.abs(stop.point[0])<=180&&Math.abs(stop.point[1])<=90,'Choisir un arrêt avant ou après la portion payante.');
 require(avoid.includes('tollways')&&new Set(avoid).size===avoid.length&&avoid.every(x=>['tollways','highways','ferries'].includes(x)),'Les péages doivent rester évités hors de la portion.');
 const parts=input.map(validatePart),fresh=r=>{const age=now()-Date.parse(r.observedAt);if(!finite(age)||age<0||age>300000)fail('STALE_ROUTE','Trajet ancien : comparer à nouveau avant l’arrêt.')};
 for(const p of parts)fresh(p);const graph=parts[0].graphDate;
 require(parts.every(p=>p.graphDate===graph)&&same(parts[0].coordinates.at(-1),parts[1].coordinates[0])&&same(parts[1].coordinates.at(-1),parts[2].coordinates[0]),'Raccordements de la portion non vérifiés.');
 require(parts[1].tolls.every(t=>t===1),'Portion payante non confirmée.');
 const outside=r=>{fresh(r);require(r.graphDate===graph,'Le réseau a changé.');if(r.tolls.some(Boolean)||r.categories.some(v=>v&2))fail('TOLL_OUTSIDE','Un péage subsiste sur l’accès à l’arrêt.');for(const [name,flag] of [['highways',1],['ferries',8]])if(avoid.includes(name)&&r.categories.some(v=>v&flag))fail('EXCLUSION_LOST','Un évitement n’est pas respecté pour cet arrêt.')};
 outside(parts[0]);outside(parts[2]);const index=stop.side==='before'?0:2,part=parts[index],start=part.coordinates[0],end=part.coordinates.at(-1);
 require(!same(stop.point,start)&&!same(stop.point,end),'L’arrêt doit être distinct des limites de la portion.');
 const request=async(a,b)=>{check(signal);const r=validatePart(await calculate({coordinates:[copy(a),copy(b)],avoid:[...avoid],vehicle:{type:'car'},alternatives:false},{signal,purpose:'station-access'}));check(signal);outside(r);return r};
 const first=await request(start,stop.point),actual=first.coordinates.at(-1);
 require(same(first.coordinates[0],start)&&meters(actual,stop.point)<=20,'Accès routier à la station trop éloigné.');
 require(!same(actual,start)&&!same(actual,end),'Arrêt rattaché à une limite du trajet.');
 const second=await request(actual,end);require(same(second.coordinates[0],actual)&&same(second.coordinates.at(-1),end),'Raccordement de l’arrêt non exact.');
 parts.splice(index,1,first,second);
 const route=await joinInstructions(parts,{calculate,stopAfter:[index],avoid,allowHighwayOnSection,now,signal});
 return freeze({kind:'selected-toll-station-proposal',route,stop:{side:stop.side,requestedPoint:stop.point,roadPoint:copy(actual),snapMeters:meters(actual,stop.point),physicalEntranceVerified:false},parts,stopAfter:[index],requiresConfirmation:true,price:null});
}
