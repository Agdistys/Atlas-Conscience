import {test,expect} from '@playwright/test';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkOverflow,checkAccessibility} from '../helpers/inspection.mjs';
import {reachable} from '../helpers/reading-layout.mjs';
const ids=['carMode','walkMode','cycleBtn','transitBtn','bikesBtn'];
const flows=[['cycleBtn','cycleDialog','cyclePlaces'],['transitBtn','transitDialog','transitPlaces'],['bikesBtn','bikesDialog',null]];
async function setup(page,{heavy=false}={}){
 await mockDragonRoute(page);
 await page.addInitScript(({heavy})=>{
  if(heavy&&!localStorage.getItem('dragonroute.profile.v2.public'))localStorage.setItem('dragonroute.profile.v2.public',JSON.stringify({version:2,vehicle:{name:'Caravane témoin',type:'caravan',fuel:'E10',cons:8,liters:40},addresses:[],stations:[]}));
  window.gpsCalls=0;Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(){window.gpsCalls++}}});
 },{heavy});
 await page.goto('/DragonRoute/');await expect(page.locator('#carMode')).toHaveAttribute('aria-pressed','true');
 const calls=[];page.on('request',r=>{if(/geocodage|navigation\/itineraire|\/route\/v1|mobilites-m|gbfs/.test(r.url()))calls.push(r.url())});return calls;
}
const storage=page=>page.evaluate(()=>JSON.stringify(localStorage));
async function road(page){await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt')}

test('accès modes : cinq entrées avant le véhicule, limites visibles et aucun effet externe',async({page},info)=>{
 const calls=await setup(page,{heavy:true}),before=await storage(page);
 for(const id of ids)await expect(page.locator('#'+id)).toBeVisible();
 await expect(page).toHaveTitle('OùQuandQui — Préparer ses déplacements');await expect(page.locator('.brand strong')).toHaveText('OùQuandQui');await expect(page.locator('#routeModuleName')).toHaveText('DragonRoute · module routier');await expect(page.locator('#tripReadout')).toContainText('Caravane');await expect(page.locator('#tripReadout')).toContainText('Calcul indisponible');
 await expect(page.locator('#transitBtn')).toContainText('Pilote Grenoble');await expect(page.locator('#bikesBtn')).toContainText('Pilote Lyon');await expect(page.locator('#cycleBtn')).toContainText('vélo personnel');
 expect(await page.evaluate(()=>Boolean(document.querySelector('.mode-access').compareDocumentPosition(document.querySelector('#vehiclePicker'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await page.locator('#walkMode').click();await expect(page.locator('#walkMode')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#carMode')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#walkingOptions')).toBeVisible();await expect(page.locator('#vehiclePicker')).toBeHidden();await expect(page.locator('#routingOptions')).toBeHidden();await expect(page.locator('#routeModeHeading')).toHaveText('Trajet à pied');await expect(page.locator('#routeModuleName')).toBeHidden();
 await page.locator('#carMode').click();await expect(page.locator('#routeVehicle')).toHaveValue('caravan');await expect(page.locator('#vehiclePicker')).toBeVisible();await expect(page.locator('#walkingOptions')).toBeHidden();await expect(page.locator('#routeModuleName')).toBeVisible();expect(await storage(page)).toBe(before);expect(calls).toEqual([]);expect(await page.evaluate(()=>window.gpsCalls)).toBe(0);
 await checkOverflow(page);await checkAccessibility(page,info,'cinq-modes');
});
for(const [button,dialog,places] of flows)test(`accès modes : ${button} au clavier, lieux communs et retour du focus`,async({page})=>{
 const calls=await setup(page,{heavy:true}),before=await storage(page);await page.locator('#start').fill('Gare de Grenoble');await page.locator('#end').fill('Place Victor Hugo Grenoble');
 await page.locator('#'+button).focus();await page.keyboard.press('Enter');await expect(page.locator('#'+dialog)).toBeVisible();
 if(places){await expect(page.locator('#'+places)).toContainText('Gare de Grenoble');await expect(page.locator('#'+places)).toContainText('Place Victor Hugo Grenoble')}
 else{await expect(page.locator('#bikeTripStart')).toHaveValue('Gare de Grenoble');await expect(page.locator('#bikeTripEnd')).toHaveValue('Place Victor Hugo Grenoble')}
 expect(calls).toEqual([]);await page.keyboard.press('Escape');await expect(page.locator('#'+dialog)).toBeHidden();await expect(page.locator('#'+button)).toBeFocused();await expect(page.locator('#routeVehicle')).toHaveValue('caravan');await expect(page.locator('#summary')).toBeHidden();expect(await storage(page)).toBe(before);expect(calls).toEqual([]);
});
test('accès modes : un trajet calculé est conservé à la réouverture des accès autonomes',async({page})=>{
 const calls=await setup(page);await road(page);const summary=await page.locator('#summary').textContent(),path=await page.locator('#routeLine').getAttribute('d'),n=calls.length;
 await page.locator('#carMode').click();await expect(page.locator('#summary')).toHaveText(summary);
 for(const [button,dialog] of flows){await page.locator('#'+button).click();await expect(page.locator('#'+dialog)).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#summary')).toHaveText(summary);await expect(page.locator('#routeLine')).toHaveAttribute('d',path)}
 expect(calls).toHaveLength(n);await page.locator('#walkMode').click();await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#status')).toContainText('Calculer un nouveau trajet');expect(calls).toHaveLength(n);
});
test('accès modes : commande active protégée, annulation libère les cinq accès',async({page})=>{
 await setup(page);let held;await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>{held=r});await page.locator('#goBtn').click();await expect.poll(()=>!!held).toBe(true);for(const id of ids)await expect(page.locator('#'+id)).toBeDisabled();await page.locator('#cancelTripBtn').click();for(const id of ids)await expect(page.locator('#'+id)).toBeEnabled();await held.abort().catch(()=>{});await expect(page.locator('#summary')).toBeHidden();await page.locator('#walkMode').click();await expect(page.locator('#routeModeHeading')).toHaveText('Trajet à pied');
});
test('accès modes : fermeture pendant une résolution vélo, réponse tardive sans changement du mode',async({page})=>{
 await page.addInitScript(()=>{const f=window.fetch;window.fetch=(u,o)=>f(u,String(u).includes('/geocodage/')?{...o,signal:undefined}:o)});
 const calls=await setup(page);let held;await page.route('https://data.geopf.fr/geocodage/search?**',r=>{held=r});await page.locator('#cycleBtn').click();await page.locator('#cycleSearch').click();await expect.poll(()=>!!held).toBe(true);await page.keyboard.press('Escape');await expect(page.locator('#cycleBtn')).toBeFocused();await page.locator('#walkMode').click();await held.fulfill({json:{type:'FeatureCollection',features:[]}});await expect(page.locator('#cycleDialog')).toBeHidden();await expect(page.locator('#routeModeHeading')).toHaveText('Trajet à pied');await expect(page.locator('#summary')).toBeHidden();expect(calls.filter(u=>u.includes('/route/v1'))).toEqual([]);
});
test('accès modes : erreur des lieux réparable depuis le mode marche',async({page})=>{
 const calls=await setup(page);await page.locator('#walkMode').click();await page.locator('#start').fill('');await page.locator('#goBtn').click();await expect(page.locator('#tripValidation')).toContainText('Renseigner le lieu de départ');await page.locator('#tripValidationList button').first().click();await expect(page.locator('#start')).toBeFocused();expect(calls).toEqual([]);await page.locator('#start').fill('Lyon');await expect(page.locator('#tripValidation')).toBeHidden();await expect(page.locator('#walkMode')).toHaveAttribute('aria-pressed','true');
});
test('accès modes : commandes accessibles en paysage, texte agrandi et petit écran',async({page},info)=>{
 await setup(page);await page.locator('.mode-access').scrollIntoViewIfNeeded();await capture(page,info,'modes-preparation');
 await page.setViewportSize({width:844,height:390});await page.addStyleTag({content:'html{font-size:200%}'});await page.locator('.mode-access').scrollIntoViewIfNeeded();await checkOverflow(page);await capture(page,info,'modes-paysage-texte-agrandi');
 for(const id of ids){const button=page.locator('#'+id);await reachable(button);const box=await button.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44)}
 await page.locator('#cycleBtn').click();await expect(page.locator('#cycleDialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#cycleBtn')).toBeFocused();await checkAccessibility(page,info,'modes-texte-agrandi');
});
