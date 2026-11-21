import {test,expect} from '@playwright/test';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
const ign='https://data.geopf.fr/navigation/itineraire?**';
const fuel='https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?**';
const stations=['A','B','C','D','E'].map((id,i)=>({id,lat:45.6-i*.1,lon:4.87,at:10+i*10,price:1.8-i*.05}));
function responseFor(url){
 const p=new URL(url).searchParams,points=[p.get('start'),...(p.get('intermediates')?.split('|')||[]),p.get('end')],via=points.length===3,s=via?stations.find(s=>Math.abs(s.lat-Number(points[1].split(',')[1]))<1e-6):null;
 const distance=via?108000:104000,duration=via?4200:3900,access=s?.at*1000;
 return {resource:'bdtopo-osrm',resourceVersion:'2026-11-21',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,constraints:p.has('constraints')?[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}]:[],geometry:{type:'LineString',coordinates:points.map(x=>x.split(',').map(Number))},portions:via?[{start:points[0],end:points[1],distance:access,duration:600},{start:points[1],end:points[2],distance:distance-access,duration:duration-600}]:[{start:points[0],end:points[1],distance,duration}]};
}
async function setup(page,{cap=3}={}){
 await mockDragonRoute(page);const calls={routes:[],fuel:0},control={failures:new Map(),pending:null,wait:false};
 await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('maxCandidates: 20',`maxCandidates: ${cap}`)})});
 await page.route(fuel,r=>{calls.fuel++;return r.fulfill({json:{total_count:5,results:stations.map(s=>({id:s.id,adresse:s.id+' route test',ville:'Valence',geom:[s.lat,s.lon],e10_prix:s.price,e10_maj:'2026-09-16T10:00:00Z',services_service:['Toilettes publiques'],horaires_automate_24_24:'Oui'}))}})});
 await page.route(ign,async r=>{const p=new URL(r.request().url()).searchParams,via=p.get('intermediates'),id=via?stations.find(s=>Math.abs(s.lat-Number(via.split(',')[1]))<1e-6)?.id:'direct';calls.routes.push({id,url:r.request().url()});if(control.wait&&id==='B'){control.pending=r;return}const failure=control.failures.get(id);return r.fulfill(failure||{json:responseFor(r.request().url())}).catch(()=>{})});
 await page.goto('/DragonRoute/');await page.locator('#avoidHighways').check();await page.locator('#routeOptimization').selectOption('shortest');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');return {calls,control};
}
const noPath={status:404,json:{error:{message:' No path found '}}};
async function done(page){await expect(page.locator('#stationsBtn')).toBeEnabled();await expect(page.locator('#cancelStationsBtn')).toBeHidden()}
async function search(page){await page.locator('#stationsBtn').click();await done(page);if(await page.locator('#stationListMode').isVisible())await page.locator('#stationListMode').selectOption('all')}
const via=calls=>calls.routes.filter(r=>r.id!=='direct').map(r=>r.id);
async function ids(page,expected){await expect(page.locator('.result-card')).toHaveCount(expected.length);expect(await page.locator('.result-card').evaluateAll(es=>es.map(e=>e.dataset.station))).toEqual(expected)}

test('accès station IGN : absence de chemin isolée, suite bornée et contraintes conservées',async({page},info)=>{
 const {calls,control}=await setup(page);control.failures.set('B',noPath);const storage=await page.evaluate(()=>JSON.stringify({...localStorage}));await search(page);
 await ids(page,['A','C']);expect(via(calls)).toEqual(['A','B','C']);await expect(page.locator('#stationCoverage')).toContainText('3 candidates examinées sur 5');await expect(page.locator('#fuelStatus')).toContainText('1 station(s) sans accès calculable');await expect(page.locator('#fuelStatus')).not.toContainText('HTTP');await expect(page.locator('#tripKm')).toHaveText('104,0 km');const received=calls.fuel;
 await page.locator('#continueStationsBtn').focus();await page.keyboard.press('Enter');await done(page);await ids(page,['A','C','D','E']);expect(via(calls)).toEqual(['A','B','C','D','E']);expect(calls.fuel).toBe(received);await expect(page.locator('#continueStationsBtn')).toBeHidden();await expect(page.locator('#stationCoverage')).toBeFocused();await expect(page.locator('.station-index')).toHaveText(['Point 1','Point 2','Point 3','Point 4']);
 for(const {url}of calls.routes){const p=new URL(url).searchParams;expect(p.get('optimization')).toBe('shortest');expect(p.get('constraints')).toContain('autoroute')}
 expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(storage);await page.locator('#stationCoverage').scrollIntoViewIfNeeded();await capture(page,info,'ign-acces-impossible');await checkOverflow(page);await checkAccessibility(page,info,'ign-acces-impossible');
});

