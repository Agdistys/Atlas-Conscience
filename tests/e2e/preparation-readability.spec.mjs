import {test,expect} from '@playwright/test';
import {mockDragonRoute,confirmStationPreview} from '../helpers/dragonroute.mjs';
import {checkAccessibility,checkOverflow,capture} from '../helpers/inspection.mjs';
import {reachable,enlargeText} from '../helpers/reading-layout.mjs';
const jump=(page,id)=>page.locator('[data-preparation-target="'+id+'"]');
const external=/geocodage|navigation\/itineraire|\/route\/v1|\/table\/v1|data.economie/;
async function setup(page,{partial=false}={}){
 await mockDragonRoute(page);if(partial)await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('maxCandidates: 20','maxCandidates: 1')})});
 const calls=[];page.on('request',r=>{if(external.test(r.url()))calls.push(r.url())});
 await page.goto('/DragonRoute/');await expect(page.locator('#hJS')).toContainText('✓');
 await page.evaluate(()=>{window.uiWrites=0;for(const key of ['setItem','removeItem','clear']){const old=Storage.prototype[key];Storage.prototype[key]=function(...args){uiWrites++;return old.apply(this,args)}}});return calls;
}
async function route(page){await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt')}
async function stations(page){await page.locator('#stationsBtn').click();await expect(page.locator('#stationsBtn')).toBeEnabled();await expect(page.locator('#stationSummary')).toBeVisible()}

test('préparation lisible : actions proches des choix, navigation clavier et critères explicites',async({page},info)=>{
 const calls=await setup(page);await expect(page.locator('#tripReadout')).toContainText('Véhicule léger');
 expect(await page.evaluate(()=>Boolean(document.querySelector('#goBtn').compareDocumentPosition(document.querySelector('#routingOptions'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await jump(page,'routeModeHeading').focus();await page.keyboard.press('Enter');await expect(page.locator('#routeModeHeading')).toBeFocused();
 await page.locator('#avoidHighways').check();await expect(page.locator('#tripReadout')).toContainText('éviter autoroutes');
 await page.locator('#routeSchedule').evaluate(e=>e.open=false);await jump(page,'stationDeparture').click();await expect(page.locator('#stationDeparture')).toBeFocused();await expect(page.locator('#routeSchedule')).toHaveJSProperty('open',true);
 await page.locator('#stationDeparture').fill('2026-11-25T09:00');await page.locator('#routeArriveBy').fill('2026-11-25T12:00');await page.locator('#routeOnlyBefore').check();await expect(page.locator('#tripReadout')).toContainText('2026-11-25 12:00');await expect(page.locator('#tripReadout')).toContainText('Filtre d’heure limite actif');
 await page.locator('#walkMode').click();await expect(page.locator('#tripReadout')).toContainText('À pied');await expect(page.locator('#tripReadout')).not.toContainText('autoroutes');await page.locator('#maxWalkKm').fill('0');await page.locator('#walkRule').selectOption('strict');await expect(page.locator('#tripReadout')).toContainText('0 km maximum');await expect(page.locator('#tripReadout')).toContainText('Limite impérative');
 await page.locator('#carMode').click();await expect(page.locator('#tripReadout')).toContainText('éviter autoroutes');expect(calls).toEqual([]);expect(await page.evaluate(()=>uiWrites)).toBe(0);await checkOverflow(page);await checkAccessibility(page,info,'preparation-actions');
});

test('préparation lisible : erreur horaire masquée rejoint le champ sans appel',async({page})=>{
 const calls=await setup(page);await page.locator('#routeArriveBy').fill('2026-09-16T12:00');await page.locator('#routeSchedule').evaluate(e=>e.open=false);await page.locator('#goBtn').click();await expect(page.locator('#routeArriveBy')).toBeFocused();await expect(page.locator('#routeSchedule')).toHaveJSProperty('open',true);await expect(page.locator('#tripValidation')).toContainText('L’heure limite doit suivre le départ');expect(calls).toEqual([]);
});

test('préparation lisible : résultat, stations et budget accessibles sans recalcul',async({page},info)=>{
 const calls=await setup(page);const actionY=await page.locator('#goBtn').evaluate(e=>e.offsetTop);await route(page);expect(await page.locator('#goBtn').evaluate(e=>e.offsetTop)).toBe(actionY);await route(page);expect(await page.locator('#goBtn').evaluate(e=>e.offsetTop)).toBe(actionY);const count=calls.length;
 for(const id of ['summary','stopsHeading','budgetHeading']){await jump(page,id).focus();await page.keyboard.press('Enter');await expect(page.locator('#'+id)).toBeFocused();await reachable(page.locator('#'+id),{scroll:false});}
 expect(calls.length).toBe(count);await jump(page,'maxDetourKm').first().click();await expect(page.locator('#maxDetourKm')).toBeFocused();await page.locator('#maxDetourKm').fill('10');await expect(page.locator('#stationReadout')).toContainText('détour ≤ 10 km');await jump(page,'liters').click();await page.locator('#liters').fill('30');await expect(page.locator('#stationReadout')).toContainText('30 L à acheter');
 const stationY=await page.locator('#stationsBtn').evaluate(e=>e.offsetTop-document.querySelector('#stationsPanel').offsetTop);await stations(page);expect(await page.locator('#stationsBtn').evaluate(e=>e.offsetTop-document.querySelector('#stationsPanel').offsetTop)).toBe(stationY);await jump(page,'stationResultsTitle').click();await expect(page.locator('#stationResultsTitle')).toBeFocused();await expect(page.locator('#stationResultReadout')).toContainText('Recherche non exhaustive');await expect(page.locator('#stationFilterStatus')).toBeVisible();await expect(page.locator('#stationCoverageBrief')).toContainText('Recherche non exhaustive');
 await page.locator('[data-select]').first().click();await expect(page.locator('#stationPreviewDialog')).toBeVisible();await expect(page.locator('#selectedStop')).toBeHidden();await confirmStationPreview(page);await expect(page.locator('#selectedStop')).toBeVisible();
 await page.locator('#stationSummary').scrollIntoViewIfNeeded();await capture(page,info,'stations-lecture-courte');await checkAccessibility(page,info,'stations-lecture-courte');await checkOverflow(page);
 await page.locator('#start').fill('Grenoble');for(const id of ['jumpRouteResult','jumpStations','jumpBudget','jumpStationResult'])await expect(page.locator('#'+id)).toBeHidden();expect(await page.evaluate(()=>uiWrites)).toBe(0);
});

test('préparation lisible : méthode repliée, limites visibles et suite volontaire',async({page},info)=>{
 const calls=await setup(page,{partial:true});await route(page);await stations(page);
 const n=calls.length;await expect(page.locator('#stationCoverageBrief')).toContainText('Comparaison partielle : 1 restent');await expect(page.locator('#stationCoverageDetails')).toBeHidden();await expect(page.locator('#stationCoverageBrief')).toBeVisible();await expect(page.locator('#continueStationsBtn')).toBeVisible();
 const closed=await page.locator('#stationCoverage').evaluate(e=>e.getBoundingClientRect().height);await page.locator('#stationCoverage summary').focus();await page.keyboard.press('Enter');await expect(page.locator('#stationCoverageDetails')).toBeVisible();await expect(page.locator('#stationContinuationMethod')).toContainText('prix gardent leur date');expect(await page.locator('#stationCoverage').evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThan(closed+100);expect(calls.length).toBe(n);
 await page.keyboard.press('Enter');await expect(page.locator('#stationCoverageDetails')).toBeHidden();await page.locator('#continueStationsBtn').focus();await page.keyboard.press('Enter');await expect(page.locator('#stationsBtn')).toBeEnabled();await expect(page.locator('#stationCoverage')).toBeFocused();await expect(page.locator('#stationCoverageBrief')).toContainText('2 candidates examinées sur 2');await expect(page.locator('#stationCoverageDetails')).toBeHidden();
 await page.locator('#stationListMode').selectOption('all');await expect(page.locator('.station-index')).toHaveText(['Point 1','Point 2']);await expect(page.locator('#continueStationsBtn')).toBeHidden();await page.locator('summary').filter({hasText:'Règles de fraîcheur des prix'}).click();await expect(page.locator('#stationFreshnessPolicy')).toBeVisible();await checkAccessibility(page,info,'stations-methodes');expect(await page.evaluate(()=>uiWrites)).toBe(0);
});

test('préparation lisible : paramètres invalides de collecte visibles depuis la recherche',async({page})=>{
 const calls=await setup(page);await route(page);const n=calls.length;await page.locator('#samplingOptions').evaluate(e=>e.open=true);await page.locator('#stationRadiusKm').fill('0');await page.locator('#samplingOptions').evaluate(e=>e.open=false);await page.locator('#stationsBtn').click();await expect(page.locator('#stationRadiusKm')).toBeFocused();await expect(page.locator('#samplingSummary')).toContainText('rayon');await expect(page.locator('#fuelStatus')).not.toBeEmpty();expect(calls.length).toBe(n);
});

test('préparation lisible : paysage et texte doublé gardent les accès atteignables',async({page},info)=>{
 await setup(page);await route(page);await page.setViewportSize({width:844,height:390});await enlargeText(page);await checkOverflow(page);
 for(const id of ['routeModeHeading','stationDeparture','summary','stopsHeading','budgetHeading']){const b=jump(page,id);await reachable(b);await b.click();await expect(page.locator('#'+id)).toBeFocused();await reachable(page.locator('#'+id),{scroll:false})}
 await reachable(page.locator('#goBtn'));await capture(page,info,'preparation-paysage');await checkAccessibility(page,info,'preparation-paysage');expect(await page.evaluate(()=>uiWrites)).toBe(0);
});
