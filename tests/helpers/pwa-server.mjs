import http from 'node:http';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
import {shellFiles} from '../pwa-shell.mjs';
export async function pwaServer(){
 const files=new Map();for(const path of shellFiles)files.set(path,await fs.readFile(new URL('../../DragonRoute/'+(path==='./'?'index.html':path),import.meta.url)));
 const worker=await fs.readFile(new URL('../../DragonRoute/service-worker.js',import.meta.url),'utf8');
 const state={release:'A',corrupt:null,requests:[]};
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');state.requests.push(url.pathname+url.search);
  const preview=url.pathname.startsWith('/preview/');
  const path='./'+url.pathname.split('/').slice(2).join('/');
  const body=path==='./'||path==='./index.html'?Buffer.from(files.get('./index.html').toString().replace('<body>',`<body data-test-release="${state.release}"${preview?' data-preview="true"':''}>`)):files.get(path);
  let payload=body,type='application/octet-stream',status=200;
  if(path==='./service-worker.js'){
   const entries=shellFiles.map(p=>{const data=p==='./'||p==='./index.html'?Buffer.from(files.get('./index.html').toString().replace('<body>',`<body data-test-release="${state.release}">`)):files.get(p);return {path:p,integrity:'sha256-'+createHash('sha256').update(data).digest('base64')}});
   payload=worker.replace(/\/\/ BEGIN SHELL MANIFEST[\s\S]*?\/\/ END SHELL MANIFEST/,'// BEGIN SHELL MANIFEST\nconst RELEASE="test-'+state.release+'";\nconst SHELL='+JSON.stringify(entries)+';\n// END SHELL MANIFEST');type='text/javascript';
  }else if(!body){payload=JSON.stringify({message:'not cached',path:url.pathname});type='application/json';status=url.pathname.includes('/api')?200:404}
  else type=path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.webmanifest')?'application/manifest+json':path.endsWith('.png')?'image/png':'text/html';
  if(path===state.corrupt&&req.headers['sec-fetch-dest']==='empty')payload='broken payload';
  res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(payload);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {state,origin:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections()})};
}
