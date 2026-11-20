import {confirmStationPreview} from '../helpers/dragonroute.mjs';
import {test,expect} from '@playwright/test';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
async function setup(page){
 await mockDragonRoute(page);await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await page.locator('#tariffCalculator > summary').click();
}
async function choose(page,exit='AIX NORD'){
 await page.locator('#tariffNetwork').selectOption('AREA');await page.locator('#tariffClass').selectOption('1');
 await page.locator('#tariffEntry').selectOption({label:'AIGUEBELETTE'});await page.locator('#tariffExit').selectOption({label:exit});
}
test('grilles : tarif officiel par classe, sans appel ni compte',async({page},info)=>{
 const remote=[];page.on('request',r=>{if(/tollguru|api\/tolls|static.data.gouv.fr|voyage.aprr.fr/.test(r.url()))remote.push(r.url())});
 await setup(page);await expect(page.locator('#tariffAdd')).toBeDisabled();await choose(page);
 await expect(page.locator('#tariffResult')).toContainText('3,50 € TTC · classe 1');
 await page.locator('#tariffClass').selectOption('2');await expect(page.locator('#tariffResult')).toContainText('5,50 € TTC · classe 2');
 await expect(page.locator('#tariffPdf')).toHaveAttribute('href','https://voyage.aprr.fr/sites/default/files/2026-02/TARIFS_AREA.pdf');
 expect(remote).toEqual([]);await checkOverflow(page);await checkAccessibility(page,info,'grille-tarifaire');await capture(page,info,'grille-tarifaire');
});
test('grilles : subtotal partiel puis total declare sans double addition',async({page},info)=>{
 await setup(page);await choose(page);await page.locator('#budgetPrice').fill('2');await page.locator('#tariffAdd').click();
 await expect(page.locator('#tollAmount')).toHaveText('3,50 € · partiel');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');
 await expect(page.locator('#tariffAdd')).toBeDisabled();await page.locator('#tariffComplete').check();await expect(page.locator('#budgetTotal')).toHaveText('16,40 € · estimation déclarée');
 await page.locator('#budgetPrice').fill('3');await expect(page.locator('#budgetTotal')).toHaveText('22,84 € · estimation déclarée');
 await page.locator('#tariffExit').selectOption({label:'AIX SUD'});await page.locator('#tariffAdd').click();await expect(page.locator('#tariffComplete')).not.toBeChecked();
 await expect(page.locator('#tollAmount')).toHaveText('6,40 € · partiel');await expect(page.locator('#tariffSegments li')).toHaveCount(2);
 await page.locator('#tariffSegments button').first().click();await expect(page.locator('#tollAmount')).toHaveText('2,90 € · partiel');
 await checkOverflow(page);await checkAccessibility(page,info,'grille-budget');await capture(page,info,'grille-budget');
 await page.locator('#tariffClear').click();await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');await expect(page.locator('#tariffComplete')).toBeDisabled();
});
test('grilles : changement de classe, date et expiration invalident le budget',async({page})=>{
 await setup(page);await choose(page);await page.locator('#tariffAdd').click();await page.locator('#tariffClass').selectOption('2');
 await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
 await page.locator('#tariffAdd').click();await page.locator('#tariffDate').fill('2027-02-01');await expect(page.locator('#tariffAdd')).toBeDisabled();await expect(page.locator('#tariffSegments li')).toHaveCount(0);
 await page.locator('#tariffDate').fill('2026-01-01');await expect(page.locator('#tariffResult')).toContainText('non proposée');
 await page.locator('#tariffDate').fill('');await expect(page.locator('#tariffDate')).toHaveValue('');await expect(page.locator('#tariffAdd')).toBeDisabled();
 await page.locator('#tariffDate').fill('2026-11-20');await page.locator('#tariffAdd').click();
 await page.clock.setFixedTime(new Date('2027-01-01T12:00:00Z'));await page.locator('#budgetPrice').fill('2');
 await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tariffAdd')).toBeDisabled();
});
test('grilles : variante, station et nouveau depart retirent les anciens troncons',async({page})=>{
 await setup(page);page.on('dialog',d=>d.accept());
 await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>{const points=new URL(r.request().url()).pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));if(points.length!==3)return r.fallback();return r.fulfill({json:{code:'Ok',routes:[{distance:106000,duration:106000/26,geometry:{type:'LineString',coordinates:points}}]}})});
 await choose(page);await page.locator('#tariffAdd').click();await page.locator('#routeChoices input').nth(1).check();await expect(page.locator('#tariffSegments li')).toHaveCount(0);
 await page.locator('#routeChoices input').first().check();await page.locator('#tariffAdd').click();await page.locator('#stationsBtn').click();await expect(page.locator('.result-card')).toHaveCount(2);
 await page.locator('[data-select=A]').click();await confirmStationPreview(page);await expect(page.locator('#selectedStop')).toBeVisible();await expect(page.locator('#tariffSegments li')).toHaveCount(0);
 await page.locator('#tariffAdd').click();await page.locator('#start').fill('Autre départ');await expect(page.locator('#tripBudget')).toBeHidden();
 await page.locator('#goBtn').click();await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
});
test('grilles : entree exacte, nom corrige et aucune sortie supposee',async({page})=>{
 await setup(page);await page.locator('#tariffClass').selectOption('1');await page.locator('#tariffEntry').selectOption({label:'AMBOISE CH.RENAULT'});
 await expect(page.locator('#tariffAdd')).toBeDisabled();await page.locator('#tariffExit').selectOption({label:'AMBERIEU'});await expect(page.locator('#tariffResult')).toContainText('66,90 €');
 await page.locator('#tariffEntry').selectOption({label:'ALLAINES'});await expect(page.locator('#tariffExit')).toHaveValue('');await expect(page.locator('#tariffAdd')).toBeDisabled();
 await page.locator('#tariffNetwork').selectOption('AREA');await expect(page.locator('#tariffEntry')).toHaveValue('');await expect(page.locator('#tariffExit')).toBeDisabled();
});
test('grilles : calcul manuel et devis automatique ne sont jamais additionnes',async({page})=>{
 await mockDragonRoute(page);const endpoint='https://tolls.example.test/api/tolls';let calls=0;
 await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('tollsApi: ""',`tollsApi: "${endpoint}"`)})});
 await page.route(endpoint,r=>{calls++;const input=r.request().postDataJSON();return r.fulfill({json:{requestId:input.requestId,routeHash:'a'.repeat(64),provider:'TollGuru',currency:'EUR',fetchedAt:'2026-09-17T10:00:00Z',departureTime:input.departureTime,payment:input.payment,vehicle:input.vehicle,status:'estimated',amountEur:9.5,knownSubtotalEur:null,tariffValidAt:null,items:[{label:'Simulation',amountEur:9.5,payment:input.payment}],warnings:[]}})});
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await page.locator('#budgetPrice').fill('2');await page.locator('#tollHeight').fill('1.6');await page.locator('#tollWeight').fill('1900');await page.locator('#tollVehicleConfirmed').check();await page.locator('#tollCalculate').click();
 await expect(page.locator('#budgetTotal')).toHaveText('22,40 € · estimation');
 await page.locator('#tariffCalculator > summary').click();await choose(page);await page.locator('#tariffAdd').click();await page.locator('#tariffComplete').check();
 await expect(page.locator('#budgetTotal')).toHaveText('16,40 € · estimation déclarée');expect(calls).toBe(1);
 await page.locator('#tollCalculate').click();await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#budgetTotal')).toHaveText('22,40 € · estimation');expect(calls).toBe(2);
});
