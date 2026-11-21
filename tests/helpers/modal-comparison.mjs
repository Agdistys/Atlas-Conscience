import {expect} from '@playwright/test';import fs from 'node:fs';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from './dragonroute.mjs';
import {checkAccessibility,checkOverflow} from './inspection.mjs';
import {transferPlan,transitPlanPattern} from './transit-transfers.mjs';
const a=[5.7152,45.1913],b=[5.731,45.1572],ign='https://data.geopf.fr/navigation/itineraire?**',bike='https://routing.openstreetmap.de/routed-bike/route/v1/driving/**';
function road(url){const p=new URL(url).searchParams,start=p.get('start'),end=p.get('end');return {resource:'bdtopo-osrm',resourceVersion:'2026-11-18',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance:1000,duration:2400,constraints:[],geometry:{type:'LineString',coordinates:[start.split(',').map(Number),end.split(',').map(Number)]},portions:[{start,end,distance:1000,duration:2400}]}}
function completePlan(){// Simulated stop-to-stop alternatives, with no walking step, for the complete-group branch.
 const d=transferPlan();for(const r of d.plan.itineraries){const first=r.legs[0],last=r.legs.at(-1);r.legs=r.legs.filter(l=>l.mode!=='WALK');Object.assign(r.legs[0],{from:{...first.from,stopId:'SEM:SIMULATED-START'},startTime:r.startTime});Object.assign(r.legs.at(-1),{to:{...last.to,stopId:'SEM:SIMULATED-END'},endTime:r.endTime});for(const l of r.legs){l.duration=(l.endTime-l.startTime)/1000;l.legGeometry=null}}
 return d;
}
async function setup(page,{complete=false,fuel='Gazole',mutate=()=>{},origin}={}){
 await mockDragonRoute(page,origin?{origin}:{});await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));const calls=[];
 page.on('request',r=>{if(/geocodage|\/plan\?|\/route\/v1|navigation\/itineraire/.test(r.url()))calls.push(r.url())});
 await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(new URL(r.request().url()).searchParams.get('q').includes('Innsbruck')?addressFeature(...b,'Avenue Innsbruck, Grenoble'):addressFeature(...a,'Gare de Grenoble'))}));
 await page.route(ign,r=>r.fulfill({json:road(r.request().url())}));
 await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>r.fulfill({json:{code:'Ok',routes:[{distance:6000,duration:900,geometry:{type:'LineString',coordinates:[a,b]}}]}}));
 await page.route(bike,r=>r.fulfill({json:JSON.parse(fs.readFileSync('tests/fixtures/cycling-comparison/grenoble-cycle.json'))}));
 await page.route(transitPlanPattern,r=>{const d=complete?completePlan():transferPlan();mutate(d,r.request().url());return r.fulfill({json:d})});
 await page.addInitScript(fuel=>localStorage.setItem('dragonroute.profile.v2.public',JSON.stringify({version:2,vehicle:{name:'Véhicule de test',type:'car',fuel,cons:6.2,liters:40},addresses:[],stations:[]})),fuel);
 await page.goto('/DragonRoute/');await page.locator('#start').fill('Gare Grenoble');await page.locator('#end').fill('Avenue Innsbruck Grenoble');return calls;
}
async function start(page,{cycle=true}={}){await page.locator('#transitBtn').click();await page.locator('#transitWhen').fill('2026-11-19T10:00');await page.locator('#transitCompare').check();if(cycle)await page.locator('#transitCycle').check();await page.locator('#transitSearch').click()}
async function ready(page,options){await start(page,options);await expect(page.locator('[data-modal-carbon-open]')).toBeEnabled();await expect(page.locator('#transitSearch')).toBeEnabled()}
async function open(page){await page.locator('[data-modal-carbon-open]').click();await expect(page.locator('#modalCarbonTitle')).toBeFocused()}
const row=(page,key)=>page.locator('[data-modal-row="'+key+'"]');
async function car(page,occupants='4'){await page.locator('#modalCarbonCar').selectOption('voiture-compact-diesel');await page.locator('#modalCarbonOccupants').fill(occupants)}
async function transit(page,index=null){const loc=index===null?page.locator('[data-modal-option]'):page.locator('[data-modal-option="'+index+'"]');for(const s of await loc.all()){await s.evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true});await s.selectOption('tramway')}}

export {setup,ready,open,car,transit,completePlan,road};
