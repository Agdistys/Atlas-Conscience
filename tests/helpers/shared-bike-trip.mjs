import {preparationControl} from './preparation-controls.mjs';
import {expect} from '@playwright/test';import fs from 'node:fs';
import {mockDragonRoute,addressFeature,placesResponse,geocodingPattern} from './dragonroute.mjs';import {checkAccessibility,checkOverflow,capture} from './inspection.mjs';
const base='https://download.data.grandlyon.com/files/rdata/jcd_jcdecaux.jcdvelov/',cycle='https://routing.openstreetmap.de/routed-bike/route/v1/driving/**',ign='https://data.geopf.fr/navigation/itineraire?**',now=Date.parse('2026-11-19T06:00:00Z');
const raw=n=>JSON.parse(fs.readFileSync('tests/fixtures/shared-bike-trip/'+n+'.json'));
function feeds(){const d={};for(const n of ['station_information','station_status','vehicle_types'])d[n]=JSON.parse(fs.readFileSync('tests/fixtures/shared-bikes/'+n+'.json'));d.station_status.last_updated=now/1000;for(const r of d.station_status.data.stations){r.last_reported=now/1000;r.is_installed=r.is_renting=r.is_returning=true;r.num_bikes_available=2;r.num_docks_available=3;r.vehicle_types_available=[{vehicle_type_id:'mechanical',count:1},{vehicle_type_id:'electrical',count:1}]}return d}
async function setup(page,{data=feeds(),leaflet=false,disabled=false,open=true,preview=false}={}){
 await mockDragonRoute(page);await page.clock.setFixedTime(new Date(now));const calls=[];page.on('request',r=>{if(/data.geopf.fr|routing.openstreetmap.de|download.data.grandlyon.com/.test(r.url()))calls.push(r.url())});
 await page.route(base+'*.json',r=>r.fulfill({json:data[new URL(r.request().url()).pathname.split('/').at(-1).replace('.json','')]}));
 await page.route(geocodingPattern,r=>{const end=new URL(r.request().url()).searchParams.get('q').includes('Part-Dieu');return r.fulfill({json:placesResponse(end?addressFeature(4.858507,45.760146,'Gare Part-Dieu, Lyon'):addressFeature(4.832126,45.757974,'Place Bellecour, Lyon'))})});
 await page.route(ign,r=>r.fulfill({json:raw(new URL(r.request().url()).searchParams.get('start').startsWith('4.832126')?'walk-access':'walk-exit')}));await page.route(cycle,r=>r.fulfill({json:raw('cycle')}));
 if(leaflet)await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:fs.readFileSync('node_modules/leaflet/dist/'+(r.request().url().endsWith('.css')?'leaflet.css':'leaflet.js')),contentType:r.request().url().endsWith('.css')?'text/css':'application/javascript'}));
 if(disabled)await page.route('**/DragonRoute/config.js',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:(await res.text()).replace('cyclingApi: "https://routing.openstreetmap.de/routed-bike/route/v1/driving/"','cyclingApi: ""')})});
 if(preview)await page.route('**/DragonRoute/',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('<body>','<body data-preview="true">')})});
 await page.goto('/DragonRoute/');if(!open)return calls;await (await preparationControl(page,'bikesBtn')).click();await page.locator('#bikesLoad').click();await expect(page.locator('#bikesBrowse')).toBeVisible();await page.locator('#bikeTripStart').fill('Place Bellecour, Lyon');await page.locator('#bikeTripEnd').fill('Gare Part-Dieu, Lyon');return calls;
}
async function choose(page,role,id){await page.locator('#bikesQuery').fill(id);await page.locator(`[data-bike-trip-role="${role}"][data-bike-trip-station="${id}"]`).click()}
async function stations(page){await choose(page,'pickup','2002');await choose(page,'dropoff','3011')}
async function calculate(page){await page.locator('#bikeTripSearch').click();await expect(page.locator('#bikeTripStatus')).toContainText('Les trois étapes sont calculées');await expect(page.locator('#bikeTripSearch')).toBeEnabled()}
async function overflow(page){expect(await page.locator('#bikesDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await checkOverflow(page)}


export {setup,choose,stations,calculate,feeds,raw,now,cycle,ign};
