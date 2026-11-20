import {expect} from '@playwright/test';
export const readingSizes={'desktop-1440':{width:1024,height:768},'tablet-768':{width:768,height:1024},'mobile-390':{width:844,height:390},'mobile-360':{width:360,height:800}};
export async function enlargeText(page){await page.evaluate(()=>document.documentElement.style.fontSize='200%')}
export async function readingOverflow(page){
 expect(await page.evaluate(()=>[document.documentElement,document.querySelector('#sheet'),...document.querySelectorAll('dialog[open]')].filter(e=>e&&e.scrollWidth>e.clientWidth+1).map(e=>({id:e.id||e.tagName,width:e.clientWidth,scroll:e.scrollWidth})))).toEqual([]);
}
export async function reachable(locator,{focus=true,scroll=true}={}){
 if(scroll)await locator.scrollIntoViewIfNeeded();if(focus)await locator.focus();
 await expect.poll(()=>locator.evaluate(e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y),dialog=e.closest('dialog'),heading=dialog?.querySelector('.dialog-heading'),header=heading?.getBoundingClientRect();return r.width>=1&&r.height>=1&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1&&(hit===e||e.contains(hit))&&(!header||heading.contains(e)||r.top>=header.bottom-1)})).toBe(true);
}
export async function target44(locator){const r=await locator.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44)}
