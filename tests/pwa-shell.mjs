import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../DragonRoute/',import.meta.url);
export const shellFiles=['./','./index.html','./style.css','./config.js','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
export function manifest(){
 const entries=shellFiles.map(path=>({path,integrity:'sha256-'+createHash('sha256').update(fs.readFileSync(new URL(path==='./'?'index.html':path,root))).digest('base64')}));
 const digest=createHash('sha256').update(JSON.stringify(entries)).digest('hex').slice(0,16);
 return 'const RELEASE="29-'+digest+'";\nconst SHELL='+JSON.stringify(entries,null,2)+';';
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const path=new URL('service-worker.js',root),source=fs.readFileSync(path,'utf8'),updated=source.replace(/\/\/ BEGIN SHELL MANIFEST[\s\S]*?\/\/ END SHELL MANIFEST/,'// BEGIN SHELL MANIFEST\n'+manifest()+'\n// END SHELL MANIFEST');
 if(process.argv.includes('--write'))fs.writeFileSync(path,updated);
 else if(source!==updated){console.error('Mettre à jour le manifeste : node tests/pwa-shell.mjs --write');process.exitCode=1}
}
