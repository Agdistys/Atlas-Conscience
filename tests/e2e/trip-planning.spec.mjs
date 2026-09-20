import { test, expect } from '@playwright/test';
import { mockDragonRoute } from '../helpers/dragonroute.mjs';
import { capture, checkAccessibility, checkOverflow } from '../helpers/inspection.mjs';

test.beforeEach(async ({page}) => { await mockDragonRoute(page); });
async function ready(page) {
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
}

test('geocodage ambigu : choix explicite, libelles, annulation et cache', async ({page}, info) => {
  let requests=0;
  await page.route('https://nominatim.openstreetmap.org/search?**', r => {
    requests++;
    const url=new URL(r.request().url());
    expect(url.searchParams.get('limit')).toBe('5');
    return r.fulfill({json:[
      {lat:'45.764',lon:'4.8357',display_name:'Lyon, 69001, France'},
      {lat:'45.75',lon:'4.84',display_name:'Autre lieu, 69002, France'}
    ]});
  });
  await page.goto('/DragonRoute/');
  await page.locator('#start').fill('Lieu');
  expect(requests).toBe(0);
  await page.locator('#goBtn').click();
  await expect(page.locator('#placeDialog')).toBeVisible();
  await expect(page.locator('#confirmPlace')).toBeDisabled();
  await expect(page.locator('#summary')).toBeHidden();
  await page.getByRole('radio',{name:'Lyon, 69001, France'}).check();
  await capture(page,info,'choix-lieu');
  await checkAccessibility(page,info,'choix-lieu');await checkOverflow(page);
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#placeTitle')).toHaveText('Quel lieu d’arrivée ?');
  await page.keyboard.press('Escape');
  await expect(page.locator('#status')).toContainText('annulé');
  await expect(page.locator('#goBtn')).toBeEnabled();
  expect(requests).toBe(2);
  await page.locator('#goBtn').click();
  await page.getByRole('radio',{name:'Lyon, 69001, France'}).check();
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#placeTitle')).toHaveText('Quel lieu d’arrivée ?');
  await page.getByRole('radio',{name:'Autre lieu, 69002, France'}).check();
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#resolvedPlaces')).toContainText('Arrivée : Autre lieu, 69002, France');
  expect(requests).toBe(2);
  await expect(page.locator('#avoidTolls')).toBeDisabled();
});

test('geocodage : coordonnees invalides refusees et libelle hostile en texte', async ({page}) => {
  await page.route('https://nominatim.openstreetmap.org/search?**',r=>r.fulfill({json:[
    {lat:'NaN',lon:'4',display_name:'Invalide'},
    {lat:'91',lon:'4',display_name:'Invalide'},
    {lat:'45',lon:'4',display_name:'<img src=x onerror=alert(1)>'},
    {lat:'46',lon:'5',display_name:'Autre lieu'}
  ]}));
  await page.goto('/DragonRoute/');await page.locator('#goBtn').click();
  await expect(page.locator('#placeChoices input')).toHaveCount(2);
  await expect(page.locator('#placeChoices img')).toHaveCount(0);
  await page.locator('#cancelPlace').click();
  await expect(page.locator('#status')).toContainText('annulé');
});

test('budget carburant distinct du plein et peages inconnus', async ({page},info) => {
  await ready(page);
  await expect(page.locator('#budgetFuel')).toContainText('6,45 L');
  await expect(page.locator('#budgetFuel')).toContainText('prix à renseigner');
  await page.locator('#budgetPrice').fill('2');
  await expect(page.locator('#budgetFuel')).toHaveText('6,45 L · 12,90 €');
  await page.locator('#liters').fill('100');
  await expect(page.locator('#budgetFuel')).toContainText('12,90 €');
  await expect(page.locator('.budget-lines')).toContainText('Tarif indisponible');
  await expect(page.locator('.budget-lines')).toContainText('Incomplet');
  await expect(page.locator('#useStationPrice')).toBeDisabled();
  await page.locator('input[name=routeChoice][value="1"]').check();
  await expect(page.locator('#budgetFuel')).toHaveText('7,32 L · 14,63 €');
  await page.locator('#budgetPrice').fill('0');
  await expect(page.locator('#budgetFuel')).toContainText('prix à renseigner');
  await page.locator('#budgetPrice').fill('2');
  await page.locator('#tripBudget').scrollIntoViewIfNeeded();
  await capture(page,info,'budget-trajet');await checkOverflow(page);await checkAccessibility(page,info,'budget-trajet');
  await page.locator('#fuel').selectOption('E85');
  await expect(page.locator('#budgetPrice')).toHaveValue('');
  await page.locator('#start').fill('Grenoble');
  await expect(page.locator('#tripBudget')).toBeHidden();
});

