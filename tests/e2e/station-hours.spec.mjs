import {confirmStationPreview} from '../helpers/dragonroute.mjs';
import {test,expect} from '@playwright/test';
import {mockDragonRoute,publicRouting,orsPattern,orsResponse} from '../helpers/dragonroute.mjs';
import {capture,checkOverflow,checkAccessibility} from '../helpers/inspection.mjs';
import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const fuel='https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?**';
const hours=JSON.stringify({'@automate-24-24':'',jour:Array.from({length:7},(_,i)=>({'@id':String(i+1),'@nom':['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][i],'@ferme':'',horaire:[{'@ouverture':'08.00','@fermeture':'12.00'},{'@ouverture':'14.00','@fermeture':'18.00'}]}))});
async function fixture(page,{gpl=false,constrained=false,leaflet=false}={}){
 await mockDragonRoute(page);let calls=0;page.on('request',r=>{if(/data.economie|\/table\/|\/route\/|routing.example/.test(r.url()))calls++});
 if(leaflet)await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:r.request().url().endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync(require.resolve(r.request().url().endsWith('.css')?'leaflet/dist/leaflet.css':'leaflet/dist/leaflet.js'))}));
 if(constrained){await publicRouting(page);await page.route(orsPattern,async r=>r.fulfill({json:orsResponse(await r.request().postDataJSON())}))}
 await page.route(fuel,r=>r.fulfill({json:{total_count:3,results:['A','B','C'].map((id,i)=>({id,adresse:`${id} route test`,cp:'26000',ville:'Valence',geom:[45.6-i*.1,4.87],e10_prix:1.7+i*.1,gplc_prix:.9+i*.1,e10_maj:'2026-09-17T08:00:00Z',gplc_maj:'2026-09-17T08:00:00Z',horaires:id==='B'?hours:id==='A'?JSON.stringify({'@automate-24-24':'1',jour:[{'@id':'4','@nom':'Jeudi','@ferme':'',horaire:{'@ouverture':'00.00','@fermeture':'00.00'}}]}):null,horaires_automate_24_24:id==='A'?'Oui':id==='B'?'Non':null,services_service:id==='C'?[]:['Toilettes publiques']}))}}));
 await page.route('https://router.project-osrm.org/table/v1/driving/**',r=>{
  const n=new URL(r.request().url()).pathname.split('/').at(-1).split(';').length,distances=Array.from({length:n},()=>Array(n).fill(null)),durations=Array.from({length:n},()=>Array(n).fill(null));
  for(let i=1;i<n-1;i++){distances[0][i]=i*10000;distances[i][n-1]=106000-i*10000;durations[0][i]=i*600;durations[i][n-1]=4500-i*600}
  return r.fulfill({json:{code:'Ok',distances,durations}})
 });
 await page.goto('/DragonRoute/');if(constrained){await page.locator('#routingOptions').evaluate(e=>e.open=true);await page.locator('#avoidTolls').check()}
 await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 if(gpl)await page.locator('#fuel').selectOption('GPLc');
 await page.locator('#stationDeparture').fill('2026-09-17T11:30');await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('stations comparées');
 await page.locator('#stationFilters').evaluate(e=>e.open=true);await page.locator('#stationListMode').selectOption('all');return ()=>calls;
}
const select=(page,value)=>page.locator('#stationOpeningFilter').selectOption(value);
async function ids(page,values,leaflet=false){expect(await page.locator('.result-card').evaluateAll(a=>a.map(e=>e.dataset.station))).toEqual(values);await expect(page.locator(leaflet?'.station-marker':'#stationDots .svg-station')).toHaveCount(values.length)}
test('horaires : arrivée par station, filtre strict, inconnus séparés et réévaluation locale',async({page},info)=>{
 const calls=await fixture(page),n=calls();await ids(page,['A','B','C']);
 await expect(page.locator('[data-station=B] .station-opening')).toContainText('11:50');await expect(page.locator('[data-station=A] .station-opening')).toContainText('Automate 24 h/24');
 await page.locator('[data-station=A] .station-detail-link').click();await expect(page.locator('#stationDetails')).toContainText('00:00 – 00:00 (durée ambiguë — non interprétée)');await page.getByRole('button',{name:'Fermer la fiche station'}).click();
 await select(page,'compatible');await ids(page,['A','B']);await page.locator('#stationDeparture').fill('2026-09-17T11:45');await ids(page,['A']);
 await expect(page.locator('#stationFilterStatus')).toContainText('1 aux horaires inconnus');await expect(page.locator('#stationFilterStatus')).toContainText('1 hors horaires du guichet');
 await select(page,'unknown');await ids(page,['C']);await expect(page.locator('[data-station=C] .station-index')).toHaveText('Point 3');
 await select(page,'outside');await ids(page,['B']);await page.locator('#stationDots [data-details=B]').press('Enter');
 await expect(page.locator('#stationDetails')).toContainText('12:05');await expect(page.locator('#stationDetails')).toContainText('sans date de mise à jour des horaires');
 await capture(page,info,'horaires-fiche');await checkOverflow(page);await checkAccessibility(page,info,'horaires-fiche');await page.getByRole('button',{name:'Fermer la fiche station'}).click();
 await page.locator('#resetStationFilters').click();await ids(page,['A','B','C']);expect(calls()).toBe(n);await page.locator('#stationDeparture').scrollIntoViewIfNeeded();await capture(page,info,'horaires-filtres');await checkOverflow(page);await checkAccessibility(page,info,'horaires-filtres');
});
test('horaires : heure invalide et changements d’heure ne passent jamais le filtre strict',async({page})=>{
 const calls=await fixture(page),n=calls();await select(page,'compatible');
 for(const date of ['','2026-03-29T02:30','2026-10-25T02:30']){await page.locator('#stationDeparture').fill(date);await expect(page.locator('#stationDeparture')).toHaveAttribute('aria-invalid','true');await ids(page,[])}
 await expect(page.locator('#stationDepartureStatus')).toContainText('existe deux fois');await page.locator('#stationDepartureNow').click();await expect(page.locator('#stationDeparture')).toHaveValue('2026-09-17T12:00');await ids(page,['A']);expect(calls()).toBe(n);
});
test('horaires : filtres cumulés, badges et arrêt choisi conservé hors horaires',async({page})=>{
 const calls=await fixture(page),n=calls();page.on('dialog',d=>d.accept());await page.locator('[data-select=B]').click();await confirmStationPreview(page);await expect(page.locator('#selectedStop')).toBeVisible();const afterSelect=calls();expect(afterSelect).toBeGreaterThan(n);
 await select(page,'compatible');await page.locator('#stationDeparture').fill('2026-09-17T11:45');await expect(page.locator('#filteredStopNote')).toContainText('reste dans le trajet');await expect(page.locator('#stationDots .svg-station')).toHaveCount(2);
 await page.locator('#maxDetourKm').fill('0');await expect(page.locator('.result-card')).toHaveCount(0);await expect(page.locator('#stationDots .svg-station')).toHaveCount(1);
 await page.locator('#resetStationFilters').click();await select(page,'compatible');await expect(page.locator('[data-station=A] .result-badge')).toHaveText(['OPTIMAL','POMPE','RAPIDE']);expect(calls()).toBe(afterSelect);
});
test('horaires : automate générique ne confirme pas le GPLc, guichet reste utilisable',async({page})=>{
 await fixture(page,{gpl:true});await expect(page.locator('[data-station=A] .station-opening')).toContainText('non qualifié pour le GPLc');await select(page,'compatible');await ids(page,['B']);await page.locator('#stationDeparture').fill('2026-09-17T11:45');await ids(page,[]);
});
test('horaires : accès routier contraint utilise sa première étape',async({page})=>{
 await fixture(page,{constrained:true});await expect(page.locator('[data-station=B] .station-opening')).toContainText('12:20');await select(page,'compatible');await ids(page,['A']);
});
test('horaires : carte Leaflet, clic et titre reflètent la même arrivée',async({page})=>{
 await fixture(page,{leaflet:true});await ids(page,['A','B','C'],true);await expect(page.locator('.station-marker').nth(1)).toHaveAttribute('title',/11:50/);await page.locator('.station-marker').nth(1).click();await expect(page.locator('#stationDetails')).toContainText('11:50');await page.getByRole('button',{name:'Fermer la fiche station'}).click();await page.locator('#stationDeparture').fill('2026-09-17T11:45');await select(page,'outside');await ids(page,['B'],true);await expect(page.locator('.station-marker')).toHaveAttribute('title',/12:05/);
});
test.describe('horaires sur appareil dans un autre fuseau',()=>{test.use({timezoneId:'America/New_York'});test('heure de Paris explicite, départ figé puis actualisation volontaire',async({page})=>{
 await fixture(page);await expect(page.locator('[data-station=B] .station-opening')).toContainText('11:50');await page.clock.setFixedTime(new Date('2026-09-17T15:00:00Z'));await expect(page.locator('#stationDeparture')).toHaveValue('2026-09-17T11:30');await page.locator('#stationDepartureNow').click();await expect(page.locator('#stationDeparture')).toHaveValue('2026-09-17T17:00');await expect(page.locator('[data-station=B] .station-opening')).toContainText('17:20');
})});
