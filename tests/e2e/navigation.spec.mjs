import {confirmRouteChoice} from '../helpers/dragonroute.mjs';
import {confirmStationPreview} from '../helpers/dragonroute.mjs';
import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse,publicRouting,orsPattern,orsResponse} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';

test.beforeEach(async({page})=>{await mockDragonRoute(page)});
async function ready(page){
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
}
async function open(page){await page.locator('#navigationBtn').click();await expect(page.locator('#navigationDialog')).toBeVisible()}
async function close(page){await page.getByRole('button',{name:'Fermer la navigation',exact:true}).click()}
async function gpx(page,info,label){
  const pending=page.waitForEvent('download');await page.locator('#exportGpxBtn').click();
  const download=await pending;expect(download.suggestedFilename()).toMatch(/^DragonRoute_trajet_.*\.gpx$/);
  const file=info.outputPath(label+'.gpx');await download.saveAs(file);
  const xml=await fs.readFile(file,'utf8');
  await info.attach(label,{path:file,contentType:'application/gpx+xml'});
  return page.evaluate(xml=>{
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    const get=tag=>[...doc.getElementsByTagName(tag)];
    return {error:get('parsererror').length,namespace:doc.documentElement.namespaceURI,version:doc.documentElement.getAttribute('version'),
      points:get('trkpt').map(n=>[Number(n.getAttribute('lon')),Number(n.getAttribute('lat'))]),
      waypoints:get('wpt').map(n=>({coords:[Number(n.getAttribute('lon')),Number(n.getAttribute('lat'))],name:n.textContent})),
      description:get('desc')[0]?.textContent,unexpected:get('img').length+get('script').length,xml};
  },xml);
}

test('navigation : liens explicites sans envoi automatique et fermeture clavier',async({page},info)=>{
  const requests=[];page.on('request',r=>{if(/google\.com\/maps|waze\.com/.test(r.url()))requests.push(r.url())});
  await page.goto('/DragonRoute/');await expect(page.locator('#navigationBtn')).toBeHidden();
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
  await open(page);
  const google=new URL(await page.locator('#googleMapsLink').getAttribute('href'));
  expect(google.origin+google.pathname).toBe('https://www.google.com/maps/dir/');
  expect(Object.fromEntries(google.searchParams)).toEqual({api:'1',origin:'45.764,4.8357',destination:'44.9334,4.8924',travelmode:'driving'});
  const waze=new URL(await page.locator('#wazeArrivalLink').getAttribute('href'));
  expect(waze.origin+waze.pathname).toBe('https://www.waze.com/ul');
  expect(waze.searchParams.get('ll')).toBe('44.9334,4.8924');
  expect(waze.searchParams.get('navigate')).toBe('yes');expect(waze.searchParams.has('origin')).toBe(false);
  await expect(page.locator('#wazeStationLink')).toBeHidden();
  await expect(page.locator('#navigationCarLinks')).toContainText('repart de la position utilisée par Waze');
  for(const id of ['googleMapsLink','wazeArrivalLink']){
    await expect(page.locator('#'+id)).toHaveAttribute('target','_blank');
    await expect(page.locator('#'+id)).toHaveAttribute('rel','noopener noreferrer');
  }
  expect(requests).toEqual([]);
  await capture(page,info,'navigation');await checkAccessibility(page,info,'navigation');await checkOverflow(page);
  expect(await page.locator('#navigationDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.keyboard.press('Escape');await expect(page.locator('#navigationDialog')).toBeHidden();
  await expect(page.locator('#navigationBtn')).toBeFocused();
  await expect(page.locator('#googleMapsLink')).not.toHaveAttribute('href',/.+/);
});

test('navigation : variante et arret confirmes dans les liens et le GPX',async({page},info)=>{
  await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>{
    const points=new URL(r.request().url()).pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));
    if(points.length!==3)return r.fallback();
    return r.fulfill({json:{code:'Ok',routes:[{distance:106000,duration:106000/26,geometry:{type:'LineString',coordinates:points}}]}});
  });
  await ready(page);
  await page.locator('[data-route-choice="1"]').click();await confirmRouteChoice(page);await open(page);
  let track=await gpx(page,info,'variante');expect(track.error).toBe(0);
  expect(track.namespace).toBe('http://www.topografix.com/GPX/1/1');expect(track.version).toBe('1.1');
  expect(track.points).toContainEqual([5.08,45.55]);expect(track.waypoints).toHaveLength(2);
  expect(track.description).toContain('118,0 km');await close(page);
  await page.locator('[data-route-choice="0"]').click();await confirmRouteChoice(page);
  await page.locator('#stationsBtn').click();await expect(page.locator('.result-card')).toHaveCount(2);
  await page.locator('[data-select=A]').click();await confirmStationPreview(page);await expect(page.locator('#selectedStop')).toBeVisible();
  await open(page);
  expect(new URL(await page.locator('#googleMapsLink').getAttribute('href')).searchParams.get('waypoints')).toBe('45.4,4.87');
  expect(new URL(await page.locator('#wazeStationLink').getAttribute('href')).searchParams.get('ll')).toBe('45.4,4.87');
  expect(new URL(await page.locator('#wazeArrivalLink').getAttribute('href')).searchParams.get('ll')).toBe('44.9334,4.8924');
  track=await gpx(page,info,'avec-arret');expect(track.error).toBe(0);expect(track.description).toContain('106,0 km');
  expect(track.points).toEqual([[4.8357,45.764],[4.87,45.4],[4.8924,44.9334]]);
  expect(track.waypoints.map(p=>p.coords)).toEqual(track.points);expect(track.waypoints[1].name).toContain('Arrêt carburant');
  await close(page);await page.locator('#removeStopBtn').click();await open(page);
  await expect(page.locator('#wazeStationLink')).toBeHidden();
  expect(new URL(await page.locator('#googleMapsLink').getAttribute('href')).searchParams.has('waypoints')).toBe(false);
  track=await gpx(page,info,'sans-arret');expect(track.waypoints).toHaveLength(2);expect(track.description).toContain('104,0 km');
  expect(track.points).not.toContainEqual([4.87,45.4]);
});

