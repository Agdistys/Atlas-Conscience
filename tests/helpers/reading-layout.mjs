import {expect} from '@playwright/test';
export const readingSizes={'desktop-1440':{width:1024,height:768},'tablet-768':{width:768,height:1024},'mobile-390':{width:844,height:390},'mobile-360':{width:360,height:800}};
export async function enlargeText(page){await page.evaluate(()=>document.documentElement.style.fontSize='200%')}
export async function readingOverflow(page){
 const report=await page.evaluate(()=>{
  const roots=[document.documentElement,document.querySelector('#sheet'),...document.querySelectorAll('dialog[open]')].filter(e=>e&&e.scrollWidth>e.clientWidth+1);
  return {overflow:roots.map(e=>({id:e.id||e.tagName,width:e.clientWidth,scroll:e.scrollWidth})),details:roots.flatMap(root=>{
   const bounds=root.getBoundingClientRect();
   return [...root.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.right>bounds.right+1||r.left<bounds.left-1||e.scrollWidth>e.clientWidth+1)}).slice(0,35).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.id,tag:e.tagName,class:e.className,text:e.textContent.slice(0,90),width:r.width,right:r.right,scroll:e.scrollWidth,display:s.display,minWidth:s.minWidth,grid:s.gridTemplateColumns,wrap:s.overflowWrap}});
  })};
 });
 expect(report.overflow,JSON.stringify(report.details,null,2)).toEqual([]);
}
export async function reachable(locator,{focus=true,scroll=true}={}){
 if(scroll)await locator.scrollIntoViewIfNeeded();if(focus)await locator.focus();
 await expect.poll(()=>locator.evaluate(e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y),dialog=e.closest('dialog'),heading=dialog?.querySelector('.dialog-heading'),header=heading?.getBoundingClientRect();return r.width>=1&&r.height>=1&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1&&(hit===e||e.contains(hit))&&(!header||heading.contains(e)||r.top>=header.bottom-1)})).toBe(true);
}
// DOM rectangles can subtract fractional scroll coordinates (Firefox: 43.999992 for 44 CSS px).
// Compare to 44 after rounding only the measurement noise at 1/10,000 CSS pixel.
export async function target44(locator){const r=await locator.boundingBox(),pixels=n=>Math.round(n*10000)/10000;expect(pixels(r.width)).toBeGreaterThanOrEqual(44);expect(pixels(r.height)).toBeGreaterThanOrEqual(44)}
