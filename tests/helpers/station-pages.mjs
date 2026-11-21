import {expect} from '@playwright/test';
import {mockDragonRoute} from './dragonroute.mjs';
export const fuelPattern='https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?**';
export const matrixPattern='https://router.project-osrm.org/table/v1/driving/**';
export const point=(page,id)=>page.locator(`#map [data-station-point="${id}"]`);
export async function ready(page){await expect(page.locator('#stationsBtn')).toBeEnabled();await expect(page.locator('#cancelStationsBtn')).toBeHidden()}
export async function setupPages(page,{count=100,leaflet=false,origin='http://127.0.0.1:4173',ties=false}={}){
 await mockDragonRoute(page,{origin});const calls={fuel:0,matrix:0,route:0},control={fail:false,hold:false},pending=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/route/v1/'))calls.route++});
 if(leaflet){await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',r=>r.fulfill({path:'node_modules/leaflet/dist/leaflet.js',contentType:'application/javascript'}));await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',r=>r.fulfill({path:'node_modules/leaflet/dist/leaflet.css',contentType:'text/css'}))}
 await page.route(fuelPattern,r=>{calls.fuel++;return r.fulfill({json:{total_count:count,results:Array.from({length:count},(_,i)=>({id:`S${i+1}`,adresse:`${i+1} rue publique`,ville:'Valence',geom:[45.4-i*.00001,4.87],e10_prix:ties?1.6:1.8-i*.001,e10_maj:'2026-09-17T09:00:00Z',horaires_automate_24_24:'Oui',services_service:i%2?[]:['Toilettes publiques']}))}})});
 await page.route(matrixPattern,r=>{calls.matrix++;if(control.hold){pending.push(r);return}if(control.fail)return r.abort();const coords=new URL(r.request().url()).pathname.split('/').at(-1).split(';'),n=coords.length,distances=Array.from({length:n},()=>Array(n).fill(0)),durations=Array.from({length:n},()=>Array(n).fill(0));for(let i=1;i<n-1;i++){const k=Math.round((45.4-Number(coords[i].split(',')[1]))/.00001);distances[0][i]=50000+k*10;distances[i][n-1]=56000-k*10;durations[0][i]=2000+k;durations[i][n-1]=ties?2200-k:2200}return r.fulfill({json:{code:'Ok',distances,durations}})});
 await page.goto(origin+'/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await page.locator('#stationsBtn').click();await ready(page);return {calls,control,pending,errors};
}
export async function collectAll(page,count=100){for(let n=20;n<count;n+=20){await page.locator('#continueStationsBtn').click();await ready(page)}await expect(page.locator('#testedCount')).toHaveText(String(count))}
export async function snapshot(page){return {storage:await page.evaluate(()=>JSON.stringify({...localStorage})),route:await page.locator('#tripKm').textContent()}}
