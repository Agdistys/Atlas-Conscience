import {expect} from '@playwright/test';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from './dragonroute.mjs';
import {network,rawRoute,points,time} from './selected-tolls.mjs';

export async function setupSelectedTollApp(page,{leaflet=false}={}){
 const f=network(),errors=[],requests=[],control={};await mockDragonRoute(page);await page.clock.setFixedTime(new Date(time));page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/DragonRoute/app.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('// END GUIDANCE CONTROLLER',`window.tollTest={snapshot:()=>structuredClone({trip,stop:selectedStop,progress:guidance?.tollProgress,nav:guidance?.state,route:guidance?.route}),recalculate:()=>guidanceRecalculate()};\n// END GUIDANCE CONTROLLER`)})});
 if(leaflet){for(const [file,type]of [['leaflet.js','application/javascript'],['leaflet.css','text/css']])await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/'+file,r=>r.fulfill({path:'node_modules/leaflet/dist/'+file,contentType:type}));}
 await page.route(geocodingPattern,r=>{const last=new URL(r.request().url()).searchParams.get('q').toLowerCase().includes('valence');return r.fulfill({json:placesResponse(addressFeature(...points[last?8:0],last?'Arrivée publique':'Départ public'))})});
 await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>r.fulfill({json:{code:'Ok',routes:[{geometry:{type:'LineString',coordinates:points},distance:629,duration:63}],waypoints:[{location:points[0]},{location:points[8]}]}}));
 await page.route('https://ouquandqui-routing.d-serant.workers.dev/api/route',async r=>{
  const body=r.request().postDataJSON();requests.push(body);if(control.quota)return r.fulfill({status:429,headers:{"Retry-After":"60"},json:{error:{code:"MINUTE_LIMIT"}}});
  try{const d=await f.calculate(body);await r.fulfill({json:rawRoute(d.coordinates,d.tolls,{categories:d.categories})})}catch(e){await r.fulfill({status:422,json:{error:e.message}})}
 });
 await page.route('https://data.economie.gouv.fr/**/records?**',r=>r.fulfill({json:{total_count:2,results:[1,7].map(i=>({id:'S'+i,adresse:'Station publique '+i,cp:'26000',ville:'Test',geom:[45,points[i][0]],e10_prix:1.7,e10_maj:new Date(time).toISOString(),e10_rupture_type:null,horaires_automate_24_24:'Oui'}))}}));
 await page.addInitScript(()=>{
  window.gpsTest={callbacks:[],point:[5,45],gets:0,spoken:[]};
  const raw=()=>({coords:{longitude:gpsTest.point[0],latitude:gpsTest.point[1],accuracy:5,speed:10},timestamp:Date.now()});
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok){gpsTest.gets++;ok(raw())},watchPosition(ok,fail){gpsTest.callbacks.push({ok,fail});return gpsTest.callbacks.length-1},clearWatch(){}}});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{localService:true,lang:'fr-FR',name:'Locale'}],speak:u=>gpsTest.spoken.push(u.text),cancel(){},addEventListener(){}}});window.SpeechSynthesisUtterance=function(text){this.text=text};
 });
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 return {f,errors,requests,control,before:await page.evaluate(()=>({storage:JSON.stringify({...localStorage}),trip:tollTest.snapshot().trip}))};
}
