import fs from 'node:fs';
import {expect} from '@playwright/test';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from './dragonroute.mjs';
import {feeds,now} from './shared-bike-trip.mjs';
export const cycle='https://routing.openstreetmap.de/routed-bike/route/v1/driving/**',bikes='https://download.data.grandlyon.com/files/rdata/jcd_jcdecaux.jcdvelov/';
export const headers=value=>({'Retry-After':value,'Access-Control-Expose-Headers':'Retry-After, Date'});
export async function elapsed(page,ms){await page.evaluate(ms=>{const old=performance.now.bind(performance);Object.defineProperty(performance,'now',{configurable:true,value:()=>old()+ms})},ms)}
export async function advance(page,ms){const n=await page.evaluate(()=>Date.now());await page.clock.setFixedTime(new Date(n+ms));await elapsed(page,ms)}
export async function late(page,pattern){await page.addInitScript(pattern=>{const original=window.fetch;window.fetch=(url,...args)=>{if(String(url).includes(pattern)&&window.deferMode!==false){window.deferMode=false;return new Promise(resolve=>window.releaseMode=()=>resolve(new Response('{}',{status:429,headers:{'Retry-After':'3600'}})))}return original(url,...args)}},pattern)}
export async function setup(page,{origin='http://127.0.0.1:4173',leaflet=false}={}){
 await mockDragonRoute(page,{origin});await page.clock.setFixedTime(new Date(now));const calls={geo:[],cycle:[],bikes:[]};
 page.on('request',r=>{const u=r.url();const k=u.includes('/geocodage/')?'geo':u.includes('/routed-bike/')?'cycle':u.startsWith(bikes)?'bikes':null;if(k)calls[k].push(u)});
 await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(new URL(r.request().url()).searchParams.get('q').includes('Bellecour')?addressFeature(4.832126,45.757974,'Place Bellecour, Lyon'):addressFeature(4.858507,45.760146,'Gare Part-Dieu, Lyon'))}));
 await page.route(cycle,r=>r.fulfill({json:JSON.parse(fs.readFileSync('tests/fixtures/cycling/lyon.json'))}));const data=feeds();
 await page.route(bikes+'*.json',r=>r.fulfill({json:data[new URL(r.request().url()).pathname.split('/').at(-1).replace('.json','')]}));
 if(leaflet)await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:fs.readFileSync('node_modules/leaflet/dist/'+(r.request().url().endsWith('.css')?'leaflet.css':'leaflet.js')),contentType:r.request().url().endsWith('.css')?'text/css':'application/javascript'}));
 await page.goto(origin+'/DragonRoute/');await page.locator('#start').fill('Place Bellecour, Lyon');await page.locator('#end').fill('Gare Part-Dieu, Lyon');return calls;
}
export async function openCycle(page){await page.locator('#cycleBtn').click()}
export async function calc(page){await page.locator('#cycleSearch').click();await expect(page.locator('#cycleStatus')).toContainText('Parcours vélo disponible');await expect(page.locator('#cycleSearch')).toBeEnabled()}
export async function openBikes(page){await page.locator('#bikesBtn').click();await page.locator('#bikesLoad').click();await expect(page.locator('#bikesLoad')).toBeEnabled()}
