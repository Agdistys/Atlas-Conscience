// Shared by the standalone page and the Worker. No network or DOM dependency.
export const FB_HOSTS = new Set(['facebook.com','www.facebook.com','m.facebook.com','mbasic.facebook.com','web.facebook.com','fb.watch','www.fb.watch']);
export function safeFacebookURL(value, base) {
  let u; try { u = new URL(value, base); } catch { throw new Error('Adresse Facebook invalide.'); }
  if (u.protocol !== 'https:' || !FB_HOSTS.has(u.hostname) || u.username || u.password || u.port || u.href.length > 4096)
    throw new Error('Seules les adresses HTTPS Facebook reconnues sont acceptées.');
  u.hash = ''; return u;
}
export function classifyFacebook(value) {
  const u = safeFacebookURL(value), p = u.pathname;
  const result = (path, type, params = '') => ({platform:'Facebook', type, url:`https://www.facebook.com${path}${params}`, needsResolution:false});
  if (u.hostname.endsWith('fb.watch')) {
    if (!/^\/[A-Za-z0-9_-]+\/?$/.test(p)) throw new Error('Lien fb.watch non reconnu.');
    return {platform:'Facebook',type:'Lien à résoudre',url:`https://fb.watch${p}`,needsResolution:true};
  }
  if (/^\/share\/(?:[rvp]\/)?[A-Za-z0-9_-]+\/?$/.test(p))
    return {platform:'Facebook',type:'Lien à résoudre',url:`https://www.facebook.com${p}`,needsResolution:true};
  let m;
  if ((m = p.match(/^\/reels?\/(\d+)\/?$/))) return result(`/reel/${m[1]}/`,'Reel');
  if ((m = p.match(/^\/(?:[A-Za-z0-9._-]+\/)?videos\/(\d+)\/?$/))) return result(`/watch/`,'Vidéo',`?v=${m[1]}`);
  if (/^\/(?:watch\/?|video.php)$/.test(p) && /^\d+$/.test(u.searchParams.get('v') || ''))
    return result('/watch/','Vidéo',`?v=${u.searchParams.get('v')}`);
  if ((m = p.match(/^\/([A-Za-z0-9._-]+)\/posts\/([A-Za-z0-9]+)\/?$/))) return result(`/${m[1]}/posts/${m[2]}/`,'Publication');
  if ((m = p.match(/^\/groups\/([A-Za-z0-9._-]+)\/(posts|permalink)\/(\d+)\/?$/))) return result(`/groups/${m[1]}/${m[2]}/${m[3]}/`,'Publication');
  if (/^\/(?:permalink.php|story.php)$/.test(p) && /^[A-Za-z0-9]+$/.test(u.searchParams.get('story_fbid') || '') && /^\d+$/.test(u.searchParams.get('id') || ''))
    return result('/permalink.php','Publication',`?story_fbid=${u.searchParams.get('story_fbid')}&id=${u.searchParams.get('id')}`);
  if (/^\/(?:photo.php|photo\/?)$/.test(p) && /^\d+$/.test(u.searchParams.get('fbid') || ''))
    return result('/photo/','Photo',`?fbid=${u.searchParams.get('fbid')}`);
  throw new Error('Adresse permanente non reconnue. Colle le lien du contenu ou le code d’intégration fourni par Facebook.');
}
export function normalize(raw) {
  let value = String(raw || '').trim();
  if (!value) throw new Error('Colle d’abord un lien Instagram ou Facebook.');
  if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
  let u; try { u = new URL(value); } catch { throw new Error('Ce lien ne semble pas valide.'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port || value.length > 4096) throw new Error('Utilise une adresse HTTPS sans identifiants.');
  if (FB_HOSTS.has(u.hostname)) return classifyFacebook(u.href);
  if (['instagram.com','www.instagram.com','m.instagram.com'].includes(u.hostname)) {
    const m = u.pathname.match(/^\/(p|reels?|tv)\/([A-Za-z0-9_-]+)\/?$/);
    if (!m) throw new Error('Lien Instagram reconnu, mais ce n’est pas un post ou un Reel.');
    const kind=m[1]==='reels'?'reel':m[1];
    return {platform:'Instagram',type:kind==='p'?'Publication':kind==='tv'?'Vidéo':'Reel',url:`https://www.instagram.com/${kind}/${m[2]}/`,needsResolution:false};
  }
  throw new Error('Utilise un lien Instagram ou Facebook.');
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function makeEmbed(info) {
  // Re-validate even server-returned URLs; a share link never becomes an embed.
  info = normalize(info.url);
  if (info.needsResolution) throw new Error('Le lien de partage doit être résolu avant de créer un lecteur.');
  if (info.platform==='Instagram') return `<blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(info.url)}" data-instgrm-version="14" style="background:#fff;border:0;margin:0 auto;max-width:540px;width:100%;"></blockquote>\n<script async src="https://www.instagram.com/embed.js"><\/script>`;
  const video=['Reel','Vidéo'].includes(info.type), reel=info.type==='Reel';
  const width=reel?267:500, height=reel?476:video?281:680;
  const params=new URLSearchParams({href:info.url,width:String(width),height:String(height),show_text:video?'false':'true'});
  if(video)params.set('t','0');
  const src=`https://www.facebook.com/plugins/${video?'video':'post'}.php?${params}`;
  return `<div style="width:100%;max-width:${width}px;margin:0 auto;">\n  <iframe title="${escapeHtml(info.type)} Facebook" src="${escapeHtml(src)}" width="${width}" height="${height}" style="border:none;overflow:hidden;max-width:100%;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" loading="lazy"></iframe>\n  <p><a href="${escapeHtml(info.url)}" target="_blank" rel="noopener noreferrer">Voir sur Facebook</a></p>\n</div>`;
}
