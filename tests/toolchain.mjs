import fs from 'node:fs';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {chromium} from '@playwright/test';
import {inspectDependencies,validToolchain} from './dependency-contract.mjs';
fs.mkdirSync('quality',{recursive:true});fs.rmSync('quality/toolchain-status.json',{force:true});
const proof={schemaVersion:1,generatedAt:new Date().toISOString(),commit:process.env.INSPECTION_COMMIT||spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),node:process.versions.node,platform:`${os.platform()} ${os.release()} ${os.arch()}`,state:'passed',errors:[]};
let browser;
try {
 Object.assign(proof,inspectDependencies());
 if(proof.errors.length) throw Error('Dépendances incohérentes');
 const channel=process.env.PLAYWRIGHT_CHANNEL;
 if(channel&&channel!=='chrome') throw Error('Canal de navigateur non qualifié');
 browser=await chromium.launch({channel});
 proof.browser={engine:'chromium',channel:channel||'bundled',version:browser.version()};
} catch(error) {proof.errors.push(error.message)} finally {await browser?.close()}
if(!validToolchain(proof,proof.commit))proof.state='blocked';
fs.writeFileSync('quality/toolchain-status.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));process.exitCode=proof.state==='passed'?0:1;
