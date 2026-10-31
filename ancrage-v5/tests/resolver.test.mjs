import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{handle,resolveFacebook,extractCanonical} from '../worker/src/index.mjs';
import {normalize,makeEmbed} from '../core.mjs';
const share='https://www.facebook.com/share/v/1DVM55EzSR/';
const reel='https://www.facebook.com/reel/2197532477774605/';
const redirect=url=>new Response(null,{status:302,headers:{location:url}});
const html=s=>new Response(s,{headers:{'Content-Type':'text/html'}});
const request=(url,origin='https://agdistys.github.io',method='GET')=>new Request(`https://resolver.example${url}`,{method,headers:origin?{origin}:{}});
const bad=async(p,code)=>assert.rejects(p,e=>e.code===code);
test('real sample fixture: observed Location converts without visiting the login-walled Reel',async()=>{
  const calls=[];const info=await resolveFacebook(share,async(url,options)=>{calls.push(url);assert.equal(options.redirect,'manual');assert.equal(options.credentials,'omit');assert.equal(options.headers.Cookie,undefined);return redirect(reel+'?rdid=tracking&share_url=ignored');});
  assert.equal(info.url,reel);assert.equal(info.type,'Reel');assert.equal(info.evidence,'redirect');assert.equal(calls.length,1);
});
test('mobile host and fb.watch keep their meaning',()=>{assert.equal(normalize('https://m.facebook.com/share/r/abc/?mibextid=x').needsResolution,true);assert.equal(normalize('https://fb.watch/ABC/').url,'https://fb.watch/ABC/');});
test('video share does not imply video destination',async()=>{const r=await resolveFacebook(share,async()=>redirect('https://www.facebook.com/alice/posts/123/'));assert.equal(r.type,'Publication');});
test('direct formats are local; tracking removed; Instagram kept',async()=>{
  for(const value of [reel,'https://www.facebook.com/watch/?v=123&fbclid=x','https://m.facebook.com/alice/videos/123/','https://www.facebook.com/story.php?story_fbid=pfbidABC&id=12&ref=x','https://www.facebook.com/photo.php?fbid=123','https://www.facebook.com/groups/public/posts/12/']){
    const r=await resolveFacebook(value,()=>assert.fail('No network for direct URL'));assert.equal(r.evidence,'input');assert.ok(!r.url.includes('fbclid'));
  }
  assert.equal(normalize('https://www.instagram.com/reels/Ab_CD-123/?igsh=abc').url,'https://www.instagram.com/reel/Ab_CD-123/');
});
test('SSRF input is rejected before fetch',async()=>{
  for(const u of ['https://evil.example/','https://facebook.com.evil.example/share/v/x/','https://localhost/share/v/x/','https://127.0.0.1/','file:///etc/passwd','http://facebook.com/share/v/x/','https://x:y@facebook.com/share/v/x/','https://facebook.com:444/share/v/x/','https://foo.facebook.com/share/v/x/'])await bad(resolveFacebook(u,()=>assert.fail('No request allowed')),'invalid_url');
});
test('external redirects and credentials are rejected',async()=>{for(const url of ['https://evil.example/','http://facebook.com/reel/1/','https://user:pass@facebook.com/reel/1/','https://facebook.com:444/reel/1/'])await bad(resolveFacebook(share,async()=>redirect(url)),'unsafe_redirect');});
test('login next parameter is never treated as resolution',async()=>await bad(resolveFacebook(share,async()=>redirect('https://www.facebook.com/login/?next='+encodeURIComponent(reel))),'login_required'));
test('redirect loops and chain bounds',async()=>{
  await bad(resolveFacebook(share,async()=>redirect(share)),'redirect_loop');let count=0;
  await bad(resolveFacebook(share,async()=>redirect('https://www.facebook.com/share/v/x'+(++count)+'/')),'too_many_redirects');assert.equal(count,6);
});
test('relative redirects validated then resolved',async()=>assert.equal((await resolveFacebook(share,async()=>redirect('/reel/123/'))).url,'https://www.facebook.com/reel/123/'));
test('metadata supports attribute order and entities',async()=>{const r=await resolveFacebook(share,async()=>html('<head><meta content="https://www.facebook.com/watch/?v=123&amp;fbclid=x" property="og:url"></head>'));assert.equal(r.url,'https://www.facebook.com/watch/?v=123');assert.equal(r.evidence,'metadata');});
test('recommendations, scripts, comments and templates do not count',()=>{assert.equal(extractCanonical('<head><script>const x=\'<link rel="canonical" href="'+reel+'">\';</script><!-- <link rel="canonical" href="'+reel+'"> --></head><body><a href="'+reel+'">recommended</a><meta property="og:url" content="'+reel+'"></body>',share),null);});
test('conflicting metadata is refused',async()=>await bad(resolveFacebook(share,async()=>html('<head><link rel="canonical" href="'+reel+'"><meta property="og:url" content="https://www.facebook.com/reel/123/"></head>')),'ambiguous'));
test('no metadata means failure, not guessed ID',async()=>await bad(resolveFacebook(share,async()=>html('<body>Log in 2197532477774605</body>')),'unresolved'));
test('upstream HTTP errors and non-HTML',async()=>{await bad(resolveFacebook(share,async()=>new Response('',{status:429})),'rate_limited');await bad(resolveFacebook(share,async()=>new Response('',{status:403})),'upstream_blocked');await bad(resolveFacebook(share,async()=>new Response('{}',{headers:{'Content-Type':'application/json'}})),'unexpected_content');});
test('bounded body even without content-length',async()=>await bad(resolveFacebook(share,async()=>html('x'.repeat(524289))),'response_too_large'));
test('deadline also covers an upstream that never resolves',async()=>await bad(resolveFacebook(share,()=>new Promise(()=>{}),20),'timeout'));
test('network errors do not expose internals',async()=>await bad(resolveFacebook(share,async()=>{throw new Error('private details');}),'network_error'));
test('CORS is restricted, including null origin',async()=>{for(const origin of ['https://evil.example','null']){const r=await handle(request('/resolve?url='+encodeURIComponent(share),origin),{},()=>assert.fail());assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);}});
test('health does not call Facebook; preflight and methods',async()=>{const h=await handle(request('/health'),{},()=>assert.fail());assert.equal((await h.json()).service,'ancrage-ami-resolver');assert.equal(h.headers.get('Access-Control-Allow-Origin'),'https://agdistys.github.io');assert.equal((await handle(request('/resolve',undefined,'OPTIONS'))).status,204);assert.equal((await handle(request('/resolve',undefined,'POST'))).status,405);assert.equal((await handle(request('/resolve'))).status,400);assert.equal((await handle(request('/other'))).status,404);});
test('per-IP binding blocks before outgoing fetch',async()=>{const r=await handle(request('/resolve?url='+encodeURIComponent(share)),{RATE_LIMITER:{async limit(){return {success:false};}}},()=>assert.fail());assert.equal(r.status,429);});
test('API success and structured errors',async()=>{const r=await handle(request('/resolve?url='+encodeURIComponent(share)),{},async()=>redirect(reel));const body=await r.json();assert.equal(body.url,reel);assert.equal(body.ok,true);const fail=await handle(request('/resolve?url='+encodeURIComponent(share)),{},async()=>new Response('',{status:403}));assert.equal((await fail.json()).error.code,'upstream_blocked');});
test('Cloudflare entry point ignores execution context as a fetcher',async()=>{const r=await worker.fetch(request('/resolve?url='+encodeURIComponent(reel)),{},{});assert.equal((await r.json()).url,reel);});
test('Reel uses official 267 by 476 video.php and a fallback link',()=>{const s=makeEmbed(normalize(reel));assert.match(s,/video\.php/);assert.match(s,/width="267" height="476"/);assert.match(s,/title="Reel Facebook"/);assert.match(s,/Voir sur Facebook/);assert.throws(()=>makeEmbed(normalize(share)));});
test('Instagram and posts keep correct integrations',()=>{assert.match(makeEmbed(normalize('https://www.instagram.com/p/abc/')),/instagram.com\/embed.js/);assert.match(makeEmbed(normalize('https://www.facebook.com/alice/posts/123/')),/post\.php/);assert.throws(()=>normalize('https://www.instagram.com.evil.example/p/abc/'));});
