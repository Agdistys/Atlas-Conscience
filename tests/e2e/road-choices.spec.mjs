import {preparationControl} from '../helpers/preparation-controls.mjs';
import {confirmStationPreview} from '../helpers/dragonroute.mjs';
import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {mockDragonRoute,publicRouting,orsPattern,orsResponse} from '../helpers/dragonroute.mjs';
import {capture,checkOverflow,checkAccessibility} from '../helpers/inspection.mjs';

const pattern='https://data.geopf.fr/navigation/itineraire?**';
function responseFor(url){
 const p=new URL(url).searchParams,points=[p.get('start'),...(p.get('intermediates')?.split('|')||[]),p.get('end')],short=p.get('optimization')==='shortest';
 const distance=(short?100000:120000)+(points.length>2?10000:0),duration=(short?9600:8400)+(points.length>2?600:0);
 const coordinates=points.map(s=>s.split(',').map(Number));if(points.length===2)coordinates.splice(1,0,[short?4.87:4.97,45.4]);
 return {resource:'bdtopo-osrm',resourceVersion:'2026-11-20',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,
 constraints:p.has('constraints')?[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}]:[],geometry:{type:'LineString',coordinates},
 portions:points.slice(1).map((end,i)=>({start:points[i],end,distance:distance/(points.length-1),duration:duration/(points.length-1)}))};
}
async function setup(page){await mockDragonRoute(page);const calls={ign:[],osrm:[],geo:0};page.on('request',r=>{const u=r.url();if(u.includes('/navigation/itineraire'))calls.ign.push(u);if(u.includes('/route/v1/driving'))calls.osrm.push(u);if(u.includes('/geocodage/'))calls.geo++});await page.route(pattern,r=>r.fulfill({json:responseFor(r.request().url())}));await page.goto('/DragonRoute/');return calls}
async function go(page){await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt')}
async function open(page){await page.locator('#roadCompareBtn').click();await expect(page.locator('#roadTitle')).toBeFocused()}
async function calculate(page,n=2){await page.locator('#roadCalculate').click();await expect(page.locator('#roadStatus')).toContainText(n+'/2 critères calculés')}
const option=(page,c)=>page.locator('[data-road-criterion='+c+']');
const adopt=(page,c)=>page.locator('[data-road-adopt='+c+']');
const storage=page=>page.evaluate(()=>JSON.stringify({...localStorage}));

test('choix routiers : ouverture sans appel ni écriture, prix personnel distinct du budget',async({page})=>{
 const calls=await setup(page);await go(page);await page.locator('#budgetPrice').fill('3');const before=await storage(page),n=JSON.stringify(calls);
 await open(page);await expect(page.locator('#roadPrice')).toHaveValue('');await expect(page.locator('#roadCards article')).toHaveCount(0);expect(JSON.stringify(calls)).toBe(n);expect(await storage(page)).toBe(before);
 await page.keyboard.press('Escape');await expect(page.locator('#roadCompareBtn')).toBeFocused();await expect(page.locator('#budgetPrice')).toHaveValue('3');
});

test('choix routiers : deux critères, écarts lisibles, tri sans appel et adoption volontaire',async({page},info)=>{
 const calls=await setup(page);await go(page);await open(page);await page.locator('#roadCons').fill('6');await page.locator('#roadPrice').fill('2');await page.locator('#roadDeparture').fill('2026-11-20T10:00');await calculate(page);
 await expect(option(page,'fastest')).toContainText('104,0 km');await expect(option(page,'fastest')).toContainText('12,48 €');await expect(option(page,'shortest')).toContainText('100,0 km');await expect(option(page,'shortest')).toContainText('IGN');
 await expect(page.locator('#roadDifference')).toContainText('-4,0 km · +95 min · -0,48 €');await expect(page.locator('#roadCards')).toContainText('budget total incomplet');await expect(page.locator('#tripKm')).toHaveText('104,0 km');
 const n=JSON.stringify(calls);await page.locator('#roadSort').selectOption('distance');await expect(page.locator('[data-road-criterion]').first()).toHaveAttribute('data-road-criterion','shortest');expect(JSON.stringify(calls)).toBe(n);
 await capture(page,info,'choix-routiers-comparaison');await checkOverflow(page);await checkAccessibility(page,info,'choix-routiers-comparaison');
 await adopt(page,'shortest').click();await expect(page.locator('#roadCompareDialog')).not.toBeVisible();await expect(page.locator('#tripKm')).toHaveText('100,0 km');await expect(page.locator('#tripTime')).toHaveText('160 min');await expect(page.locator('#routeOptimization')).toHaveValue('shortest');await expect(page.locator('#appliedRouting')).toContainText('IGN');await expect(page.locator('#budgetFuel')).toContainText('12,00 €');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');await expect(page.locator('#stationDeparture')).toHaveValue('2026-11-20T10:00');expect(JSON.stringify(calls)).toBe(n);
 expect(await storage(page)).toBe('{}');
});

test('choix routiers : même tracé regroupé, métriques différentes et critères conservés',async({page})=>{
 await setup(page);await go(page);await page.route(pattern,r=>{const d=responseFor(r.request().url());d.geometry.coordinates=[[4.8357,45.764],[4.855,45.55],[4.875,45.25],[4.8924,44.9334]];return r.fulfill({json:d})});await open(page);await calculate(page);
 await expect(page.locator('#roadCards article')).toHaveCount(1);await expect(page.locator('#roadCards')).toContainText('Même tracé');await expect(page.locator('[data-road-adopt]')).toHaveCount(2);await expect(option(page,'fastest')).toContainText('65 min');await expect(option(page,'shortest')).toContainText('160 min');
 await adopt(page,'shortest').click();await expect(page.locator('#tripTime')).toHaveText('160 min');
});

test('choix routiers : mêmes exclusions IGN, cache distinct et arrêts recalculés sur le choix',async({page})=>{
 const calls=await setup(page);await page.locator('#avoidHighways').check();await go(page);await open(page);await calculate(page);
 expect(calls.ign.map(u=>new URL(u).searchParams.get('optimization'))).toEqual(['fastest','shortest']);expect(calls.osrm).toHaveLength(0);expect(calls.ign.every(u=>new URL(u).searchParams.has('constraints'))).toBe(true);
 await adopt(page,'shortest').click();await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('2 stations comparées');
 await page.locator('[data-select]').first().click();await confirmStationPreview(page);await expect(page.locator('#tripKm')).toHaveText('110,0 km');await expect(page.locator('#appliedRouting')).toContainText('Plus court');expect(calls.ign.slice(2).every(u=>new URL(u).searchParams.get('optimization')==='shortest')).toBe(true);expect(calls.osrm).toHaveLength(0);
});

test('choix routiers : heure limite, filtre local et arrivée inconnue sans faux admissible',async({page})=>{
 const calls=await setup(page);await go(page);await open(page);await page.locator('#roadDeparture').fill('2026-11-20T10:00');await page.locator('#roadArriveBy').fill('2026-11-20T11:05');await page.locator('#roadOnlyBefore').check();await calculate(page);
 await expect(adopt(page,'fastest')).toBeEnabled();await expect(adopt(page,'shortest')).toBeDisabled();await expect(option(page,'shortest')).toHaveAttribute('data-state','excluded');
 const n=JSON.stringify(calls);await page.locator('#roadOnlyBefore').uncheck();await expect(adopt(page,'shortest')).toBeEnabled();expect(JSON.stringify(calls)).toBe(n);
 await page.locator('#roadDeparture').fill('');await page.locator('#roadOnlyBefore').check();await calculate(page);await expect(page.locator('[data-road-adopt]:enabled')).toHaveCount(0);await expect(page.locator('[data-state=excluded]')).toHaveCount(2);
});

test('choix routiers : hypothèses invalides sans appel, modification retire les résultats',async({page})=>{
 const calls=await setup(page);await go(page);await open(page);const n=JSON.stringify(calls);
 for(const [id,v] of [['roadCons',''],['roadCons','0'],['roadPrice','0'],['roadPrice','11'],['roadDeparture','2026-10-25T02:30']]){const old=await page.locator('#'+id).inputValue();await page.locator('#'+id).fill(v);await page.locator('#roadCalculate').click();await expect(page.locator('#roadStatus')).toContainText('Vérifier les hypothèses');await page.locator('#'+id).fill(old)}expect(JSON.stringify(calls)).toBe(n);
 await calculate(page);await page.locator('#roadPrice').fill('2');await expect(page.locator('#roadCards article')).toHaveCount(0);await expect(page.locator('#roadStatus')).toContainText('Hypothèses modifiées');await expect(page.locator('#tripKm')).toHaveText('104,0 km');
});

test('choix routiers : panne partielle sans repli et moteur désactivé explicite',async({page},info)=>{
 const calls=await setup(page);await go(page);await page.route(pattern,r=>r.fulfill({status:503,json:{error:'down'}}));await open(page);await calculate(page,1);
 await expect(adopt(page,'shortest')).toHaveCount(0);await expect(option(page,'shortest')).toContainText('Aucun autre critère');await capture(page,info,'choix-routiers-partiel');await checkAccessibility(page,info,'choix-routiers-partiel');
 await page.locator('#roadClose').click();await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('ignRouting: true','ignRouting: false')})});await page.reload();await go(page);const n=calls.ign.length;await open(page);await calculate(page,1);await expect(option(page,'shortest')).toContainText('options incompatibles');expect(calls.ign.length).toBe(n);
});

