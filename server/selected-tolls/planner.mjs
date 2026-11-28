// Preparation only: no network, storage, provider activation, or GPS side effects.
// A trusted adapter must supply complete ORS edge attributes; live qualification is separate.
const reject = (code, message) => { throw Object.assign(new Error(message), { code }); };
const copy = value => structuredClone(value);
const finite = n => typeof n === 'number' && Number.isFinite(n);
const point = p => Array.isArray(p) && p.length === 2 && p.every(finite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
const same = (a,b) => point(a) && point(b) && a.every((n,i) => Math.abs(n-b[i]) <= 1e-7);
const instant = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
const day = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && instant(s+'T12:00:00Z') && new Date(s+'T12:00:00Z').toISOString().slice(0,10) === s;
const freeze = o => { if(o && typeof o === 'object') { for(const v of Object.values(o)) freeze(v); Object.freeze(o); } return o; };
const check = signal => { if(signal?.aborted) reject('CANCELLED','Calcul annulé.'); };
const required = (v, message) => { if(!v) reject('INVALID_DATA',message); };
const maxPoints = 20000;

function coverage(values, count, accepts) {
  required(Array.isArray(values) && values.length > 0 && values.length <= count, 'Attributs routiers absents.');
  const result=[];let cursor=0;
  for(const row of values) {
    required(Array.isArray(row) && row.length===3, 'Plage d’attributs invalide.');
    const [a,b,value]=row;
    required(Number.isSafeInteger(a) && Number.isSafeInteger(b) && a===cursor && b>a && b<=count && accepts(value), 'Attributs incomplets, superposés ou inconnus.');
    for(let i=a;i<b;i++) result.push(value);
    cursor=b;
  }
  required(cursor===count,'Une partie du tracé ne possède pas d’attributs.');
  return result;
}

export function normalizeOrs(data, observedAt) {
  required(instant(observedAt), 'Date de réception absente.');
  required(data?.type==='FeatureCollection' && data.features?.length===1 && !data.error, 'Réponse de calcul invalide.');
  const f=data.features[0],p=f?.properties,g=f?.geometry,graphDate=data.metadata?.engine?.graph_date;
  required(instant(graphDate), 'Version du réseau inconnue.');
  required(data.metadata?.query?.profile==='driving-car', 'Profil automobile non confirmé.');
  required(g?.type==='LineString' && Array.isArray(g.coordinates) && g.coordinates.length>=2 && g.coordinates.length<=maxPoints && g.coordinates.every(point), 'Tracé invalide.');
  required(finite(p?.summary?.distance) && p.summary.distance>0 && finite(p.summary.duration) && p.summary.duration>0, 'Distance ou durée invalide.');
  required(Array.isArray(p.segments) && p.segments.length===1 && finite(p.segments[0].distance) && finite(p.segments[0].duration) && Math.abs(p.segments[0].distance-p.summary.distance)<=1 && Math.abs(p.segments[0].duration-p.summary.duration)<=1 && !p.warnings?.length, 'Segments incomplets ou réserve du moteur.');
  const tolls=coverage(p.extras?.tollways?.values,g.coordinates.length-1,n=>n===0||n===1);
  const categories=coverage(p.extras?.waycategory?.values,g.coordinates.length-1,n=>Number.isSafeInteger(n)&&n>=0&&n<=31);
  return freeze({source:'ors',graphDate,observedAt,coordinates:copy(g.coordinates),distance:p.summary.distance,duration:p.summary.duration,tolls,categories});
}

function validRoute(route) {
  required(route?.source==='ors' && instant(route.graphDate) && instant(route.observedAt), 'Provenance du tracé invalide.');
  required(Array.isArray(route.coordinates) && route.coordinates.length>=2 && route.coordinates.length<=maxPoints && route.coordinates.every(point), 'Tracé invalide.');
  required(finite(route.distance) && route.distance>0 && finite(route.duration) && route.duration>0, 'Mesures invalides.');
  const n=route.coordinates.length-1;
  required(route.tolls?.length===n && route.tolls.every(v=>v===0||v===1) && route.categories?.length===n && route.categories.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=31), 'Couverture routière incomplète.');
  return route;
}
const identity = r => JSON.stringify([r.source,r.graphDate,r.coordinates,r.tolls,r.categories]);
function matches(route, start, end, graphDate, avoid) {
  validRoute(route);
  required(route.graphDate===graphDate, 'Le réseau a changé : nouvelle comparaison nécessaire.');
  required(same(route.coordinates[0],start) && same(route.coordinates.at(-1),end), 'L’entrée ou la sortie n’est pas raccordée exactement.');
  // Ambiguous category/profile toll flags cannot certify a free approach.
  if(avoid.includes('tollways') && (route.tolls.some(Boolean)||route.categories.some(v=>v&2))) reject('TOLL_OUTSIDE','Un péage subsiste hors de la portion autorisée.');
  for(const [name,flag] of [['highways',1],['ferries',8]]) if(avoid.includes(name) && route.categories.some(v=>v&flag)) reject('EXCLUSION_LOST','Un autre évitement n’est pas respecté.');
}

