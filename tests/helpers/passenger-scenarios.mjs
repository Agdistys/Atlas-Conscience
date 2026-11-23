import {expect} from '@playwright/test';
import {setup,open,group,calculate,common,budgets,exported} from './passenger-access.mjs';
export const key='dragonroute.comparisons.v1.public';
export const raw=p=>p.evaluate(k=>localStorage.getItem(k),key);
export const read=async p=>JSON.parse(await raw(p));
export async function savedScenario(page,{same=false,budget=false,leaflet=true}={}){
 const ctx=await setup(page,{leaflet}),plan=await exported(page);
 await page.route('https://data.geopf.fr/geocodage/search**',r=>{const q=new URL(r.request().url()).searchParams.get('q');return r.fulfill({json:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:q.includes('Origine')?[4.83,45.72]:[4.89,44.98]},properties:{_type:'address',label:q,city:'Test',postcode:'69000'}}]}})});
 await open(page);await page.locator('#passengerAccessEnabled').check();
 if(same){await page.locator('#passengerAccessSameStart').check();await page.locator('#passengerAccessSameEnd').check();}
 else{await page.locator('#passengerAccessStart').fill('Origine à conserver');await page.locator('#passengerAccessEnd').fill('Destination à conserver');}
 await page.locator('#comparisonDeparture').fill('2026-11-24T09:00');await page.locator('#comparisonArriveBy').fill('2026-11-24T18:00');await page.locator('#comparisonOnlyBefore').check();await page.locator('#comparisonWalkLimit').fill('10');await page.locator('#comparisonWalkRule').selectOption('strict');await group(page);await page.locator('#passengerAccessConsent').check();await page.locator('#multiModeGroup').check();await calculate(page);await common(page);
 if(budget)await budgets(page);else{await page.locator('#modalPrioritiesOpen').click();await page.locator('#modalPriorityDuration').fill('1');await page.locator('#modalPrioritiesApply').click();}
 await page.locator('[data-comparison-save="modal"]').click();await expect(page.locator('#comparisonScenarioSaveNote')).toBeVisible();expect(await raw(page)).toBeNull();await page.locator('#comparisonName').fill('Mon scénario passagers');await page.locator('#comparisonConsent').check();await page.locator('#comparisonSaveSubmit').click();await expect(page.locator('#comparisonSaveDialog')).toBeHidden();
 return {...ctx,plan,saved:await read(page),original:await raw(page)};
}
export async function library(page){await page.locator('#modalPriorities [data-comparison-library]').click();await page.locator('[data-comparison-show]').first().click();await expect(page.locator('#comparisonPassengerResume')).toBeVisible();}
export async function resume(page){await page.locator('#comparisonResumePassenger').click();await expect(page.locator('#multiModesDialog')).toBeVisible();await expect(page.locator('#comparisonStatus')).toContainText('Lieux et réglages repris');}
export async function confirmResume(page,departure='2026-11-24T09:05'){
 await page.locator('#comparisonDeparture').fill(departure);await page.locator('#passengerAccessConsent').check();await page.locator('#multiModeGroup').check();
}
