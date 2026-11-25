import {expect} from '@playwright/test';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from './dragonroute.mjs';
export const start=[5,45],end=[5.005,45.005];
export function meters(a,b){const r=Math.PI/180,h=Math.sin((b[1]-a[1])*r/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin((b[0]-a[0])*r/2)**2;return 12742000*Math.asin(Math.sqrt(h))}
export function road(nodes=[start,end],provider='osrm'){
 const geometry={type:'LineString',coordinates:[]},legs=[];let distance=0,duration=0;
 for(let i=0;i<nodes.length-1;i++){const a=nodes[i],b=nodes[i+1],mid=[b[0],a[1]],coords=[a,mid,b],d1=meters(a,mid),d2=meters(mid,b);
 const steps=[{geometry:{type:'LineString',coordinates:[a,mid]},distance:d1,duration:d1/10,name:'Rue publique A',maneuver:{type:'depart',location:a,modifier:'straight'}},{geometry:{type:'LineString',coordinates:[mid,b]},distance:d2,duration:d2/10,name:'Rue publique B',maneuver:{type:'turn',location:mid,modifier:'left'}},{geometry:{type:'LineString',coordinates:[b,b]},distance:0,duration:0,name:'',maneuver:{type:'arrive',location:b,modifier:'right'}}];
 if(provider==='ign')for(const s of steps){s.instruction=s.maneuver;s.attributes={name:s.name};delete s.maneuver}
 const d=d1+d2;legs.push({start:a.join(','),end:b.join(','),distance:d,duration:d/10,steps});geometry.coordinates.push(...(i?coords.slice(1):coords));distance+=d;duration+=d/10;}
 return {geometry,legs,distance,duration};
}
export function reply(url){
 const u=new URL(url),p=u.searchParams,ign=u.pathname.includes('itineraire'),nodes=ign?[p.get('start'),...(p.get('intermediates')?.split('|')||[]),p.get('end')].map(x=>x.split(',').map(Number)):u.pathname.split('/').at(-1).split(';').map(x=>x.split(',').map(Number)),r=road(nodes,ign?'ign':'osrm');
 return ign?{...r,resource:'bdtopo-osrm',resourceVersion:'test',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',portions:r.legs,constraints:p.has('constraints')?[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}]:[]}:{code:'Ok',routes:[r],waypoints:nodes.map(location=>({location}))};
}
export async function fixture(page,{ign=false,leaflet=false}={}){
 await mockDragonRoute(page);
 await page.route('**/DragonRoute/app.js',async r=>{const response=await r.fetch();const source=await response.text();await r.fulfill({response,body:source.replace('// END GUIDANCE CONTROLLER',`window.navTest={route:()=>JSON.stringify(trip.base),multi:(route,points)=>{multiActive={plan:{route,routing:structuredClone(trip.routing),nodes:points.map((p,i)=>({point:[p[1],p[0]],kind:i===0?'start':i===points.length-1?'end':'station',name:'Point public '+i})),name:'Parcours public'}}},station:(via,p)=>{selectedStop={station:{id:'public',address:'Station publique',lat:p[1],lon:p[0]},via,confirmedAt:Date.now()}}};\n// END GUIDANCE CONTROLLER`)})});
 const calls=[],errors=[],control={};page.on('pageerror',e=>errors.push(e.message));
 if(leaflet){await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',r=>r.fulfill({path:'node_modules/leaflet/dist/leaflet.js',contentType:'application/javascript'}));await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',r=>r.fulfill({path:'node_modules/leaflet/dist/leaflet.css',contentType:'text/css'}));}
 await page.route(geocodingPattern,r=>{const b=new URL(r.request().url()).searchParams.get('q').includes('Valence');return r.fulfill({json:placesResponse(addressFeature(...(b?end:start),b?'Arrivée publique':'Départ public'))})});
 for(const pattern of ['https://router.project-osrm.org/route/v1/driving/**','https://data.geopf.fr/navigation/itineraire?**'])await page.route(pattern,r=>{calls.push(r.request().url());return control.reply?control.reply(r):r.fulfill({json:reply(r.request().url())})});
 await page.addInitScript(()=>{
  window.gpsTest={watches:[],cleared:[],callbacks:[],spoken:[],cancelled:0,wakes:[],released:0};
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(ok,fail,options){const id=gpsTest.watches.length;gpsTest.watches.push({id,options});gpsTest.callbacks.push({ok,fail});return id},clearWatch(id){gpsTest.cleared.push(id)}}});
  Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{async request(){const lock={release:async()=>{gpsTest.released++},addEventListener(){}};gpsTest.wakes.push(lock);return lock}}});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{localService:true,lang:'fr-FR',name:'Locale'},{localService:false,lang:'fr-FR',name:'Distante'}],speak:u=>gpsTest.spoken.push({text:u.text,local:u.voice.localService}),cancel:()=>gpsTest.cancelled++,addEventListener(){}}});
  window.SpeechSynthesisUtterance=function(text){this.text=text};
 });await page.goto('/DragonRoute/');
 if(ign)await page.locator('#avoidHighways').check();await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 const before=await page.evaluate(()=>({storage:JSON.stringify({...localStorage}),route:navTest.route()}));
 return {calls,errors,control,before};
}
export async function open(page){await page.locator('#guidanceOpen').click();await expect(page.locator('#guidanceDialog')).toBeVisible()}
export async function begin(page){await open(page);await page.locator('#guidanceStart').click();await expect.poll(()=>page.evaluate(()=>gpsTest.watches.length)).toBe(1)}
export async function fix(page,p=start,{seconds=0,accuracy=5,watch=null,timestamp=null}={}){
 if(seconds)await page.clock.setFixedTime(new Date(Date.parse('2026-09-17T10:00:00Z')+seconds*1000));
 await page.evaluate(({p,accuracy,watch,timestamp})=>{gpsTest.callbacks[watch??gpsTest.callbacks.length-1].ok({coords:{longitude:p[0],latitude:p[1],accuracy,speed:10},timestamp:timestamp??Date.now()})},{p,accuracy,watch,timestamp});
}
export async function offroute(page){for(const seconds of [1,4,7])await fix(page,[5.02,45.02],{seconds})}
export const watches=page=>page.evaluate(()=>gpsTest.watches.length);

