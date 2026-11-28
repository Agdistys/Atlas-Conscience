// Synthetic network, not a real road or tariff. Straight tolled axis plus a free detour.
import {detailedRoute,meters} from '../../server/selected-tolls/route-adapter.mjs';
export const points=Array.from({length:9},(_,i)=>[5+i*.001,45]);
export const time=Date.parse('2026-11-28T10:00:00Z');
export function rawRoute(coordinates,tolls,{at=time,graph='2026-11-01T00:00:00Z',categories=tolls.map(v=>v?2:0)}={}){
 const n=coordinates.length-1,distance=coordinates.slice(1).reduce((sum,p,i)=>sum+meters(coordinates[i],p),0),duration=distance/10;
 return {type:'FeatureCollection',metadata:{query:{profile:'driving-car'},engine:{graph_date:graph}},features:[{geometry:{type:'LineString',coordinates},properties:{summary:{distance,duration},segments:[{distance,duration,steps:[{type:11,name:'Route',instruction:'Départ',distance,duration,way_points:[0,n]},{type:10,name:'-',instruction:'Arrivée',distance:0,duration:0,way_points:[n,n]}]}],extras:{tollways:{values:tolls.map((v,i)=>[i,i+1,v])},waycategory:{values:categories.map((v,i)=>[i,i+1,v])}}}}]};
}
export function network(){
 const calls=[],state={now:time,context:{revision:'r1',coordinates:[points[0],points[8]],vehicle:'car',vehicleClass:'1',date:'2026-11-28',optimization:'fastest',avoid:['tollways']}};
 const calculate=async(input)=>{
  calls.push(structuredClone(input));const [a,b]=input.coordinates.map(c=>points.findIndex(p=>p[0]===c[0]&&p[1]===c[1]));if(a<0||b<=a)throw Error('Unknown fixture request');
  let coordinates=points.slice(a,b+1),tolls=points.slice(a,b).map((_,i)=>a+i>=2&&a+i<6?1:0);
  if(input.avoid.includes('tollways')&&tolls.some(Boolean)){coordinates=[points[a],[points[a][0],45.004],[points[b][0],45.004],points[b]];tolls=[0,0,0]}
  return detailedRoute(rawRoute(coordinates,tolls),new Date(state.now).toISOString());
 };
 return {calls,state,calculate,getContext:()=>structuredClone(state.context),now:()=>state.now};
}
