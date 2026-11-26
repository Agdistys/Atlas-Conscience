import {test,expect} from '@playwright/test';
import {fixture,open,begin,fix,start,watches} from '../helpers/navigation.mjs';
import {capture,checkAccessibility} from '../helpers/inspection.mjs';
import {enlargeText,readingOverflow,target44} from '../helpers/reading-layout.mjs';
const unchanged=async(page,h)=>{expect(await page.evaluate(()=>({storage:JSON.stringify({...localStorage}),route:navTest.route()}))).toEqual(h.before);expect(h.errors).toEqual([])};

test('guidage épuré : départ compact, aides volontaires et aucun GPS implicite',async({page},info)=>{
 const h=await fixture(page);await open(page,{settings:false});
 await expect(page.locator('#guidanceSetup')).toBeHidden();await expect(page.locator('#guidanceVoiceSelect')).toBeHidden();
 await expect(page.locator('#guidanceInstruction')).toHaveText('Prêt à partir');
 expect((await page.locator('#guidanceDialog').innerText()).split(/\s+/).length).toBeLessThan(65);
 await page.locator('#guidanceInfo > summary').focus();await page.keyboard.press('Enter');await expect(page.locator('#guidanceSetup')).toBeVisible();await expect(page.locator('#guidanceSummary')).toContainText('OSRM');
 await page.keyboard.press('Enter');await expect(page.locator('#guidanceSetup')).toBeHidden();expect(await watches(page)).toBe(0);expect(h.calls).toHaveLength(1);
 await checkAccessibility(page,info,'guidage-preparation-epuree');await unchanged(page,h);
});
test('guidage épuré : manœuvre, carte et commandes tiennent sur téléphone',async({page},info)=>{
 const h=await fixture(page,{leaflet:true});await page.setViewportSize({width:390,height:844});await begin(page);await fix(page,start);
 await expect(page.locator('#guidanceArrow')).toHaveText('↰');await expect(page.locator('#guidanceDistance')).toContainText('390 m');await expect(page.locator('#guidanceTripStats')).toBeVisible();await expect(page.locator('#guidanceGps')).toBeHidden();
 expect((await page.locator('#guidanceDialog').innerText()).split(/\s+/).length).toBeLessThan(80);
 for(const id of ['guidancePause','guidanceFuelOpen','guidanceFollow','guidanceRangeOpen','guidanceStop']){await target44(page.locator('#'+id));const r=await page.locator('#'+id).boundingBox();expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(844)}
 const map=await page.locator('#guidanceMap').boundingBox();expect(map.height).toBeGreaterThanOrEqual(250);await capture(page,info,'guidage-epure-android');await checkAccessibility(page,info,'guidage-epure-android');await unchanged(page,h);
});
test('guidage épuré : perte GPS et refus restent visibles sans flèche ni durée périmées',async({page})=>{
 const h=await fixture(page);await begin(page);await fix(page,start);await fix(page,start,{seconds:1,accuracy:100});
 await expect(page.locator('#guidanceDistance')).toBeEmpty();await expect(page.locator('#guidanceArrow')).toHaveText('⌖');await expect(page.locator('#guidanceTripStats')).toBeHidden();await expect(page.locator('#guidanceStatus')).toContainText('précis');expect((await page.locator('#guidanceStatus').boundingBox()).height).toBeGreaterThan(25);
 await page.evaluate(()=>gpsTest.callbacks.at(-1).fail({code:1}));await expect(page.locator('#guidanceStatus')).toContainText('refusé');await expect(page.locator('#guidanceStart')).toBeVisible();await expect(page.locator('#guidanceInfo')).not.toHaveAttribute('open','');await unchanged(page,h);
});
test('guidage épuré : voix accessible directement et panne annoncée hors des aides',async({page})=>{
 const h=await fixture(page);await open(page,{settings:false});await page.locator('#guidanceVoice').check();await page.evaluate(()=>speechSynthesis.speak=()=>{throw Error('audio indisponible')});await page.locator('#guidanceStart').click();await expect.poll(()=>watches(page)).toBe(1);await fix(page,start);
 await expect(page.locator('#guidanceAudioAlert')).toBeVisible();await expect(page.locator('#guidanceAudioAlert')).toContainText('interrompue');await expect(page.locator('#guidanceVoice')).not.toBeChecked();await expect(page.locator('#guidanceInstruction')).toContainText('gauche');await expect(page.locator('#guidanceVoiceSelect')).toBeHidden();await unchanged(page,h);
});
test('guidage épuré : aides et recentrage ne relancent pas le trajet',async({page})=>{
 const h=await fixture(page,{leaflet:true});await begin(page);await fix(page,start);const calls=h.calls.length;
 await page.locator('#guidanceInfo > summary').click();await expect(page.locator('#guidanceGps')).toContainText('±5 m');await expect(page.locator('#guidanceSteps li').first()).toBeVisible();await page.locator('#guidanceInfo > summary').click();
 await page.locator('#guidanceFollow').click();await expect(page.locator('#guidanceFollow')).toHaveAttribute('aria-pressed','true');expect(h.calls).toHaveLength(calls);expect(await watches(page)).toBe(1);await unchanged(page,h);
});
test('guidage épuré : paysage et texte doublé gardent aides et arrêt accessibles',async({page},info)=>{
 const h=await fixture(page);await begin(page);await fix(page,start);await page.setViewportSize({width:844,height:390});await enlargeText(page);
 await page.locator('#guidanceInfo > summary').click();await readingOverflow(page);await page.locator('#guidanceInfo li').last().scrollIntoViewIfNeeded();await expect(page.locator('#guidanceInfo li').last()).toBeVisible();await checkAccessibility(page,info,'guidage-epure-paysage');
 await page.locator('#guidanceStop').focus();await page.keyboard.press('Enter');await expect(page.locator('#guidanceOpen')).toBeFocused();expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);await unchanged(page,h);
});
test('guidage épuré : petit écran et texte doublé sans débordement',async({page},info)=>{
 const h=await fixture(page);await begin(page);await fix(page,start);await page.setViewportSize({width:360,height:640});await enlargeText(page);await page.locator('#guidanceSettings > summary').click();await readingOverflow(page);await capture(page,info,'guidage-epure-grand-texte');await checkAccessibility(page,info,'guidage-epure-grand-texte');await page.locator('#guidanceStop').click();await unchanged(page,h);
});
