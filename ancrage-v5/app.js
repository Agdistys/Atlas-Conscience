const $=s=>document.querySelector(s),input=$('#url'),status=$('#status');
let current={clean:'',html:''},pending=null,sequence=0,original='',defaultEndpoint='';
const HKEY='ancrage_ami_history_v1',EKEY='ancrage_ami_resolver_v5';
const storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);return true;}catch{return false;}},remove(k){try{localStorage.removeItem(k);}catch{}}};
function setStatus(text,kind='ok'){status.textContent=text;status.className=`status ${kind}`;}
function invalidate(){sequence++;pending?.abort();pending=null;current={clean:'',html:''};$('#result').hidden=true;$('#manualBox').hidden=true;$('#copyFallback').hidden=true;$('#make').disabled=false;$('#make').textContent='Générer l’ancrage';}
function endpoint(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||u.pathname!=='/')throw new Error('Colle seulement l’adresse HTTPS du service, sans chemin ni clé.');return u.origin;}
function serviceURL(){const s=storage.get(EKEY)||defaultEndpoint;return s?endpoint(s):'';}
function updateConnection(){let url='';try{url=serviceURL();}catch{}$('#endpoint').value=url;$('#connection').textContent=url?'Résolveur configuré · à vérifier':'Résolveur non connecté · liens permanents utilisables';}
const configReady=location.protocol==='file:'?Promise.resolve():fetch('ancrage-v5/config.json',{cache:'no-store',credentials:'omit'}).then(r=>r.ok?r.json():{}).then(c=>{if(c.resolverUrl)defaultEndpoint=endpoint(c.resolverUrl);}).catch(()=>{}).finally(updateConnection);
updateConnection();
function extractInput(raw){
  const value=raw.trim();if(!value.startsWith('<'))return value;
  const doc=new DOMParser().parseFromString(value,'text/html');
  const frame=doc.querySelector('iframe[src]');
  if(!frame)throw new Error('Colle une adresse ou le code iframe d’intégration Facebook.');
  const u=new URL(frame.getAttribute('src'));
  if(u.protocol!=='https:'||u.hostname!=='www.facebook.com'||u.username||u.password||u.port||!/^\/plugins\/(video|post)\.php$/.test(u.pathname))throw new Error('Ce n’est pas un code d’intégration Facebook reconnu.');
  return u.searchParams.get('href')||'';
}
function render(info,message){
  current={clean:info.url,html:makeEmbed(info)};
  $('#platform').textContent=info.platform;$('#kind').textContent=info.type;
  $('#clean').textContent=current.clean;$('#html').textContent=current.html;
  $('#openLink').href=info.url;$('#openLink').textContent=`Ouvrir sur ${info.platform} ↗`;
  $('#tip').textContent=info.platform==='Instagram'?'Colle le bloc entier dans Webnode, y compris le script Instagram.':'Le code est prêt. Seul Facebook décide si le contenu peut être affiché. Le lien « Voir sur Facebook » reste disponible si le lecteur refuse.';
  $('#result').hidden=false;$('#manualBox').hidden=true;
  setStatus(message||'Adresse reconnue · code prêt à copier.');addHistory(info);
}
function manual(info,message){
  original=info.url;$('#originalLink').href=original;$('#originalText').textContent=original;$('#manual').value='';
  $('#manualBox').hidden=false;setStatus(message,'err');
}
async function generate(){
  invalidate();const ticket=sequence;
  try{
    const info=normalize(extractInput(input.value));
    if(!info.needsResolution){render(info);return;}
    await configReady;if(ticket!==sequence)return;
    const base=serviceURL();
    if(!base){manual(info,'Lien de partage mobile détecté. Connecte le résolveur Cloudflare ci-dessous, ou colle l’adresse permanente.');return;}
    const controller=new AbortController();pending=controller;const timer=setTimeout(()=>controller.abort(),11000);
    $('#make').disabled=true;$('#make').textContent='Recherche de l’adresse…';setStatus('Recherche de l’adresse permanente auprès de Facebook…');
    try{
      const response=await fetch(`${base}/resolve?${new URLSearchParams({url:info.url})}`,{signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
      const data=await response.json();if(ticket!==sequence)return;
      if(!response.ok||!data.ok||data.service!=='ancrage-ami-resolver'||data.schemaVersion!==1)throw new Error(data.error?.message||'Le service n’a pas pu résoudre ce lien.');
      const resolved=normalize(data.url);
      if(resolved.platform!=='Facebook'||resolved.needsResolution||!['redirect','metadata'].includes(data.evidence))throw new Error('Le service n’a pas fourni une adresse Facebook permanente vérifiable.');
      render(resolved,data.evidence==='redirect'?'Redirection Facebook reçue · adresse permanente retrouvée.':'Adresse permanente trouvée dans les métadonnées Facebook.');
    }catch(e){if(ticket===sequence)manual(info,e.name==='AbortError'?'Le service ne répond pas assez vite. Réessaie ou utilise l’adresse permanente.':e instanceof TypeError?'Résolveur inaccessible : connexion réseau ou origine non autorisée. Tu peux utiliser le lien permanent.':e.message);}
    finally{clearTimeout(timer);if(ticket===sequence){pending=null;$('#make').disabled=false;$('#make').textContent='Générer l’ancrage';}}
  }catch(e){if(ticket===sequence)setStatus(e.message,'err');}
}
async function copyText(text,button){
  if(!text)return;let copied=false;
  try{await navigator.clipboard.writeText(text);copied=true;}catch{
    const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';document.body.append(ta);ta.select();ta.setSelectionRange(0,text.length);
    try{copied=document.execCommand('copy')===true;}catch{}ta.remove();
  }
  if(copied){const label=button.textContent;button.textContent='Copié ✓';setTimeout(()=>button.textContent=label,1500);}
  else{$('#copyFallback').hidden=false;$('#copyText').value=text;$('#copyText').focus();$('#copyText').select();setStatus('La copie automatique est bloquée. Le texte est sélectionné ci-dessous : utilise Copier dans ton navigateur.','err');}
}
$('#make').addEventListener('click',generate);
input.addEventListener('input',()=>{invalidate();status.className='status';});
input.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')generate();});
$('#clear').addEventListener('click',()=>{invalidate();input.value='';status.className='status';input.focus();});
$('#paste').addEventListener('click',async()=>{try{input.value=await navigator.clipboard.readText();generate();}catch{setStatus('Fais un appui long dans le champ, puis Coller.','err');input.focus();}});
$('#useManual').addEventListener('click',()=>{try{const info=normalize(extractInput($('#manual').value));if(info.platform!=='Facebook'||info.needsResolution)throw new Error('Il faut une adresse Facebook permanente ou son code d’intégration, pas un autre lien /share/.');render(info,'Adresse fournie manuellement · code prêt à copier.');}catch(e){setStatus(e.message,'err');}});
$('#copyLink').addEventListener('click',e=>copyText(`<a href="${escapeHtml(original)}" target="_blank" rel="noopener noreferrer">Voir sur Facebook</a>`,e.currentTarget));
document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b)copyText(current[b.dataset.copy],b);});
$('#saveEndpoint').addEventListener('click',async()=>{
  await configReady;
  try{const url=endpoint($('#endpoint').value.trim());invalidate();const saved=storage.set(EKEY,url);defaultEndpoint=url;updateConnection();$('#connection').textContent=saved?'Adresse enregistrée. Utilise « Tester la connexion ».':'Adresse active pour cette session (stockage indisponible).';}catch(e){$('#connection').textContent=e.message;}
});
$('#resetEndpoint').addEventListener('click',async()=>{await configReady;storage.remove(EKEY);defaultEndpoint='';invalidate();updateConnection();$('#connection').textContent='Adresse locale effacée. La configuration publiée sera relue au prochain chargement.';});
$('#testEndpoint').addEventListener('click',async e=>{
  const b=e.currentTarget;await configReady;b.disabled=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const base=endpoint($('#endpoint').value.trim());const r=await fetch(`${base}/health`,{signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});const data=await r.json();if(!r.ok||!data.ok||data.service!=='ancrage-ami-resolver'||data.schemaVersion!==1)throw new Error();$('#connection').textContent='Le résolveur V5 répond. Enregistre l’adresse si ce n’est pas encore fait. Ce test ne garantit pas l’accès à tous les contenus Facebook.';}catch{$('#connection').textContent='Connexion non vérifiée. Vérifie l’adresse, le réseau et les origines autorisées du Worker.';}finally{clearTimeout(timer);b.disabled=false;}
});
function readHistory(){try{const list=JSON.parse(storage.get(HKEY)||'[]');return Array.isArray(list)?list.filter(x=>typeof x?.url==='string'&&typeof x?.platform==='string').slice(0,8):[];}catch{return [];}}
function addHistory(info){const list=readHistory().filter(x=>x.url!==info.url);list.unshift({url:info.url,platform:info.platform,type:info.type});storage.set(HKEY,JSON.stringify(list.slice(0,8)));renderHistory();}
function renderHistory(){const h=readHistory();$('#historyBox').hidden=!h.length;$('#history').replaceChildren();for(const item of h){const row=document.createElement('div');row.className='hist';const main=document.createElement('div');main.className='hist-main';const title=document.createElement('div');title.className='hist-title';title.textContent=`${item.platform} · ${item.type||'Lien'}`;const url=document.createElement('div');url.className='hist-url';url.textContent=item.url;main.append(title,url);const button=document.createElement('button');button.className='mini';button.textContent='Réutiliser';button.addEventListener('click',()=>{input.value=item.url;generate();window.scrollTo({top:0,behavior:'auto'});});row.append(main,button);$('#history').append(row);}}
$('#eraseHistory').addEventListener('click',()=>{storage.remove(HKEY);renderHistory();});renderHistory();
