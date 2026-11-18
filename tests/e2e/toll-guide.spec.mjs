import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from '../helpers/dragonroute.mjs';
import {capture,checkOverflow,checkAccessibility} from '../helpers/inspection.mjs';
const require=createRequire(import.meta.url),ctx={window:{}};vm.runInNewContext(fs.readFileSync('DragonRoute/config.js','utf8'),ctx);
const inventory=ctx.window.DRAGONROUTE_TOLL_GATES;
const entry=inventory.gates.find(g=>g.name==='Aiguebelette'),exit=inventory.gates.find(g=>g.name==='Aix Nord');
const point=g=>[g.positions[0][1],g.positions[0][0]];
async function setup(page,{empty=false,missing=false,leaflet=false,ambiguous=false}={}){
 await mockDragonRoute(page);
 if(ambiguous)await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+"\nwindow.DRAGONROUTE_TARIFFS.networks.APRR.gates.push('AIGUEBELETTE');window.DRAGONROUTE_TOLL_GATES.gates.push({...window.DRAGONROUTE_TOLL_GATES.gates.find(g=>g.name==='Aiguebelette'),id:'invalid-name',name:'Chamb\uFFFDry Nord'});"})});
 if(missing)await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.DRAGONROUTE_TOLL_GATES=undefined;'})});
 if(leaflet){
  for(const [file,type] of [['leaflet.js','application/javascript'],['leaflet.css','text/css']])await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/'+file,r=>r.fulfill({path:require.resolve('leaflet/dist/'+file),contentType:type}));
 }
 const coords=empty?[[2,48],[2.01,48.01]]:[point(entry),point(exit)];
 await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(addressFeature(...(new URL(r.request().url()).searchParams.get('q').includes('Valence')?coords[1]:coords[0]),'Lieu de test'))}));
 await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>r.fulfill({json:{code:'Ok',routes:[{distance:30000,duration:1800,geometry:{type:'LineString',coordinates:coords}},{distance:35000,duration:2100,geometry:{type:'LineString',coordinates:[[2,48],[2.01,48.01]]}}]}}));
 let calls=0;page.on('request',r=>{if(/data.geopf|project-osrm|data.economie|tollguru|data.gouv/.test(r.url()))calls++});
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await page.locator('#tariffCalculator').evaluate(e=>e.open=true);await page.locator('#tollLocator').evaluate(e=>e.open=true);
 return ()=>calls;
}
const card=(page,g)=>page.locator('#toll-card-'+g.id);
async function proposePair(page){
 await card(page,entry).getByRole('button',{name:'Proposer comme entrée AREA'}).click();
 await card(page,exit).getByRole('button',{name:'Proposer comme sortie AREA'}).click();
 await page.locator('#tariffClass').selectOption('1');
}

test('repérage : gares sources, proposition vérifiée avant budget, aucune requête supplémentaire',async({page},info)=>{
 const calls=await setup(page),before=calls();await page.locator('#tollLocate').click();
 await expect(card(page,entry)).toContainText('Passage à confirmer');await expect(card(page,exit)).toBeVisible();
 await expect(page.locator('#tariffEntry')).toHaveValue('');await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
 await card(page,exit).getByRole('button',{name:'Proposer comme sortie AREA'}).click();await expect(page.locator('#tollGuideChoice')).toContainText('Choisir d’abord');await expect(page.locator('#tariffEntry')).toHaveValue('');
 await proposePair(page);await expect(page.locator('#tariffResult')).toContainText('3,50 €');await expect(page.locator('#tariffAdd')).toBeDisabled();
 await expect(page.locator('#tariffGateConfirmation')).toBeVisible();await page.locator('#tariffGateConfirmed').check();await page.locator('#tariffAdd').click();
 await expect(page.locator('#tollAmount')).toHaveText('3,50 € · partiel');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');await expect(page.locator('#tariffComplete')).not.toBeChecked();
 expect(calls()).toBe(before);await page.locator('#tollLocator').scrollIntoViewIfNeeded();await checkOverflow(page);await checkAccessibility(page,info,'reperage-peages');await capture(page,info,'reperage-peages');
});

