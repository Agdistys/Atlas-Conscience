import {test,expect} from '@playwright/test';
import {setupSelectedTollApp as setup} from '../helpers/selected-toll-app.mjs';
import {confirmStationPreview} from '../helpers/dragonroute.mjs';
import {checkAccessibility,checkOverflow,capture} from '../helpers/inspection.mjs';

async function choose(page,vehicleClass='1'){
 await page.locator('#selectedTollOpen').click();const d=page.getByRole('dialog',{name:'Choisir une portion payante'});
 await d.getByLabel('Classe de péage',{exact:true}).selectOption(vehicleClass);await d.getByRole('button',{name:'Comparer les parcours'}).click();await d.getByRole('radio',{name:/Portion 1/}).check();await d.getByText('💰 Estimer le péage',{exact:true}).click();return d;
}
async function gates(d,{entry='A7 · VIENNE',exit='A7 · VALENCE-N',confirm=true}={}){
 await d.getByLabel('Réseau tarifaire de la portion').selectOption('ASF');await d.getByLabel('Gare d’entrée déclarée').selectOption({label:entry});await d.getByLabel('Gare de sortie déclarée').selectOption({label:exit});if(confirm)await d.getByRole('checkbox',{name:'Ces gares correspondent à toute la portion choisie'}).check();
}
async function propose(d){await d.getByRole('button',{name:'Calculer cette portion'}).click();await expect(d.getByRole('button',{name:'Choisir ce trajet',exact:true})).toBeVisible();}
async function adopt(d){await propose(d);await d.getByRole('button',{name:'Choisir ce trajet',exact:true}).click();await expect(d).toBeHidden();}

