import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkOverflow,checkAccessibility} from '../helpers/inspection.mjs';

const pattern='https://data.geopf.fr/navigation/itineraire?**',key='dragonroute.prepared.v11.public',oldKey='dragonroute.prepared.v3.public';
function responseFor(url){
 const p=new URL(url).searchParams,points=[p.get('start'),...(p.get('intermediates')?.split('|')||[]),p.get('end')],short=p.get('optimization')==='shortest',walk=p.get('profile')==='pedestrian';
 const distance=(walk?2000:short?100000:120000)+(points.length>2?10000:0),duration=(walk?1600:short?9600:8400)+(points.length>2?600:0);
 const coords=points.map(s=>s.split(',').map(Number));if(points.length===2)coords.splice(1,0,[short?4.87:4.97,45.4]);
 return {resource:'bdtopo-osrm',resourceVersion:'2026-11-18',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,
  constraints:p.has('constraints')?[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}]:[],geometry:{type:'LineString',coordinates:coords},
  portions:points.slice(1).map((end,i)=>({start:points[i],end,distance:distance/(points.length-1),duration:duration/(points.length-1)}))};
}
async function setup(page){
 await mockDragonRoute(page);const calls={ign:[],osrm:[],geo:0};page.on('request',r=>{const u=r.url();if(u.includes('/navigation/itineraire'))calls.ign.push(u);if(u.includes('router.project-osrm.org'))calls.osrm.push(u);if(u.includes('/geocodage/'))calls.geo++});
 await page.route(pattern,r=>r.fulfill({json:responseFor(r.request().url())}));await page.goto('/DragonRoute/');return calls;
}
async function go(page){await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt')}
async function save(page){await page.locator('#savePreparationBtn').click();await page.locator('#preparedName').fill('Distance choisie');await page.locator('#preparedConfirm').check();await page.locator('#preparedSave').click();await expect(page.locator('#preparedMessage')).toContainText('Préparation enregistrée');return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)}
async function download(page,id){const wait=page.waitForEvent('download');await page.locator(id).click();return fs.readFile(await(await wait).path(),'utf8')}

test('critères : durée et distance changent le tracé sans mélanger le cache',async({page},info)=>{
 const calls=await setup(page);await page.locator('#avoidHighways').check();await go(page);await expect(page.locator('#tripKm')).toHaveText('120,0 km');await expect(page.locator('#tripTime')).toHaveText('140 min');
 await page.locator('#routeOptimization').selectOption('shortest');await expect(page.locator('#summary')).toBeHidden();expect(calls.ign).toHaveLength(1);await go(page);await expect(page.locator('#tripKm')).toHaveText('100,0 km');await expect(page.locator('#tripTime')).toHaveText('160 min');await expect(page.locator('#appliedRouting')).toContainText('Plus court');
 await page.locator('#sheet').evaluate(e=>e.scrollTop=0);await capture(page,info,'critere-distance');await checkOverflow(page);await checkAccessibility(page,info,'critere-distance');
 await page.locator('#routeOptimization').selectOption('fastest');await go(page);await expect(page.locator('#tripKm')).toHaveText('120,0 km');await expect(page.locator('#appliedRouting')).toContainText('Plus rapide');expect(calls.ign.map(u=>new URL(u).searchParams.get('optimization'))).toEqual(['fastest','shortest']);expect(calls.osrm).toHaveLength(0);
});

test('critères : stations et arrêt utilisent aussi la distance, avec autoroutes permises',async({page})=>{
 const calls=await setup(page);await page.locator('#routeOptimization').selectOption('shortest');await go(page);await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('2 stations comparées');
 page.once('dialog',d=>d.accept());await page.locator('[data-select]').first().click();await expect(page.locator('#tripKm')).toHaveText('110,0 km');await expect(page.locator('#appliedRouting')).toContainText('Plus court');expect(calls.ign).toHaveLength(3);
 for(const u of calls.ign){const p=new URL(u).searchParams;expect(p.get('optimization')).toBe('shortest');expect(p.has('constraints')).toBe(false)}expect(calls.osrm).toHaveLength(0);
 await page.locator('#removeStopBtn').click();await expect(page.locator('#tripKm')).toHaveText('100,0 km');expect(calls.ign).toHaveLength(3);
});

