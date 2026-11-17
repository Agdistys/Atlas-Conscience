import {once} from 'node:events';
import {test,expect} from '@playwright/test';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
import {buildTollRequest,normalizeTolls,createTollServer} from '../../server/tolls.mjs';
const endpoint='https://tolls.example.test/api/tolls';
function quote(input,amount=9.5){
 const r=buildTollRequest(input);
 return normalizeTolls({status:'OK',summary:{countries:['FRA'],currency:'EUR',vehicleType:'2AxlesAuto'},route:{polyline:r.body.polyline,distance:{value:input.distance},hasTolls:true,costs:{cash:amount,licensePlate:amount},tolls:[{id:1,name:'Péage fictif <img src=x>',currency:'EUR',tax:{isTaxIncluded:true},cashCost:amount,licensePlateCost:amount}]}},r,Date.parse('2026-09-17T10:00:00Z'));
}
async function setup(page,handler){
 await mockDragonRoute(page);
 await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('tollsApi: ""',`tollsApi: "${endpoint}"`)})});
 await page.route(endpoint,handler||((r)=>r.fulfill({json:quote(r.request().postDataJSON())})));
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
}
async function parameters(page){await page.locator('#tollHeight').fill('1.6');await page.locator('#tollWeight').fill('1900');await page.locator('#tollVehicleConfirmed').check()}
async function calculate(page){await parameters(page);await page.locator('#tollCalculate').click()}

test('peages : service absent visible sans tarif nul ni appel',async({page},info)=>{
 await mockDragonRoute(page);const requests=[];page.on('request',r=>{if(/tollguru|api\/tolls/.test(r.url()))requests.push(r.url())});
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await expect(page.locator('#tollCalculate')).toBeDisabled();await expect(page.locator('#tollParameters')).toBeHidden();
 await expect(page.locator('#tollAvailability')).toContainText('non activé');await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');expect(requests).toEqual([]);
 await checkOverflow(page);await checkAccessibility(page,info,'peages-indisponibles');
});
test('peages : total carburant et source sans addition du plein',async({page},info)=>{
 const requests=[];await setup(page,r=>{requests.push(r.request().postDataJSON());return r.fulfill({json:quote(requests.at(-1))})});
 await expect(page.locator('#tollCalculate')).toBeDisabled();await parameters(page);expect(requests).toHaveLength(0);
 await page.locator('#budgetPrice').fill('2');await page.locator('#tollCalculate').click();
 await expect(page.locator('#tollAmount')).toHaveText('9,50 € · estimation');await expect(page.locator('#budgetTotal')).toHaveText('22,40 € · estimation');
 expect(requests).toHaveLength(1);expect(requests[0].coordinates).toEqual([[4.8357,45.764],[4.855,45.55],[4.875,45.25],[4.8924,44.9334]]);
 await page.locator('#budgetPrice').fill('3');await expect(page.locator('#budgetTotal')).toHaveText('28,84 € · estimation');expect(requests).toHaveLength(1);
 await page.locator('#tollDetails summary').click();await expect(page.locator('#tollSource')).toContainText('PTAC 1900 kg');await expect(page.locator('#tollItems img')).toHaveCount(0);
 await capture(page,info,'peages-estimation');await checkOverflow(page);await checkAccessibility(page,info,'peages-estimation');
 await page.locator('#tollHeight').fill('2.5');await expect(page.locator('#tollCalculate')).toBeDisabled();await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');await expect(page.locator('#tollDetails')).toBeHidden();
});
test('peages : zero confirme, partiel et devise incorrecte restent distincts',async({page})=>{
 let state='zero';await setup(page,r=>{const q=quote(r.request().postDataJSON());
  if(state==='zero')Object.assign(q,{status:'no_tolls',amountEur:0,items:[]});
  if(state==='partial')Object.assign(q,{status:'partial',amountEur:null,knownSubtotalEur:9.5,items:[...q.items,{label:'Paiement inconnu',amountEur:null,payment:q.payment}],warnings:['Tarif manquant.']});
  if(state==='currency')q.currency='USD';return r.fulfill({json:q});
 });
 await page.locator('#budgetPrice').fill('2');await calculate(page);await expect(page.locator('#tollAmount')).toContainText('sans péage confirmé');await expect(page.locator('#budgetTotal')).toHaveText('12,90 € · estimation');
 state='partial';await page.locator('#tollCalculate').click();await expect(page.locator('#tollAmount')).toContainText('9,50 € connus · partiel');await expect(page.locator('#budgetTotal')).toHaveText('Incomplet');
 state='currency';await page.locator('#tollCalculate').click();await expect(page.locator('#tollNotice')).toContainText('non concordant');await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');
});
test('peages : variante ignore la reponse tardive de lancien trace',async({page})=>{
 await page.addInitScript(()=>{const original=window.fetch;window.fetch=(url,options)=>original(url,String(url).includes('tolls.example.test')?{...options,signal:undefined}:options)});
 let pending,resolveRequest;const received=new Promise(r=>resolveRequest=r);const calls=[];
 await setup(page,r=>{const data=r.request().postDataJSON();calls.push(data);if(calls.length===1){pending=r;resolveRequest();return}return r.fulfill({json:quote(data,15)})});
 await calculate(page);await received;await page.locator('input[name=routeChoice][value="1"]').check();
 await expect(page.locator('#tollAmount')).toHaveText('15,00 € · estimation');expect(calls[1].coordinates).toContainEqual([5.08,45.55]);
 await pending.fulfill({json:quote(calls[0],95)});await page.waitForTimeout(100);await expect(page.locator('#tollAmount')).toHaveText('15,00 € · estimation');
});
test('peages : arret complet et retrait recalcules sans double paiement',async({page})=>{
 const calls=[];await setup(page,r=>{const d=r.request().postDataJSON();calls.push(d);return r.fulfill({json:quote(d,d.coordinates.length===3?12:9.5)})});
 await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>{const points=new URL(r.request().url()).pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));if(points.length!==3)return r.fallback();return r.fulfill({json:{code:'Ok',routes:[{distance:106000,duration:106000/26,geometry:{type:'LineString',coordinates:points}}]}})});
 await calculate(page);await expect(page.locator('#tollAmount')).toContainText('9,50');await page.locator('#stationsBtn').click();await expect(page.locator('.result-card')).toHaveCount(2);
 await page.locator('[data-select=A]').click();await expect(page.locator('#tollAmount')).toHaveText('12,00 € · estimation');expect(calls.at(-1).coordinates).toEqual([[4.8357,45.764],[4.87,45.4],[4.8924,44.9334]]);
 await page.locator('#removeStopBtn').click();await expect(page.locator('#tollAmount')).toHaveText('9,50 € · estimation');expect(calls.at(-1).coordinates).toEqual(calls[0].coordinates);
});
test('peages : panne, reprise manuelle et expiration sans appels repetes',async({page})=>{
 let ok=false,count=0;await setup(page,r=>{count++;return ok?r.fulfill({json:quote(r.request().postDataJSON())}):r.fulfill({status:429,body:'quota'})});
 await calculate(page);await expect(page.locator('#tollNotice')).toContainText('Quota');await expect(page.locator('#summary')).toBeVisible();expect(count).toBe(1);
 ok=true;await page.locator('#tollCalculate').click();await expect(page.locator('#tollAmount')).toContainText('9,50');
 await page.locator('#start').fill('Autre départ');await expect(page.locator('#tripBudget')).toBeHidden();
 await page.locator('#goBtn').click();await expect(page.locator('#tollAmount')).toContainText('9,50');
 await page.clock.install({time:new Date('2026-09-17T10:00:00Z')});await page.locator('#tollCalculate').click();await page.clock.runFor(600);await expect(page.locator('#tollAmount')).toContainText('9,50');
 const before=count;await page.clock.fastForward(15*60000+10);await expect(page.locator('#tollNotice')).toContainText('expirée');await expect(page.locator('#tollAmount')).toHaveText('Tarif indisponible');expect(count).toBe(before);
});

