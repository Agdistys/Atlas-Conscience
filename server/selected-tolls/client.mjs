import {detailedRoute} from './route-adapter.mjs';
export const relayEndpoint='https://ouquandqui-routing.d-serant.workers.dev/api/route';
const messages={DAILY_LIMIT:'Quota gratuit quotidien atteint. Réessayer demain.',MINUTE_LIMIT:'Calculs trop rapprochés. Réessayer dans une minute.',UPSTREAM_LIMIT:'Service de calcul momentanément limité.',ROAD_ACCESS_RESTRICTED:'Accès routier réservé ou restreint. Choisir un autre point.',ORIGIN_REFUSED:'Cette page n’est pas autorisée à utiliser le service de calcul.',NOT_CONFIGURED:'Service de calcul indisponible.',UPSTREAM_ACCESS:'Service de calcul indisponible.',EXCLUSION_NOT_RESPECTED:'Les évitements ne sont pas confirmés.',INVALID_INSTRUCTIONS:'Les indications ne sont pas suffisamment précises pour ce parcours.'};
function request(input){
 const p=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite)&&Math.abs(v[0])<=180&&Math.abs(v[1])<=90;
 if(!input||input.vehicle?.type!=='car'||Object.keys(input.vehicle).length!==1||input.alternatives!==false||input.coordinates?.length!==2||!input.coordinates.every(p)||input.coordinates[0].every((n,i)=>n===input.coordinates[1][i])||!Array.isArray(input.avoid)||new Set(input.avoid).size!==input.avoid.length||input.avoid.some(x=>!['tollways','highways','ferries'].includes(x)))throw Error('Calcul limité à deux points voiture et aux évitements proposés.');
 return {coordinates:structuredClone(input.coordinates),avoid:[...input.avoid],vehicle:{type:'car'},alternatives:false};
}
export function createRelayCalculator({fetchImpl=fetch,now=Date.now,timeoutMs=25000}={}){
 if(typeof fetchImpl!=='function'||typeof now!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('Service non configuré.');
 let notBefore=0;const cache=new Map();
 return async(input,{signal}={})=>{
  const body=request(input);if(signal?.aborted)throw Object.assign(Error('Calcul annulé.'),{code:'CANCELLED'});
  const key=JSON.stringify(body),cached=cache.get(key),age=cached?now()-Date.parse(cached.observedAt):Infinity;
  if(age>=0&&age<=60000)return structuredClone(cached);if(cached)cache.delete(key);
  if(now()<notBefore)throw Object.assign(Error('Service temporairement limité. Réessayer plus tard.'),{code:'ROUTING_LIMIT',retryAt:notBefore});
  const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,timeoutMs);signal?.addEventListener('abort',abort,{once:true});
  try{
   const response=await fetchImpl(relayEndpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error'});
   if(response.redirected||response.status>=300&&response.status<400)throw Error('Redirection du service refusée.');
   const reader=response.body?.getReader();if(!reader)throw Error('Réponse du service vide.');let bytes=0;const chunks=[];
   try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>4*1024*1024){await reader.cancel();throw Error('Réponse du service trop volumineuse.')}chunks.push(value)}}finally{reader.releaseLock()}
   const dataBytes=new Uint8Array(bytes);let offset=0;for(const c of chunks){dataBytes.set(c,offset);offset+=c.length}
   const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(dataBytes));
   if(!response.ok){const code=typeof data?.error?.code==='string'?data.error.code:'ROUTING_UNAVAILABLE';
    if(response.status===429){const raw=response.headers.get('Retry-After'),seconds=raw&&/^\d+$/.test(raw)?Math.min(86400,Math.max(1,Number(raw))):code==='DAILY_LIMIT'?Math.ceil((Date.parse(new Date(now()).toISOString().slice(0,10)+'T00:00:00Z')+86400000-now())/1000):60;notBefore=now()+seconds*1000}
    throw Object.assign(Error(messages[code]||'Calcul indisponible. Réessayer volontairement plus tard.'),{code,retryAt:notBefore||null});
   }
   if(signal?.aborted||controller.signal.aborted)throw Object.assign(Error('Calcul annulé.'),{code:'CANCELLED'});
   // Freshness is the local receipt time, not a provider timestamp or fixture field.
   const result=detailedRoute(data,new Date(now()).toISOString());cache.set(key,structuredClone(result));if(cache.size>12)cache.delete(cache.keys().next().value);return result;
  }catch(e){if(signal?.aborted)throw Object.assign(Error('Calcul annulé.'),{code:'CANCELLED'});if(controller.signal.aborted)throw Object.assign(Error('Le calcul n’a pas répondu à temps. Réessayer.'),{code:'TIMEOUT'});throw e}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
 };
}
