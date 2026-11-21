import {test,expect} from '@playwright/test';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';

test.beforeEach(async({page})=>{await mockDragonRoute(page)});

test('adresses IGN : communes homonymes, lieux nommes et coordonnees choisies',async({page},info)=>{
  const queries=[],routes=[];
  await page.route(geocodingPattern,r=>{
    const params=new URL(r.request().url()).searchParams;queries.push(params.get('q'));
    expect(params.get('index')).toBe('address,poi');
    expect(params.get('autocomplete')).toBe('false');
    expect(params.get('limit')).toBe('5');
    expect([...params.keys()].sort()).toEqual(['autocomplete','index','limit','q']);
    const poi={type:'Feature',geometry:{type:'Point',coordinates:[4.804783,45.766084]},properties:{
      _type:'poi',toponym:'Gare de Lyon-Gorge-de-Loup',postcode:['69009'],city:['Lyon 9e Arrondissement','Lyon'],depcode:['69'],
      category:['gare voyageurs uniquement','transport']}};
    return r.fulfill({json:params.get('q').includes('gorge')?placesResponse(poi,structuredClone(poi)):
      placesResponse(addressFeature(4.921827,44.922579,'Valence',{postcode:'26000',city:'Valence',context:'26, Drôme'}),
        addressFeature(.904345,44.108321,'Valence',{postcode:'82400',city:'Valence',context:'82, Tarn-et-Garonne'}))});
  });
  page.on('request',r=>{if(r.url().includes('/route/v1/'))routes.push(r.url())});
  await page.goto('/DragonRoute/');
  await page.locator('#start').fill('  Lyon   gorge de loup  ');
  expect(queries).toHaveLength(0);
  await page.locator('#goBtn').click();
  // Identical POIs collapse to one. The two Valence locations require a choice.
  await expect(page.locator('#placeTitle')).toHaveText('Quel lieu d’arrivée ?');
  await expect(page.locator('#placeChoices input')).toHaveCount(2);
  await expect(page.locator('#confirmPlace')).toBeDisabled();
  expect(routes).toHaveLength(0);
  await expect(page.locator('#placeChoices')).toContainText('Valence · 26000 · 26, Drôme');
  await expect(page.locator('#placeChoices')).toContainText('Valence · 82400 · 82, Tarn-et-Garonne');
  await capture(page,info,'ign-adresses');await checkAccessibility(page,info,'ign-adresses');await checkOverflow(page);
  await page.getByRole('radio',{name:'Valence · 26000 · 26, Drôme',exact:true}).check();
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#resolvedPlaces')).toContainText('Gare de Lyon-Gorge-de-Loup · 69009 · Lyon 9e Arrondissement · Département 69 · gare voyageurs uniquement');
  expect(queries).toEqual(['Lyon gorge de loup','Valence']);
  expect(decodeURIComponent(routes[0])).toContain('4.804783,45.766084;4.921827,44.922579');
});

test('adresses IGN : reponses vides ou invalides sans trajet ni repli',async({page})=>{
  const requests=[];page.on('request',r=>requests.push(r.url()));
  let response;
  await page.route(geocodingPattern,r=>r.fulfill(response));
  await page.goto('/DragonRoute/');
  for(const [json,message] of [
    [null,'géocodage invalide'],
    [{type:'FeatureCollection',features:{}},'géocodage invalide'],
    [placesResponse(),'Lieu introuvable en France'],
    [placesResponse(null,{},addressFeature(null,45,'Null'),addressFeature('',45,'Vide'),
      addressFeature(true,45,'Booléen'),addressFeature('4',45,'Texte'),addressFeature(181,45,'Longitude'),
      addressFeature(4,91,'Latitude'),addressFeature(4,45,''),addressFeature(4,45,'Parcelle',{_type:'parcel'}),
      {type:'Feature',geometry:{type:'LineString',coordinates:[4,45]},properties:{label:'Ligne',_type:'address'}}),'aucun lieu exploitable']
  ]){
    response={json};
    await page.locator('#goBtn').click();
    await expect(page.locator('#status')).toContainText(message);
    await expect(page.locator('#goBtn')).toBeEnabled();
    await expect(page.locator('#summary')).toBeHidden();
    await expect(page.locator('#routeLine')).toHaveAttribute('d','');
  }
  response={status:503,body:'Service indisponible'};
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('HTTP 503');
  expect(requests.some(u=>/nominatim|route\/v1|navigation\/itineraire/.test(u))).toBe(false);
  response={json:placesResponse(addressFeature(4.8357,45.764,'Lieu valide'))};
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#goBtn')).toBeEnabled();
});

test('adresses IGN : quota respecte, relance manuelle et expiration du cache',async({page})=>{
  let requests=0,limited=true;
  await page.route(geocodingPattern,r=>{
    requests++;
    return r.fulfill(limited?{status:429,headers:{'Retry-After':'8','Access-Control-Expose-Headers':'Retry-After'},body:'Too many requests'}:
      {json:placesResponse(addressFeature(4.8357,45.764,'Lieu valide'))});
  });
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Réessayer dans 8 s');
  limited=false;
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('temporairement limitée');
  expect(requests).toBe(1);
  await page.clock.fastForward(8001);
  expect(requests).toBe(1); // No background retry.
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  expect(requests).toBe(3);
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  expect(requests).toBe(3);
  await page.clock.fastForward(300001);
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  expect(requests).toBe(5);
});