export function sections(reference) {
  validRoute(reference);const result=[];
  for(let a=0;a<reference.tolls.length;) {
    if(!reference.tolls[a]){a++;continue;}
    let b=a+1;while(b<reference.tolls.length && reference.tolls[b])b++;
    // A trip beginning or ending inside a paid area does not identify both boundaries.
    if(a>0 && b<reference.tolls.length) result.push(freeze({id:`${a}:${b}`,from:a,to:b,entry:copy(reference.coordinates[a]),exit:copy(reference.coordinates[b])}));
    a=b;
  }
  return result;
}

export function orsRequest(start, end, avoid) {
  required(point(start)&&point(end)&&!same(start,end), 'Deux points distincts sont nécessaires.');
  required(Array.isArray(avoid)&&new Set(avoid).size===avoid.length&&avoid.every(x=>['tollways','highways','ferries'].includes(x)), 'Évitements invalides.');
  return freeze({coordinates:[copy(start),copy(end)],preference:'fastest',units:'m',geometry:true,instructions:true,language:'fr',radiuses:[20,20],extra_info:['tollways','waycategory'],options:{avoid_features:[...avoid]}});
}

function quotedPrice(quote, context, sectionKey) {
  if(quote==null)return null;
  let source;try{source=new URL(quote.source);}catch{reject('PRICE_UNVERIFIED','Source du tarif absente.');}
  if(!Number.isSafeInteger(quote.cents)||quote.cents<0||quote.cents>100000||quote.currency!=='EUR'||quote.vehicleClass!==context.vehicleClass||quote.date!==context.date||quote.sectionKey!==sectionKey||source.protocol!=='https:'||source.username||source.password)reject('PRICE_UNVERIFIED','Tarif non rattaché à cette portion, cette classe ou cette date.');
  return {cents:quote.cents,currency:'EUR',vehicleClass:quote.vehicleClass,date:quote.date,source:source.href,sectionKey};
}

export function selectionKey(reference,id) {
  const section=sections(reference).find(s=>s.id===id);
  required(section,'Portion absente du tracé de référence.');
  return JSON.stringify([identity(reference),id]);
}