test('navigation : exclusions transmises et poids lourd sans lien voiture',async({page},info)=>{
  await publicRouting(page);await page.route(orsPattern,r=>r.fulfill({json:orsResponse(r.request().postDataJSON())}));
  await page.goto('/DragonRoute/');
  for(const id of ['avoidTolls','avoidHighways','avoidFerries'])await page.locator('#'+id).check();
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await open(page);
  const google=new URL(await page.locator('#googleMapsLink').getAttribute('href'));
  expect(google.searchParams.get('avoid')).toBe('tolls,highways,ferries');
  const waze=new URL(await page.locator('#wazeArrivalLink').getAttribute('href'));
  for(const key of ['avoid_tolls','avoid_freeways','avoid_ferries'])expect(waze.searchParams.get(key)).toBe('true');
  await expect(page.locator('#navigationAvoidNote')).toContainText('pas une garantie');
  await close(page);await page.locator('#routeVehicle').selectOption('truck');
  for(const [id,v] of Object.entries({truckHeight:'4',truckWidth:'2.5',truckLength:'12',truckWeight:'18',truckAxleload:'9'}))await page.locator('#'+id).fill(v);
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await open(page);
  await expect(page.locator('#navigationCarLinks')).toBeHidden();await expect(page.locator('#navigationVehicleNote')).toContainText('gabarit du poids lourd');
  for(const id of ['googleMapsLink','wazeArrivalLink','wazeStationLink'])await expect(page.locator('#'+id)).not.toHaveAttribute('href',/.+/);
  const track=await gpx(page,info,'poids-lourd');expect(track.error).toBe(0);expect(track.description).toContain('poids lourd');
  expect(track.description).toContain('H 4,00 m');expect(track.description).toContain('Les contraintes ne sont pas des réglages');
});

test('navigation : XML sur, echec de telechargement et invalidation des anciens liens',async({page},info)=>{
  await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(addressFeature(4.8357,45.764,'Lieu <img src=x> & "nom"\u0001'))}));
  await ready(page);await open(page);
  const track=await gpx(page,info,'libelle-xml');expect(track.error).toBe(0);expect(track.unexpected).toBe(0);
  expect(track.waypoints[0].name).toContain('Lieu <img src=x> & "nom"');expect(track.waypoints[0].name).not.toContain('\u0001');
  await expect(page.locator('#navigationSummary img')).toHaveCount(0);
  await page.evaluate(()=>{URL.createObjectURL=()=>{throw Error('Téléchargement indisponible')}});await page.locator('#exportGpxBtn').click();
  await expect(page.locator('#navigationMessage')).toHaveText('Téléchargement indisponible');
  await close(page);
  await page.locator('#start').fill('Nouvelle adresse');
  await expect(page.locator('#navigationBtn')).toBeHidden();
  for(const id of ['googleMapsLink','wazeArrivalLink','wazeStationLink'])await expect(page.locator('#'+id)).not.toHaveAttribute('href',/.+/);
  await page.route(geocodingPattern,r=>r.fulfill({status:503,body:'Unavailable'}));
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('HTTP 503');
  await expect(page.locator('#navigationBtn')).toBeHidden();
});
