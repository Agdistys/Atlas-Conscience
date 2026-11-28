import {expect} from '@playwright/test';
import {setup,open,group} from './passenger-access.mjs';
import {transferPlan,transitPlanPattern} from './transit-transfers.mjs';
export {transitPlanPattern};
export function planFor(url){
 const data=transferPlan(),p=new URL(url).searchParams,at=Date.parse(p.get('date')+'T'+p.get('time')+':00+01:00'),shift=at-data.plan.date;
 data.plan.date=at;for(const r of data.plan.itineraries){r.startTime+=shift;r.endTime+=shift;for(const l of r.legs){l.startTime+=shift;l.endTime+=shift;}}
 return data;
}
export async function fixture(page,{outside=false,leaflet=true}={}){
 const ctx=await setup(page,{leaflet}),calls=[],control={};
 page.on('request',r=>{if(r.url().includes('/routers/default/plan?'))calls.push(r.url())});
 const d=transferPlan(),a=d.plan.from,b=d.plan.to;
 await page.route('https://data.geopf.fr/geocodage/search**',r=>{const label=new URL(r.request().url()).searchParams.get('q'),p=label.includes('Origine')?a:b;return r.fulfill({json:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:outside?[4.83,45.72]:[p.lon,p.lat]},properties:{_type:'address',label,city:'Grenoble',postcode:'38000'}}]}})});
 await page.route(transitPlanPattern,r=>control.reply?control.reply(r):r.fulfill({json:planFor(r.request().url())}));
 return {...ctx,transitCalls:calls,transitControl:control,a:[a.lat,a.lon],b:[b.lat,b.lon]};
}
export async function prepare(page,{collective=true}={}){
 await open(page);await page.locator('#passengerAccessEnabled').check();await page.locator('#passengerAccessStart').fill('Origine publique Grenoble');await page.locator('#passengerAccessEnd').fill('Destination publique Grenoble');await page.locator('#comparisonDeparture').fill('2026-11-24T09:00');await group(page);await page.locator('#passengerAccessConsent').check();await page.locator('#multiModeGroup').check();if(collective)await page.locator('#passengerTransitEnabled').check();
}
export async function calculate(page){await page.locator('#comparisonCalculate').click();await expect(page.locator('#comparisonCalculate')).toBeEnabled();await expect(page.locator('#comparisonStatus')).toContainText('trajets disponibles');}
export const card=(p,i=0)=>p.locator('[data-passenger-transit="'+i+'"]');