test('choix routiers : quota du premier calcul IGN ne déclenche pas le second',async({page})=>{
 const calls=await setup(page);await page.locator('#avoidHighways').check();await go(page);
 // Expire the existing cache after the browser clock has been installed.
 await page.evaluate(()=>{const now=performance.now.bind(performance);Object.defineProperty(performance,'now',{configurable:true,value:()=>now()+300001})});
 await page.route(pattern,r=>r.fulfill({status:429,json:{error:'quota'}}));await open(page);await calculate(page,0);expect(calls.ign).toHaveLength(2);await expect(option(page,'shortest')).toContainText('second calcul non demandé');await expect(page.locator('[data-road-adopt]')).toHaveCount(0);await expect(page.locator('#tripKm')).toHaveText('120,0 km');
});

test('choix routiers : annulation et réponse tardive ne modifient pas le trajet',async({page})=>{
 await page.addInitScript(()=>{const fetch=window.fetch;window.fetch=(url,options)=>fetch(url,String(url).includes('/navigation/itineraire')?{...options,signal:undefined}:options)});await setup(page);await go(page);await open(page);let pending;
 await page.route(pattern,r=>{pending=r});await page.locator('#roadCalculate').click();await expect.poll(()=>Boolean(pending)).toBe(true);await expect(page.locator('#start')).toBeDisabled();await expect(page.locator('#roadCalculate')).toBeDisabled();await expect(page.locator('#roadPrice')).toBeDisabled();await expect(adopt(page,'fastest')).toBeDisabled();
 await page.locator('#roadCancel').click();await pending.fulfill({json:responseFor(pending.request().url())});await expect(page.locator('#roadStatus')).toContainText('Comparaison annulée');await expect(page.locator('#roadCards article')).toHaveCount(0);await expect(page.locator('#tripKm')).toHaveText('104,0 km');await expect(page.locator('#goBtn')).toBeEnabled();
});

