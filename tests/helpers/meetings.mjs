import {expect} from '@playwright/test';import {createRequire} from 'node:module';const require=createRequire(import.meta.url);import fs from 'node:fs/promises';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from './dragonroute.mjs';
const osrm='https://router.project-osrm.org/route/v1/driving/**',ign='https://data.geopf.fr/navigation/itineraire?**',key='dragonroute.prepared.v11.public';
const pickup=[4.86,45.55],dropoff=[4.88,45.25];
function routeResult(points){
 const count=points.length,position=points.findIndex(p=>p[0]===4.87||p[0]===4.88&&p[1]===45.2);
 const distances=count===2?[100000]:count===4?[30000,60000,30000]:count===5?(position===1?[10000,20000,60000,40000]:position===2?[30000,30000,40000,30000]:[30000,60000,20000,20000]):[50000,60000];
 const legs=distances.map(distance=>({distance,duration:distance*.06}));return {distance:distances.reduce((a,b)=>a+b,0),duration:legs.reduce((a,b)=>a+b.duration,0),legs,geometry:{type:'LineString',coordinates:points}};
}
function response(url){
 const u=new URL(url);if(u.host==='router.project-osrm.org'){const points=u.pathname.split('/').at(-1).split(';').map(s=>s.split(',').map(Number));return {code:'Ok',waypoints:points.map(location=>({location})),routes:[routeResult(points)]}}
 const p=u.searchParams,points=[p.get('start'),...(p.get('intermediates')?.split('|')||[]),p.get('end')].map(s=>s.split(',').map(Number)),r=routeResult(points);
 return {resource:'bdtopo-osrm',resourceVersion:'2026-11-18',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance:r.distance,duration:r.duration,constraints:p.has('constraints')?[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}]:[],geometry:r.geometry,portions:points.slice(1).map((end,i)=>({start:points[i].join(','),end:end.join(','),...r.legs[i]}))};
}
async function setup(page,engine='osrm',leaflet=false,configure=null){
 await mockDragonRoute(page);const calls=[];page.on('request',r=>{if(r.url().includes('/route/v1/')||r.url().includes('/navigation/itineraire'))calls.push(r.url())});
 await page.route(osrm,r=>r.fulfill({json:response(r.request().url())}));await page.route(ign,r=>r.fulfill({json:response(r.request().url())}));
 await page.route(geocodingPattern,async r=>{const q=new URL(r.request().url()).searchParams.get('q'),p=q==='PRISE_PRIVEE'?pickup:q==='DEPOSE_PRIVEE'?dropoff:q.toLowerCase().includes('valence')?[4.8924,44.9334]:[4.8357,45.764];await r.fulfill({json:placesResponse(addressFeature(...p,q))})});
 if(leaflet)for(const [file,contentType] of [['leaflet.js','application/javascript'],['leaflet.css','text/css']])await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/'+file,r=>r.fulfill({path:require.resolve('leaflet/dist/'+file),contentType}));
 if(configure)await configure();
 await page.goto('/DragonRoute/');if(engine==='ign'){await page.locator('#routeOptimization').selectOption('shortest');await page.locator('#avoidHighways').check()}
 await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await page.locator('#ridesTab').click();return calls;
}
async function fields(page,position='before'){await page.locator('#meetingPickup').fill('PRISE_PRIVEE');await page.locator('#meetingDropoff').fill('DEPOSE_PRIVEE');await page.locator('#meetingStationPosition').selectOption(position)}
async function calculate(page){await page.locator('#meetingCalculate').click();await expect(page.locator('#meetingApply')).toBeVisible()}
async function adopt(page){page.once('dialog',d=>d.accept());await page.locator('#meetingApply').click();await expect(page.locator('#meetingSummary')).toBeVisible()}
async function plan(page,position='before'){await fields(page,position);await calculate(page);await adopt(page)}
async function download(page,id){const p=page.waitForEvent('download');await page.locator(id).click();return fs.readFile(await(await p).path(),'utf8')}
async function save(page){await page.locator('#savePreparationBtn').click();await page.locator('#preparedConfirm').check();await page.locator('#preparedSave').click();await expect(page.locator('#preparedMessage')).toContainText('Préparation enregistrée');return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)}

export {setup,fields,calculate,adopt,plan,download,save,key};
