import {confirmStationPreview} from '../helpers/dragonroute.mjs';
import {test,expect} from '@playwright/test';
import {setup,plan,save,calculate,adopt} from '../helpers/meetings.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
const picks=page=>page.locator('#rideTollList select');
const line=(page,label)=>page.locator('#rideCostLines > div').filter({has:page.locator('dt',{hasText:label})}).locator('dd');
async function open(page){await page.locator('#rideTollAllocation').evaluate(e=>e.open=true)}
async function add(page,network='AREA'){
 await page.locator('#tariffCalculator').evaluate(e=>e.open=true);await page.locator('#tariffNetwork').selectOption(network);if(await page.locator('#tariffClass').inputValue()!=='1')await page.locator('#tariffClass').selectOption('1');
 if(network==='BPNL')await page.locator('#tariffPassageConfirmed').check();else{await page.locator('#tariffEntry').selectOption({label:'AIGUEBELETTE'});await page.locator('#tariffExit').selectOption({label:'AIX NORD'})}
 await page.locator('#tariffAdd').click();
}
async function ready(page,configure=null){await setup(page,'osrm',false,configure);await plan(page);await page.locator('#budgetPrice').fill('2');await add(page);await open(page)}
async function assign(page,value='shared',index=0){await picks(page).nth(index).selectOption(value);await page.locator('#rideTollConfirm').check()}
async function recap(page){await page.locator('#rideSharing').evaluate(e=>e.open=true);await page.locator('#rideFrom').fill('Secteur public A');await page.locator('#rideTo').fill('Secteur public B');await page.locator('#ridePrepare').click();await expect(page.locator('#rideShare')).toBeVisible()}
test('péages partagés : affectation confirmée, montant partiel puis complet, texte public et arrondis',async({page},info)=>{
 const calls=[];page.on('request',r=>{if(/tollguru|api\/tolls/.test(r.url()))calls.push(r.url())});await ready(page);await expect(picks(page)).toHaveValue('unassigned');await expect(page.locator('#rideTollConfirm')).toBeDisabled();
 await picks(page).focus();await picks(page).selectOption('shared');await expect(picks(page)).toBeFocused();await expect(page.locator('#rideTollStatus')).toContainText('pas encore appliqués');await expect(line(page,'Par passager')).toHaveText('3,72 € · carburant seulement');
 await page.locator('#rideTollConfirm').check();await expect(line(page,'Par passager')).toHaveText('5,47 € · frais connus seulement');await expect(line(page,'Reste conducteur')).toHaveText('12,91 €');
 await page.locator('#tariffComplete').check();await expect(page.locator('#rideTollConfirm')).not.toBeChecked();await page.locator('#rideTollConfirm').check();await expect(line(page,'Par passager')).toHaveText('5,47 € · proposition');
 await page.locator('#rideSeats').fill('3');await page.locator('#ridePassengers').fill('2');await expect(line(page,'Par passager')).toHaveText('3,64 € · proposition');await expect(line(page,'Reste conducteur')).toHaveText('11,10 €');
 await recap(page);const text=await page.locator('#rideText').inputValue();expect(text).toContain('carburant + péages par passager : 3,64 €');expect(text).toContain('3,50 € de péages avec les passagers');expect(text).not.toMatch(/PRISE_PRIVEE|DEPOSE_PRIVEE|45.55/);await page.locator('#rideConsent').check();
 await page.locator('#ridePassengers').fill('0');await expect(page.locator('#rideShare')).toBeHidden();await expect(line(page,'Par passager')).toHaveText('Aucun passager prévu');await expect(line(page,'Reste conducteur')).toHaveText('18,38 €');await page.locator('#ridePassengers').fill('1');
 await page.locator('#rideTollStatus').scrollIntoViewIfNeeded();await capture(page,info,'peages-partages-confirmes');await checkAccessibility(page,info,'peages-partages-confirmes');await checkOverflow(page);expect(calls).toEqual([]);
});
test('péages partagés : ajout, montant non attribué, retrait et effacement réversibles',async({page},info)=>{
 await ready(page);await assign(page);await add(page,'BPNL');await expect(picks(page)).toHaveCount(2);await expect(picks(page).nth(0)).toHaveValue('shared');await expect(picks(page).nth(1)).toHaveValue('unassigned');await expect(page.locator('#rideTollConfirm')).not.toBeChecked();await page.locator('#tariffComplete').check();await page.locator('#rideTollConfirm').check();
 await expect(line(page,'Péages connus non attribués')).toHaveText('2,60 € · à vérifier');await expect(line(page,'Par passager')).toHaveText('5,47 € · frais connus seulement');await expect(line(page,'Reste conducteur')).toHaveText('15,51 €');
 await assign(page,'before',1);await expect(line(page,'Par passager')).toHaveText('5,47 € · proposition');await expect(line(page,'Péages hors portion')).toHaveText('2,60 €');await recap(page);
 await picks(page).nth(1).selectOption('after');await expect(page.locator('#rideShare')).toBeHidden();await page.locator('#rideTollConfirm').check();await expect(line(page,'Péages hors portion')).toHaveText('2,60 €');
 await page.locator('#rideTollStatus').scrollIntoViewIfNeeded();await capture(page,info,'peages-partages-mixtes');await checkAccessibility(page,info,'peages-partages-mixtes');await checkOverflow(page);
 await page.locator('#rideTollReset').click();await expect(picks(page).nth(0)).toHaveValue('unassigned');await expect(picks(page).nth(1)).toHaveValue('unassigned');await expect(page.locator('#tariffSegments li')).toHaveCount(2);await expect(page.locator('#rideTollConfirm')).toBeDisabled();
 await assign(page);await page.locator('#tariffSegments li').nth(0).getByRole('button').click();await expect(picks(page)).toHaveCount(1);await expect(picks(page)).toHaveValue('unassigned');await expect(line(page,'Par passager')).toHaveText('3,72 € · carburant seulement');
});
test('péages partagés : dates, classe et expiration invalident sans restaurer les anciennes affectations',async({page})=>{
 await ready(page);await assign(page);const original=await page.locator('#rideDeparture').inputValue();await page.locator('#rideDeparture').fill('2026-09-18T12:00');await expect(picks(page)).toHaveValue('unassigned');await expect(picks(page)).toBeDisabled();await expect(page.locator('#rideTollStatus')).toContainText('Date des péages différente');await page.locator('#rideDeparture').fill(original);await expect(picks(page)).toBeEnabled();await expect(picks(page)).toHaveValue('unassigned');await assign(page);
 await page.locator('#tariffClass').selectOption('2');await expect(picks(page)).toHaveCount(0);await add(page);await assign(page);await page.locator('#tariffDate').fill('2026-09-18');await expect(picks(page)).toHaveCount(0);await page.locator('#tariffDate').fill('2026-09-17');await add(page);await assign(page);
 await page.clock.setFixedTime(new Date('2027-01-01T12:00:00Z'));await page.locator('#ridePassengers').fill('0');await expect(picks(page)).toHaveValue('unassigned');await expect(picks(page)).toBeDisabled();await expect(line(page,'Péages du trajet complet')).toHaveText('Inconnus');await page.locator('#budgetPrice').fill('3');await expect(picks(page)).toHaveCount(0);
});
test('péages partagés : station, rencontres et reprise ne réutilisent pas les attributions',async({page})=>{
 await ready(page);await assign(page);const doc=await save(page);expect(JSON.stringify(doc)).not.toMatch(/sharedTolls|tollRevision|placement|AIGUEBELETTE/);await page.getByRole('button',{name:'Fermer les trajets préparés'}).click();
 await page.locator('#stationsTab').click();await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('stations comparées');await page.locator('[data-select=A]').click();await confirmStationPreview(page);await page.locator('#ridesTab').click();await expect(picks(page)).toHaveCount(0);await expect(line(page,'Par passager')).toContainText('carburant seulement');
 await add(page);await assign(page);await page.locator('#meetingRemove').click();await expect(page.locator('#rideTollAllocation')).toBeHidden();await expect(page.locator('#tariffSegments li')).toHaveCount(0);
 await page.reload();await page.locator('#preparedBtn').click();await page.locator('[data-prepared-show]').click();await page.locator('#preparedResumeBtn').click();await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await page.locator('#meetingReview').click();await calculate(page);await adopt(page);await expect(picks(page)).toHaveCount(0);await add(page);await open(page);await expect(picks(page)).toHaveValue('unassigned');
});
test('péages partagés : hors portion commune et carburant inconnu ne deviennent pas des frais complets',async({page})=>{
 await ready(page);await page.locator('#tariffComplete').check();await assign(page,'before');await expect(line(page,'Péages attribués')).toHaveText('0,00 € · déclaration');await expect(line(page,'Par passager')).toHaveText('3,72 € · proposition');
 await page.locator('#budgetPrice').fill('');await expect(line(page,'Par passager')).toHaveText('0,00 € · frais connus seulement');await expect(page.locator('#rideCostNote')).toContainText('aucune participation totale');await assign(page,'shared');await expect(line(page,'Par passager')).toHaveText('1,75 € · frais connus seulement');
 await page.locator('#rideTollConfirm').uncheck();await expect(line(page,'Par passager')).toHaveText('Indisponible');await expect(page.locator('#rideTollConfirm')).not.toBeChecked();expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('dragonroute.')))).toEqual([]);
});
test('péages partagés : devis externe simulé remplace les tronçons sans réemploi des affectations',async({page})=>{
 const endpoint='https://tolls.example.test/api/tolls';let zero=false;
 const configure=async()=>{
 await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('tollsApi: ""',`tollsApi: "${endpoint}"`)})});
 await page.route(endpoint,r=>{const input=r.request().postDataJSON();return r.fulfill({json:{requestId:input.requestId,routeHash:'a'.repeat(64),provider:'TollGuru',currency:'EUR',fetchedAt:'2026-09-17T10:00:00Z',departureTime:input.departureTime,payment:input.payment,vehicle:input.vehicle,status:zero?'no_tolls':'estimated',amountEur:zero?0:10,knownSubtotalEur:null,tariffValidAt:null,items:zero?[]:[{label:'Péage construit',amountEur:10,payment:input.payment}],warnings:[]}})});
 };
 await ready(page,configure);await assign(page);await page.locator('#tollHeight').fill('1.6');await page.locator('#tollWeight').fill('1900');await page.locator('#tollVehicleConfirmed').check();await page.locator('#tollDeparture').fill(await page.locator('#rideDeparture').inputValue());await page.locator('#tollCalculate').click();await expect(page.locator('#tollAmount')).toHaveText('10,00 € · estimation');await expect(picks(page)).toHaveCount(0);await expect(line(page,'Par passager')).toHaveText('3,72 € · carburant seulement');
 zero=true;await page.locator('#tollCalculate').click();await expect(page.locator('#tollAmount')).toContainText('sans péage confirmé');await expect(line(page,'Par passager')).toHaveText('3,72 € · proposition');
});