test('choix routiers : fermeture en cours, réponse tardive et retour du focus',async({page})=>{
 await page.addInitScript(()=>{const fetch=window.fetch;window.fetch=(url,options)=>fetch(url,String(url).includes('/navigation/itineraire')?{...options,signal:undefined}:options)});await setup(page);await go(page);await open(page);let pending;
 await page.route(pattern,r=>{pending=r});await page.locator('#roadCalculate').click();await expect.poll(()=>Boolean(pending)).toBe(true);await page.keyboard.press('Escape');await pending.fulfill({json:responseFor(pending.request().url())});await expect(page.locator('#goBtn')).toBeEnabled();await expect(page.locator('#roadCompareBtn')).toBeFocused();await expect(page.locator('#roadCards article')).toHaveCount(0);await expect(page.locator('#tripKm')).toHaveText('104,0 km');
});

test('choix routiers : contexte modifié pendant un calcul rend sa réponse inutilisable',async({page})=>{
 await page.addInitScript(()=>{const fetch=window.fetch;window.fetch=(url,options)=>fetch(url,String(url).includes('/navigation/itineraire')?{...options,signal:undefined}:options)});await setup(page);await go(page);await open(page);let pending;
 await page.route(pattern,r=>{pending=r});await page.locator('#roadCalculate').click();await expect.poll(()=>Boolean(pending)).toBe(true);
 await page.locator('#roadCons').evaluate(e=>{e.value='7';e.dispatchEvent(new Event('input',{bubbles:true}))});await pending.fulfill({json:responseFor(pending.request().url())});await expect(page.locator('#goBtn')).toBeEnabled();await expect(page.locator('#roadCards article')).toHaveCount(0);await expect(page.locator('#roadStatus')).toContainText('Hypothèses modifiées');await expect(page.locator('#tripKm')).toHaveText('104,0 km');
});