test('selected toll tariff: declared official reference appears in comparison and adopted budget',async({page},info)=>{
 const {before,errors}=await setup(page);const d=await choose(page);await gates(d);await propose(d);
 await expect(d.locator('.selected-toll-metrics')).toContainText('9,00');await expect(d.getByRole('link',{name:'Source tarifaire'})).toHaveAttribute('href',/Tarifs_ASF\.txt$/);await checkAccessibility(page,info,'declared-tariff');await checkOverflow(page);await capture(page,info,'declared-tariff');await page.screenshot({path:info.outputPath('tariff-viewport.png')});
 await d.getByRole('button',{name:'Choisir ce trajet',exact:true}).click();await expect(page.locator('#selectedTollSummary')).toContainText('9,00 € · gares déclarées');await expect(page.locator('#tollAmount')).toContainText('9,00');await expect(page.locator('#tollNotice')).toContainText('non vérifié automatiquement');
 const s=await page.evaluate(()=>tollTest.snapshot().trip.selectedToll.selection);expect(s.price).toBeNull();expect(s.estimate.cents).toBe(900);expect(s.estimate.coverage).toBe('DECLARED_NOT_ROUTE_VERIFIED');expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(before.storage);expect(errors).toEqual([]);
});
test('selected toll tariff: a strict cap rejects a declared amount without extra routing or adoption',async({page})=>{
 const {before,requests,errors}=await setup(page);const d=await choose(page);await gates(d);await d.getByText('💰 Limite de prix',{exact:true}).click();await d.getByLabel('Plafond péage en euros').fill('10');const count=requests.length;await d.getByRole('button',{name:'Calculer cette portion'}).click();await expect(d.getByRole('status')).toContainText('plafond strict');expect(requests.length).toBe(count);expect(await page.evaluate(()=>tollTest.snapshot().trip)).toEqual(before.trip);await expect(d.getByRole('button',{name:'Choisir ce trajet',exact:true})).toBeHidden();await d.getByLabel('Plafond péage en euros').fill('');await adopt(d);await expect(page.locator('#tollAmount')).toContainText('9,00');expect(errors).toEqual([]);
});
test('selected toll tariff: unconfirmed or changed gates invalidate the proposal before any adoption',async({page})=>{
 const {before,requests,errors}=await setup(page);const d=await choose(page);await gates(d,{confirm:false});const count=requests.length;await d.getByRole('button',{name:'Calculer cette portion'}).click();await expect(d.getByRole('status')).toContainText('Confirmer');expect(requests.length).toBe(count);
 await d.getByRole('checkbox',{name:'Ces gares correspondent à toute la portion choisie'}).check();await propose(d);await d.getByRole('checkbox',{name:'Ces gares correspondent à toute la portion choisie'}).uncheck();await expect(d.getByRole('button',{name:'Choisir ce trajet',exact:true})).toBeHidden();await page.keyboard.press('Escape');expect(await page.evaluate(()=>tollTest.snapshot().trip)).toEqual(before.trip);expect(errors).toEqual([]);
});
test('selected toll tariff: unknown source cell stays unknown and reverse directions are not invented',async({page})=>{
 const {errors}=await setup(page);const d=await choose(page);await gates(d,{entry:'PUY · PUYMORENS SORTIE',exit:'PUY · PUYMORENS ENTREE',confirm:false});await expect(d.locator('.selected-toll-tariff')).toContainText('inconnu');await expect(d.getByRole('checkbox',{name:'Ces gares correspondent à toute la portion choisie'})).toBeDisabled();await expect(d.getByRole('link',{name:'Source tarifaire'})).toBeHidden();
 await d.getByLabel('Gare d’entrée déclarée').selectOption({label:'A7 · VALENCE-N'});expect(await d.getByLabel('Gare de sortie déclarée').locator('option').allTextContents()).not.toContain('A7 · VIENNE');await d.getByLabel('Réseau tarifaire de la portion').selectOption('');await adopt(d);await expect(page.locator('#selectedTollSummary')).toContainText('prix inconnu');expect(errors).toEqual([]);
});
test('selected toll tariff: vehicle class and trip date invalidate the carried budget reference',async({page})=>{
 const {errors}=await setup(page);const d=await choose(page,'2');await gates(d);await adopt(d);await expect(page.locator('#tollAmount')).toContainText('14,40');
 // Fault injection: a changed class must not leave a carried reference valid, even outside the disabled table controls.
 await page.locator('#tariffClass').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}))});await expect(page.locator('#tollAmount')).toContainText('inconnu');await expect(page.locator('#selectedTollSummary')).toContainText('reconfirmer');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');
 await page.locator('#tariffClass').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});await page.locator('#stationDeparture').evaluate(el=>{el.value='2026-11-29T12:00';el.dispatchEvent(new Event('input',{bubbles:true}))});await expect(page.locator('#tollAmount')).toContainText('inconnu');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');expect(errors).toEqual([]);
});
test('selected toll tariff: station adoption and removal preserve one reference without double counting',async({page})=>{
 const {errors}=await setup(page);const d=await choose(page);await gates(d);await adopt(d);await page.locator('#stationsBtn').click();await page.locator('[data-select="S1"]').click();await confirmStationPreview(page);await expect(page.locator('#tollAmount')).toContainText('9,00');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');await page.locator('#budgetPrice').evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true});await page.locator('#budgetPrice').fill('2');await expect(page.locator('#budgetTotal')).toContainText('estimation déclarée');await expect(page.locator('#tariffAdd')).toBeDisabled();
 const s=await page.evaluate(()=>tollTest.snapshot());expect(s.trip.selectedToll.selection.estimate.cents).toBe(900);const total=(s.stop.via.distance/1000*6.2/100*2+9).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});await expect(page.locator('#budgetTotal')).toContainText(total);expect(s.stop.via.tollAttributes.tolls).toEqual(s.trip.base.tollAttributes.tolls);await page.locator('#removeStopBtn').click();await expect(page.locator('#tollAmount')).toContainText('9,00');await page.locator('#selectedTollRemove').click();await expect(page.locator('#selectedTollNotice')).toBeHidden();await expect(page.locator('#tollAmount')).not.toContainText('9,00');expect(errors).toEqual([]);
});
