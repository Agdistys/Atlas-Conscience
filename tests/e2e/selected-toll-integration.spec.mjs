import {test,expect} from '@playwright/test';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse,confirmStationPreview} from '../helpers/dragonroute.mjs';
import {network,rawRoute,points,time} from '../helpers/selected-tolls.mjs';
import {checkAccessibility,checkOverflow,capture} from '../helpers/inspection.mjs';

async function setup(page,{leaflet=false}={}){
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
async function propose(page){await page.locator('#selectedTollOpen').click();const d=page.getByRole('dialog',{name:'Choisir une portion payante'});await d.getByLabel('Classe de péage',{exact:true}).selectOption('1');await d.getByRole('button',{name:'Comparer les parcours'}).click();await d.getByRole('radio',{name:/Portion 1/}).check();await d.getByRole('button',{name:'Calculer cette portion'}).click();await expect(d.getByRole('button',{name:'Choisir ce trajet',exact:true})).toBeVisible();return d}
async function adopt(page){const d=await propose(page);await d.getByRole('button',{name:'Choisir ce trajet',exact:true}).click();await expect(d).toBeHidden();await expect(page.locator('#selectedTollNotice')).toBeVisible()}
async function fix(page,index,seconds=0){await page.clock.setFixedTime(new Date(time+seconds*1000));await page.evaluate(p=>{gpsTest.point=p;gpsTest.callbacks.at(-1).ok({coords:{longitude:p[0],latitude:p[1],accuracy:5,speed:10},timestamp:Date.now()})},points[index]);}
async function begin(page){await page.locator('#guidanceOpen').click();await page.locator('#guidanceStart').click();await expect.poll(()=>page.evaluate(()=>gpsTest.callbacks.length)).toBe(1)}

test('selected toll app: compare, explicitly adopt, protect saved routes and restore',async({page},info)=>{
 const {errors,before,requests}=await setup(page,{leaflet:true});const d=await propose(page);await checkOverflow(page);await checkAccessibility(page,info,'selected-toll-app');await capture(page,info,'selected-toll-app');await d.evaluate(el=>el.scrollTop=0);await page.screenshot({path:info.outputPath('selected-toll-viewport.png')});
 expect(await page.evaluate(()=>tollTest.snapshot().trip.routing.provider)).toBe('osrm');await d.getByRole('button',{name:'Choisir ce trajet',exact:true}).click();await expect(page.locator('#selectedTollSummary')).toContainText('prix inconnu');
 const after=await page.evaluate(()=>tollTest.snapshot());expect(after.trip.routing.provider).toBe('ors-selected');expect(after.trip.base.geometry.coordinates).toEqual(points);expect(after.trip.base.legs).toHaveLength(1);expect(after.trip.selectedToll.selection.price).toBeNull();await expect(page.locator('#savePreparationBtn')).toBeDisabled();expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(before.storage);expect(requests.every(r=>r.coordinates.length===2&&r.vehicle.type==='car'&&r.alternatives===false)).toBe(true);
 await page.locator('#selectedTollRemove').click();expect(await page.evaluate(()=>tollTest.snapshot().trip)).toEqual(before.trip);await expect(page.locator('#selectedTollNotice')).toBeHidden();expect(errors).toEqual([]);
});
test('selected toll app: station preview and removal preserve the chosen paid edges',async({page})=>{
 const {errors}=await setup(page);await adopt(page);await page.locator('#stationsBtn').click();await page.locator('#continueStationsBtn').click();await expect(page.locator('[data-select="S7"]')).toBeVisible();await page.locator('[data-select="S7"]').click();await confirmStationPreview(page);
 const s=await page.evaluate(()=>tollTest.snapshot());expect(s.stop.via.geometry.coordinates).toEqual(points);expect(s.stop.via.legs).toHaveLength(2);expect(s.stop.via.tollAttributes.tolls).toEqual(s.trip.base.tollAttributes.tolls);
 await page.locator('#removeStopBtn').click();expect(await page.evaluate(()=>tollTest.snapshot().stop)).toBeNull();expect(await page.evaluate(()=>tollTest.snapshot().trip.base.geometry.coordinates)).toEqual(points);expect(errors).toEqual([]);
});
test('selected toll app: GPS keeps forward-only paid progress through recalculation',async({page})=>{
 const {errors,requests}=await setup(page);await adopt(page);await begin(page);await fix(page,0);await expect.poll(()=>page.evaluate(()=>tollTest.snapshot().progress?.phase)).toBe('before');
 await fix(page,1,8);await fix(page,2,16);await fix(page,3,24);await expect.poll(()=>page.evaluate(()=>tollTest.snapshot().progress?.phase)).toBe('within');await page.evaluate(()=>tollTest.recalculate());await expect.poll(()=>page.evaluate(()=>tollTest.snapshot().route?.geometry.coordinates[0])).toEqual(points[3]);
 await fix(page,4,32);await fix(page,5,40);await fix(page,6,48);await fix(page,7,56);await expect.poll(()=>page.evaluate(()=>tollTest.snapshot().progress?.phase)).toBe('after');const n=requests.length;await page.evaluate(()=>tollTest.recalculate());const late=requests.slice(n);expect(late.length).toBeGreaterThan(0);expect(late.every(r=>r.avoid.includes('tollways'))).toBe(true);expect(late.flatMap(r=>r.coordinates).some(p=>JSON.stringify(p)===JSON.stringify(points[2]))).toBe(false);expect(errors).toEqual([]);
});
test('selected toll app: expired proposal and cancelled dialog leave the original trip intact',async({page})=>{
 const {before,errors}=await setup(page);let d=await propose(page);await page.keyboard.press('Escape');expect(await page.evaluate(()=>tollTest.snapshot().trip)).toEqual(before.trip);d=await propose(page);await page.clock.setFixedTime(new Date(time+300001));await d.getByRole('button',{name:'Choisir ce trajet',exact:true}).click();await expect(d.getByRole('status')).toContainText(/recalculée|ancien|expir|périm/);expect(await page.evaluate(()=>tollTest.snapshot().trip)).toEqual(before.trip);expect(errors).toEqual([]);
});
test('selected toll app: station chosen during guidance preserves the paid exception and resumes GPS',async({page})=>{
 const {errors,before}=await setup(page);await adopt(page);await begin(page);await fix(page,0);await page.locator('#guidanceFuelOpen').click();await page.locator('#guidanceFuelSearch').click();await expect(page.locator('[data-guidance-station="S1"]')).toBeVisible();await page.locator('[data-guidance-station="S1"]').click();await page.locator('#guidanceFuelApply').click();await expect(page.locator('#guidanceFuelDialog')).toBeHidden();expect(await page.evaluate(()=>gpsTest.callbacks.length)).toBe(2);await fix(page,0,1);
 const s=await page.evaluate(()=>tollTest.snapshot());expect(s.route.geometry.coordinates).toEqual(points);expect(s.route.legs).toHaveLength(2);expect(s.route.tollAttributes.tolls).toEqual(s.trip.base.tollAttributes.tolls);await expect(page.locator('#guidanceFuelOpen')).toBeDisabled();expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(before.storage);expect(errors).toEqual([]);
});
test('selected toll app: old station comparisons cannot be confirmed',async({page})=>{
 const {errors}=await setup(page);await adopt(page);await page.locator('#stationsBtn').click();await page.locator('[data-select="S1"]').click();await expect(page.locator('#stationPreviewConfirm')).toBeEnabled();await page.clock.setFixedTime(new Date(time+300001));await page.locator('#stationPreviewConfirm').click();await expect(page.locator('#stationPreviewDialog')).toBeHidden();expect(await page.evaluate(()=>tollTest.snapshot().stop)).toBeNull();await expect(page.locator('#fuelStatus')).toContainText('ancienne');expect(errors).toEqual([]);
});
test('selected toll app: free-service quota does not replace a confirmed route or retry',async({page})=>{
 const {requests,control,errors}=await setup(page);await adopt(page);const original=await page.evaluate(()=>tollTest.snapshot().trip);control.quota=true;await page.clock.setFixedTime(new Date(time+61000));await page.locator('#selectedTollOpen').click();const d=page.getByRole('dialog',{name:'Choisir une portion payante'});await d.getByLabel('Classe de péage',{exact:true}).selectOption('1');await d.getByRole('button',{name:'Comparer les parcours'}).click();await expect(d.getByRole('status')).toContainText('trop rapprochés');const count=requests.length;await d.getByRole('button',{name:'Comparer les parcours'}).click();await expect(d.getByRole('status')).toContainText('temporairement limité');expect(requests.length).toBe(count);expect(await page.evaluate(()=>tollTest.snapshot().trip)).toEqual(original);expect(errors).toEqual([]);
});