test('accès station IGN : premier lot entièrement inaccessible puis résultats suivants',async({page})=>{
 const {calls,control}=await setup(page);for(const id of ['A','B','C'])control.failures.set(id,noPath);await search(page);await ids(page,[]);await expect(page.locator('#testedCount')).toHaveText('0');await expect(page.locator('#fuelStatus')).toContainText('3 station(s) sans accès calculable');await expect(page.locator('#stationCoverage')).toContainText('3 non comparables');await page.locator('#continueStationsBtn').click();await done(page);await page.locator('#stationListMode').selectOption('all');await ids(page,['D','E']);expect(via(calls)).toEqual(['A','B','C','D','E']);
});

for(const [label,failure]of [
 ['404 générique',{status:404,json:{error:{message:'Not found'}}}],
 ['404 sans données',{status:404,json:{error:{message:'No data found'}}}],
 ['404 HTML',{status:404,contentType:'text/html',body:'<h1>No path found</h1>'}],
 ['404 JSON illisible',{status:404,contentType:'application/json',body:'{'}],
 ['404 schéma différent',{status:404,json:{message:'No path found'}}],
 ['500 avec message de chemin',{status:500,json:{error:{message:'No path found'}}}],
 ['503 panne',{status:503,json:{error:{message:'Indisponible'}}}],
 ['429 quota',{status:429,headers:{'Retry-After':'5','Access-Control-Expose-Headers':'Retry-After'},json:{error:{message:'No path found'}}}]
])test('accès station IGN : '+label+' interrompt sans consommer la candidate',async({page})=>{
 const {calls,control}=await setup(page);control.failures.set('B',failure);await search(page);await ids(page,['A']);expect(via(calls)).toEqual(['A','B']);await expect(page.locator('#stationCoverage')).toContainText('1 candidates examinées sur 5');await expect(page.locator('#fuelStatus')).not.toContainText('sans accès calculable');await expect(page.locator('#tripKm')).toHaveText('104,0 km');
 if(failure.status===429){await page.locator('#continueStationsBtn').click();await done(page);expect(via(calls)).toEqual(['A','B']);await page.evaluate(()=>{const old=performance.now.bind(performance);Object.defineProperty(performance,'now',{value:()=>old()+6000})})}
 control.failures.delete('B');await page.locator('#continueStationsBtn').click();await done(page);await ids(page,['A','B','C','D']);expect(via(calls)).toEqual(['A','B','B','C','D']);await expect(page.locator('#stationCoverage')).toContainText('4 candidates examinées sur 5');
});

test('accès station IGN : annulation avant absence de chemin ne consomme pas la candidate',async({page})=>{
 const {calls,control}=await setup(page);control.wait=true;await page.locator('#stationsBtn').click();await expect.poll(()=>!!control.pending).toBe(true);await page.locator('#cancelStationsBtn').click();await done(page);await control.pending.fulfill(noPath).catch(()=>{});await expect(page.locator('#stationCoverage')).toContainText('1 candidates examinées sur 5');await ids(page,['A']);control.wait=false;await page.locator('#continueStationsBtn').click();await done(page);await ids(page,['A','B','C','D']);expect(via(calls)).toEqual(['A','B','B','C','D']);
});

test('accès station IGN : changement de fenêtre pendant réponse tardive invalide la file',async({page})=>{
 await page.addInitScript(()=>{const f=window.fetch;window.fetch=(url,o)=>f(url,String(url).includes('/navigation/itineraire')?{...o,signal:undefined}:o)});const {control}=await setup(page);control.wait=true;await page.locator('#stationsBtn').click();await expect.poll(()=>!!control.pending).toBe(true);await page.locator('#stopTolerance').evaluate(e=>{e.value='10';e.dispatchEvent(new Event('input',{bubbles:true}))});await control.pending.fulfill(noPath);await done(page);await expect(page.locator('#stationContinuation')).toBeHidden();await ids(page,[]);await expect(page.locator('#fuelStatus')).toContainText('Critères modifiés');
});

test('accès station IGN : absence sur trajet principal ne crée ni trajet ni station',async({page})=>{
 const {calls,control}=await setup(page);control.failures.set('direct',noPath);await page.locator('#routeOptimization').selectOption('fastest');await page.locator('#end').fill('Grenoble');await page.locator('#goBtn').click();await expect(page.locator('#goBtn')).toBeEnabled();await expect(page.locator('#status')).toContainText('Aucun chemin trouvé');await expect(page.locator('#summary')).toBeHidden();expect(via(calls)).toEqual([]);expect(calls.fuel).toBe(0);
});
