// Browser-independent interaction state. The host owns the trip and must adopt explicitly.
import {createPlanner,sections} from './planner.mjs';
import {joinInstructions,withOutsideStop,meters} from './route-adapter.mjs';
const copy=v=>structuredClone(v),finite=n=>typeof n==='number'&&Number.isFinite(n),point=p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
const same=(a,b)=>point(a)&&point(b)&&a.every((n,i)=>Math.abs(n-b[i])<=1e-7);
const fail=(code,message)=>{throw Object.assign(Error(message),{code})};
const need=(v,message)=>{if(!v)fail('INVALID_CONTEXT',message)};
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o)}return o};
function context(raw){
 need(raw&&typeof raw.revision==='string'&&raw.revision&&raw.revision.length<=256&&raw.vehicle==='car'&&raw.optimization==='fastest'&&['1','2'].includes(raw.vehicleClass),'Comparaison disponible pour un trajet voiture au plus rapide.');
 need(Array.isArray(raw.coordinates)&&raw.coordinates.length===2&&raw.coordinates.every(point)&&!same(...raw.coordinates),'Départ et arrivée distincts requis.');
 need(Array.isArray(raw.avoid)&&raw.avoid.includes('tollways')&&new Set(raw.avoid).size===raw.avoid.length&&raw.avoid.every(x=>['tollways','highways','ferries'].includes(x)),'Conserver l’évitement des péages sur le reste du trajet.');
 need(typeof raw.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.date)&&Number.isFinite(Date.parse(raw.date))&&new Date(raw.date).toISOString().slice(0,10)===raw.date,'Date du trajet invalide.');
 return freeze({revision:raw.revision,vehicle:raw.vehicle,optimization:raw.optimization,vehicleClass:raw.vehicleClass,coordinates:copy(raw.coordinates),avoid:[...raw.avoid],date:raw.date});
}
const signature=c=>JSON.stringify(c);
/** All network calls use the same two-point contract. Provider failures are never retried.
 * state()/onChange contain copies. Confirmation consumes a private proposal once.
 * No storage writes, GPS start, fare inference or application mutation happens here.
 */
