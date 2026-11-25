import {test,expect} from '@playwright/test';
import {fixture,open,begin,fix,offroute,start,end,reply,road,watches} from '../helpers/navigation.mjs';
import {checkAccessibility,capture} from '../helpers/inspection.mjs';
import {enlargeText,readingOverflow} from '../helpers/reading-layout.mjs';
test('guidage : démarrage volontaire, progression, pause et préparation intacte',async({page},info)=>{
 const ctx=await fixture(page,{leaflet:true});expect(await watches(page)).toBe(0);await open(page);expect(ctx.calls).toHaveLength(1);expect(await watches(page)).toBe(0);await page.locator('#guidanceStart').click();await expect.poll(()=>watches(page)).toBe(1);expect(ctx.calls.at(-1)).toContain('steps=true');
 await fix(page,start);await expect(page.locator('#guidanceInstruction')).toContainText('gauche');await expect(page.locator('#guidanceDistance')).toContainText('390 m');await expect(page.locator('#guidanceRemaining')).toContainText('km restants');await expect(page.locator('#guidanceMap .leaflet-interactive')).toHaveCount(3);await expect(page.locator('#guidanceMap .leaflet-overlay-pane svg')).toBeVisible();const marker=await page.locator('#guidanceMap .leaflet-interactive').last().boundingBox(),map=await page.locator('#guidanceMap').boundingBox();expect(marker.x+marker.width/2).toBeGreaterThan(map.x);expect(marker.x+marker.width/2).toBeLessThan(map.x+map.width);await capture(page,info,'guidage-position');
 await page.locator('#guidancePause').click();expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);await fix(page,end,{seconds:30,watch:0});await expect(page.locator('#guidanceInstruction')).toHaveText('Guidage en pause');await page.locator('#guidanceStart').click();await expect.poll(()=>watches(page)).toBe(2);await fix(page,[5.005,45.002],{seconds:60});await expect(page.locator('#guidanceInstruction')).toContainText('Destination');await page.locator('#guidanceClose').click();await expect(page.locator('#guidanceOpen')).toBeFocused();expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0,1]);expect(await page.evaluate(()=>({storage:JSON.stringify({...localStorage}),route:navTest.route()}))).toEqual(ctx.before);expect(ctx.errors).toEqual([]);
});
test('guidage : clavier, texte doublé et schéma sans fond restent utilisables',async({page},info)=>{
 const ctx=await fixture(page);await begin(page);await fix(page,start);await page.setViewportSize({width:360,height:640});await enlargeText(page);await expect(page.locator('#guidanceFallback svg')).toBeVisible();await readingOverflow(page);await checkAccessibility(page,info,'guidage-agrandi');await capture(page,info,'guidage-agrandi');await page.keyboard.press('Escape');await expect(page.locator('#guidanceDialog')).toBeHidden();await expect(page.locator('#guidanceOpen')).toBeFocused();expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);expect(ctx.errors).toEqual([]);
});
test('guidage : IGN conserve autoroutes exclues et manœuvres du même trajet',async({page})=>{
 const ctx=await fixture(page,{ign:true});await begin(page);const p=new URL(ctx.calls.at(-1)).searchParams;expect(p.get('getSteps')).toBe('true');expect(p.get('profile')).toBe('car');expect(p.get('constraints')).toContain('autoroute');await fix(page,start);await expect(page.locator('#guidanceInstruction')).toContainText('gauche');await offroute(page);await page.locator('#guidanceRecalculate').click();await expect(page.locator('#guidanceSummary')).toContainText('recalculé');const q=new URL(ctx.calls.at(-1)).searchParams;expect(q.get('constraints')).toBe(p.get('constraints'));expect(q.get('optimization')).toBe(p.get('optimization'));expect(q.get('start')).toBe('5.02,45.02');expect(ctx.errors).toEqual([]);
});
for(const kind of ['tracé modifié','manœuvre absente','accès éloigné','panne','quota'])test('guidage : '+kind+' refuse le suivi sans changer la préparation',async({page})=>{
 const ctx=await fixture(page);ctx.control.reply=r=>{const d=reply(r.request().url());if(kind==='tracé modifié')d.routes[0].geometry.coordinates[1][0]+=.01;if(kind==='manœuvre absente')delete d.routes[0].legs[0].steps;if(kind==='accès éloigné')d.waypoints[0].location=[1,1];return r.fulfill({status:kind==='panne'?503:kind==='quota'?429:200,json:d})};
 await open(page);await page.locator('#guidanceStart').click();await expect(page.locator('#guidanceStart')).toBeEnabled();await expect(page.locator('#guidanceStatus')).not.toHaveText('Le GPS n’est pas activé.');expect(await watches(page)).toBe(0);expect(ctx.calls).toHaveLength(2);expect(await page.evaluate(()=>navTest.route())).toBe(ctx.before.route);expect(ctx.errors).toEqual([]);
});
test('guidage : position imprécise, périmée et refus GPS retirent la consigne',async({page})=>{
 await fixture(page);await begin(page);await fix(page,start);await fix(page,[5.002,45],{seconds:1,accuracy:80});await expect(page.locator('#guidanceStatus')).toContainText('imprécise');await expect(page.locator('#guidanceDistance')).toBeEmpty();await fix(page,start,{seconds:2});await page.clock.setFixedTime(new Date('2026-09-17T10:00:20Z'));await expect(page.locator('#guidanceStatus')).toContainText('ancienne');await page.evaluate(()=>gpsTest.callbacks[0].fail({code:1}));await expect(page.locator('#guidanceStatus')).toContainText('refusé');expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);
});
test('guidage : arrière-plan interrompt et reprise reste volontaire',async({page})=>{
 await fixture(page);await begin(page);await fix(page,start);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await expect(page.locator('#guidanceStatus')).toContainText('arrière-plan');expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});expect(await watches(page)).toBe(1);await page.locator('#guidanceStart').click();expect(await watches(page)).toBe(2);
});
test('guidage : écart confirmé, recalcul volontaire et budget conservé',async({page})=>{
 const ctx=await fixture(page);await begin(page);await fix(page,start);await offroute(page);await expect(page.locator('#guidanceStatus')).toContainText('Écart');expect(ctx.calls).toHaveLength(2);await page.locator('#guidanceRecalculate').click();await expect(page.locator('#guidanceSummary')).toContainText('budgets initiaux conservés');expect(ctx.calls).toHaveLength(3);expect(ctx.calls.at(-1)).toContain('5.02,45.02;5.005,45.005');expect(await page.evaluate(()=>navTest.route())).toBe(ctx.before.route);await fix(page,[5.02,45.02],{seconds:8});await expect(page.locator('#guidanceStatus')).toContainText('Position suivie');
});
test('guidage : recalcul automatique choisi, panne sans répétition automatique',async({page})=>{
 const ctx=await fixture(page);await open(page);await page.locator('#guidanceAuto').check();await page.locator('#guidanceStart').click();await expect.poll(()=>watches(page)).toBe(1);await fix(page,start);ctx.control.reply=r=>r.fulfill({status:503,json:{}});await offroute(page);await expect(page.locator('#guidanceStatus')).toContainText('Recalcul impossible');expect(ctx.calls).toHaveLength(3);await fix(page,[5.02,45.02],{seconds:50});await expect(page.locator('#guidanceRecalculate')).toBeVisible();expect(ctx.calls).toHaveLength(3);ctx.control.reply=r=>r.fulfill({json:reply(r.request().url())});await page.locator('#guidanceRecalculate').click();await expect(page.locator('#guidanceSummary')).toContainText('recalculé');expect(ctx.calls).toHaveLength(4);
});
test('guidage : réponse tardive après fermeture ne déclenche aucun GPS',async({page})=>{
 const ctx=await fixture(page);let release;ctx.control.reply=async r=>{await new Promise(ok=>release=ok);await r.fulfill({json:reply(r.request().url())}).catch(()=>{})};await open(page);await page.locator('#guidanceStart').click();await expect.poll(()=>!!release).toBe(true);await page.locator('#guidanceClose').click();release();expect(await watches(page)).toBe(0);await expect(page.locator('#guidanceDialog')).toBeHidden();expect(ctx.errors).toEqual([]);
});
test('guidage : changement du contexte invalide le suivi et la reprise',async({page})=>{
 await fixture(page);await begin(page);await fix(page,start);await page.locator('#end').evaluate(e=>e.value='Autre lieu');await expect(page.locator('#guidanceStatus')).toContainText('modifiés');expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);await expect(page.locator('#guidanceStart')).toBeDisabled();
});
test('guidage : arrivée confirmée termine le suivi',async({page})=>{
 await fixture(page);await begin(page);await fix(page,end);await fix(page,end,{seconds:3});await expect(page.locator('#guidanceInstruction')).toHaveText('Arrivée');await expect(page.locator('#guidanceStart')).toBeHidden();expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);
});
test('guidage : voix locale facultative et maintien écran libéré',async({page})=>{
 await fixture(page);await open(page);await page.locator('#guidanceVoice').check();await page.locator('#guidanceStart').click();await expect.poll(()=>watches(page)).toBe(1);await fix(page,start);await fix(page,start,{seconds:1});expect(await page.evaluate(()=>gpsTest.spoken)).toHaveLength(1);expect(await page.evaluate(()=>gpsTest.spoken[0].local)).toBe(true);await expect(page.locator('#guidanceScreenNote')).toContainText('maintenu');await page.locator('#guidancePause').click();expect(await page.evaluate(()=>gpsTest.released)).toBe(1);
});
test('guidage : voix distante seule laisse le guidage visuel disponible',async({page})=>{
 await fixture(page);await page.evaluate(()=>speechSynthesis.getVoices=()=>[{localService:false,lang:'fr-FR'}]);await open(page);await expect(page.locator('#guidanceVoice')).toBeDisabled();await page.locator('#guidanceStart').click();await expect.poll(()=>watches(page)).toBe(1);await fix(page,start);expect(await page.evaluate(()=>gpsTest.spoken)).toHaveLength(0);await expect(page.locator('#guidanceInstruction')).toContainText('gauche');
});
test('guidage : étape station respectée, reprise puis recalcul gardent la destination',async({page})=>{
 const ctx=await fixture(page),station=[5.002,45.002],via=road([start,station,end]);
 // Isolate the navigation integration contract using an already confirmed station.
 await page.evaluate(({via,station})=>{navTest.station(via,station)},{via,station});
 await begin(page);expect(ctx.calls.at(-1)).toContain('5.002,45.002');await fix(page,station);await fix(page,station,{seconds:3});await expect(page.locator('#guidanceContinue')).toBeVisible();expect(await watches(page)).toBe(1);await page.locator('#guidanceContinue').click();expect(await watches(page)).toBe(2);await fix(page,station,{seconds:4});for(const seconds of [5,8,11])await fix(page,[5.02,45.02],{seconds});await page.locator('#guidanceRecalculate').click();await expect(page.locator('#guidanceSummary')).toContainText('recalculé');expect(ctx.calls.at(-1)).toContain('5.02,45.02;5.005,45.005');expect(ctx.calls.at(-1)).not.toContain('5.002,45.002;');expect(ctx.errors).toEqual([]);
});


