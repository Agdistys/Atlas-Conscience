import fs from 'node:fs';
const files=['planner','route-adapter','navigation','session','client','dialog'],names=Object.fromEntries(files.map((f,i)=>[f,'module'+i]));
const chunks=[],exports=[];
for(const name of files){
 let source=fs.readFileSync('server/selected-tolls/'+name+'.mjs','utf8');
 const exposed=[...source.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(\w+)/g)].map(x=>x[1]);
 source=source.replace(/^import\s+\{([^}]+)\}\s+from\s+'\.\/([^']+)\.mjs';$/gm,(_,imports,dependency)=>{if(!names[dependency])throw Error('Unknown dependency');return `const {${imports}}=${names[dependency]};`}).replace(/\bexport\s+/g,'');
 if(/(^|\n)import\s/.test(source))throw Error('Unsupported import');
 chunks.push(`const ${names[name]}=(()=>{\n${source}\nreturn {${exposed.join(',')}};\n})();`);exports.push(names[name]);
}
const bundle='// BEGIN SELECTED TOLLS GENERATED\nconst selectedTollsCore=(()=>{\n'+chunks.join('\n')+'\nreturn Object.freeze(Object.assign({},'+exports.join(',')+'));\n})();\n// END SELECTED TOLLS GENERATED\n';
const file='DragonRoute/app.js',source=fs.readFileSync(file,'utf8'),pattern=/\/\/ BEGIN SELECTED TOLLS GENERATED\n[\s\S]*?\/\/ END SELECTED TOLLS GENERATED\n/;
if(process.argv.includes('--write')){const next=pattern.test(source)?source.replace(pattern,()=>bundle):source.replace('const $=id=>document.getElementById(id);\n',m=>m+bundle);if(next===source&&!pattern.test(source))throw Error('Insertion point missing');fs.writeFileSync(file,next)}
else if(!pattern.test(source)||source.match(pattern)[0]!==bundle)throw Error('Selected toll bundle is stale. Run node tests/build-selected-tolls.mjs --write');
console.log('Selected toll source bundle verified.');
