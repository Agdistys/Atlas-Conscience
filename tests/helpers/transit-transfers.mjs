import fs from 'node:fs';
export const transitPlanPattern='https://data.mobilites-m.fr/api/routers/default/plan?**';
export function transferPlan({onlyTransfers=false,arrive=false}={}){
 const d=JSON.parse(fs.readFileSync('tests/fixtures/transit/'+(arrive?'arrive':'depart')+'.json'));
 const item=d.plan.itineraries.find(x=>x.legs.some(l=>l.mode==='TRAM')),two=structuredClone(item),i=two.legs.findIndex(l=>l.mode==='TRAM'),l=two.legs[i],midTime=Math.floor((l.startTime+l.endTime)/2000)*1000,mid={...l.from,name:'Correspondance simulée',lat:(l.from.lat+l.to.lat)/2,lon:(l.from.lon+l.to.lon)/2,stopId:'SEM:TEST'};
 const a={...l,to:mid,endTime:midTime,duration:(midTime-l.startTime)/1000,distance:l.distance/2,legGeometry:null},b={...l,from:mid,startTime:midTime,duration:(l.endTime-midTime)/1000,distance:l.distance/2,routeShortName:'B',tripId:l.tripId+'-test',legGeometry:null};
 two.legs.splice(i,1,a,b);two.transfers=0;d.plan.itineraries=onlyTransfers?[two]:[two,item];return d;
}
