import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
const core=(await readFile(new URL('core.mjs',root),'utf8')).replace(/^export /gm,'');
const app=await readFile(new URL('app.js',root),'utf8');
const template=await readFile(new URL('template.html',root),'utf8');
const script=`${core}\n${app}`.replace(/<\/script/gi,'<\\/script');
await writeFile(new URL('../APP-Ancrage_aMi_V5.html',root),template.replace('<!-- APP_SCRIPT -->',`<script>\n(()=>{\n${script}\n})();\n</script>`));
