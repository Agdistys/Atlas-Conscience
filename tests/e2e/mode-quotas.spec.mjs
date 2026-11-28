import {preparationControl} from '../helpers/preparation-controls.mjs';
import {test,expect} from '@playwright/test';
import {setup,cycle,bikes,headers,elapsed,advance,late,openCycle,calc,openBikes} from '../helpers/mode-quotas.mjs';
import {geocodingPattern} from '../helpers/dragonroute.mjs';
import {setup as shared,stations,calculate} from '../helpers/shared-bike-trip.mjs';
import {setup as stationSetup,search,more,fuel} from '../helpers/service-stations.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
const status=p=>p.locator('#cycleStatus');

for(const [name,code,value] of [['sans délai',429,null],['503',503,'120'],['extrême',429,'9'.repeat(400)]])test(`délais modes : adresses ${name}, sans confusion avec un lieu introuvable`,async({page})=>{
 const calls=await setup(page);await page.route(geocodingPattern,r=>r.fulfill({status:code,headers:value===null?{}:headers(value),json:{}}));await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText(value?.length>100?'trop long':value==='120'?'120 s':'60 s');await expect(page.locator('#start')).not.toHaveAttribute('aria-invalid','true');
 await page.clock.setFixedTime(new Date('2030-01-01'));await page.locator('#goBtn').click();expect(calls.geo).toHaveLength(1);await expect(page.locator('#summary')).toBeHidden();
 await openCycle(page);await page.locator('#cycleSearch').click();await expect(status(page)).toContainText('Aucune relance automatique');expect(calls.geo).toHaveLength(1);expect(calls.cycle).toHaveLength(0);
});
test('délais modes : adresses datées du serveur et reprise volontaire dans un autre mode',async({page})=>{
 const calls=await setup(page);let limited=true;await page.route(geocodingPattern,r=>limited?r.fulfill({status:503,headers:{...headers('Sat, 21 Nov 2026 12:02:00 GMT'),Date:'Sat, 21 Nov 2026 12:00:00 GMT'},json:{}}):r.fallback());await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('120 s');limited=false;await advance(page,121000);expect(calls.geo).toHaveLength(1);await openCycle(page);await calc(page);expect(calls.geo).toHaveLength(3);
});
test('délais modes : réponse adresses abandonnée ne bloque pas le nouveau calcul',async({page})=>{
 await late(page,'/geocodage/');const calls=await setup(page);await openCycle(page);await page.locator('#cycleSearch').click();await expect.poll(()=>page.evaluate(()=>Boolean(window.releaseMode))).toBe(true);await page.locator('#cycleCancel').click();await page.evaluate(()=>window.releaseMode());await calc(page);expect(calls.cycle).toHaveLength(1);
});
test('délais modes : vélo respecte la cadence malgré une avance de l’heure civile',async({page})=>{
 const calls=await setup(page);await openCycle(page);await calc(page);const previous=await page.locator('#cycleMetrics').textContent();await page.clock.setFixedTime(new Date('2030-01-01'));await page.locator('#cycleSearch').click();await expect(status(page)).toContainText('Patienter');await expect(page.locator('#cycleMetrics')).toHaveText(previous);expect(calls.cycle).toHaveLength(1);await elapsed(page,5100);await calc(page);expect(calls.cycle).toHaveLength(2);
});
for(const [name,code,value] of [['minimum',429,'5'],['sans délai',429,null],['503',503,'120'],['extrême',429,'9'.repeat(400)]])test(`délais modes : vélo ${name} garde son attente et permet la consultation des stations`,async({page})=>{
 const calls=await setup(page);await page.route(cycle,r=>r.fulfill({status:code,headers:value===null?{}:headers(value),json:{}}));await openCycle(page);await page.locator('#cycleSearch').click();await expect(status(page)).toContainText(value?.length>100?'trop long':value==='120'?'120 s':'60 s');await elapsed(page,6000);await page.clock.setFixedTime(new Date('2030-01-01'));await page.locator('#cycleSearch').click();expect(calls.cycle).toHaveLength(1);await page.locator('#cycleClose').click();await openBikes(page);await expect(page.locator('#bikesBrowse')).toBeVisible();expect(calls.bikes).toHaveLength(3);
});
test('délais modes : réponse vélo abandonnée ne bloque pas une nouvelle recherche',async({page})=>{
 await late(page,'/routed-bike/');const calls=await setup(page);await openCycle(page);await page.locator('#cycleSearch').click();await expect.poll(()=>page.evaluate(()=>Boolean(window.releaseMode))).toBe(true);await page.locator('#cycleCancel').click();await page.evaluate(()=>window.releaseMode());await elapsed(page,5100);await calc(page);expect(calls.cycle).toHaveLength(1);
});
test('délais modes : Vélo’v partiel conservé, clavier et reprise volontaire après attente',async({page},info)=>{
 const calls=await setup(page);let limited=true;await page.route(bikes+'station_status.json',r=>limited?r.fulfill({status:503,headers:headers('120'),json:{}}):r.fallback());await openBikes(page);await expect(page.locator('#bikesStatus')).toContainText('120 s');await expect(page.locator('[data-bike-id]')).toHaveCount(25);await expect(page.locator('#bikesResults')).toContainText('Vélos annoncésInconnu');const old=await page.locator('#bikesResults').textContent();await advance(page,61000);await page.locator('#bikesLoad').focus();await page.keyboard.press('Enter');await expect(page.locator('#bikesStatus')).toContainText('Réessayer dans');await expect(page.locator('#bikesResults')).toHaveText(old);expect(calls.bikes).toHaveLength(3);await checkOverflow(page);await capture(page,info,'velov-attente-partielle');await checkAccessibility(page,info,'velov-attente-partielle');
 limited=false;await advance(page,61000);expect(calls.bikes).toHaveLength(3);await page.locator('#bikesLoad').click();await expect(page.locator('#bikesStatus')).not.toContainText('indisponible');await expect(page.locator('[data-bike-id]')).toHaveCount(25);expect(calls.bikes).toHaveLength(4);await page.keyboard.press('Escape');await expect(page.locator('#modeMenuToggle')).toBeFocused();
});
test('délais modes : Vélo’v cadence indépendante de l’heure civile et quota extrême lisible',async({page})=>{
 const calls=await setup(page);await openBikes(page);await page.clock.setFixedTime(new Date('2030-01-01'));await page.locator('#bikesLoad').click();await expect(page.locator('#bikesStatus')).toContainText('Patienter');expect(calls.bikes).toHaveLength(3);await elapsed(page,61000);await page.route(bikes+'station_information.json',r=>r.fulfill({status:429,headers:headers('9'.repeat(400)),json:{}}));await page.locator('#bikesLoad').click();await expect(page.locator('#bikesStatus')).toContainText('trop long');await elapsed(page,1e9);await page.locator('#bikesLoad').click();expect(calls.bikes).toHaveLength(6);
});
test('délais modes : Vélo’v réponse abandonnée ne pose pas de quota après réouverture',async({page})=>{
 await late(page,'station_information.json');const calls=await setup(page);await (await preparationControl(page,'bikesBtn')).click();await page.locator('#bikesLoad').click();await expect.poll(()=>page.evaluate(()=>Boolean(window.releaseMode))).toBe(true);
 // A close event is queued by the browser. Deliver the old response before that event.
 await page.evaluate(()=>{document.getElementById('bikesDialog').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));window.releaseMode()});
 await expect(page.locator('#bikesDialog')).toBeHidden();await advance(page,61000);await openBikes(page);await expect(page.locator('#bikesBrowse')).toBeVisible();expect(calls.bikes.length).toBeGreaterThan(2);
 // Reopen in the same task: the previous close event must not erase the new request.
 await advance(page,61000);const before=calls.bikes.length;
 await page.evaluate(()=>{document.getElementById('bikesClose').click();document.getElementById('bikesBtn').click();document.getElementById('bikesLoad').click()});
 await expect(page.locator('#bikesBrowse')).toBeVisible();await expect(page.locator('#bikesLoad')).toBeEnabled();await expect(page.locator('[data-bike-id]')).toHaveCount(25);expect(calls.bikes.length).toBeGreaterThan(before);
});
test('délais modes : quota du parcours partagé respecté par le calcul vélo autonome',async({page},info)=>{
 const calls=await shared(page);await stations(page);let limited=true;await page.route(cycle,r=>limited?r.fulfill({status:429,headers:headers('120'),json:{}}):r.fallback());await page.locator('#bikeTripSearch').click();await expect(page.locator('#bikeTripStatus')).toContainText('120 s');const count=calls.filter(u=>u.includes('/routed-bike/')).length;await page.keyboard.press('Escape');await page.locator('#start').fill('Place Bellecour, Lyon');await page.locator('#end').fill('Gare Part-Dieu, Lyon');await openCycle(page);await page.locator('#cycleSearch').click();await expect(status(page)).toContainText('Réessayer dans');expect(calls.filter(u=>u.includes('/routed-bike/'))).toHaveLength(count);await capture(page,info,'velo-attente-commune');await checkAccessibility(page,info,'velo-attente-commune');await checkOverflow(page);await page.keyboard.press('Escape');await expect(page.locator('#modeMenuToggle')).toBeFocused();
 limited=false;await advance(page,121000);await (await preparationControl(page,'bikesBtn')).click();await page.locator('#bikesLoad').click();await expect(page.locator('#bikesBrowse')).toBeVisible();await stations(page);await calculate(page);expect(calls.filter(u=>u.includes('/routed-bike/'))).toHaveLength(count+1);
});
test('délais modes : première matrice indisponible reste non concluante puis reprend les stations reçues',async({page})=>{
 const {calls}=await stationSetup(page);let limited=true;await page.route('https://router.project-osrm.org/table/v1/driving/**',r=>limited?r.fulfill({status:503,headers:headers('5'),json:{}}):r.fallback());await search(page);await expect(page.locator('#fuelStatus')).toContainText('Aucun accès aux stations');await expect(page.locator('#fuelStatus')).toContainText('non concluant');await expect(page.locator('#fuelStatus')).not.toContainText('Modifier la distance');const fuel=calls.fuel.length;limited=false;await elapsed(page,5100);await more(page);await expect(page.locator('.result-card')).toHaveCount(2);expect(calls.fuel).toHaveLength(fuel);
});

test('délais modes : collecte vide achevée distincte d’une comparaison interrompue',async({page})=>{
 const {calls}=await stationSetup(page);await page.route(fuel,r=>r.fulfill({json:{total_count:0,results:[]}}));await search(page);await expect(page.locator('#fuelStatus')).toContainText('Aucune station E10 reçue');await expect(page.locator('#fuelStatus')).not.toContainText('non concluant');await expect(page.locator('#continueStationsBtn')).toBeHidden();await expect(page.locator('.result-card')).toHaveCount(0);expect(calls.matrix).toHaveLength(0);await expect(page.locator('#summary')).toBeVisible();
});