test('repérage : points accessibles, masquage, rayon et nouveau trajet retirent les anciens choix',async({page})=>{
 await setup(page);await page.locator('#tollLocate').click();
 const count=await page.locator('.toll-gate-card').count();expect(count).toBeGreaterThanOrEqual(2);await expect(page.locator('.svg-toll')).toHaveCount(count);
 await page.locator(`[data-toll-focus="${entry.id}"]`).press('Enter');await expect(card(page,entry)).toBeFocused();
 await page.locator('#tollGuideToggle').click();await expect(page.locator('.svg-toll')).toHaveCount(0);await expect(page.locator('.toll-gate-card')).toHaveCount(count);
 await page.locator('#tollGuideToggle').click();await expect(page.locator('.svg-toll')).toHaveCount(count);
 await page.locator('#tollGuideRadius').selectOption('0.1');await expect(card(page,entry)).toBeVisible();
 await proposePair(page);await page.locator('#tariffGateConfirmed').check();
 await page.locator('#routeChoices input').nth(1).check();await expect(page.locator('.toll-gate-card')).toHaveCount(0);await expect(page.locator('.svg-toll')).toHaveCount(0);await expect(page.locator('#tariffEntry')).toHaveValue('');await expect(page.locator('#tariffAdd')).toBeDisabled();
 await page.locator('#tollLocate').click();await expect(page.locator('#tollGuideStatus')).toContainText('Cela ne confirme pas');await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
});

test('repérage : confirmation retirée quand le choix manuel des gares change',async({page})=>{
 await setup(page);await page.locator('#tollLocate').click();await proposePair(page);await page.locator('#tariffGateConfirmed').check();await expect(page.locator('#tariffAdd')).toBeEnabled();
 await page.locator('#tariffExit').selectOption({label:'AIX SUD'});await expect(page.locator('#tariffGateConfirmed')).not.toBeChecked();await expect(page.locator('#tariffAdd')).toBeDisabled();
 await page.locator('#tariffGateConfirmed').check();await page.locator('#tariffAdd').click();await expect(page.locator('#tollAmount')).toHaveText('2,90 € · partiel');
 await page.locator('#end').fill('Autre arrivée');await expect(page.locator('.svg-toll')).toHaveCount(0);await expect(page.locator('#tripBudget')).toBeHidden();
});

test('repérage : inventaire absent et hors couverture ne deviennent jamais un péage à zéro',async({page})=>{
 await setup(page,{missing:true});await expect(page.locator('#tollLocate')).toBeDisabled();await expect(page.locator('#tollGuideStatus')).toContainText('indisponible');await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
 await page.locator('#tariffNetwork').selectOption('AREA');await page.locator('#tariffClass').selectOption('1');await page.locator('#tariffEntry').selectOption({label:'AIGUEBELETTE'});await page.locator('#tariffExit').selectOption({label:'AIX NORD'});await expect(page.locator('#tariffAdd')).toBeEnabled();
});

test('repérage : Leaflet garde les gares séparées des stations et ouvre la bonne fiche',async({page},info)=>{
 await setup(page,{leaflet:true});await expect(page.locator('#hMap')).toHaveText('carte ✓');await page.locator('#tollLocate').click();
 const count=await page.locator('.toll-gate-card').count();await expect(page.locator('.toll-marker')).toHaveCount(count);await expect(page.locator('.station-marker')).toHaveCount(0);
 await page.locator('.toll-marker').first().click();await expect(page.locator('.toll-gate-card').first()).toBeFocused();
 await page.locator('#tollGuideToggle').click();await expect(page.locator('.toll-marker')).toHaveCount(0);await expect(page.locator('.map-route-selected')).toHaveCount(1);
 await page.locator('#tollGuideToggle').click();await expect(page.locator('.toll-marker')).toHaveCount(count);await checkOverflow(page);await capture(page,info,'reperage-carte');
});


test('repérage : noms ambigus ou illisibles non préremplis',async({page})=>{
 await setup(page,{ambiguous:true});await page.locator('#tollLocate').click();
 await expect(page.locator('#toll-card-invalid-name')).toContainText('Nom de gare incomplet dans la source');await expect(page.locator('#toll-card-invalid-name [data-toll-propose]')).toHaveCount(0);await expect(page.locator('.svg-toll[data-toll-focus=invalid-name]')).toHaveAttribute('aria-label',/Nom de gare incomplet/);
 await expect(card(page,entry)).toContainText('Plusieurs noms tarifaires concordants');await expect(card(page,entry).locator('[data-toll-propose]')).toHaveCount(0);
 await expect(page.locator('#tariffEntry')).toHaveValue('');await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
});
