import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appFiles = ['index.html', 'app.js', 'config.js', 'style.css', 'icons/icon-192.png', 'icons/icon-512.png'];
export const previewFiles = [...appFiles, 'preview.json', 'rapport/inspection.html', 'rapport/status.json',
  ...['desktop-1440', 'tablet-768', 'mobile-390', 'mobile-360'].flatMap(p => ['demarrage', 'resultats'].map(s => `rapport/${p}-${s}.png`))];

function copyFile(source, target) {
  if (!fs.lstatSync(source).isFile() || fs.lstatSync(source).isSymbolicLink()) throw new Error(`Fichier ordinaire requis : ${source}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

export function buildPreview(root, target, { commit, pr }) {
  if (!/^[a-f0-9]{40}$/.test(commit) || !/^[1-9][0-9]*$/.test(String(pr))) throw new Error('Identite de preview invalide');
  if (fs.existsSync(target)) throw new Error('Le dossier de sortie existe deja');
  const status = JSON.parse(fs.readFileSync(path.join(root, 'quality/status.json'), 'utf8'));
  if (status.state !== 'inspection' || status.commit !== commit) throw new Error('Inspection reussie du meme commit requise');
  for (const file of appFiles) copyFile(path.join(root, 'DragonRoute', file), path.join(target, file));
  for (const file of previewFiles.filter(p => p.startsWith('rapport/'))) {
    copyFile(path.join(root, 'quality', file.slice(8)), path.join(target, file));
  }
  let html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
  if (!html.includes('<body>') || !html.includes('</footer>')) throw new Error('Structure DragonRoute inattendue');
  html = html.replace('<body>', '<body data-preview="true">')
    .replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow">')
    .replace(/<link rel="manifest"[^>]*>/, '')
    .replace('V3 PWA', 'ESSAI')
    .replace('</footer>', `<p>Version d'essai · PR ${pr} · ${commit.slice(0, 7)} · <a href="./rapport/inspection.html">Rapport d'inspection</a></p></footer>`);
  fs.writeFileSync(path.join(target, 'index.html'), html);
  fs.writeFileSync(path.join(target, 'preview.json'), JSON.stringify({ schemaVersion: 1, pr: Number(pr), commit }, null, 2));
}

export function assembleSite(site, cache, incoming, plan) {
  const previews = path.join(site, 'previews');
  if (fs.existsSync(previews)) throw new Error('Le site principal utilise deja le dossier reserve previews');
  const allowed = new Set(previewFiles);
  function copyPreview(from, to) {
    for (const file of allowed) copyFile(path.join(from, file), path.join(to, file));
  }
  for (const number of plan.openPRs) {
    if (!Number.isSafeInteger(number) || number < 1) throw new Error('Numero de PR invalide');
    const old = path.join(cache, 'previews', `pr-${number}`);
    if (fs.existsSync(old) && number !== plan.pr) copyPreview(old, path.join(previews, `pr-${number}`));
  }
  if (plan.pr) {
    const metadata = JSON.parse(fs.readFileSync(path.join(incoming, 'preview.json'), 'utf8'));
    const status = JSON.parse(fs.readFileSync(path.join(incoming, 'rapport/status.json'), 'utf8'));
    if (metadata.pr !== plan.pr || metadata.commit !== plan.commit || status.commit !== plan.commit || status.state !== 'inspection') {
      throw new Error('La preview ne correspond pas au commit inspecte');
    }
    copyPreview(incoming, path.join(previews, `pr-${plan.pr}`));
  }
  fs.writeFileSync(path.join(site, '.nojekyll'), '');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv[2] === 'build') {
    buildPreview(process.cwd(), path.resolve('preview-site'), { commit: process.env.INSPECTION_COMMIT, pr: process.env.PREVIEW_PR });
  } else if (process.argv[2] === 'assemble') {
    assembleSite(path.resolve('site'), path.resolve('cache'), path.resolve('incoming'), JSON.parse(fs.readFileSync('pages-plan.json', 'utf8')));
  } else throw new Error('Commande attendue : build ou assemble');
}