test('choix routiers : arrêt préservé au refus, retiré après confirmation sans ancien tarif',async({page})=>{
 await setup(page);await go(page);await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('stations comparées');await page.locator('[data-select]').first().click();await confirmStationPreview(page);await page.locator('#useStationPrice').click();await expect(page.locator('#selectedStop')).toBeVisible();const km=await page.locator('#tripKm').innerText(),price=await page.locator('#budgetPrice').inputValue();
 await open(page);await calculate(page);page.once('dialog',d=>d.dismiss());await adopt(page,'shortest').click();await expect(page.locator('#tripKm')).toHaveText(km);await expect(page.locator('#budgetPrice')).toHaveValue(price);await expect(page.locator('#selectedStop')).toBeVisible();
 page.once('dialog',d=>d.accept());await adopt(page,'shortest').click();await expect(page.locator('#selectedStop')).toBeHidden();await expect(page.locator('#budgetPrice')).toHaveValue('');await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');await expect(page.locator('.result-card')).toHaveCount(0);
});

test('choix routiers : sauvegarde et GPX gardent le critère et le nouveau tracé',async({page})=>{
 await setup(page);await go(page);await open(page);await calculate(page);await adopt(page,'shortest').click();expect(await storage(page)).toBe('{}');
 await page.locator('#savePreparationBtn').click();await page.locator('#preparedName').fill('Route comparée');await page.locator('#preparedConfirm').check();await page.locator('#preparedSave').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dragonroute.prepared.v11.public')));expect(saved.entries[0].optimization).toBe('shortest');expect(saved.entries[0].snapshot.distanceMeters).toBe(100000);
 await page.getByRole('button',{name:'Fermer les trajets préparés'}).click();await page.locator('#navigationBtn').click();const wait=page.waitForEvent('download');await page.locator('#exportGpxBtn').click();const gpx=await fs.readFile(await(await wait).path(),'utf8');expect(gpx).toContain('Plus court');expect(gpx).toContain('lon="4.87000000"');expect(gpx.match(/<trkpt /g)).toHaveLength(3);
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>/^dragonroute\.(profile|journal)/.test(k)))).toEqual([]);
});

test('choix routiers : deux erreurs conservent le trajet initial sans choix sélectionnable',async({page})=>{
 await setup(page);await go(page);await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>r.fulfill({status:503,json:{error:'down'}}));await page.route(pattern,r=>r.fulfill({status:503,json:{error:'down'}}));await open(page);await calculate(page,0);await expect(page.locator('[data-road-adopt]')).toHaveCount(0);await expect(page.locator('#tripKm')).toHaveText('104,0 km');await expect(page.locator('#goBtn')).toBeEnabled();
});

