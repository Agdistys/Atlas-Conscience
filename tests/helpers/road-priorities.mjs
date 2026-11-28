import {test,expect} from '@playwright/test';
import {mockDragonRoute} from './dragonroute.mjs';
import {checkAccessibility} from './inspection.mjs';
import {readingOverflow,enlargeText,reachable,target44} from './reading-layout.mjs';
const pattern='https://data.geopf.fr/navigation/itineraire?**';
async function setup(page,{same=false,partial=false,fuel='E10'}={}){
 await mockDragonRoute(page);const calls=[];page.on('request',r=>{if(/geocodage|navigation\/itineraire|\/route\/v1|data.economie/.test(r.url()))calls.push(r.url())});
 await page.route(pattern,r=>{const p=new URL(r.request().url()).searchParams,short=p.get('optimization')==='shortest';if(partial&&short)return r.fulfill({status:503,json:{error:'source indisponible'}});const a=p.get('start').split(',').map(Number),b=p.get('end').split(',').map(Number),distance=short&&!same?100000:120000,duration=short&&!same?9600:8400;return r.fulfill({json:{resource:'bdtopo-osrm',resourceVersion:'2026-11-21',profile:'car',optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,constraints:[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}],geometry:{type:'LineString',coordinates:[a,[short&&!same?4.87:4.97,45.4],b]},portions:[{start:p.get('start'),end:p.get('end'),distance,duration}]}})});
 await page.goto('/DragonRoute/');await page.locator('#routingOptions').evaluate(e=>e.open=true);await page.locator('#avoidHighways').check();await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');if(fuel!=='E10'){await page.locator('#fuel').evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true});await page.locator('#fuel').selectOption(fuel)}await page.locator('#roadCompareBtn').click();await page.locator('#roadDeparture').fill('2026-11-20T10:00');await page.locator('#roadArriveBy').fill('2026-11-20T12:30');await page.locator('#roadCalculate').click();await expect(page.locator('#roadStatus')).toContainText((partial?1:2)+'/2 critères calculés');
 await page.evaluate(()=>{window.priorityWrites=0;for(const k of ['setItem','removeItem','clear']){const f=Storage.prototype[k];Storage.prototype[k]=function(...args){priorityWrites++;return f.apply(this,args)}}});return calls;
}
const card=(page,id)=>page.locator('[data-priority-id='+id+']');
async function open(page){await page.locator('#roadPrioritiesOpen').click();await expect(page.locator('#roadPrioritiesTitle')).toBeFocused()}
async function score(page){await page.locator('#roadPriorityFactor').selectOption('voiture-compact-essence');await page.locator('#roadPriorityDuration').fill('3');await page.locator('#roadPriorityCarbon').fill('7');await page.locator('#roadPrioritiesApply').click();await expect(card(page,'shortest')).toContainText('Indice 30,0 / 100')}
async function noWrites(page){expect(await page.evaluate(()=>priorityWrites)).toBe(0)}

export {setup, open, score};
