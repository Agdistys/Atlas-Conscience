import {preparationControl} from '../helpers/preparation-controls.mjs';
import {test,expect} from '@playwright/test';
import {fixture,open,begin,fix,start,watches} from '../helpers/navigation.mjs';
import {capture,checkAccessibility} from '../helpers/inspection.mjs';
import {enlargeText,readingOverflow,target44} from '../helpers/reading-layout.mjs';

test('ergonomie : navigation basse, retour de focus et champs conservés',async({page},info)=>{
 const h=await fixture(page);const before=await page.locator('#start').inputValue();
 await expect(page.locator('#bottomNav button')).toHaveCount(4);
 for(const id of ['tripsTab','journalBtn','profileBtn','sourcesBtn'])await target44(page.locator('#'+id));
 await page.locator('#tripsTab').focus();
 for(const [button,dialog] of [['journalBtn','journalDialog'],['profileBtn','profileDialog'],['sourcesBtn','sourcesDialog']]){
  await page.keyboard.press('Tab');await expect(page.locator('#'+button)).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#'+dialog)).toBeVisible();await expect(page.locator('#'+button)).toHaveAttribute('aria-current','page');await page.keyboard.press('Escape');await expect(page.locator('#'+button)).toBeFocused();
 }
 await page.locator('#tripsTab').click();await expect(page.locator('#tripHeading')).toBeFocused();await expect(page.locator('#start')).toHaveValue(before);await expect(page.locator('#tripsTab')).toHaveAttribute('aria-current','page');
 await expect(page.locator('#carMode')).toContainText('🚘');await expect(page.locator('#walkMode')).toContainText('🚶');await expect(page.locator('#transitBtn')).toContainText('🚌');
 await capture(page,info,'navigation-basse');await checkAccessibility(page,info,'navigation-basse');expect(h.errors).toEqual([]);
});
test('ergonomie : texte doublé et bas du formulaire accessibles sous la barre',async({page},info)=>{
 await fixture(page);await enlargeText(page);await page.setViewportSize({width:360,height:800});await readingOverflow(page);
 await page.locator('#sheet footer a').scrollIntoViewIfNeeded();await page.locator('#sheet footer a').focus();
 await expect.poll(()=>page.locator('#sheet footer a').evaluate(e=>{const top=document.getElementById('bottomNav').getBoundingClientRect().top;return [...e.getClientRects()].every(r=>r.top>=0&&r.bottom<=top&&r.left>=0&&r.right<=innerWidth)})).toBe(true);
 const nav=await page.locator('#bottomNav').boundingBox();expect(nav.y+nav.height).toBeCloseTo(800,0);await capture(page,info,'navigation-basse-texte-double');await checkAccessibility(page,info,'navigation-basse-texte-double');
});
test('ergonomie : pause station repliée et réglages vocaux sans démarrer le GPS',async({page})=>{
 const h=await fixture(page);await expect(page.locator('#stopMinutes')).toBeHidden();await expect(page.locator('#stationPauseOptions')).not.toHaveAttribute('open','');
 await page.locator('#sourcesBtn').click();await page.locator('#settingsVoice').click();await expect(page.locator('#guidanceDialog')).toBeVisible();await expect(page.locator('#guidanceVoiceSelect')).toBeFocused();expect(await watches(page)).toBe(0);expect(h.calls).toHaveLength(1);await expect(page.locator('#guidanceAuto')).toHaveCount(0);await page.keyboard.press('Escape');await expect(page.locator('#sourcesBtn')).toBeFocused();
});
test('voix : choix local et débit essayés sans GPS ni voix distante',async({page})=>{
 await fixture(page);await page.evaluate(()=>{speechSynthesis.getVoices=()=>[{name:'Une',voiceURI:'one',lang:'fr-FR',localService:true},{name:'Deux',voiceURI:'two',lang:'fr-FR',localService:true},{name:'Distante',voiceURI:'cloud',lang:'fr-FR',localService:false}];speechSynthesis.speak=u=>gpsTest.spoken.push({name:u.voice.name,rate:u.rate,text:u.text})});
 await open(page);await expect(page.locator('#guidanceVoiceSelect option')).toHaveCount(3);await page.locator('#guidanceVoiceSelect').selectOption('two');await page.locator('#guidanceVoiceRate').selectOption('1.1');await page.locator('#guidanceVoiceTest').click();expect(await page.evaluate(()=>gpsTest.spoken)).toEqual([{name:'Deux',rate:1.1,text:'Dans deux cents mètres, tournez à droite. Puis continuez tout droit.'}]);expect(await watches(page)).toBe(0);
});
test('voix : réglage en cours de guidage interrompt puis reprise volontaire',async({page})=>{
 await fixture(page);await begin(page);await fix(page,start);await page.locator('#guidanceSettings > summary').click();await page.locator('#guidanceVoiceRate').selectOption('0.9');await expect(page.locator('#guidanceStatus')).toContainText('pause pendant le réglage vocal');expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);expect(await watches(page)).toBe(1);await page.locator('#guidanceStart').click();expect(await watches(page)).toBe(2);
});
test('voix : unités prononcées et absence de la voix choisie sans substitution distante',async({page})=>{
 await fixture(page);await open(page);await page.locator('#guidanceVoiceSelect').selectOption('fr-FR|Locale');await page.locator('#guidanceVoice').check();await page.locator('#guidanceStart').click();await expect.poll(()=>watches(page)).toBe(1);await fix(page,start);expect(await page.evaluate(()=>gpsTest.spoken[0].text)).toMatch(/^Dans 390 mètres, /);
 await page.locator('#guidancePause').click();await page.locator('#guidanceClose').click();await page.evaluate(()=>speechSynthesis.getVoices=()=>[{name:'Distante',lang:'fr-FR',localService:false}]);await open(page);await expect(page.locator('#guidanceVoiceTest')).toBeDisabled();await expect(page.locator('#guidanceVoice')).toBeDisabled();
});

test('ergonomie : le focus remonte au-dessus de la barre après un défilement natif incomplet',async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:640});const target=await preparationControl(page,'bikesBtn');await page.locator('#start').focus();
 await target.evaluate(e=>{const r=e.getBoundingClientRect();window.scrollTo(0,scrollY+r.bottom-innerHeight+12);e.focus({preventScroll:true})});
 await expect(target).toBeFocused();await expect.poll(()=>target.evaluate(e=>{const r=e.getBoundingClientRect(),bar=document.getElementById('bottomNav').getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.top>=0&&r.bottom<bar.top&&(hit===e||e.contains(hit))})).toBe(true);
 // A pointer press near the bar must not move the control between down and up.
 await page.locator('#start').focus();const transit=page.locator('#transitBtn');
 // Let the keyboard focus correction finish before simulating a later manual scroll.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await transit.evaluate(e=>{const r=e.getBoundingClientRect(),bar=document.getElementById('bottomNav').getBoundingClientRect();window.scrollBy(0,r.bottom-bar.top-4)});
 // Reproduce a browser that keeps the input focused when a button is pressed.
 await transit.evaluate(e=>e.addEventListener('mousedown',event=>event.preventDefault(),{once:true}));
 const box=await transit.boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThan(640);
 expect(await transit.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e===hit||e.contains(hit)})).toBe(true);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(100);
 await expect(page.locator('#start')).toBeFocused();const held=await transit.boundingBox();expect(held.y).toBeCloseTo(box.y,1);await page.mouse.up();await expect(page.locator('#transitDialog')).toBeVisible();await page.keyboard.press('Escape');
});
