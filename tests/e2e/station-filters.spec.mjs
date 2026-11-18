import {test,expect} from '@playwright/test';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkOverflow,checkAccessibility} from '../helpers/inspection.mjs';

const fuel='https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?**';
const source=[
  {id:'A',lat:45.6,price:1.72,km:2,min:2,services:['Station de gonflage','Toilettes publiques']},
  {id:'B',lat:45.5,price:1.6,km:4,min:5},
  {id:'C',lat:45.4,price:1.6,km:10,min:8,services:['Toilettes publiques']},
  {id:'D',lat:45.3,price:1.6,km:6,min:10,services:['Station de gonflage']}
];
async function fixture(page,{limited=false,cap=false}={}){
  await mockDragonRoute(page);
  let calls=0;
  page.on('request',r=>{if(/data.economie|\/table\/|\/route\//.test(r.url()))calls++});
  if(cap)await page.route('**/DragonRoute/config.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('maxCandidates: 20','maxCandidates: 2')})});
  await page.route(fuel,r=>r.fulfill({json:{total_count:limited?150:4,results:source.map(s=>({id:s.id,adresse:`${s.id} route test`,ville:'Valence',geom:[s.lat,4.87],e10_prix:s.price,e10_maj:'2026-09-17T08:00:00Z',services_service:s.services}))}}));
  await page.route('https://router.project-osrm.org/table/v1/driving/**',r=>{
    const coords=new URL(r.request().url()).pathname.split('/').at(-1).split(';');
    const n=coords.length,distances=Array.from({length:n},()=>Array(n).fill(null)),durations=Array.from({length:n},()=>Array(n).fill(null));
    for(let i=1;i<n-1;i++){
      const s=source.find(s=>Math.abs(s.lat-Number(coords[i].split(',')[1]))<1e-6);
      distances[0][i]=i*10000;distances[i][n-1]=104000+s.km*1000-distances[0][i];
      durations[0][i]=i*600;durations[i][n-1]=3900+s.min*60-durations[0][i];
    }
    return r.fulfill({json:{code:'Ok',distances,durations}});
  });
  await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('stations comparées');
  await page.locator('#stationFilters').evaluate(el=>el.open=true);
  await page.locator('#stationListMode').selectOption('all');
  return ()=>calls;
}
const service=(page,name)=>page.locator('#serviceChoices').getByRole('checkbox',{name,exact:true});
async function ids(page,expected){
  await expect(page.locator('.result-card')).toHaveCount(expected.length);
  expect(await page.locator('.result-card').evaluateAll(els=>els.map(e=>e.dataset.station))).toEqual(expected);
  await expect(page.locator('#stationDots .svg-station')).toHaveCount(expected.length);
  await expect(page.locator('#eligibleCount')).toHaveText(String(expected.length));
}

test('filtres : détour routier, services cumulés, inconnus et reset sans nouvelle requête',async({page},info)=>{
  const calls=await fixture(page),initial=calls();await ids(page,['A','B','C','D']);
  await page.locator('#maxDetourKm').fill('6');await ids(page,['A','B','D']);
  await page.locator('#maxDetourMin').fill('5');await ids(page,['A','B']);
  await service(page,'Station de gonflage').check();await ids(page,['A']);
  await expect(page.locator('#stationFilterStatus')).toContainText('1 aux services non renseignés');
  await service(page,'Toilettes publiques').check();await ids(page,['A']);
  await expect(page.locator('[data-station=A] .station-index')).toHaveText('Point 1');
  await expect(page.locator('[data-station=A] .result-badge')).toHaveText(['OPTIMAL','POMPE','RAPIDE']);
  await page.locator('#stationFilters').scrollIntoViewIfNeeded();
  await capture(page,info,'filtres-stations');await checkOverflow(page);await checkAccessibility(page,info,'filtres-stations');
  await page.locator('#resetStationFilters').click();await ids(page,['A','B','C','D']);
  expect(calls()).toBe(initial);await expect(page.locator('#tripKm')).toHaveText('104,0 km');
});

test('filtres : zéro, valeurs invalides, résultat vide et autonomie synchronisée à la carte',async({page})=>{
  const calls=await fixture(page),initial=calls();
  await page.locator('#maxDetourKm').fill('0');await ids(page,[]);
  await expect(page.locator('#stationCards')).toContainText('Aucun élargissement automatique');
  await page.locator('#maxDetourKm').fill('-1');await ids(page,[]);await expect(page.locator('#stationFilterStatus')).toContainText('saisir une valeur');
  await page.locator('#maxDetourKm').fill('');await page.locator('#maxDetourMin').fill('1441');await ids(page,[]);
  await page.locator('#resetStationFilters').click();
  await page.locator('#rangeOptions').evaluate(e=>e.open=true);
  await page.locator('#rangeMode').selectOption('km');await page.locator('#rangeValue').fill('55');await page.locator('#rangeOnly').check();
  await ids(page,['A','B']);await service(page,'Toilettes publiques').check();await ids(page,['A']);
  await page.locator('#resetStationFilters').click();await ids(page,['A','B','C','D']);
  await expect(page.locator('#rangeValue')).toHaveValue('55');expect(calls()).toBe(initial);
});

test('classements et égalités : badges recalculés sous contraintes, numéros conservés',async({page})=>{
  await fixture(page);
  await expect(page.locator('.result-badge').filter({hasText:'POMPE'})).toHaveCount(3);
  await page.locator('#stationListMode').selectOption('cost');await ids(page,['B','D','C','A']);
  await page.locator('#stationListMode').selectOption('price');await ids(page,['B','C','D','A']);
  await page.locator('#stationListMode').selectOption('detour');await ids(page,['A','B','C','D']);
  await service(page,'Toilettes publiques').check();await ids(page,['A','C']);
  await expect(page.locator('[data-station=C] .station-index')).toHaveText('Point 3');
  await expect(page.locator('[data-station=C] .result-badge')).toHaveText(['OPTIMAL','POMPE']);
  await expect(page.locator('#stationFilterStatus')).toContainText('1 aux services non renseignés');
  await expect(page.locator('#stationFilterStatus')).toContainText('1 sans tous les services requis déclarés');
  await page.locator('#stationDots [data-details=C]').press('Enter');await expect(page.locator('#stationDetails')).toContainText('Toilettes publiques');
  await page.getByRole('button',{name:'Fermer la fiche station'}).click();
  await page.locator('#end').fill('Autre destination');await expect(page.locator('#stationFilterStatus')).toBeHidden();await expect(page.locator('#stationDots .svg-station')).toHaveCount(0);
});

test('arrêt choisi hors filtre conservé explicitement et retiré sans stations fantômes',async({page})=>{
  await fixture(page);page.on('dialog',d=>d.accept());await page.locator('[data-select=A]').click();await expect(page.locator('#selectedStop')).toBeVisible();
  await page.locator('#maxDetourKm').fill('0');await expect(page.locator('.result-card')).toHaveCount(0);await expect(page.locator('#eligibleCount')).toHaveText('0');
  await expect(page.locator('#filteredStopNote')).toContainText('reste dans le trajet');await expect(page.locator('#stationDots .svg-station')).toHaveCount(1);
  await expect(page.locator('#tripKm')).toHaveText('106,0 km');
  await page.locator('#removeStopBtn').click();await ids(page,[]);await expect(page.locator('#filteredStopNote')).toBeHidden();await expect(page.locator('#tripKm')).toHaveText('104,0 km');
});

test('couverture : limite des candidates et réponse tronquée affichées, aucun élargissement implicite',async({page})=>{
  const calls=await fixture(page,{limited:true,cap:true}),initial=calls();
  await ids(page,['A','B']);await expect(page.locator('#stationCoverage')).toContainText('2 candidates examinées sur 4');
  await expect(page.locator('#stationCoverage')).toContainText('Limite atteinte');await expect(page.locator('#stationCoverage')).toContainText('réponse(s) limitée(s)');
  await service(page,'Toilettes publiques').check();await page.locator('#maxDetourKm').fill('0');await ids(page,[]);expect(calls()).toBe(initial);
  await page.locator('#resetStationFilters').click();await ids(page,['A','B']);expect(calls()).toBe(initial);
});
