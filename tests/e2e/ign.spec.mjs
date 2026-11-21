import {confirmStationPreview} from '../helpers/dragonroute.mjs';
import { test, expect } from '@playwright/test';
import { mockDragonRoute } from '../helpers/dragonroute.mjs';
import { capture, checkAccessibility, checkOverflow } from '../helpers/inspection.mjs';

const pattern='https://data.geopf.fr/navigation/itineraire?**';
function responseFor(url){
  const p=new URL(url).searchParams;
  const points=[p.get('start'),...(p.get('intermediates')?.split('|')||[]),p.get('end')];
  const via=points.length===3,distance=via?130000:120000,duration=via?9000:8400;
  return {resource:'bdtopo-osrm',resourceVersion:'2026-11-17',profile:'car',optimization:'fastest',crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,
    constraints:[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}],
    geometry:{type:'LineString',coordinates:points.map(p=>p.split(',').map(Number))},
    portions:points.slice(1).map((end,i)=>({start:points[i],end,distance:distance/(points.length-1),duration:duration/(points.length-1)}))};
}
test.beforeEach(async({page})=>{await mockDragonRoute(page)});
async function start(page){
  await page.goto('/DragonRoute/');await page.locator('#avoidHighways').check();await page.locator('#goBtn').click();
}

test('IGN sans autoroute : trajet et stations gardent les exclusions et le cache',async({page},info)=>{
  const requests=[],times=[];let osrm=0;
  page.on('request',r=>{if(r.url().includes('router.project-osrm.org'))osrm++});
  await page.route(pattern,async r=>{
    requests.push(r.request().url());times.push(performance.now());
    const p=new URL(r.request().url()).searchParams;
    expect(r.request().headers().authorization).toBeUndefined();
    expect(p.get('profile')).toBe('car');expect(p.get('timeUnit')).toBe('second');expect(p.get('distanceUnit')).toBe('meter');
    expect(JSON.parse(p.get('constraints'))).toEqual({constraintType:'banned',key:'waytype',operator:'=',value:'autoroute'});
    await r.fulfill({json:responseFor(r.request().url())});
  });
  await start(page);await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#tripKm')).toHaveText('120,0 km');
  await expect(page.locator('#appliedRouting')).toContainText('IGN');
  await expect(page.locator('#routingAttribution')).toContainText('2026-11-17');
  await expect(page.locator('#routeAlternativesNote')).toContainText('Un seul trajet sans autoroute');
  await expect(page.locator('#tripBudget')).toContainText('Tarif indisponible');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('2 stations comparées');
  await expect(page.locator('.result-card').first()).toContainText('À 65,0 km');
  await expect(page.locator('.result-card').first()).toContainText('+10,0 km');
  expect(requests).toHaveLength(3);expect(osrm).toBe(0);
  expect(times[2]-times[1]).toBeGreaterThan(450);
  for(const url of requests.slice(1))expect(new URL(url).searchParams.get('intermediates')).toMatch(/^4\.8/);
  await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('2 stations comparées');
  expect(requests).toHaveLength(3);
  await page.locator('[data-select]').first().click();await confirmStationPreview(page);
  await expect(page.locator('#tripKm')).toHaveText('130,0 km');expect(requests).toHaveLength(3);
  await page.locator('#removeStopBtn').click();await expect(page.locator('#tripKm')).toHaveText('120,0 km');
  await page.locator('#sheet').evaluate(e=>e.scrollTop=0);
  await capture(page,info,'ign-sans-autoroute');await checkOverflow(page);await checkAccessibility(page,info,'ign-sans-autoroute');
  await page.locator('#avoidHighways').uncheck();await expect(page.locator('#stops')).toBeHidden();
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#appliedRouting')).toContainText('OSRM');expect(osrm).toBe(1);
});

test('IGN erreurs et reponses incoherentes refusees sans repli',async({page})=>{
  let mode='quota',calls=0,osrm=0;
  page.on('request',r=>{if(r.url().includes('router.project-osrm.org'))osrm++});
  await page.route(pattern,r=>{
    calls++;
    if(mode==='quota')return r.fulfill({status:429,json:{error:'quota'}});
    if(mode==='down')return r.fulfill({status:503,json:{error:'indisponible'}});
    const data=responseFor(r.request().url());
    if(mode==='units')data.distanceUnit='kilometer';
    if(mode==='ignored')data.constraints=[];
    if(mode==='legs')data.portions[0].distance=1;
    if(mode==='geometry')data.geometry=null;
    if(mode==='snap')data.portions[0].start='2.3,48.8';
    return r.fulfill({json:data});
  });
  await start(page);await expect(page.locator('#status')).toContainText('Limite du service IGN');
  expect(calls).toBe(1);await page.evaluate(()=>{const now=performance.now.bind(performance);performance.now=()=>now()+6000});
  for(const next of ['down','units','ignored','legs','geometry','snap']){
    mode=next;await page.locator('#goBtn').click();
    await expect(page.locator('#status')).toContainText(next==='down'?'Aucun trajet avec autoroute':'incomplète ou incohérente');
    await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#avoidHighways')).toBeChecked();
  }
  expect(osrm).toBe(0);expect(calls).toBe(7);
  mode='ok';await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
});

test('IGN comparaison interrompue ou en panne preserve seulement le trajet',async({page})=>{
  let calls=0;
  await page.route(pattern,r=>{
    calls++;
    const via=new URL(r.request().url()).searchParams.has('intermediates');
    return via?r.fulfill({status:429,json:{error:'quota'}}):r.fulfill({json:responseFor(r.request().url())});
  });
  await start(page);await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('Limite du service IGN');
  await expect(page.locator('#tripKm')).toHaveText('120,0 km');await expect(page.locator('.result-card')).toHaveCount(0);
  expect(calls).toBe(2);
  await page.evaluate(()=>{const now=performance.now.bind(performance);performance.now=()=>now()+6000});await page.route(pattern,async r=>{await new Promise(resolve=>setTimeout(resolve,1000));await r.fulfill({json:responseFor(r.request().url())})});
  await page.locator('#stationsBtn').click();await page.locator('#cancelStationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('Recherche interrompue');
  await expect(page.locator('#tripKm')).toHaveText('120,0 km');await expect(page.locator('.result-card')).toHaveCount(0);
});

test('IGN restrictions non disponibles jamais ignorees et desactivation possible',async({page})=>{
  let calls=0;page.on('request',r=>{if(r.url().includes('data.geopf.fr/navigation'))calls++});
  await page.goto('/DragonRoute/');await page.locator('#avoidHighways').check();
  await page.locator('#avoidTolls').evaluate(el=>el.checked=true);
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('ne seront pas ignorées');
  expect(calls).toBe(0);
  await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('ignRouting: true','ignRouting: false')})});
  await page.reload();await expect(page.locator('#avoidHighways')).toBeDisabled();
  await expect(page.locator('#goBtn')).toBeEnabled();
});
