import {test,expect} from '@playwright/test';import fs from 'node:fs';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from '../helpers/dragonroute.mjs';
import {checkOverflow,checkAccessibility} from '../helpers/inspection.mjs';
const base='https://data.mobilites-m.fr/api/',plan=base+'routers/default/plan?**',catalog=base+'routers/default/index/routes',stops=base+'routers/default/index/stops/**',alerts=base+'gtfs/realtime/alert/SMA?json=true';
const fixture=(n,dir='transit-network')=>JSON.parse(fs.readFileSync(`tests/fixtures/${dir}/${n}.json`));
const start=addressFeature(5.714527,45.191112,'Grenoble, Gares'),end=addressFeature(5.731,45.1572,'Grenoble, destination publique');
async function setup(page,{origin="http://127.0.0.1:4173"}={}){await mockDragonRoute(page,{origin});await page.clock.setFixedTime(new Date('2026-11-18T20:06:30Z'));const calls=[];page.on('request',r=>{if(r.url().startsWith(base)&&!r.url().includes('/plan?'))calls.push(r.url())});await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(new URL(r.request().url()).searchParams.get('q').includes('Grand')?end:start)}));await page.route(plan,r=>r.fulfill({json:fixture('depart','transit')}));await page.route(catalog,r=>r.fulfill({json:fixture('routes')}));await page.route(stops,r=>r.fulfill({json:fixture('stoptimes')}));await page.route(alerts,r=>r.fulfill({json:fixture('alerts')}));await page.goto('/DragonRoute/');await page.locator('#start').fill('Gare Grenoble');await page.locator('#end').fill('Grand Place Grenoble');return calls}
async function search(page){await page.locator('#transitBtn').click();await page.locator('#transitWhen').fill('2026-11-19T10:00');await page.locator('#transitSearch').click();await expect(page.locator('[data-transit-option]')).toHaveCount(2);await expect(page.locator('[data-transit-network]').first()).toBeEnabled()}
async function consult(page){await page.locator('[data-transit-network]').first().click();await expect(page.locator('#transitNetworkStatus')).toContainText('consultation du');await expect(page.locator('#transitNetworkCancel')).toBeHidden()}
async function expand(page){await page.locator('.network-board summary').first().click()}

export {setup,search,consult,base,plan,catalog,stops,alerts,fixture,start,end};
