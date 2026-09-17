const lyon={lat:'45.7640',lon:'4.8357',display_name:'Lyon, France'};
const valence={lat:'44.9334',lon:'4.8924',display_name:'Valence, France'};

function json(route, body){
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
}

export async function mockDragonRoute(page){
  await page.clock.setFixedTime(new Date('2026-09-17T10:00:00Z'));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === 'http://127.0.0.1:4173' ? route.continue() : route.abort();
  });
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.route('https://tile.openstreetmap.org/**',route=>route.abort());

  await page.route('https://nominatim.openstreetmap.org/search?**',async route=>{
    const url=new URL(route.request().url());
    const q=(url.searchParams.get('q')||'').toLowerCase();
    await json(route,[q.includes('valence')?valence:lyon]);
  });

  await page.route('https://router.project-osrm.org/route/v1/driving/**',route=>json(route,{
    code:'Ok',
    routes:[{
      distance:104000,
      duration:3900,
      geometry:{type:'LineString',coordinates:[
        [4.8357,45.7640],[4.8550,45.55],[4.8750,45.25],[4.8924,44.9334]
      ]}
    },...(new URL(route.request().url()).searchParams.get('alternatives')==='true'?[{
      distance:118000,duration:4600,
      geometry:{type:'LineString',coordinates:[[4.8357,45.7640],[5.08,45.55],[5.03,45.25],[4.8924,44.9334]]}
    }]:[])]
  }));

  await page.route('https://router.project-osrm.org/table/v1/driving/**', route => {
    const coords = new URL(route.request().url()).pathname.split('/').at(-1).split(';');
    const km = coords.map((_, i) => i === 0 ? 0 : i === coords.length - 1 ? 104 : Number(coords[i].split(',')[1]) > 45.3 ? 50 : 62);
    const distances = km.map((a, i) => km.map((b, j) => i === j ? 0 : (Math.abs(a-b) + (i > 0 && i < km.length-1 || j > 0 && j < km.length-1 ? 1 : 0))*1000));
    return json(route, { code: 'Ok', distances, durations: distances.map(row => row.map(value => value/26)) });
  });

  await page.route('https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?**',route=>json(route,{
    total_count:2,
    results:[
      {id:'A',adresse:'1 route test',cp:'26000',ville:'Valence',geom:[45.40,4.87],e10_prix:1.72,e10_maj:'2026-09-16T18:00:00+00:00',e10_rupture_type:null,horaires_automate_24_24:'Oui',services_service:['Station de gonflage','Lavage automatique'],horaires:JSON.stringify({jour:[{'@nom':'Lundi','@ferme':'0',horaire:[{'@ouverture':'08:00','@fermeture':'12:00'},{'@ouverture':'14:00','@fermeture':'18:00'}]},{'@nom':'Mardi','@ferme':'1'},{'@nom':'Mercredi'}]})},
      {id:'B',adresse:'2 route test',cp:'26000',ville:'Valence',geom:[45.20,4.88],e10_prix:1.66,e10_maj:'2026-09-16T18:00:00+00:00',e10_rupture_type:null}
    ]
  }));
}
