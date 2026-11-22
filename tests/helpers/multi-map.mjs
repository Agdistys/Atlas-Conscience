import {expect} from '@playwright/test';
import {mockDragonRoute} from './dragonroute.mjs';
export function multiMapFixture({stations=2,meetings=false,name='Parcours de démonstration',id='multi-test',avoid=false}={}){
 const nodes=[{kind:'start',id:'start',name:'Lyon',point:[45.76,4.83]}];
 if(meetings)nodes.push({kind:'pickup',id:'pickup',name:'Prise en charge publique',point:[45.7,4.84]});
 for(let i=0;i<stations;i++)nodes.push({kind:'station',id:'station:'+i,name:'Station '+(i+1),point:[45.4,4.87],liters:5,pause:5,price:1.8,updated:'2026-09-16T12:00:00Z',receivedAt:'2026-09-17T09:00:00Z'});
 if(meetings)nodes.push({kind:'dropoff',id:'dropoff',name:'Dépose publique',point:[45,4.88]});
 nodes.push({kind:'end',id:'end',name:'Valence',point:[44.93,4.89]});
 const n=nodes.length-1;return {version:1,id,name,nodes,calculatedAt:'2026-09-17T09:00:00Z',savedAt:'2026-09-17T09:01:00Z',fuel:'E10',inputs:{cons:6.2,initial:20,capacity:60,reserve:30,referencePrice:1.8},routing:{provider:avoid?'ign':'osrm',vehicle:{type:'car'},optimization:avoid?'shortest':'fastest',avoid:avoid?['highways']:[]},reference:{distance:n*50000-5000,duration:n*2500-100},meeting:meetings?{distance:n*50000-5000,duration:n*2500-100,km:100,minutes:100}:null,route:{distance:n*50000,duration:n*2500,legs:Array.from({length:n},()=>({distance:50000,duration:2500})),geometry:{type:'LineString',coordinates:nodes.map(n=>[n.point[1],n.point[0]])},resourceVersion:null}};
}
export async function setupMultiMap(page,{leaflet=true,plans=[multiMapFixture()],origin='http://127.0.0.1:4173'}={}){
 await mockDragonRoute(page,{origin});if(leaflet)for(const [file,type] of [['leaflet.js','application/javascript'],['leaflet.css','text/css']])await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/'+file,r=>r.fulfill({path:'node_modules/leaflet/dist/'+file,contentType:type}));
 await page.addInitScript(plans=>{localStorage.setItem('dragonroute.multi-stops.v1.public',JSON.stringify({version:1,entries:plans}));localStorage.setItem('another-app','conserver')},plans);
 const calls={tiles:0,routing:0,external:0},errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('tile.openstreetmap.org'))calls.tiles++;if(/geocodage|\/route\/v1|navigation\/itineraire|api\/explore/.test(r.url()))calls.routing++;if(/www.google.com|www.waze.com/.test(r.url()))calls.external++});
 await page.goto(origin+'/DragonRoute/');await page.waitForLoadState('networkidle');await page.locator('#preparedBtn').click();await page.locator('#multiLibraryOpen').click();await page.locator('[data-multi-read="0"]').click();await expect(page.locator('#multiConfirmedBody')).toContainText('Lecture datée');return {calls,errors};
}