test('choix routiers : brouillon de rencontre conservé au refus et retiré après accord',async({page})=>{
 await setup(page);await go(page);await page.locator('#meetingPickup').evaluate(e=>e.value='Point public de rencontre');await open(page);await calculate(page);
 page.once('dialog',d=>d.dismiss());await adopt(page,'shortest').click();await expect(page.locator('#meetingPickup')).toHaveValue('Point public de rencontre');await expect(page.locator('#roadCompareDialog')).toBeVisible();
 page.once('dialog',d=>d.accept());await adopt(page,'shortest').click();await expect(page.locator('#meetingPickup')).toHaveValue('');await expect(page.locator('#tripKm')).toHaveText('100,0 km');
});

test('choix routiers : poids lourd et exclusions transmis au relais sans substitution voiture',async({page})=>{
 const calls=await setup(page);await publicRouting(page);const bodies=[];await page.route(orsPattern,r=>{const b=r.request().postDataJSON();bodies.push(b);return r.fulfill({json:orsResponse(b)})});await page.reload();
 await (await preparationControl(page,'routeVehicle')).selectOption('truck');for(const [id,value] of [['truckHeight','3'],['truckWidth','2.4'],['truckLength','8'],['truckWeight','7'],['truckAxleload','4']])await page.locator('#'+id).fill(value);await page.locator('#avoidTolls').check();await go(page);
 const initial=bodies.at(-1);await open(page);await calculate(page,1);expect(bodies.at(-1)).toEqual(initial);expect(calls.ign).toHaveLength(0);expect(calls.osrm).toHaveLength(0);await expect(adopt(page,'shortest')).toHaveCount(0);await expect(option(page,'shortest')).toContainText('options incompatibles');
 await adopt(page,'fastest').click();await expect(page.locator('#routeVehicle')).toHaveValue('truck');await expect(page.locator('#avoidTolls')).toBeChecked();await expect(page.locator('#truckHeight')).toHaveValue('3');
});

test('choix routiers : réponse à un autre lieu refusée avant toute adoption',async({page})=>{
 await setup(page);await go(page);await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>r.fulfill({json:{code:'Ok',routes:[{distance:120000,duration:7200,geometry:{type:'LineString',coordinates:[[0,0],[4.8924,44.9334]]}}]}}));await open(page);await calculate(page,1);
 await expect(option(page,'fastest')).toContainText('extrémités du tracé');await expect(adopt(page,'fastest')).toHaveCount(0);await expect(page.locator('#tripKm')).toHaveText('104,0 km');
});

test('routes : accès direct aux alternatives garde les exclusions et le trajet avant adoption',async({page})=>{
 const calls=await setup(page);await page.locator('#avoidHighways').check();await go(page);const before=await page.locator('#tripKm').textContent();await page.locator('#findAlternativesBtn').click();await expect(page.locator('#roadStatus')).toContainText('2/2 critères calculés');await expect(page.locator('[data-road-group]')).toHaveCount(2);await expect(page.locator('#roadDifference')).toContainText('-20,0 km');await expect(page.locator('#roadDifference')).toContainText('+20 min');expect(calls.ign.every(u=>new URL(u).searchParams.get('constraints').includes('autoroute'))).toBe(true);await page.keyboard.press('Escape');await expect(page.locator('#tripKm')).toHaveText(before);
});
test('routes : accès direct regroupe un même tracé sans inventer une alternative',async({page})=>{
 await setup(page);await page.route(pattern,r=>{const d=responseFor(r.request().url());d.geometry.coordinates[1]=[4.9,45.4];return r.fulfill({json:d})});await page.locator('#avoidHighways').check();await go(page);await page.locator('#findAlternativesBtn').click();await expect(page.locator('#roadStatus')).toContainText('2/2 critères calculés');await expect(page.locator('[data-road-group]')).toHaveCount(1);await expect(page.locator('#roadCards')).toContainText('Même tracé');
});