export function createSelectedTollSession({calculate,getContext,validateRoute=()=>{},onChange=()=>{},now=Date.now}={}){
 need([calculate,getContext,validateRoute,onChange,now].every(v=>typeof v==='function'),'Session de comparaison non configurée.');
 let state={status:'idle'},sequence=0,job=null,closed=false,comparison=null,pending=null,active=null,stopProposal=null;
 const publish=next=>{state=freeze(copy(next));onChange(copy(state));return copy(state)};
 const snapshot=()=>copy(state);
 const get=()=>context(getContext());
 const current=j=>!closed&&job===j&&!j.controller.signal.aborted&&signature(get())===j.signature;
 const guard=j=>{if(!current(j))fail('STALE_CONTEXT','Le trajet ou ses réglages ont changé. Recommencer la comparaison.')};
 const cancel=()=>{job?.controller.abort();job=null;pending=null;stopProposal=null;sequence++};
 const begin=(status,source=null)=>{need(!closed,'Comparaison fermée.');const c=get();cancel();const j=job={context:c,signature:signature(c),controller:new AbortController(),id:sequence};if(source)need(source.signature===j.signature,'Le trajet a changé. Recommencer la comparaison.');publish({...state,status,error:null});return j};
 const call=j=>async(request,options={})=>{
  guard(j);const avoid=request.avoid??request.options?.avoid_features;
  need(Array.isArray(request.coordinates)&&request.coordinates.length===2&&request.coordinates.every(point)&&Array.isArray(avoid),'Requête de calcul invalide.');
  const result=await calculate({coordinates:copy(request.coordinates),avoid:[...avoid],vehicle:{type:'car'},alternatives:false},{...options,signal:j.controller.signal});guard(j);return result;
 };
 const catchJob=(j,e)=>{if(job===j&&!closed){pending=null;stopProposal=null;publish({...state,status:'error',error:{code:e.code||'CALCULATION_FAILED',message:e.message}})}throw e};
 const validateFree=(r,graph,start,end,avoid)=>{
  need(r.graphDate===graph&&same(r.geometry.coordinates[0],start)&&same(r.geometry.coordinates.at(-1),end),'Raccordement de la référence sans péage non confirmé.');
  need(!r.tollAttributes.tolls.some(Boolean)&&!r.tollAttributes.categories.some(v=>v&2),'Un péage subsiste sur la référence gratuite.');
  for(const [name,flag] of [['highways',1],['ferries',8]])if(avoid.includes(name))need(!r.tollAttributes.categories.some(v=>v&flag),'Un évitement initial a changé.');
 };
 return {
  state:snapshot,
  async compare({allowHighwayOnSection=false}={}){
   need(typeof allowHighwayOnSection==='boolean','Exception autoroutière invalide.');const j=begin('comparing');comparison=null;active=null;
   try{
    const c=j.context,calc=call(j),referenceAvoid=c.avoid.filter(x=>x!=='tollways'&&!(allowHighwayOnSection&&x==='highways'));
    const reference=await calc({coordinates:c.coordinates,avoid:referenceAvoid});
    // Also validate instructions and every declared avoidance on the reference.
    const referenceRoute=await joinInstructions([reference],{calculate:calc,avoid:referenceAvoid,now,signal:j.controller.signal});
    const endpoints=[referenceRoute.geometry.coordinates[0],referenceRoute.geometry.coordinates.at(-1)];
    need(endpoints.every((p,i)=>meters(p,c.coordinates[i])<=20),'Accès routier éloigné du lieu choisi.');
    const baseline=await calc({coordinates:endpoints,avoid:c.avoid});
    const baselineRoute=await joinInstructions([baseline],{calculate:calc,avoid:c.avoid,now,signal:j.controller.signal});
    validateFree(baselineRoute,referenceRoute.graphDate,...endpoints,c.avoid);guard(j);
    comparison={signature:j.signature,context:c,reference,baseline,baselineRoute,allowHighwayOnSection};
    const choices=sections(reference).map((s,index)=>({...s,number:index+1,road:[...new Set(reference.steps.filter(step=>step.way_points[0]<s.to&&step.way_points[1]>s.from).map(step=>step.name).filter(name=>name&&name!=='-'))].slice(0,3).join(' / '),coordinates:reference.coordinates.slice(s.from,s.to+1),distance:reference.coordinates.slice(s.from+1,s.to+1).reduce((n,p,i)=>n+meters(reference.coordinates[s.from+i],p),0),price:null}));
    return publish({status:'choices',context:c,baseline:baselineRoute,reference:referenceRoute,sections:choices,allowHighwayOnSection,proposal:null,error:null});
   }catch(e){return catchJob(j,e)}
  },
  async choose(sectionId,{quote=null,maxCents=null}={}){
   need(comparison,'Comparer les trajets avant de choisir une portion.');const j=begin('calculating',comparison);
   try{
    const c=comparison,calc=call(j),planner=createPlanner({calculate:calc,now});
    const proposal=await planner.propose({reference:c.reference,baseline:c.baseline,sectionId,context:c.context,allowHighwayOnSection:c.allowHighwayOnSection,quote,maxCents,signal:j.controller.signal});
    const route=await joinInstructions(proposal.parts,{calculate:calc,avoid:c.context.avoid,allowHighwayOnSection:c.allowHighwayOnSection,now,signal:j.controller.signal});guard(j);
    validateRoute(copy(route),{kind:'selection',context:copy(c.context)});guard(j);
    pending={planner,proposal,route,signature:j.signature,job:j};
    return publish({...state,status:'proposal',proposal:{section:copy(proposal.section),route,price:proposal.price,maxCents,deltaDistance:route.distance-c.baselineRoute.distance,deltaDuration:route.duration-c.baselineRoute.duration,expiresAt:proposal.expiresAt},error:null});
   }catch(e){return catchJob(j,e)}
  },
  confirm(){
   need(pending&&state.status==='proposal','Aucune proposition prête à confirmer.');const p=pending;guard(p.job);
   validateRoute(copy(p.route),{kind:'selection',context:copy(p.job.context)});guard(p.job);
   const selection=p.planner.confirm(p.proposal,get().revision,{signal:p.job.controller.signal});
   active={selection,route:copy(p.route),signature:p.signature,stop:null};pending=null;
   publish({...state,status:'confirmed',proposal:null,active});return copy(active);
  },
  async prepareStop(stop){
   need(active,'Confirmer une portion avant de choisir un arrêt.');const j=begin('calculating-stop',active);stop=copy(stop);
   try{
    const s=active.selection,proposal=await withOutsideStop(s.parts,stop,{calculate:call(j),avoid:s.context.avoid,allowHighwayOnSection:s.allowHighwayOnSection,now,signal:j.controller.signal});guard(j);
    validateRoute(copy(proposal.route),{kind:'stop',context:copy(j.context),stop:copy(stop)});guard(j);
    stopProposal={proposal,stop,job:j,active,created:now()};return publish({...state,status:'stop-proposal',stopProposal:proposal,error:null});
   }catch(e){return catchJob(j,e)}
  },
  confirmStop(){
   const p=stopProposal;need(p&&state.status==='stop-proposal'&&active===p.active,'Arrêt non confirmé ou remplacé.');guard(p.job);
   need(now()>=p.created&&now()-p.created<=300000,'L’arrêt proposé a expiré.');validateRoute(copy(p.proposal.route),{kind:'stop',context:copy(p.job.context),stop:copy(p.stop)});guard(p.job);
   active={...active,route:copy(p.proposal.route),stop:copy(p.stop)};stopProposal=null;publish({...state,status:'confirmed',active,stopProposal:null});return copy(active);
  },
  cancel(){cancel();publish({...state,status:comparison?'choices':'idle',proposal:null,stopProposal:null,error:null})},
  close(){cancel();closed=true;comparison=null;active=null;publish({status:'closed'})}
 };
}
