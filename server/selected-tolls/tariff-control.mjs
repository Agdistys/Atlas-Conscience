import {selectedTariffNetworks,declaredSectionTariff} from './tariffs.mjs';
export function createSectionTariffControl({document,catalogue,onChange,now=Date.now}){
 const make=(tag,text,attrs={})=>{const el=document.createElement(tag);if(text)el.textContent=text;for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el};
 const networks=selectedTariffNetworks(catalogue),root=make('details','',{class:'selected-toll-tariff'});root.append(make('summary','💰 Estimer le péage'));
 const network=make('select','',{'aria-label':'Réseau tarifaire de la portion'}),entry=make('select','',{'aria-label':'Gare d’entrée déclarée'}),exit=make('select','',{'aria-label':'Gare de sortie déclarée'}),confirmed=make('input','',{type:'checkbox'}),confirmLabel=make('label','',{class:'check-label'});
 const output=make('p','',{class:'selected-toll-price','aria-live':'polite'}),source=make('a','Source tarifaire',{target:'_blank',rel:'noopener noreferrer'}),assumptions=make('p','',{class:'note'}),info=make('details','',{class:'explanation'});
 info.append(make('summary','ⓘ',{'aria-label':'Limites de l’estimation de péage'}),make('p','Tarif de référence pour les gares déclarées, sans réduction. Leur passage sur la carte n’est pas vérifié automatiquement. Cette estimation ne satisfait pas un plafond strict. Une classe tarifaire ne certifie pas le gabarit du véhicule.'));
 for(const [label,select]of [['Réseau',network],['Entrée',entry],['Sortie',exit]]){const el=make('label',label);el.append(select);root.append(el)}
 confirmLabel.append(confirmed,make('span','Ces gares correspondent à toute la portion choisie'));root.append(output,assumptions,source,confirmLabel,info);
 const options=(select,values,placeholder)=>{select.replaceChildren(make('option',placeholder,{value:''}));for(const [value,label]of values)select.append(make('option',label,{value:String(value)}))};
 options(network,Object.keys(networks).map(id=>[id,id]),'Sans estimation');
 let context=null,sectionKey=null,binding='',busy=false;
 const value=()=>({network:network.value,entry:entry.value===''?null:Number(entry.value),exit:exit.value===''?null:Number(exit.value),confirmed:confirmed.checked});
 function gates(resetEntry=false){const n=networks[network.value];if(resetEntry)options(entry,[...new Set((n?.rows||[]).filter(r=>r[0]!==r[1]).map(r=>r[0]))].sort((a,b)=>n.gates[a].localeCompare(n.gates[b],'fr')).map(i=>[i,n.gates[i]]),'Choisir une entrée');options(exit,(n?.rows||[]).filter(r=>entry.value!==''&&String(r[0])===entry.value&&r[0]!==r[1]).map(r=>[r[1],n.gates[r[1]]]).sort((a,b)=>a[1].localeCompare(b[1],'fr')),'Choisir une sortie')}
 function render(){
  network.disabled=busy;entry.disabled=busy||!network.value;exit.disabled=busy||entry.value==='';confirmed.disabled=busy;source.hidden=true;source.removeAttribute('href');assumptions.textContent='';
  if(!network.value){output.textContent='Facultatif · le prix peut rester inconnu.';confirmed.disabled=true;return}
  try{const r=declaredSectionTariff(catalogue,{...value(),confirmed:true},context,sectionKey,now());output.textContent=(r.cents/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})+' · gares déclarées';assumptions.textContent='Classe '+r.vehicleClass+' · trajet '+r.date.split('-').reverse().join('/')+' · tarif au '+r.effectiveFrom.split('-').reverse().join('/');source.href=r.source;source.hidden=false;}
  catch(e){output.textContent=entry.value===''||exit.value===''?'Choisir les gares dans le sens publié.':e.message;confirmed.disabled=true;confirmed.checked=false}
 }
 const changed=()=>{confirmed.checked=false;render();onChange()};
 network.addEventListener('change',()=>{gates(true);changed()});entry.addEventListener('change',()=>{gates();changed()});exit.addEventListener('change',changed);confirmed.addEventListener('change',()=>{render();onChange()});gates(true);
 return {element:root,update(next){context=next.context;sectionKey=next.sectionKey;busy=next.busy;root.hidden=!sectionKey||!Object.keys(networks).length;const key=JSON.stringify([sectionKey,context?.date,context?.vehicleClass]);if(key!==binding){confirmed.checked=false;binding=key}render()},choice(){if(!network.value)return null;declaredSectionTariff(catalogue,value(),context,sectionKey,now());return value()},reset(){network.value='';confirmed.checked=false;gates(true);binding='';render()}};
}
