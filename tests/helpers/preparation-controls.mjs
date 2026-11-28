// Open the same native disclosure controls a user needs before interacting.
export async function preparationControl(page,id){
 const control=page.locator('#'+id);
 const parents=await control.evaluate(el=>{const ids=[];for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')ids.unshift(p.id);return ids});
 for(const id of parents){if(!id)continue;const details=page.locator('#'+id);if(!await details.evaluate(e=>e.open))await details.locator(':scope > summary').click()}
 return control;
}
// Expected, explicit last-mode write; all other saved data must remain byte-identical.
export function rememberedModeSnapshot(snapshot,mode){
 const data=JSON.parse(snapshot),key='dragonroute.profile.v4.public';
 const profile=data[key]?JSON.parse(data[key]):{version:4,vehicles:[],activeVehicleId:null,addresses:[],stations:[],folders:[],preferences:{defaultMode:'car',lastMode:null,theme:'day'}};
 profile.preferences.lastMode=mode;data[key]=JSON.stringify(profile);return JSON.stringify(data);
}
