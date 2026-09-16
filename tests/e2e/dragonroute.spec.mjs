import { test, expect } from '@playwright/test';

const lyon={lat:'45.7640',lon:'4.8357',display_name:'Lyon, France'};
const valence={lat:'44.9334',lon:'4.8924',display_name:'Valence, France'};

function json(route, body){
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
}

test.beforeEach(async ({page})=>{
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
    }]
  }));

  await page.route('https://router.project-osrm.org/table/v1/driving/**',route=>json(route,{
    code:'Ok',
    distances:[
      [0,50000,62000,104000],
      [50000,0,12000,56000],
      [62000,12000,0,45000],
      [104000,56000,45000,0]
    ],
    durations:[
      [0,1850,2300,3900],
      [1850,0,500,2100],
      [2300,500,0,1750],
      [3900,2100,1750,0]
    ]
  }));

  await page.route('https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?**',route=>json(route,{
    total_count:2,
    results:[
      {id:'A',adresse:'1 route test',cp:'26000',ville:'Valence',geom:[45.40,4.87],e10_prix:1.72,e10_maj:'2026-09-16T18:00:00+00:00',e10_rupture_type:null},
      {id:'B',adresse:'2 route test',cp:'26000',ville:'Valence',geom:[45.20,4.88],e10_prix:1.66,e10_maj:'2026-09-16T18:00:00+00:00',e10_rupture_type:null}
    ]
  }));
});

test('le moteur démarre même si Leaflet est indisponible',async ({page})=>{
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('/DragonRoute/');
  await expect(page.locator('#hJS')).toHaveText('JS ✓');
  await expect(page.locator('#status')).toContainText('Moteur chargé');
  await expect(page.locator('#hMap')).toContainText('fallback');
  expect(pageErrors).toEqual([]);
});

test('Lyon → Valence produit les trois lectures sans donnée fictive',async ({page})=>{
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('stations comparées',{timeout:15_000});
  await expect(page.locator('#hGeo')).toHaveText('géocodage ✓');
  await expect(page.locator('#hRoute')).toHaveText('routage ✓');
  await expect(page.locator('#hFuel')).toHaveText('carburants ✓');
  await expect(page.locator('#optimal')).toContainText('coût comparé');
  await expect(page.locator('#cheap')).toContainText('€/L');
  await expect(page.locator('#fast')).toContainText('min');
  await expect(page.locator('#testedCount')).not.toHaveText('0');
});