test('peages : interface et serveur HTTP relies sans cle dans le navigateur',async({page},info)=>{
 const source=[];let claimed=0;
 const server=createTollServer({key:'fake-private-integration-key',origins:['http://127.0.0.1:4173'],qualified:true,claim:()=>claimed++,now:()=>Date.parse('2026-09-17T10:00:00Z'),fetchImpl:async(url,init)=>{
  source.push({url,init});const body=JSON.parse(init.body);
  return Response.json({status:'OK',summary:{countries:['FRA'],currency:'EUR',vehicleType:'2AxlesAuto'},route:{polyline:body.polyline,distance:{value:104000},hasTolls:true,costs:{cash:7},tolls:[{id:1,name:'Tarif de test',currency:'EUR',tax:{isTaxIncluded:true},cashCost:7}]}});
 }});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{
  await mockDragonRoute(page);const url=`http://127.0.0.1:${server.address().port}/api/tolls`;
  await page.route(url,r=>r.continue());
  const sent=[];page.on('request',r=>{if(r.url()===url)sent.push({headers:r.headers(),body:r.postData()})});
  await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('tollsApi: ""',`tollsApi: "${url}"`)})});
  await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#budgetPrice').fill('2');await calculate(page);await expect(page.locator('#budgetTotal')).toHaveText('19,90 € · estimation');
  await capture(page,info,'peages-serveur');await checkOverflow(page);
  expect(claimed).toBe(1);expect(source).toHaveLength(1);expect(source[0].init.headers['x-api-key']).toBe('fake-private-integration-key');
  expect(JSON.stringify(sent)).not.toContain('fake-private-integration-key');expect(source[0].url).toBe('https://apis.tollguru.com/toll/v2/complete-polyline-from-mapping-service');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
});