test('critères : réponse différente, absente, contrainte inventée et panne refusées sans repli',async({page})=>{
 const calls=await setup(page);let mode='wrong';await page.route(pattern,r=>{const d=responseFor(r.request().url());if(mode==='quota')return r.fulfill({status:429,json:{error:'quota'}});if(mode==='down')return r.fulfill({status:503,json:{error:'down'}});if(mode==='wrong')d.optimization='fastest';if(mode==='missing')delete d.optimization;if(mode==='constraint')d.constraints=[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}];return r.fulfill({json:d})});
 await page.locator('#routeOptimization').selectOption('shortest');for(const m of ['wrong','missing','constraint','quota','down']){mode=m;await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText(m==='quota'?'Limite du service IGN':m==='down'?'Aucun autre critère':'incomplète ou incohérente');await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#routeOptimization')).toHaveValue('shortest')}
 expect(calls.osrm).toHaveLength(0);expect(calls.ign).toHaveLength(5);mode='ok';await go(page);
});

test('critères : incompatibilité et service désactivé demandent un choix explicite',async({page})=>{
 const calls=await setup(page);await page.locator('#routeOptimization').selectOption('shortest');await page.locator('#routeVehicle').evaluate(e=>{e.value='truck';e.dispatchEvent(new Event('change',{bubbles:true}))});await expect(page.locator('#goBtn')).toBeDisabled();await expect(page.locator('#routeOptimization')).toHaveValue('shortest');await expect(page.locator('#optimizationNote')).toContainText('indisponible');expect(calls.geo).toBe(0);
 await page.locator('#routeVehicle').selectOption('car');await page.locator('#avoidTolls').evaluate(e=>{e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}))});await expect(page.locator('#goBtn')).toBeDisabled();expect(calls.ign).toHaveLength(0);page.once('dialog',d=>d.accept());await page.locator('#clearUnavailableOptions').click();await expect(page.locator('#goBtn')).toBeEnabled();await go(page);
 await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('ignRouting: true','ignRouting: false')})});await page.reload();await expect(page.locator('#routeOptimization option[value=shortest]')).toBeDisabled();await expect(page.locator('#routeOptimization')).toHaveValue('fastest');await go(page);expect(calls.osrm).toHaveLength(1);
});

test('critères : sauvegarde, import, reprise et GPX conservent le choix et le tracé',async({page},info)=>{
 const calls=await setup(page);await page.locator('#routeOptimization').selectOption('shortest');await go(page);const data=await save(page);expect(data.version).toBe(11);expect(data.entries[0].optimization).toBe('shortest');expect(JSON.parse(await download(page,'#preparedExport'))).toEqual(data);
 await page.locator('#preparedImportFile').setInputFiles({name:'trajet.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.locator('#preparedImportConfirm').check();await page.locator('#preparedImportApply').click();await page.reload();await page.locator('#preparedBtn').click();await page.locator('[data-prepared-show]').click();await expect(page.locator('#preparedDetails')).toContainText('Plus court');await page.locator('#preparedResumeBtn').click();await expect(page.locator('#routeOptimization')).toHaveValue('shortest');const geo=calls.geo;await go(page);expect(calls.geo).toBe(geo);
 await page.locator('#navigationBtn').click();await expect(page.locator('#navigationOptimizationNote')).toContainText('ne transmettent pas ce critère');const gpx=await download(page,'#exportGpxBtn');expect(gpx).toContain('Plus court');expect(gpx.match(/<trkpt /g)).toHaveLength(3);expect(gpx).toContain('lon="4.87000000"');await capture(page,info,'critere-navigation');await checkAccessibility(page,info,'critere-navigation');
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>/^dragonroute\.(profile|journal)/.test(k)))).toEqual([]);
});

