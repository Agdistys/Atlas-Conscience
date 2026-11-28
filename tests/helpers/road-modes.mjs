import {expect} from '@playwright/test';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from './dragonroute.mjs';
const pattern='https://data.geopf.fr/navigation/itineraire?**';
function responseFor(url){const p=new URL(url).searchParams,walk=p.get('profile')==='pedestrian',a=p.get('start'),b=p.get('end'),distance=walk?2510.5:3000,duration=walk?2510:600;return {resource:'bdtopo-osrm',resourceVersion:'2026-11-17',profile:p.get('profile'),optimization:'fastest',crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,constraints:walk?[]:[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}],geometry:{type:'LineString',coordinates:[a.split(',').map(Number),[2.35,48.85],b.split(',').map(Number)]},portions:[{start:a,end:b,distance,duration}]};}
async function setup(page,{lyon=false,origin}={}){await mockDragonRoute(page,{origin});const calls={geo:0,ign:[],osrm:[],other:[]};page.on('request',r=>{const u=r.url();if(u.includes('/geocodage/'))calls.geo++;if(u.includes('/navigation/itineraire'))calls.ign.push(u);if(u.includes('/route/v1/driving'))calls.osrm.push(u);if(/google.com|waze.com/.test(u))calls.other.push(u)});if(!lyon)await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(new URL(r.request().url()).searchParams.get('q').includes('Valence')?addressFeature(2.367776,48.852891,'Arrivée publique'):addressFeature(2.337306,48.849319,'Départ public'))}));await page.route(pattern,r=>r.fulfill({json:responseFor(r.request().url())}));await page.goto('/DragonRoute/');return calls;}
async function go(page,ign=true){if(ign)await page.locator('#avoidHighways').check();await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');}
async function open(page){await page.locator('#compareBtn').click();await expect(page.locator('#comparisonPanel')).toBeVisible();}
async function calculate(page,n=2){await page.locator('#comparisonCalculate').click();await expect(page.locator('#comparisonStatus')).toContainText(`${n}/2 trajets disponibles`);}
const card=(page,mode)=>page.locator(`[data-compare-mode=${mode}]`);
const select=(page,mode)=>page.locator(`[data-compare-select=${mode}]`);

export {setup,go,open,calculate,pattern,responseFor};