test('guidage : parcours adopté avec deux arrêts garde tous les points',async({page})=>{
 const ctx=await fixture(page),points=[start,[5.001,45.001],[5.003,45.003],end];await page.evaluate(({route,points})=>navTest.multi(route,points),{route:road(points),points});await begin(page);expect(ctx.calls.at(-1)).toContain('5,45;5.001,45.001;5.003,45.003;5.005,45.005');await fix(page,points[1]);await fix(page,points[1],{seconds:3});await expect(page.locator('#guidanceContinue')).toBeVisible();await page.locator('#guidanceContinue').click();await fix(page,points[2],{seconds:40});await fix(page,points[2],{seconds:43});await expect(page.locator('#guidanceContinue')).toBeVisible();expect(ctx.errors).toEqual([]);
});
test('guidage : délai du moteur borné et réponse tardive sans suivi',async({page})=>{
 const ctx=await fixture(page);await page.clock.install({time:new Date('2026-09-17T10:00:00Z')});let release;ctx.control.reply=async r=>{await new Promise(ok=>release=ok);await r.fulfill({json:reply(r.request().url())}).catch(()=>{})};await open(page);await page.locator('#guidanceStart').click();await expect.poll(()=>!!release).toBe(true);await page.clock.fastForward(25001);await expect(page.locator('#guidanceStart')).toBeEnabled();expect(await watches(page)).toBe(0);release();await expect(page.locator('#guidancePause')).toBeHidden();expect(ctx.calls).toHaveLength(2);
});
test('guidage : délai GPS suspend les annonces puis une position fiable les rétablit',async({page})=>{
 await fixture(page);await begin(page);await fix(page,start);await page.evaluate(()=>gpsTest.callbacks[0].fail({code:3}));await expect(page.locator('#guidanceStatus')).toContainText('à temps');await expect(page.locator('#guidanceDistance')).toBeEmpty();await fix(page,start,{seconds:2});await expect(page.locator('#guidanceInstruction')).toContainText('gauche');await page.locator('#guidanceClose').click();await fix(page,end,{seconds:40,watch:0});await expect(page.locator('#guidanceDialog')).toBeHidden();
});
test('guidage : arrivée pendant un recalcul annule son résultat tardif',async({page})=>{
 const ctx=await fixture(page);await begin(page);await fix(page,start);await offroute(page);let release;ctx.control.reply=async r=>{await new Promise(ok=>release=ok);await r.fulfill({json:reply(r.request().url())}).catch(()=>{})};await page.locator('#guidanceRecalculate').click();await expect.poll(()=>!!release).toBe(true);await fix(page,end,{seconds:40});await fix(page,end,{seconds:43});await expect(page.locator('#guidanceInstruction')).toHaveText('Arrivée');release();await expect(page.locator('#guidanceStart')).toBeHidden();expect(await page.evaluate(()=>gpsTest.cleared)).toEqual([0]);
});

