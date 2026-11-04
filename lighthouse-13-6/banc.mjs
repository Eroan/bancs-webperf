// Même relevé, plusieurs modèles. PASSAGES, SORTIE, CHROME_PATH lus dans l'environnement.
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { demarrer, LOCALES, MARQUEUR } from './serveur.mjs';
const N = +(process.env.PASSAGES || 10), SORTIE = process.env.SORTIE, CHROME = process.env.CHROME_PATH;
if (!SORTIE || !CHROME) throw new Error('SORTIE et CHROME_PATH requis');
const LH = v => `node_modules/${v}/cli/index.js`;
const VARIANTES = { '135': ['lh135', ''], '136': ['lh136', ''], '136-reseau65': ['lh136', 'reseau'], '136-rendu65': ['lh136', 'rendu'],
  '136-lcptexte65': ['lh136', 'lcptexte'], '136-graphe65': ['lh136', 'graphe'], '136-tout65': ['lh136', 'reseau,rendu,lcptexte,graphe'] };
function lancer(args, env = {}) {
  return new Promise((ok, ko) => {
    const p = spawn(process.execPath, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', d => err += d);
    p.on('close', c => c === 0 ? ok() : ko(new Error(`sortie ${c} : ${args.join(' ')}\n${err.slice(-600)}`)));
  });
}
function extraire(f) {
  const r = JSON.parse(fs.readFileSync(f, 'utf8')); const a = r.audits; const m = a.metrics.details.items[0];
  const proto = {}; for (const x of a['network-requests'].details.items) proto[x.protocol || '?'] = (proto[x.protocol || '?'] || 0) + 1;
  return { version: r.lighthouseVersion, chrome: r.environment.hostUserAgent.match(/Chrome\/([\d.]+)/)[1], score: Math.round(r.categories.performance.score * 100),
    fcp: a['first-contentful-paint'].numericValue, lcp: a['largest-contentful-paint'].numericValue, si: a['speed-index'].numericValue, tbt: a['total-blocking-time'].numericValue,
    cls: a['cumulative-layout-shift'].numericValue, ofcp: m.observedFirstContentfulPaint, olcp: m.observedLargestContentfulPaint, protocoles: proto };
}
function typeLcp(dir) {
  const t = JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir).find(f => f.endsWith('trace.json'))), 'utf8'));
  const c = (t.traceEvents || t).filter(e => e.name === 'largestContentfulPaint::Candidate' && e.args?.data?.isOutermostMainFrame !== false);
  return c.length ? c[c.length - 1].args.data.type : null;
}
const { s, port } = await demarrer();
const temoin = await (await fetch(`http://127.0.0.1:${port}/__banc`)).text();
if (temoin !== MARQUEUR) throw new Error('serveur du banc absent');
const REELLES = { 'awp-accueil': 'https://agencewebperformance.fr/', 'awp-article': 'https://agencewebperformance.fr/pagespeed-insights-vs-lighthouse/', 'horizon': 'https://theme-horizon-demo.myshopify.com/' };
const PAGES = { ...Object.fromEntries(LOCALES.map(p => [p, `http://127.0.0.1:${port}/${p}`])), ...REELLES };
const ids = Object.keys(PAGES), mesures = [], temp = fs.mkdtempSync(path.join(os.tmpdir(), 'banc-lh136-'));
const sauver = () => fs.writeFileSync(path.join(SORTIE, 'mesures.json'), JSON.stringify({ passages: N, pages: PAGES, mesures }, null, 0));
async function releve(page, i, { collecte = 'lh136', flags = [], variantes = VARIANTES, serie = 'simule' } = {}) {
  const dir = path.join(temp, `${page}-${serie}-${i}`); fs.mkdirSync(dir);
  await lancer([LH(collecte), PAGES[page], `-G=${dir}`, '--only-categories=performance', '--quiet', '--chrome-flags=--headless=new', ...flags]);
  const type = typeLcp(dir);
  // Variantes à un seul groupe rétabli : calcul déterministe sur le relevé, 3 relevés suffisent ; 135, 136 et 136-tout65 sur tous.
  let noms = Object.keys(variantes); if (serie === 'simule' && i >= 3) noms = ['135', '136', '136-tout65'];
  if (serie === 'simule' && i === 0) noms.push('136bis');
  for (const v of noms) {
    const [lh, groupes] = v === '136bis' ? VARIANTES['136'] : variantes[v];
    const out = path.join(temp, 'r.json');
    const pre = groupes ? ['--import', './variante.mjs'] : [];
    await lancer([...pre, LH(lh), `-A=${dir}`, '--only-categories=performance', '--output=json', `--output-path=${out}`, '--quiet', ...flags], { VARIANTE: groupes });
    mesures.push({ serie, page, i, variante: v, collecte, lcpType: type, ...extraire(out) });
  }
  if (serie === 'simule') { // h3 réécrit en h2 dans le journal réseau, audité par la 13.5.0 : part de HTTP/3 dans l'écart
    const log = path.join(dir, 'devtoolslog.json'), brut = fs.readFileSync(log, 'utf8');
    const h2 = brut.replace(/("protocol": *")h3(?:-\d+)?"/g, '$1h2"');
    if (h2 !== brut) {
      fs.writeFileSync(log, h2); const out = path.join(temp, 'r.json');
      await lancer([LH('lh135'), `-A=${dir}`, '--only-categories=performance', '--output=json', `--output-path=${out}`, '--quiet']);
      mesures.push({ serie, page, i, variante: '135-h3-en-h2', collecte, lcpType: type, ...extraire(out) });
    }
  }
  fs.rmSync(dir, { recursive: true, force: true });
  sauver(); console.log(`${serie} ${page} ${i} (${type})`);
}
for (let i = 0; i < N; i++) {
  const ordre = ids.map((_, k) => ids[(k + i) % ids.length]);
  for (const p of ordre) await releve(p, i);
  if (i < 5) for (const p of [...LOCALES, 'awp-article']) await releve(p, i, { collecte: 'lh135', serie: 'collecte135', variantes: { '135': VARIANTES['135'] } });
  if (i < 5) for (const p of ['texte-preload', 'module-tete', 'module-flux']) await releve(p, i, { serie: 'devtools', flags: ['--throttling-method=devtools'], variantes: { '135': VARIANTES['135'], '136': VARIANTES['136'] } });
}
s.close(); fs.rmSync(temp, { recursive: true, force: true }); console.log('FIN');
