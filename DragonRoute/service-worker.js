// Static interface only. Personal records stay in localStorage, never in this cache.
const PREFIX="dragonroute-shell:"+encodeURIComponent(self.registration.scope)+":";
// BEGIN SHELL MANIFEST
const RELEASE="29-9c12e57e0c3ecffd";
const SHELL=[
  {
    "path": "./",
    "integrity": "sha256-ZhqyZrl7hkqGMW21yy6rxwUZM/WQyPEKVr2gfYIWfcE="
  },
  {
    "path": "./index.html",
    "integrity": "sha256-ZhqyZrl7hkqGMW21yy6rxwUZM/WQyPEKVr2gfYIWfcE="
  },
  {
    "path": "./style.css",
    "integrity": "sha256-dtSoGduJyi3sdxlURzJyFYcDv3qsHfWDuB1ciQD33lY="
  },
  {
    "path": "./config.js",
    "integrity": "sha256-+MDU/t5n/hlQjOq3baDbWm+LtPf6OnnGe1f144Bjyb4="
  },
  {
    "path": "./app.js",
    "integrity": "sha256-JZeeUZJNHDuEvcNFqiyPdSSl8NYEnsVOO6VaAJ7Dq3I="
  },
  {
    "path": "./manifest.webmanifest",
    "integrity": "sha256-W3Wg3PomxonEdJivfLKQXmdMaiuJ4tVlTfChchbkZDo="
  },
  {
    "path": "./icons/icon-192.png",
    "integrity": "sha256-VXE+NkNEmX+WuBvvvbVzAH8Jmj17tvACHHNzro0sQ2E="
  },
  {
    "path": "./icons/icon-512.png",
    "integrity": "sha256-e5AN6gCW/xPpjTH3y+984fSjrTDocYUVzZwIpOd38+o="
  }
];
// END SHELL MANIFEST
const CACHE=PREFIX+RELEASE;
const ROOT=new URL(self.registration.scope);
const assets=new Map(SHELL.map(a=>[new URL(a.path,ROOT).href,a]));

self.addEventListener("install",event=>{
  // Do not skip waiting: existing windows keep their complete current version.
  event.waitUntil((async()=>{
    const responses=await Promise.all(SHELL.map(async asset=>{
      const url=new URL(asset.path,ROOT).href;
      const response=await fetch(new Request(url,{cache:"reload",credentials:"omit",redirect:"error",integrity:asset.integrity}));
      if(!response.ok||response.type==="opaque")throw new Error("Interface unavailable: "+asset.path);
      return [url,response];
    }));
    const cache=await caches.open(CACHE);
    await Promise.all(responses.map(([url,response])=>cache.put(url,response)));
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    // Legacy unscoped caches may be shared by another installation: leave them intact.
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const u=new URL(request.url);
  if(u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;
  const navigation=request.mode==="navigate"&&(u.pathname===ROOT.pathname||u.pathname===new URL("index.html",ROOT).pathname);
  if(navigation)u.search="";
  else if(u.search||u.pathname===ROOT.pathname||u.pathname.endsWith("/index.html"))return;
  const asset=assets.get(u.href);
  if(!asset)return;
  // Missing entries fail instead of mixing releases or returning HTML as JS.
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(u.href)).then(response=>response||Response.error()));
});