test('budget arret : distance via, prix source et suppression', async ({page}) => {
  await ready(page);await page.locator('#stationsBtn').click();
  await expect(page.locator('.result-card')).toHaveCount(2);
  await page.locator('[data-select=A]').click();
  await expect(page.locator('#tripKm')).toHaveText('106,0 km');
  await page.locator('#useStationPrice').click();
  await expect(page.locator('#budgetFuel')).toHaveText('6,57 L · 11,30 €');
  await expect(page.locator('#budgetSource')).toContainText('1 route test');
  await page.locator('#removeStopBtn').click();
  await expect(page.locator('#tripKm')).toHaveText('104,0 km');
  await expect(page.locator('#budgetPrice')).toHaveValue('');
  await expect(page.locator('#useStationPrice')).toBeDisabled();
});

test('autonomie : litres, reserve, acces routier, filtre et unite', async ({page},info) => {
  await ready(page);
  await page.locator('#rangeOptions summary').click();
  await page.locator('#rangeMode').selectOption('liters');
  await page.locator('#cons').fill('10');
  await page.locator('#rangeValue').fill('8');
  await expect(page.locator('#rangeStatus')).toContainText('50,0 km utiles');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('.result-card')).toHaveCount(2);
  await expect(page.locator('[data-station=A] .range-badge')).toContainText('Hors portée');
  await page.locator('#rangeOnly').check();
  await expect(page.locator('.result-card')).toHaveCount(0);
  await expect(page.locator('#stationCards')).toContainText('Aucune station comparée');
  await page.locator('#reserveKm').fill('29');
  await expect(page.locator('.result-card')).toHaveCount(1);
  await expect(page.locator('[data-station=A]')).toBeVisible();
  await expect(page.locator('[data-station=A] .range-badge')).toContainText('sans garantie');
  await page.locator('#rangeOptions').scrollIntoViewIfNeeded();
  await capture(page,info,'autonomie');await checkOverflow(page);await checkAccessibility(page,info,'autonomie');
  await page.locator('#rangeMode').selectOption('km');
  await expect(page.locator('#rangeValue')).toHaveValue('');
  await expect(page.locator('#rangeOnly')).toBeDisabled();
  await expect(page.locator('.result-card')).toHaveCount(2);
  await page.locator('#rangeValue').fill('0');
  await expect(page.locator('#rangeStatus')).toContainText('0,0 km utiles');
  await page.locator('#rangeValue').fill('');
  await expect(page.locator('#rangeStatus')).toContainText('valides');
});

test('autonomie : depart change, hors portee confirme et liste complete', async ({page}) => {
  await ready(page);await page.locator('#rangeOptions summary').click();
  await page.locator('#rangeMode').selectOption('km');await page.locator('#rangeValue').fill('20');
  await page.locator('#stationsBtn').click();await expect(page.locator('.result-card')).toHaveCount(2);
  page.once('dialog',async d=>{expect(d.message()).toContain('hors');await d.dismiss()});
  await page.locator('[data-select=A]').click();
  await expect(page.locator('#selectedStop')).toBeHidden();
  page.once('dialog',d=>d.accept());await page.locator('[data-select=A]').click();
  await expect(page.locator('#selectedStop')).toBeVisible();
  await page.locator('#stationListMode').selectOption('all');
  await expect(page.locator('[data-select=A]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#start').fill('Autre départ');
  await expect(page.locator('#rangeMode')).toHaveValue('none');
});

test('profil caravane conserve sans calcul voiture implicite', async ({page}) => {
  await page.addInitScript(()=>localStorage.setItem('dragonroute.profile.v1.public',JSON.stringify({version:1,vehicle:{name:'Caravane',type:'caravan',fuel:'E10',cons:9,liters:40},addresses:[],stations:[]})));
  await page.goto('/DragonRoute/');
  await expect(page.locator('#routeVehicle')).toHaveValue('caravan');
  await expect(page.locator('#goBtn')).toBeDisabled();
  await page.locator('#routeVehicle').selectOption('car');
  await expect(page.locator('#goBtn')).toBeEnabled();
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#avoidTolls')).toBeDisabled();
});

test('recalcul via different : refus preserve ancien trajet et couts', async ({page}) => {
  await ready(page);await page.locator('#stationsBtn').click();
  await expect(page.locator('.result-card')).toHaveCount(2);
  await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>r.fulfill({json:{code:'Ok',routes:[{distance:150000,duration:8000,geometry:{type:'LineString',coordinates:[[4.8357,45.764],[4.87,45.4],[4.8924,44.9334]]}}]}}));
  page.once('dialog',async d=>{expect(d.message()).toContain('diffère');await d.dismiss()});
  await page.locator('[data-select=A]').click();
  await expect(page.locator('#fuelStatus')).toContainText('précédent est conservé');
  await expect(page.locator('#tripKm')).toHaveText('104,0 km');
  await expect(page.locator('#selectedStop')).toBeHidden();
});
