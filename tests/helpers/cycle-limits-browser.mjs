import {preparationControl} from './preparation-controls.mjs';
import {elapsed} from './mode-quotas.mjs';
import {test,expect} from '@playwright/test';import fs from 'node:fs';import fsp from 'node:fs/promises';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from './dragonroute.mjs';import {checkAccessibility,checkOverflow} from './inspection.mjs';
const endpoint='https://routing.openstreetmap.de/routed-bike/route/v1/driving/',ign='https://data.geopf.fr/navigation/itineraire?**',tc='https://data.mobilites-m.fr/api/routers/default/plan?**';
const bike=()=>JSON.parse(fs.readFileSync('tests/fixtures/cycling-comparison/grenoble-cycle.json')),transit=kind=>JSON.parse(fs.readFileSync('tests/fixtures/transit/'+kind+'.json'));
const a=[5.7152,45.1913],b=[5.731,45.1572];
function road(url){const p=new URL(url).searchParams,walk=p.get('profile')==='pedestrian',start=p.get('start'),end=p.get('end'),distance=walk?1000:6000,duration=walk?2400:900;return {resource:'bdtopo-osrm',resourceVersion:'2026-11-18',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,constraints:walk?[]:[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}],geometry:{type:'LineString',coordinates:[start.split(',').map(Number),end.split(',').map(Number)]},portions:[{start,end,distance,duration}]}}
async function setup(page,{disabled=false,heavy=false,preview=false}={}){
 await mockDragonRoute(page);await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));const calls={bike:[],road:[],geo:[],tc:[]};page.on('request',r=>{const u=r.url();if(u.startsWith(endpoint))calls.bike.push(u);else if(/\/route\/v1|\/navigation\/itineraire/.test(u))calls.road.push(u);if(u.includes('/geocodage/'))calls.geo.push(u);if(u.includes('data.mobilites-m.fr/api/routers'))calls.tc.push(u)});
 await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(new URL(r.request().url()).searchParams.get('q').includes('Innsbruck')?addressFeature(...b,'Avenue Innsbruck, Grenoble'):addressFeature(...a,'Devant la gare de Grenoble'))}));await page.route(ign,r=>r.fulfill({json:road(r.request().url())}));await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>r.fulfill({json:{code:'Ok',routes:[{distance:6000,duration:900,geometry:{type:'LineString',coordinates:[a,b]}}]}}));await page.route(endpoint+'**',r=>r.fulfill({json:bike()}));await page.route(tc,r=>r.fulfill({json:transit(new URL(r.request().url()).searchParams.get('arriveBy')==='true'?'arrive':'depart')}));
 if(disabled)await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('cyclingApi: "'+endpoint+'"','cyclingApi: ""')})});
 if(heavy)await page.addInitScript(()=>localStorage.setItem('dragonroute.profile.v2.public',JSON.stringify({version:2,vehicle:{name:'Caravane test',type:'caravan',fuel:'E10',cons:8,liters:40},addresses:[],stations:[]})));
 if(preview)await page.route('**/DragonRoute/',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('<body>','<body data-preview="true">')})});
 await page.goto('/DragonRoute/');await page.locator('#start').fill('Gare de Grenoble');await page.locator('#end').fill('Avenue Innsbruck Grenoble');return calls;
}
async function roadOpen(page,{cycle=true,walk=false}={}){if(walk)await (await preparationControl(page,'walkMode')).click();await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await page.locator('#compareBtn').click();if(cycle)await page.locator('#comparisonCycle').check()}
async function roadRun(page,n=3){await page.locator('#comparisonCalculate').click();await expect(page.locator('#comparisonStatus')).toContainText(`${n}/3 trajets disponibles`);await expect(page.locator('#comparisonCalculate')).toBeEnabled()}
async function tcOpen(page){await (await preparationControl(page,'transitBtn')).click();await page.locator('#transitWhen').fill('2026-11-19T10:00');await page.locator('#transitCompare').check();await page.locator('#transitCycle').check()}
async function tcRun(page){await page.locator('#transitSearch').click();await expect(page.locator('[data-transit-mode=cycle]')).toBeVisible();await expect(page.locator('#transitSearch')).toBeEnabled()}
const card=p=>p.locator('[data-compare-mode=cycle]');const now=async(p,seconds)=>{const target=Date.parse('2026-11-18T12:00Z')+seconds*1000,delta=Math.max(0,target-await p.evaluate(()=>Date.now()));await p.clock.setFixedTime(new Date(target));await elapsed(p,delta)};
async function capture(page,info,name,locator){if(locator)await locator.scrollIntoViewIfNeeded();await checkOverflow(page);await page.screenshot({path:info.outputPath(name+'.png'),animations:'disabled'});await checkAccessibility(page,info,name)}
async function ignoreAbort(page){await page.addInitScript(()=>{const f=fetch;window.fetch=(u,o)=>f(u,String(u).includes('routed-bike')?{...o,signal:undefined}:o)})}


export {setup,roadOpen,roadRun,tcOpen,tcRun,endpoint,bike,now,ignoreAbort};
