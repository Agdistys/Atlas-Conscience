import {safeFacebookURL, classifyFacebook} from '../../core.mjs';
const SERVICE='ancrage-ami-resolver', TIMEOUT=8000, MAX_BYTES=524288, MAX_REDIRECTS=5;
class ResolutionError extends Error {
  constructor(code,message,status=422){super(message);this.code=code;this.status=status;}
}
const failure=(code,msg,status)=>{throw new ResolutionError(code,msg,status);};
const loginPath=u=>/^\/(login|checkpoint|recover|consent|privacy\/consent|two_step_verification)(\/|\.|$)/i.test(u.pathname);
function canonical(u) { try {const info=classifyFacebook(u.href); return info.needsResolution?null:info;}catch{return null;} }
function decodeEntities(s) {
  return s.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi,m=>{
    const names={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
    if(names[m.toLowerCase()]) return names[m.toLowerCase()];
    const n=m[2].toLowerCase()==='x'?parseInt(m.slice(3,-1),16):parseInt(m.slice(2,-1),10);
    return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';
  });
}
export function extractCanonical(html, base) {
  // Only document-level metadata. Never use links to recommendations or JSON video IDs.
  const source=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  const head=source.match(/<head\b[^>]*>([\s\S]*?)(?:<\/head\s*>|<body\b)/i)?.[1] ?? ''; 
  const found=new Map();
  for(const tag of head.match(/<(?:meta|link)\b[^>]*>/gi)||[]) {
    const a={}; for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))a[m[1].toLowerCase()]=decodeEntities(m[2]??m[3]??m[4]);
    const value=/^<link\b/i.test(tag)&&a.rel?.toLowerCase().split(/\s+/).includes('canonical')?a.href:/^<meta\b/i.test(tag)&&a.property?.toLowerCase()==='og:url'?a.content:null;
    if(!value)continue;
    try{const u=safeFacebookURL(value,base),info=canonical(u);if(info)found.set(info.url,info);}catch{}
  }
  if(found.size>1)failure('ambiguous','Facebook fournit plusieurs adresses différentes. Utilise le lien permanent manuellement.');
  return found.values().next().value||null;
}
async function readBounded(response) {
  if(Number(response.headers.get('content-length'))>MAX_BYTES)failure('response_too_large','La réponse Facebook est trop volumineuse.');
  if(!response.body)return '';
  const reader=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
    if(size>MAX_BYTES)failure('response_too_large','La réponse Facebook est trop volumineuse.');
    text+=decoder.decode(value,{stream:true});
  }return text+decoder.decode();}finally{await reader.cancel().catch(()=>{});}
}
export async function resolveFacebook(value, fetcher=fetch, timeout=TIMEOUT) {
  let current;try{current=safeFacebookURL(value);}catch{failure('invalid_url','Lien Facebook HTTPS invalide.',400);}
  let initial;try{initial=classifyFacebook(current.href);}catch{failure('unsupported_url','Format de lien Facebook non reconnu.',400);}
  if(!initial.needsResolution)return {...initial,evidence:'input'};
  current=new URL(initial.url);
  const controller=new AbortController();let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new ResolutionError('timeout','Facebook ne répond pas assez vite. Réessaie ou colle le lien permanent.',504));},timeout);});
  const run=async()=>{
    const visited=new Set();
    for(let hop=0;hop<=MAX_REDIRECTS;hop++){
      if(visited.has(current.href))failure('redirect_loop','Facebook renvoie une boucle de redirections.');
      visited.add(current.href);
      if(loginPath(current))failure('login_required','Facebook demande une connexion. Ouvre le lien et copie son adresse permanente.');
      const direct=canonical(current);if(direct)return {...direct,evidence:'redirect'};
      const response=await fetcher(current.href,{method:'GET',redirect:'manual',signal:controller.signal,credentials:'omit',headers:{Accept:'text/html','User-Agent':'Ancrage-aMi/5 URL resolver'}});
      if([301,302,303,307,308].includes(response.status)){
        const location=response.headers.get('location');await response.body?.cancel();
        if(!location)failure('missing_location','Facebook ne fournit pas la destination du lien.');
        try{current=safeFacebookURL(location,current.href);}catch{failure('unsafe_redirect','La redirection sort des adresses Facebook autorisées.');}
        if(hop===MAX_REDIRECTS)failure('too_many_redirects','Facebook renvoie trop de redirections.');
        continue;
      }
      if(!response.ok){await response.body?.cancel();failure(response.status===429?'rate_limited':'upstream_blocked',response.status===429?'Facebook limite les tentatives. Réessaie plus tard.':'Facebook refuse cette consultation sans connexion.',response.status===429?429:502);}
      if(!/text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type')||'')){await response.body?.cancel();failure('unexpected_content','Facebook n’a pas renvoyé une page exploitable.');}
      const info=extractCanonical(await readBounded(response),current.href);
      if(info)return {...info,evidence:'metadata'};
      failure('unresolved','Aucune adresse permanente fiable trouvée. Le contenu peut demander une connexion, être indisponible ou ne pas être intégrable.');
    }
  };
  try{return await Promise.race([run(),deadline]);}catch(e){if(e instanceof ResolutionError)throw e;failure('network_error','La connexion à Facebook a échoué. Réessaie ou colle le lien permanent.',502);}finally{clearTimeout(timer);controller.abort();}
}
export async function handle(request,env={},fetcher=fetch) {
  const u=new URL(request.url),origin=request.headers.get('origin');
  const allowed=(env.ALLOWED_ORIGINS||'https://agdistys.github.io').split(',').map(s=>s.trim()).filter(Boolean);
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
  if(origin&&allowed.includes(origin))headers['Access-Control-Allow-Origin']=origin;
  const json=(data,status=200)=>new Response(JSON.stringify({service:SERVICE,version:5,schemaVersion:1,...data}),{status,headers});
  if(origin&&!allowed.includes(origin))return json({ok:false,error:{code:'origin_denied',message:'Cette origine n’est pas autorisée.'}},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Max-Age':'600'}});
  if(request.method!=='GET')return json({ok:false,error:{code:'method_not_allowed',message:'Utilise GET.'}},405);
  if(u.pathname==='/health')return json({ok:true});
  if(u.pathname!=='/resolve')return json({ok:false,error:{code:'not_found',message:'Route inconnue.'}},404);
  const value=u.searchParams.get('url');if(!value)return json({ok:false,error:{code:'missing_url',message:'Le paramètre url est requis.'}},400);
  try{
    if(env.RATE_LIMITER){const {success}=await env.RATE_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!success)return json({ok:false,error:{code:'rate_limited',message:'Trop de tentatives. Patiente une minute.'}},429);}
    return json({ok:true,...await resolveFacebook(value,fetcher)});
  }catch(e){return json({ok:false,error:{code:e.code||'internal_error',message:e instanceof ResolutionError?e.message:'Le service est momentanément indisponible.'}},e.status||503);}
}
export default {fetch(request,env){return handle(request,env);}};