test('critères : ancienne préparation intacte, critère inconnu et conflit conservé',async({page})=>{
 const calls=await setup(page);await go(page);const old=await save(page);old.version=3;delete old.entries[0].optimization;const raw=JSON.stringify(old);await page.evaluate(([k,o,raw])=>{localStorage.removeItem(k);localStorage.setItem(o,raw)},[key,oldKey,raw]);await page.reload();await page.locator('#preparedBtn').click();expect(JSON.parse(await download(page,'#preparedV3Export'))).toEqual(old);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();await page.locator('[data-prepared-show]').click();await expect(page.locator('#preparedDetails')).toContainText('Critère non renseigné');const n=calls.geo;await page.locator('#preparedResumeBtn').click();await expect(page.locator('#routeOptimization')).toHaveValue('');await expect(page.locator('#goBtn')).toBeDisabled();expect(calls.geo).toBe(n);await page.locator('#routeOptimization').selectOption('shortest');await go(page);expect(calls.geo).toBe(n);expect(await page.evaluate(k=>localStorage.getItem(k),oldKey)).toBe(raw);
 await page.locator('#preparedBtn').click();await page.locator('[data-prepared-rename]').click();await page.locator('#preparedName').fill('Ancien renommé');await page.locator('#preparedConfirm').check();await page.locator('#preparedSave').click();const migrated=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(migrated.entries[0].optimization).toBeNull();await page.locator('[data-prepared-rename]').click();await page.locator('#preparedConfirm').check();await page.evaluate(k=>localStorage.setItem(k,'CONCURRENT_CHANGE'),oldKey);await page.locator('#preparedSave').click();await expect(page.locator('#preparedMessage')).toContainText('autre onglet');expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)).toEqual(migrated);
});

test('critères : comparaison voiture marche, tri et sélection gardent la demande',async({page})=>{
 const calls=await setup(page);await page.locator('#routeOptimization').selectOption('shortest');await go(page);await page.locator('#compareBtn').click();await page.locator('#comparisonCalculate').click();await expect(page.locator('#comparisonStatus')).toContainText('2/2 trajets disponibles');for(const mode of ['car','walk'])await expect(page.locator(`[data-compare-mode=${mode}]`)).toContainText('Plus court');const n=calls.ign.length;await page.locator('#comparisonSort').selectOption('distance');expect(calls.ign).toHaveLength(n);await page.locator('[data-compare-select=walk]').click();await expect(page.locator('#routeOptimization')).toHaveValue('shortest');await expect(page.locator('#tripKm')).toHaveText('2,0 km');await page.locator('[data-compare-select=car]').click();await expect(page.locator('#tripKm')).toHaveText('100,0 km');expect(calls.ign).toHaveLength(n);expect(calls.ign.every(u=>new URL(u).searchParams.get('optimization')==='shortest')).toBe(true);expect(calls.osrm).toHaveLength(0);
});

test('critères : annulation des stations retire les réponses tardives et garde le trajet',async({page})=>{
 await setup(page);await page.locator('#routeOptimization').selectOption('shortest');await go(page);let release;const pending=new Promise(r=>release=r);let started;const seen=new Promise(r=>started=r);await page.route(pattern,async r=>{started();await pending;await r.fulfill({json:responseFor(r.request().url())}).catch(()=>{})});await page.locator('#stationsBtn').click();await seen;await page.locator('#cancelStationsBtn').click();release();await expect(page.locator('#fuelStatus')).toContainText('Recherche interrompue');await expect(page.locator('.result-card')).toHaveCount(0);await expect(page.locator('#tripKm')).toHaveText('100,0 km');await expect(page.locator('#routeOptimization')).toHaveValue('shortest');
});
