import {selectedTariffNetworks,declaredSectionTariff} from './tariffs.mjs';
import {preparedTollPair} from './memory.mjs';
import {locateSectionGates} from './gates.mjs';
export function createSectionTariffControl({document,catalogue,inventory=null,onChange,onLocate=()=>{},now=Date.now}){
 const make=(tag,text,attrs={})=>{const el=document.createElement(tag);if(text)el.textContent=text;for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el};
 const networks=selectedTariffNetworks(catalogue),root=make('details','',{class:'selected-toll-tariff'});root.append(make('summary','💰 Estimer le péage'));
 const network=make('select','',{'aria-label':'Réseau tarifaire de la portion'}),entry=make('select','',{'aria-label':'Gare d’entrée déclarée'}),exit=make('select','',{'aria-label':'Gare de sortie déclarée'}),confirmed=make('input','',{type:'checkbox'}),confirmLabel=make('label','',{class:'check-label'});
 const output=make('p','',{class:'selected-toll-price','aria-live':'polite'}),source=make('a','Source tarifaire',{target:'_blank',rel:'noopener noreferrer'}),assumptions=make('p','',{class:'note'}),info=make('details','',{class:'explanation'});
 info.append(make('summary','ⓘ',{'aria-label':'Limites de l’estimation de péage'}),make('p','Tarif de référence pour les gares déclarées, sans réduction. Leur passage sur la carte n’est pas vérifié automatiquement. Cette estimation ne satisfait pas un plafond strict. Une classe tarifaire ne certifie pas le gabarit du véhicule.'));
 for(const [label,select]of [['Réseau',network],['Entrée',entry],['Sortie',exit]]){const el=make('label',label);el.append(select);root.append(el)}
 confirmLabel.append(confirmed,make('span','Ces gares correspondent à toute la portion choisie'));root.append(output,assumptions,source,confirmLabel,info);
 const options=(select,values,placeholder)=>{select.replaceChildren(make('option',placeholder,{value:''}));for(const [value,label]of values)select.append(make('option',label,{value:String(value)}))};
 options(network,Object.keys(networks).map(id=>[id,id]),'Sans estimation');
 let context=null,sectionKey=null,section=null,binding='',busy=false,located=null;
 const locate=make('button','📍 Repérer les gares',{type:'button',class:'ghost'}),locationNote=make('p','',{class:'note','aria-live':'polite'}),list=make('ol','',{class:'selected-gate-list'}),pair=make('button','Proposer ces gares',{type:'button',class:'ghost'}),geography=make('details','',{class:'explanation'}),inventoryLink=make('a','Inventaire des gares',{target:'_blank',rel:'noopener noreferrer'});
 geography.append(make('summary','ⓘ',{'aria-label':'Précision du repérage des gares'}),make('p','Repères de l’inventaire 2025 à moins de 30 m de la portion, classés dans le sens du tracé. La proximité et un nom concordant ne prouvent ni le passage ni le sens de circulation. Les limites de la portion ne sont pas forcément des gares. Une gare absente du repérage ne signifie pas absence de péage.'),inventoryLink);
 root.insertBefore(locate,root.children[1]);locate.after(locationNote,list,pair,geography);pair.hidden=true;geography.hidden=true;
 function showLocations(){
  locate.disabled=busy||!section;pair.disabled=busy;list.replaceChildren();pair.hidden=!located?.pair;geography.hidden=!located;
  if(!located)return;
  locationNote.textContent=located.total?located.total+' repères proches · passage à confirmer.'+(located.total>40?' Les 40 premiers sont affichés.':''):'Aucune gare repérée. Choix manuel disponible ; péage non déduit.';
  for(const g of located.rows){const row=make('li');row.append(make('strong','P'+g.number+' · '+g.name),make('span',' · km '+(g.progress/1000).toLocaleString('fr-FR',{maximumFractionDigits:1})+' de la portion'));
   if(g.ambiguous)row.append(make('p','Plusieurs passages proches : ordre ambigu.',{class:'note'}));
   else if(g.matches.length!==1)row.append(make('p',g.matches.length?'Plusieurs noms tarifaires concordants.':'Sans correspondance de nom dans les grilles.',{class:'note'}));
   list.append(row);
  }
  if(located.pair)pair.textContent='Proposer '+located.rows[0].name+' → '+located.rows[1].name;
  inventoryLink.hidden=true;inventoryLink.removeAttribute('href');try{const u=new URL(located.source);if(u.protocol==='https:'&&!u.username&&!u.password){inventoryLink.href=u.href;inventoryLink.hidden=false}}catch{}
 }
 locate.addEventListener('click',()=>{if(busy||!section)return;try{located=locateSectionGates(section,inventory,catalogue);showLocations()}catch(e){located=null;showLocations();locationNote.textContent=e.message}onLocate()});
 pair.addEventListener('click',()=>{if(busy||!located?.pair||located.sectionKey!==sectionKey)return;const p=located.pair;network.value=p.network;gates(true);entry.value=String(p.entry);gates();exit.value=String(p.exit);changed();confirmed.focus()});
 const value=()=>({network:network.value,entry:entry.value===''?null:Number(entry.value),exit:exit.value===''?null:Number(exit.value),confirmed:confirmed.checked});
 function gates(resetEntry=false){const n=networks[network.value];if(resetEntry)options(entry,[...new Set((n?.rows||[]).filter(r=>r[0]!==r[1]).map(r=>r[0]))].sort((a,b)=>n.gates[a].localeCompare(n.gates[b],'fr')).map(i=>[i,n.gates[i]]),'Choisir une entrée');options(exit,(n?.rows||[]).filter(r=>entry.value!==''&&String(r[0])===entry.value&&r[0]!==r[1]).map(r=>[r[1],n.gates[r[1]]]).sort((a,b)=>a[1].localeCompare(b[1],'fr')),'Choisir une sortie')}
 function render(){
  showLocations();network.disabled=busy;entry.disabled=busy||!network.value;exit.disabled=busy||entry.value==='';confirmed.disabled=busy;source.hidden=true;source.removeAttribute('href');assumptions.textContent='';
  if(!network.value){output.textContent='Facultatif · le prix peut rester inconnu.';confirmed.disabled=true;return}
  try{const r=declaredSectionTariff(catalogue,{...value(),confirmed:true},context,sectionKey,now());output.textContent=(r.cents/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})+' · gares déclarées';assumptions.textContent='Classe '+r.vehicleClass+' · trajet '+r.date.split('-').reverse().join('/')+' · tarif au '+r.effectiveFrom.split('-').reverse().join('/');source.href=r.source;source.hidden=false;}
  catch(e){output.textContent=entry.value===''||exit.value===''?'Choisir les gares dans le sens publié.':e.message;confirmed.disabled=true;confirmed.checked=false}
 }
 const changed=()=>{confirmed.checked=false;render();onChange()};
 network.addEventListener('change',()=>{gates(true);changed()});entry.addEventListener('change',()=>{gates();changed()});exit.addEventListener('change',changed);confirmed.addEventListener('change',()=>{render();onChange()});gates(true);
 return {element:root,recall(memory){if(busy||!sectionKey)return false;const p=preparedTollPair(memory,catalogue);if(!p)return false;network.value=p.network;gates(true);entry.value=String(p.entry);gates();exit.value=String(p.exit);root.open=true;changed();return true},update(next){context=next.context;if(sectionKey!==next.sectionKey){located=null;locationNote.textContent=''}sectionKey=next.sectionKey;section=next.section;busy=next.busy;root.hidden=!sectionKey||!Object.keys(networks).length;const key=JSON.stringify([sectionKey,context?.date,context?.vehicleClass]);if(key!==binding){confirmed.checked=false;binding=key}render()},choice(){if(!network.value)return null;declaredSectionTariff(catalogue,value(),context,sectionKey,now());return value()},markers(){return located?.rows||[]},reset(){located=null;section=null;sectionKey=null;locationNote.textContent='';network.value='';confirmed.checked=false;gates(true);binding='';render()}};
}
