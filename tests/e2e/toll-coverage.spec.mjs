import {test,expect} from '@playwright/test';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
async function setup(page){
 await mockDragonRoute(page);await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await page.locator('#tariffCalculator > summary').click();await page.locator('#tariffNetwork').selectOption('BPNL');
}
async function choose(page,cls='1'){
 await page.locator('#tariffClass').selectOption(cls);await page.locator('#tariffPassageConfirmed').check();
}
test('BPNL : cinq classes officielles et confirmation par passage sans appel externe',async({page},info)=>{
 const requests=[];page.on('request',r=>{if(/peripheriquenord|agora.grandlyon|api\/tolls|vinci-autoroutes/.test(r.url()))requests.push(r.url())});
 await setup(page);await expect(page.locator('#tariffPairFields')).toBeHidden();await expect(page.locator('#tariffAdd')).toBeDisabled();
 for(const [i,amount] of ['2,60','3,90','4,60','10,30','1,30'].entries()){
  await page.locator('#tariffClass').selectOption(String(i+1));await expect(page.locator('#tariffResult')).toContainText(`${amount} € TTC · classe ${i+1} · BPNL · un passage payant`);
  await expect(page.locator('#tariffAdd')).toBeDisabled();
 }
 await choose(page);await expect(page.locator('#tariffAdd')).toBeEnabled();await expect(page.locator('#tariffSource')).toContainText('01/01/2026');await expect(page.locator('#tariffAttribution')).toContainText('2025-3243');await expect(page.locator('#tariffAttribution')).not.toContainText('Licence Ouverte');expect(requests).toEqual([]);
 await checkOverflow(page);await checkAccessibility(page,info,'bpnl-passage');await capture(page,info,'bpnl-passage');
});
test('BPNL : budget mixte conserve les sources, compte une seule fois et exige couverture',async({page},info)=>{
 await setup(page);await choose(page);await page.locator('#budgetPrice').fill('2');await page.locator('#tariffAdd').click();await expect(page.locator('#tollAmount')).toHaveText('2,60 € · partiel');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');
 await expect(page.locator('#tariffAdd')).toBeDisabled();await page.locator('#tariffComplete').check();await expect(page.locator('#budgetTotal')).toHaveText('15,50 € · estimation déclarée');
 await page.locator('#tariffNetwork').selectOption('AREA');await expect(page.locator('#tariffSegments li')).toHaveCount(1);await expect(page.locator('#tariffPairFields')).toBeVisible();await expect(page.locator('#tariffPassageFields')).toBeHidden();
 await page.locator('#tariffEntry').selectOption({label:'AIGUEBELETTE'});await page.locator('#tariffExit').selectOption({label:'AIX NORD'});await page.locator('#tariffAdd').click();
 await expect(page.locator('#tollAmount')).toHaveText('6,10 € · partiel');await expect(page.locator('#tariffComplete')).not.toBeChecked();await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');
 const segments=page.locator('#tariffSegments li');await expect(segments).toHaveCount(2);await expect(segments.nth(0)).toContainText('tarif au 01/01/2026');await expect(segments.nth(1)).toContainText('tarif au 01/02/2026');await expect(segments.nth(0).locator('a')).toHaveAttribute('href',/agora.grandlyon/);await expect(segments.nth(1).locator('a')).toHaveAttribute('href',/TARIFS_AREA/);
 await page.locator('#tariffComplete').check();await expect(page.locator('#budgetTotal')).toHaveText('19,00 € · estimation déclarée');
 await page.locator('#tariffNetwork').selectOption('BPNL');await page.locator('#tariffPassageConfirmed').check();await expect(page.locator('#tariffAdd')).toBeDisabled();
 await checkOverflow(page);await checkAccessibility(page,info,'bpnl-budget-mixte');await capture(page,info,'bpnl-budget-mixte');
 await segments.nth(0).locator('button').click();await expect(page.locator('#tollAmount')).toHaveText('3,50 € · partiel');await expect(page.locator('#tariffComplete')).not.toBeChecked();
});
test('BPNL : dates propres au réseau, date inconnue et expiration sans zero implicite',async({page})=>{
 await setup(page);await page.locator('#tariffDate').fill('2026-01-15');await choose(page);await page.locator('#tariffAdd').click();
 await page.locator('#tariffNetwork').selectOption('AREA');await expect(page.locator('#tariffResult')).toContainText('non proposée');await expect(page.locator('#tariffAdd')).toBeDisabled();await expect(page.locator('#tollAmount')).toHaveText('2,60 € · partiel');
 await page.locator('#tariffNetwork').selectOption('BPNL');await expect(page.locator('#tariffResult')).toContainText('2,60');
 await page.locator('#tariffDate').fill('2025-12-31');await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tariffAdd')).toBeDisabled();await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
 await page.locator('#tariffDate').fill('');await expect(page.locator('#tariffAdd')).toBeDisabled();
 await page.locator('#tariffDate').fill('2026-12-31');await page.locator('#tariffPassageConfirmed').check();await page.locator('#tariffAdd').click();
 await page.clock.setFixedTime(new Date('2027-01-01T12:00:00Z'));await page.locator('#budgetPrice').fill('2');await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');
});
test('BPNL : classe et changement de route retirent montant et confirmation de passage',async({page})=>{
 await setup(page);await choose(page);await page.locator('#tariffAdd').click();await page.locator('#tariffClass').selectOption('2');await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tariffPassageConfirmed')).not.toBeChecked();
 await page.locator('#tariffPassageConfirmed').check();await page.locator('#tariffAdd').click();await page.locator('#routeChoices input').nth(1).check();await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tariffPassageConfirmed')).not.toBeChecked();await expect(page.locator('#tariffAdd')).toBeDisabled();
 await page.locator('#tariffPassageConfirmed').check();await page.locator('#tariffDate').fill('2026-11-25');await expect(page.locator('#tariffPassageConfirmed')).not.toBeChecked();
});
test('BPNL : classe absente dans une source ne devient jamais un tarif nul',async({page})=>{
 await mockDragonRoute(page);await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.DRAGONROUTE_TARIFFS.networks.BPNL.amountsCents[1]=null;'})});
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await page.locator('#tariffCalculator > summary').click();await page.locator('#tariffNetwork').selectOption('BPNL');await choose(page,'2');
 await expect(page.locator('#tariffResult')).toHaveText('Tarif indisponible pour cette classe.');await expect(page.locator('#tariffAdd')).toBeDisabled();await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
});
