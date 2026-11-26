import {preparationControl} from '../helpers/preparation-controls.mjs';
import {test,expect} from '@playwright/test';
import {mockDragonRoute,confirmRouteChoice} from '../helpers/dragonroute.mjs';
import {checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
import {enlargeText,readingOverflow} from '../helpers/reading-layout.mjs';
import {key,read,download} from '../helpers/station-corridor.mjs';
import {setup as roadSetup,go,open,calculate} from '../helpers/road-modes.mjs';
import {adopt,fillOther,apply,walk,score} from '../helpers/modal-tolls.mjs';
import {setup as meetingSetup,plan} from '../helpers/meetings.mjs';
const SOURCE='https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053916305';
async function setup(page){
 await mockDragonRoute(page);const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await page.locator('#tariffCalculator').evaluate(e=>e.open=true);return requests;
}
async function choose(page,network='PNOR',cls='1'){
 if(await page.locator('#tariffClass').inputValue()!==cls)await page.locator('#tariffClass').selectOption(cls);
 await page.locator('#tariffNetwork').selectOption(network);
}
async function add(page,network='PNOR'){
 await page.locator('#tariffCalculator').evaluate(e=>e.open=true);await choose(page,network);await page.locator('#tariffPassageConfirmed').check();await page.locator('#tariffAdd').click();
}
test('ponts : huit tarifs officiels, source datée et passage confirmé sans appel externe',async({page},info)=>{
 const requests=await setup(page),count=requests.length;
 for(const [network,label,prices] of [['PNOR','Pont de Normandie',['6,10','7,10','7,60','15,10']],['PTAN','Pont de Tancarville',['2,90','3,70','4,40','7,50']]]){
  await choose(page,network);await expect(page.locator('#tariffPairFields')).toBeHidden();await expect(page.locator('#tariffPassageNote')).toContainText(label);await expect(page.locator('#tariffPassageNote')).not.toContainText('Lyon');
  for(let i=0;i<4;i++){await page.locator('#tariffClass').selectOption(String(i+1));await expect(page.locator('#tariffResult')).toContainText(prices[i]+' € TTC · classe '+(i+1)+' · '+label);await expect(page.locator('#tariffAdd')).toBeDisabled();}
  await expect(page.locator('#tariffSource')).toContainText('01/05/2026');await expect(page.locator('#tariffSource')).toContainText('22/11/2026');await expect(page.locator('#tariffPdf')).toHaveAttribute('href',SOURCE);await expect(page.locator('#tariffAttribution')).toContainText('DILA');await expect(page.locator('#tariffAttribution')).toContainText('21 avril 2026');
  await page.locator('#tariffPassageConfirmed').check();await expect(page.locator('#tariffAdd')).toBeEnabled();
 }
 expect(requests.length).toBe(count);await checkAccessibility(page,info,'ponts-tarifs');await checkOverflow(page);
});
test('ponts : classe non couverte, date inconnue et périodes propres ne deviennent pas zéro',async({page})=>{
 await setup(page);await choose(page,'BPNL','5');await page.locator('#tariffNetwork').selectOption('PNOR');await expect(page.locator('#tariffClass option[value="5"]')).toBeDisabled();await expect(page.locator('#tariffResult')).toContainText('indisponible pour cette classe');await expect(page.locator('#tariffAdd')).toBeDisabled();await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
 await choose(page,'PNOR','1');await page.locator('#tariffDate').fill('2026-04-30');await expect(page.locator('#tariffResult')).toContainText('non proposée');await expect(page.locator('#tariffAdd')).toBeDisabled();
 await page.locator('#tariffNetwork').selectOption('BPNL');await page.locator('#tariffPassageConfirmed').check();await page.locator('#tariffAdd').click();await page.locator('#tariffNetwork').selectOption('PTAN');await expect(page.locator('#tollAmount')).toHaveText('2,60 € · partiel');await expect(page.locator('#tariffAdd')).toBeDisabled();
 await page.locator('#tariffDate').fill('');await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tariffAdd')).toBeDisabled();await page.locator('#tariffDate').fill('2026-05-01');await page.locator('#tariffPassageConfirmed').check();await expect(page.locator('#tariffAdd')).toBeEnabled();
});
test('ponts : budget mixte, confirmations indépendantes et doublons par ouvrage',async({page})=>{
 await setup(page);await page.locator('#budgetPrice').fill('2');await add(page);await expect(page.locator('#tollAmount')).toHaveText('6,10 € · partiel');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');await page.locator('#tariffComplete').check();
 await page.locator('#tariffNetwork').selectOption('PTAN');await expect(page.locator('#tariffPassageConfirmed')).not.toBeChecked();await expect(page.locator('#tariffAdd')).toBeDisabled();await page.locator('#tariffPassageConfirmed').check();await page.locator('#tariffAdd').click();await expect(page.locator('#tollAmount')).toHaveText('9,00 € · partiel');await expect(page.locator('#tariffComplete')).not.toBeChecked();
 await page.locator('#tariffNetwork').selectOption('AREA');await page.locator('#tariffEntry').selectOption({label:'AIGUEBELETTE'});await page.locator('#tariffExit').selectOption({label:'AIX NORD'});await page.locator('#tariffAdd').click();await expect(page.locator('#tollAmount')).toHaveText('12,50 € · partiel');await page.locator('#tariffComplete').check();await expect(page.locator('#budgetTotal')).toHaveText('25,40 € · estimation déclarée');
 for(const network of ['PNOR','PTAN']){await page.locator('#tariffNetwork').selectOption(network);await page.locator('#tariffPassageConfirmed').check();await expect(page.locator('#tariffAdd')).toBeDisabled();}
 await expect(page.locator('#tariffSegments li')).toHaveCount(3);await expect(page.locator('#tariffSegments li').nth(0).locator('a')).toHaveAttribute('href',SOURCE);
 await page.locator('#tariffSegments li').nth(1).getByRole('button').click();await expect(page.locator('#tollAmount')).toHaveText('9,60 € · partiel');await expect(page.locator('#tariffComplete')).not.toBeChecked();
});
test('ponts : classe, variante, date et expiration retirent les anciens montants',async({page})=>{
 await setup(page);await add(page);await page.locator('#tariffClass').selectOption('2');await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tariffPassageConfirmed')).not.toBeChecked();await add(page);
 await page.locator('[data-route-choice="1"]').click();await confirmRouteChoice(page);await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tariffPassageConfirmed')).not.toBeChecked();await add(page);
 await page.locator('#tariffDate').fill('2026-12-31');await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#tariffPassageConfirmed')).not.toBeChecked();await add(page);await page.clock.setFixedTime(new Date('2027-01-01T12:00:00Z'));await page.locator('#budgetPrice').fill('2');await expect(page.locator('#tariffSegments li')).toHaveCount(0);await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');await expect(page.locator('#tariffAdd')).toBeDisabled();
});
test('ponts : préparation, export et reprise conservent les sources et renouvellent les confirmations',async({page},info)=>{
 const requests=await setup(page);await add(page);await add(page,'PTAN');await page.locator('#tariffComplete').check();
 await page.locator('#savePreparationBtn').click();await page.locator('#preparedKeepBudget').check();await page.locator('#preparedConfirm').check();await page.locator('#preparedSave').click();await expect(page.locator('#preparedMessage')).toContainText('enregistrée');const saved=JSON.parse(await read(page));
 expect(saved.version).toBe(11);expect(saved.entries[0].budget.tolls).toMatchObject({amountCents:900,state:'complete'});
 expect(saved.entries[0].budget.tolls.segments.map(s=>[s.network,s.kind,s.amountCents,s.source.url,s.source.effectiveFrom])).toEqual([['PNOR','passage',610,SOURCE,'2026-05-01'],['PTAN','passage',290,SOURCE,'2026-05-01']]);expect(JSON.parse(await download(page))).toEqual(saved);
 await page.getByRole('button',{name:'Fermer les trajets préparés'}).click();await page.reload();await page.locator('#preparedBtn').click();await page.locator('[data-prepared-show]').click();await expect(page.locator('#preparedDetails')).toContainText('DILA');const count=requests.length;await page.locator('#preparedResumeBtn').click();expect(requests.length).toBe(count);await expect(page.locator('#tariffSegments li')).toHaveCount(0);
 await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await page.locator('#budgetMemory').evaluate(e=>e.open=true);await page.locator('[data-budget-recall="0"]').click();await expect(page.locator('#tariffClass')).toHaveValue('');await page.locator('#tariffClass').selectOption('1');await page.locator('#tariffRecallConfirmed').check();await expect(page.locator('#tariffAdd')).toBeDisabled();await page.locator('#tariffPassageConfirmed').check();await page.locator('#tariffAdd').click();await expect(page.locator('#tollAmount')).toHaveText('6,10 € · partiel');expect(JSON.parse(await read(page))).toEqual(saved);await checkAccessibility(page,info,'ponts-reprise');
});
test('ponts : part du groupe et sources conservées dans le budget comparé',async({page})=>{
 await roadSetup(page);await page.clock.setFixedTime(new Date('2026-11-22T08:00:00Z'));await go(page);await (await preparationControl(page,'stationDeparture')).fill('2026-11-23T10:00');await page.locator('#tariffCalculator').evaluate(e=>e.open=true);await page.locator('#tariffDate').fill('2026-11-23');await add(page);await page.locator('#tariffComplete').check();
 await open(page);await page.locator('#comparisonTravelers').fill('2');await calculate(page);await page.locator('#roadModesOpen').click();await page.locator('#modalCarbonOccupants').fill('4');await page.locator('#modalBudgetsOpen').click();await page.locator('[data-budget-edit="car"]').click();await adopt(page);await expect(page.locator('#modalBudget-tolls')).toHaveValue('3.05');await expect(page.locator('#modalBudgetTollSummary')).toContainText(SOURCE);await fillOther(page);await apply(page);await expect(page.locator('[data-budget-row="car"]')).toContainText('3,05 €');
 await walk(page);await score(page);await page.locator('[data-comparison-save="modal"]').click();await page.locator('#comparisonName').fill('Budget du pont examiné');await page.locator('#comparisonConsent').check();await page.locator('#comparisonSaveSubmit').click();await expect(page.locator('#comparisonSaveDialog')).toBeHidden();const raw=await page.evaluate(()=>localStorage.getItem('dragonroute.comparisons.v1.public'));expect(raw).toContain(SOURCE);expect(raw).toContain('PNOR');expect(raw).toContain('"cents":610');
});
test('ponts : répartition aux passagers explicite et ouvrages hors portion séparés',async({page})=>{
 await meetingSetup(page);await plan(page);await page.locator('#budgetPrice').fill('2');await add(page);await add(page,'PTAN');await page.locator('#rideTollAllocation').evaluate(e=>e.open=true);const selects=page.locator('#rideTollList select');await expect(selects).toHaveCount(2);await expect(selects.nth(0)).toHaveValue('unassigned');await selects.nth(0).selectOption('shared');await selects.nth(1).selectOption('before');await page.locator('#tariffComplete').check();await page.locator('#rideTollConfirm').check();
 const line=label=>page.locator('#rideCostLines > div').filter({has:page.locator('dt',{hasText:label})}).locator('dd');
 await expect(line('Péages attribués')).toHaveText('6,10 € · déclaration');await expect(line('Péages hors portion')).toHaveText('2,90 €');await expect(line('Par passager')).toHaveText('6,77 € · proposition');expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('dragonroute.')))).toEqual([]);
});
test('ponts : clavier et texte agrandi gardent le choix et la confirmation lisibles',async({page},info)=>{
 await setup(page);await enlargeText(page);await choose(page);await page.locator('#tariffNetwork').focus();await page.keyboard.press('Tab');await expect(page.locator('#tariffClass')).toBeFocused();await page.locator('#tariffPassageConfirmed').focus();await page.keyboard.press('Space');await expect(page.locator('#tariffPassageConfirmed')).toBeChecked();await page.keyboard.press('Tab');await expect(page.locator('#tariffAdd')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#tollAmount')).toHaveText('6,10 € · partiel');await readingOverflow(page);await checkAccessibility(page,info,'ponts-lecture');
});

