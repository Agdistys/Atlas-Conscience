import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const projects = ['desktop-1440', 'tablet-768', 'mobile-390', 'mobile-360'];
export const requiredScenarios = [
  'demarrage accessible sans Leaflet',
  'Lyon vers Valence : resultats et accessibilite',
  'parcours clavier et mouvement reduit',
  'erreur de geocodage explicite',
  'relance apres succes puis panne du geocodage et recuperation',
  'relance apres succes puis panne du routage et recuperation',
  'Entree pendant une recherche ne cree pas de requetes concurrentes'
];
const states = ['demarrage', 'resultats'];
const stageNames = ['contract', 'syntax', 'report-tests', 'browser'];

export function summarize(report, stages = {}) {
  const tests = [];
  function visit(suite) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const last = test.results?.at(-1);
        tests.push({ title: spec.title, project: test.projectName,
          passed: test.status === 'expected' && last?.status === 'passed',
          status: last?.status || 'not-run', attachments: last?.attachments || [],
          errors: (last?.errors || []).map(error => error.message || String(error)) });
      }
    }
    for (const child of suite.suites || []) visit(child);
  }
  if (report) visit(report);
  const complete = projects.every(project => requiredScenarios.every(title =>
    tests.filter(t => t.project === project && t.title === title).length === 1));
  const stagesOK = stageNames.every(name => stages[name]?.exitCode === 0);
  const passed = tests.filter(t => t.passed).length;
  return { ready: complete && stagesOK && passed === tests.length && !report?.errors?.length,
    passed, total: tests.length, complete, tests, stages, errors: report?.errors || [] };
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function writeReport(root = process.cwd(), { publishSummary = true } = {}) {
  const output = path.join(root, 'quality');
  fs.mkdirSync(output, { recursive: true });
  const diagnostics = [];
  function readJSON(file, fallback) {
    try { return JSON.parse(fs.readFileSync(path.join(output, file), 'utf8')); }
    catch (error) { diagnostics.push(`${file}: ${error.message}`); return fallback; }
  }
  const summary = summarize(readJSON('browser-results.json', null), readJSON('stages.json', {}));
  const screenshots = [];
  const accessibility = [];
  function attachmentBytes(attachment) {
    if (attachment.body) return Buffer.from(attachment.body, 'base64');
    const file = path.resolve(root, attachment.path || '');
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Piece jointe hors du depot');
    return fs.readFileSync(file);
  }
  for (const test of summary.tests) {
    for (const attachment of test.attachments) {
      try {
        if (attachment.contentType === 'image/png' && states.includes(attachment.name) && projects.includes(test.project)) {
          const name = `${test.project}-${attachment.name}.png`;
          fs.writeFileSync(path.join(output, name), attachmentBytes(attachment));
          screenshots.push({ project: test.project, state: attachment.name, file: name });
        }
        if (attachment.name.startsWith('accessibilite-')) {
          const scan = JSON.parse(attachmentBytes(attachment).toString('utf8'));
          accessibility.push({ project: test.project, state: attachment.name,
            violations: scan.violations, incomplete: scan.incomplete,
            rulesPassed: scan.passes.length });
        }
      } catch (error) { diagnostics.push(`${test.project}/${attachment.name}: ${error.message}`); }
    }
  }
  const evidenceComplete = projects.every(project => states.every(state =>
    screenshots.some(s => s.project === project && s.state === state) &&
    accessibility.some(a => a.project === project && a.state === `accessibilite-${state}`)));
  const ready = summary.ready && evidenceComplete && diagnostics.length === 0 && accessibility.every(a => a.violations.length === 0);
  const status = { schemaVersion: 1, application: 'DragonRoute / OuQuandQui',
    generatedAt: new Date().toISOString(), commit: process.env.INSPECTION_COMMIT || process.env.GITHUB_SHA || null,
    state: ready ? 'inspection' : 'blocked', passed: summary.passed, total: summary.total,
    stages: summary.stages, screenshots, accessibility, diagnostics,
    notTested: ['Disponibilite des API reelles', 'Carte Leaflet et tuiles externes', 'Installation PWA et hors connexion',
      'Lighthouse et performances', 'Comparaison avec des captures approuvees', 'Autres applications'],
    humanDecision: 'En attente de validation humaine' };
  fs.writeFileSync(path.join(output, 'status.json'), JSON.stringify(status, null, 2));
  const verdict = ready ? 'PRET POUR INSPECTION' : 'CONTROLES INCOMPLETS OU EN ECHEC';
  const lines = ['# Inspectrice v2 : ' + verdict, '', 'DragonRoute / OuQuandQui', '',
    `Commit : ${status.commit || 'execution locale'}`, `Tests navigateur : ${summary.passed}/${summary.total}`, '',
    ...stageNames.map(name => `- ${name} : ${summary.stages[name]?.exitCode === 0 ? 'OK' : 'ECHEC OU NON EXECUTE'}`), '',
    `Captures : ${screenshots.length}/8. Audits d'accessibilite : ${accessibility.length}/8.`,
    `Points d'accessibilite a examiner manuellement : ${accessibility.reduce((n, a) => n + a.incomplete.length, 0)}.`, '',
    'Scenario reproductible avec API simulees et carte de secours. Les captures sont a inspecter, sans comparaison automatique a une reference approuvee.', '',
    'Non testes : ' + status.notTested.join(' ; ') + '.', '',
    'Rapport detaille : artefact inspectrice-v2, fichier quality/inspection.html. Validation humaine requise avant fusion.'];
  fs.writeFileSync(path.join(output, 'inspection.md'), lines.join('\n') + '\n');
  if (publishSummary && process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inspectrice v2</title>
<style>body{margin:0;background:#09090e;color:#eee;font:16px/1.6 system-ui}main{max-width:1080px;margin:auto;padding:24px}h1{font-size:28px}h2{font-size:21px}section{padding:20px 0;border-top:1px solid #555}img{max-width:100%;height:auto}a{color:#87dccc}code,pre{white-space:pre-wrap;overflow-wrap:anywhere}figure{margin:24px 0}li{overflow-wrap:anywhere}summary{cursor:pointer}small{color:#ccc}</style></head><body><main>
<h1>Inspectrice v2</h1><p><strong>${verdict}</strong></p><p>${esc(status.generatedAt)}<br>Commit : <code>${esc(status.commit || 'execution locale')}</code></p>
<p>DragonRoute, pilote de OuQuandQui. Tests avec services simules et carte de secours.</p>
<section><h2>Controles</h2><ul>${stageNames.map(name => `<li>${esc(name)} : ${summary.stages[name]?.exitCode === 0 ? 'OK' : 'ECHEC OU NON EXECUTE'}</li>`).join('')}</ul>
<p>Tests navigateur : ${summary.passed}/${summary.total}. Captures : ${screenshots.length}/8. Audits : ${accessibility.length}/8.</p>
<ul>${summary.tests.map(t => `<li>${esc(t.project)} : ${esc(t.title)} : ${t.passed ? 'OK' : esc(t.status)}${t.errors.length ? `<pre>${esc(t.errors.join('\n'))}</pre>` : ''}</li>`).join('')}</ul>
${diagnostics.length || summary.errors.length ? `<pre>${esc(JSON.stringify({ diagnostics, errors: summary.errors }, null, 2))}</pre>` : ''}</section>
<section><h2>Accessibilite</h2><p>Regles WCAG 2.1 A/AA detectables par axe-core. L'examen humain reste necessaire.</p>
${accessibility.map(a => `<details><summary>${esc(a.project)} / ${esc(a.state)} : ${a.violations.length} anomalie(s), ${a.incomplete.length} point(s) a examiner</summary><pre>${esc(JSON.stringify({ violations: a.violations, incomplete: a.incomplete }, null, 2))}</pre></details>`).join('')}</section>
<section><h2>Captures a inspecter</h2><p>Aucune reference visuelle n'a encore ete approuvee.</p>${screenshots.map(s => `<figure><figcaption>${esc(s.project)} / ${esc(s.state)}</figcaption><a href="${s.file}"><img src="${s.file}" alt="${esc(s.project)} : ${esc(s.state)}" loading="lazy"></a></figure>`).join('')}</section>
<section><h2>Perimetre restant</h2><ul>${status.notTested.map(t => `<li>${esc(t)}</li>`).join('')}</ul><p>${esc(status.humanDecision)}. Aucun deploiement n'est declenche par ce rapport.</p></section>
</main></body></html>`;
  fs.writeFileSync(path.join(output, 'inspection.html'), html);
  console.log(verdict);
  return status;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = writeReport().state === 'inspection' ? 0 : 1;
}