test('guidage : accès depuis le parcours adopté et retour au même bouton',async({page})=>{
 const {setupMultiAdopt,adoptMulti}=await import('../helpers/multi-adopt.mjs');await setupMultiAdopt(page);await adoptMulti(page);const button=page.locator('[data-multi-active="guidance"]');await expect(page.locator('#sheet')).toBeHidden();await button.click();await expect(page.locator('#guidanceDialog')).toBeVisible();await expect(page.locator('#guidanceSummary')).not.toBeEmpty();await page.keyboard.press('Escape');await expect(button).toBeFocused();await expect(page.locator('#multiActiveBody')).toBeVisible();
});

test('guidage : maintien écran accordé après pause immédiatement libéré',async({page})=>{
 await fixture(page);await page.evaluate(()=>navigator.wakeLock.request=()=>new Promise(ok=>window.resolveWake=()=>ok({release:async()=>gpsTest.released++,addEventListener(){}})));await begin(page);await page.locator('#guidancePause').click();await page.evaluate(()=>resolveWake());await expect.poll(()=>page.evaluate(()=>gpsTest.released)).toBe(1);await expect(page.locator('#guidanceScreenNote')).not.toContainText('Écran maintenu');
});

test('guidage : retour en arrière confirmé propose un nouveau trajet',async({page})=>{
 await fixture(page);await begin(page);await fix(page,[5.005,45.003]);for(const seconds of [1,4,7])await fix(page,[5.003,45],{seconds});await expect(page.locator('#guidanceStatus')).toContainText('Retour en arrière');await page.locator('#guidanceRecalculate').click();await expect(page.locator('#guidanceSummary')).toContainText('recalculé');
});