export function createPlanner({calculate, now=Date.now, ttlMs=300000}={}) {
  required(typeof calculate==='function'&&typeof now==='function'&&Number.isSafeInteger(ttlMs)&&ttlMs>0&&ttlMs<=300000,'Calculateur ou durée de validité invalide.');
  const proposals=new WeakMap();
  return {
    async propose({reference,baseline,sectionId,context,quote=null,maxCents=null,allowHighwayOnSection=false,signal}={}) {
      // Capture the complete intent before the first await; callers cannot edit it mid-flight.
      reference=copy(reference);baseline=copy(baseline);context=copy(context);quote=copy(quote);
      check(signal);validRoute(reference);validRoute(baseline);
      const startedAt=now();
      const fresh=r=>{ const age=now()-Date.parse(r.observedAt); if(!finite(age)||age<0||age>ttlMs)reject('STALE_ROUTE','Tracé trop ancien ou daté dans le futur.'); };
      fresh(reference);fresh(baseline);
      required(typeof context?.revision==='string'&&context.revision.length>0&&context.revision.length<=256&&context.vehicle==='car'&&['1','2'].includes(context.vehicleClass)&&day(context.date),'Contexte du trajet invalide ou véhicule non qualifié.');
      required(Array.isArray(context.avoid)&&context.avoid.includes('tollways')&&context.avoid.length<=3&&new Set(context.avoid).size===context.avoid.length&&context.avoid.every(x=>['tollways','highways','ferries'].includes(x)), 'L’évitement général des péages doit rester actif.');
      required(typeof allowHighwayOnSection==='boolean'&&(maxCents===null||Number.isSafeInteger(maxCents)&&maxCents>=0&&maxCents<=100000),'Plafond ou exception locale invalide.');
      const chosen=sections(reference).find(s=>s.id===sectionId);required(chosen,'Sélection périmée ou limites inconnues.');
      const start=reference.coordinates[0],end=reference.coordinates.at(-1),key=selectionKey(reference,sectionId),price=quotedPrice(quote,context,key);
      if(maxCents!==null && (!price||price.cents>maxCents))reject('PRICE_LIMIT','Le prix de cette portion ne respecte pas le plafond ou reste inconnu.');
      matches(baseline,start,end,reference.graphDate,context.avoid);
      const insideAvoid=context.avoid.filter(x=>x!=='tollways'&&!(allowHighwayOnSection&&x==='highways'));
      const parts=[];const limits=[[start,chosen.entry,context.avoid],[chosen.entry,chosen.exit,insideAvoid],[chosen.exit,end,context.avoid]];
      for(let i=0;i<limits.length;i++) {
        check(signal);const [a,b,avoid]=limits[i],request=orsRequest(a,b,avoid);
        const part=copy(await calculate(request,{signal,part:['before','selected','after'][i]}));check(signal);fresh(part);matches(part,a,b,reference.graphDate,avoid);
        if(i===1) {
          const expected=reference.coordinates.slice(chosen.from,chosen.to+1);
          if(part.coordinates.length!==expected.length||!part.coordinates.every((p,j)=>same(p,expected[j]))||part.tolls.some(v=>v!==1))reject('SECTION_CHANGED','La portion calculée diffère de celle choisie : aucune adoption.');
        }
        parts.push(part);
      }
      const coordinates=parts.flatMap((p,i)=>p.coordinates.slice(i?1:0)),distance=parts.reduce((n,p)=>n+p.distance,0),duration=parts.reduce((n,p)=>n+p.duration,0);
      const proposedAt=now();required(finite(proposedAt),'Horloge invalide.');
      if(proposedAt<startedAt||proposedAt-startedAt>ttlMs)reject('STALE_ROUTE','Le calcul doit être renouvelé.');
      const proposal=freeze({kind:'selected-toll-section',context,section:chosen,sectionKey:key,price,maxCents,allowHighwayOnSection,parts,coordinates,distance,duration,deltaDistance:distance-baseline.distance,deltaDuration:duration-baseline.duration,proposedAt,expiresAt:proposedAt+ttlMs,qualification:'MODEL_ONLY_NOT_LIVE'});
      proposals.set(proposal,{revision:context.revision,consumed:false});return proposal;
    },
    confirm(proposal, revision, {signal}={}) {
      check(signal);const saved=proposals.get(proposal);
      if(!saved||saved.consumed)reject('INVALID_PROPOSAL','Proposition inconnue ou déjà appliquée.');
      if(revision!==saved.revision)reject('STALE_PROPOSAL','Le trajet ou ses réglages ont changé.');
      const time=now();if(!finite(time)||time<proposal.proposedAt||time>proposal.expiresAt)reject('EXPIRED_PROPOSAL','La proposition doit être recalculée.');
      saved.consumed=true;return copy(proposal);
    }
  };
}
