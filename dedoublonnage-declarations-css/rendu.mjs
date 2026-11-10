// Volet rendu : coût de recalcul de style et équivalence du rendu, Bootstrap 5.3.8 dédoublonné puis minifié,
// sur deux pages des exemples officiels (cheatsheet, album). Chrome stable en fenêtre, contexte neuf par passage.
// Usage : TAUX=9 PASSAGES=10 node rendu.mjs   → brut/rendu-<série>.json, brut/rendu-structure.json
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { dedup } from 'css-dedup';
import { transform } from 'lightningcss';
import { chromium } from 'playwright';

const ICI = new URL('./', import.meta.url).pathname;
const EX = path.join(ICI, 'corpus/exemples/bootstrap-5.3.8-examples');
const ZIP_SHA = 'b851efe3b1589a4487c44a6b55671bbba54abb7740673be9c47a1e271ead1782';
const TAUX = (process.env.TAUX || '1,9').split(',').map(Number);
const PASSAGES = Number(process.env.PASSAGES || 10);
const BOUCLE = 20;            // recalculs forcés par mesure
const PAGES = ['cheatsheet', 'album'];

// --- garde : machine au repos (CLAUDE.md du dépôt) ---
// médiane de quatre relevés d'une seconde (le premier relevé de top, depuis le démarrage, est jeté)
const relevesTop = execFileSync('top', ['-l', '5', '-n', '0', '-s', '1']).toString().split('\n').filter((l) => l.includes('CPU usage')).slice(1)
  .map((l) => Number((l.match(/([\d.]+)% idle/) || [])[1])).sort((x, y) => x - y);
const idle = (relevesTop[1] + relevesTop[2]) / 2;
const ligneTop = `inactivité médiane ${idle.toFixed(1)} % (relevés ${relevesTop.join(', ')})`;
const STRUCTURE_SEULE = process.env.STRUCTURE_SEULE === '1';   // sans durée : pas de garde de charge
if (!STRUCTURE_SEULE && !(idle >= 85)) { console.error(`MACHINE CHARGÉE : ${ligneTop.trim()} (85 % d'inactivité exigés)`); process.exit(2); }

// --- exemples officiels, empreinte de l'archive ---
const zip = path.join(ICI, 'corpus/exemples/ex.zip');
if (!existsSync(zip)) { console.error('corpus/exemples/ex.zip absent : node recuperer.mjs'); process.exit(1); }
if (createHash('sha256').update(readFileSync(zip)).digest('hex') !== ZIP_SHA) { console.error('EMPREINTE de ex.zip différente'); process.exit(1); }

// --- variantes de la feuille (toutes minifiées par Lightning CSS, forme servie) ---
const src = readFileSync(path.join(ICI, 'corpus/bootstrap-5.3.8.css'), 'utf8');
const lcss = (css) => transform({ filename: 'bootstrap.css', code: Buffer.from(css), minify: true, errorRecovery: true }).code.toString();
const VARIANTES = {
  origine: lcss(src),
  f: lcss(dedup(src, {}).css),
  fs: lcss(dedup(src, { savingsOnly: true }).css),
  fa: lcss(dedup(src, { aggressive: true }).css),
  fas: lcss(dedup(src, { aggressive: true, savingsOnly: true }).css),
};
VARIANTES.double = VARIANTES.origine + VARIANTES.origine;   // témoin positif : deux fois plus de règles, rendu identique
const NOMS = Object.keys(VARIANTES);

// --- serveur : port libre, no-store, journal des feuilles servies ---
const servies = [];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const serveur = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__banc') { res.end('banc-dedoublonnage'); return; }
  const m = u.pathname.match(/^\/v\/([a-z]+)\/(.*)$/);
  if (!m || !VARIANTES[m[1]]) { res.statusCode = 404; res.end(); return; }
  const [, v, reste] = m;
  res.setHeader('Cache-Control', 'no-store');
  if (reste === 'assets/dist/css/bootstrap.min.css') {
    servies.push({ v, octets: Buffer.byteLength(VARIANTES[v]) });
    res.setHeader('Content-Type', 'text/css'); res.end(VARIANTES[v]); return;
  }
  let f = path.join(EX, decodeURIComponent(reste));
  if (!f.startsWith(EX)) { res.statusCode = 403; res.end(); return; }
  if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!existsSync(f)) { res.statusCode = 404; res.end(); return; }
  res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream');
  res.end(readFileSync(f));
});
await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
const ORIGINE = `http://127.0.0.1:${serveur.address().port}`;
if ((await (await fetch(`${ORIGINE}/__banc`)).text()) !== 'banc-dedoublonnage') { console.error('BANC ABSENT'); process.exit(1); }

const navigateur = await chromium.launch({ channel: 'chrome', headless: false });
const versionChrome = navigateur.version();
const sortants = [];

async function ouvrir(v, page, taux) {
  const ctx = await navigateur.newContext({ viewport: { width: 1350, height: 940 } });
  await ctx.route((url) => !url.href.startsWith(ORIGINE), (r) => { sortants.push(r.request().url()); r.fulfill({ status: 204, body: '' }); });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: taux });
  const avant = servies.length;
  const rep = await p.goto(`${ORIGINE}/v/${v}/${page}/`, { waitUntil: 'load' });
  if (rep.status() !== 200) throw new Error(`${v} ${page} : HTTP ${rep.status()}`);
  const feuille = servies.slice(avant).filter((s) => s.v === v);
  if (feuille.length !== 1 || feuille[0].octets !== Buffer.byteLength(VARIANTES[v])) throw new Error(`${v} ${page} : feuille servie ${JSON.stringify(feuille)}`);
  await p.waitForTimeout(300);
  return { ctx, p, cdp };
}
const metriques = async (cdp) => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));

// --- structure et équivalence (une fois, ×1) ---
const structure = [];
const signatures = {};
for (const page of PAGES) {
  for (const v of NOMS) {
    const { ctx, p, cdp } = await ouvrir(v, page, 1);
    await p.evaluate(() => document.getAnimations().forEach((a) => {   // infinies figées à 0 (spinners, barres), finies menées à terme (fondu d'un toast)
      if (a.effect.getComputedTiming().iterations === Infinity) { a.pause(); a.currentTime = 0; } else a.finish();
    }));
    const sig = await p.evaluate(() => [...document.querySelectorAll('body *')].map((e, i) => {
      const lire = (pseudo) => { const s = getComputedStyle(e, pseudo); const o = []; for (let k = 0; k < s.length; k++) o.push(`${s[k]}:${s.getPropertyValue(s[k])}`); return o.sort().join(';'); };   // trié : l'ordre des propriétés personnalisées suit la cascade
      return { i, tag: e.tagName.toLowerCase(), cls: e.getAttribute('class') || '', style: lire(null), avant: lire('::before'), apres: lire('::after') };
    }));
    // statistiques de sélecteurs de Chrome sur un recalcul complet forcé (feuilles d'auteur seules)
    const evts = [];
    const recu = (d) => evts.push(...d.value);
    cdp.on('Tracing.dataCollected', recu);
    const fini = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-blink.debug'] }, transferMode: 'ReportEvents' });
    await p.evaluate(() => { const b = document.body; b.style.display = 'none'; void b.offsetHeight; b.style.display = ''; void b.offsetHeight; });
    await cdp.send('Tracing.end'); await fini; cdp.off('Tracing.dataCollected', recu);
    const stats = { tentatives: 0, correspondances: 0, rejets_rapides: 0, us: 0, selecteurs: 0, evenements: 0, elements_recalcules: 0 };
    for (const e of evts) {
      if (e.name === 'UpdateLayoutTree' && e.args && e.args.elementCount) stats.elements_recalcules += e.args.elementCount;
      if (e.name !== 'SelectorStats') continue;
      stats.evenements++;
      for (const t of e.args.selector_stats.selector_timings) {
        if (t.style_sheet_id === 'ua-style-sheet') continue;
        stats.tentatives += t.match_attempts; stats.correspondances += t.match_count; stats.rejets_rapides += t.fast_reject_count;
        stats.us += t['elapsed (us)']; stats.selecteurs++;
      }
    }
    if (!stats.evenements || !stats.tentatives) throw new Error(`${v} ${page} : aucune statistique de sélecteurs dans la trace`);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const ids = [];
    (function parcourir(n) { if (n.nodeType === 1) ids.push(n.nodeId); for (const c of n.children || []) parcourir(c); })(root);
    let regles = 0, max = 0;
    for (const nodeId of ids) {
      const r = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
      const n = (r.matchedCSSRules || []).filter((m) => m.rule.origin === 'regular').length
        + (r.pseudoElements || []).reduce((a, pe) => a + pe.matches.filter((m) => m.rule.origin === 'regular').length, 0);
      regles += n; if (n > max) max = n;
    }
    structure.push({ page, variante: v, elements: ids.length, regles_appariees: regles, max_par_element: max, selecteurs_chrome: stats });
    signatures[`${page}/${v}`] = sig;
    await ctx.close();
  }
  const ref = signatures[`${page}/origine`];
  for (const v of NOMS) {
    const s = signatures[`${page}/${v}`];
    const diff = [];
    if (s.length !== ref.length) diff.push({ erreur: `nombre d'éléments ${s.length} contre ${ref.length}` });
    else for (let i = 0; i < s.length; i++) for (const k of ['style', 'avant', 'apres']) if (s[i][k] !== ref[i][k]) {
      const a = new Map(ref[i][k].split(';').map((x) => [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)]));
      const b = new Map(s[i][k].split(';').map((x) => [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)]));
      const props = [...new Set([...a.keys(), ...b.keys()])].filter((q) => a.get(q) !== b.get(q));
      diff.push({ element: `${s[i].tag}.${s[i].cls}`.slice(0, 80), cible: k, proprietes: props.slice(0, 6).map((q) => `${q}: ${a.get(q)} → ${b.get(q)}`) });
    }
    structure.find((x) => x.page === page && x.variante === v).ecarts_rendu = { n: diff.length, exemples: diff.slice(0, 12) };
  }
}
for (const x of structure.filter((x) => x.variante === 'double')) if (x.ecarts_rendu.n !== 0) { console.error(`TÉMOIN : la variante double change le rendu (${x.page})`, JSON.stringify(x.ecarts_rendu, null, 1)); process.exit(1); }

// --- série chronométrée : passages alternés, ordre tourné, premier passage jeté ---
const series = {};
for (const taux of STRUCTURE_SEULE ? [] : TAUX) {
  const lignes = [];
  for (let passage = 0; passage <= PASSAGES; passage++) {
    const ordre = NOMS.map((_, i) => NOMS[(i + passage) % NOMS.length]);
    for (const page of PAGES) for (const v of ordre) {
      const { ctx, p, cdp } = await ouvrir(v, page, taux);
      // règle de bascule injectée hors de la feuille testée, style forcé avant la première lecture
      await p.evaluate(() => { const st = document.createElement('style'); st.textContent = 'html.banc-bascule *{--banc-bascule:1}'; document.head.append(st); void document.body.offsetHeight; });
      const m0 = await metriques(cdp);
      await p.evaluate((k) => { const b = document.body; for (let i = 0; i < k; i++) { b.style.display = 'none'; void b.offsetHeight; b.style.display = ''; void b.offsetHeight; } }, BOUCLE);
      const m1 = await metriques(cdp);
      // second déclencheur : classe sur html, tous les éléments restylés sans reconstruction de l'arbre de rendu
      await p.evaluate((k) => { const h = document.documentElement; for (let i = 0; i < 2 * k; i++) { h.classList.toggle('banc-bascule'); void document.body.offsetHeight; } }, BOUCLE);
      const m2 = await metriques(cdp);
      if (passage > 0) lignes.push({ taux, passage, page, variante: v,
        chargement_recalc_ms: m0.RecalcStyleDuration * 1000, chargement_layout_ms: m0.LayoutDuration * 1000,
        recalc_ms: (m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000 / BOUCLE,
        recalc_n: m1.RecalcStyleCount - m0.RecalcStyleCount, layout_ms: (m1.LayoutDuration - m0.LayoutDuration) * 1000 / BOUCLE,
        classe_ms: (m2.RecalcStyleDuration - m1.RecalcStyleDuration) * 1000 / (2 * BOUCLE), classe_n: m2.RecalcStyleCount - m1.RecalcStyleCount,
        classe_layout_ms: (m2.LayoutDuration - m1.LayoutDuration) * 1000 / (2 * BOUCLE) });
      await ctx.close();
    }
    console.log(`×${taux} passage ${passage}${passage ? '' : ' (échauffement, jeté)'}`);
  }
  const attendu = PASSAGES * PAGES.length * NOMS.length;
  if (lignes.length !== attendu) { console.error(`COMPLÉTUDE ×${taux} : ${lignes.length}/${attendu}`); process.exit(1); }
  series[taux] = lignes;
}
await navigateur.close();
serveur.close();
if (sortants.length) console.log(`requêtes sortantes interceptées : ${[...new Set(sortants)].join(', ')}`);

writeFileSync(path.join(ICI, 'brut/rendu-structure.json'), JSON.stringify({ chrome: versionChrome, structure }, null, 1));
if (STRUCTURE_SEULE) { console.log(`STRUCTURE SEULE : brut/rendu-structure.json écrit, aucune durée mesurée ; Chrome ${versionChrome}`); process.exit(0); }
// témoin de durée : la plage de `double` ne recouvre pas celle de l'origine (critère fixé après l'échec du critère > 20 %, voir PROTOCOLE.md)
const temoin = [];
for (const [taux, lignes] of Object.entries(series)) for (const page of PAGES) {
  for (const mesure of ['recalc_ms', 'classe_ms']) {
    const o = lignes.filter((l) => l.page === page && l.variante === 'origine').map((l) => l[mesure]);
    const d = lignes.filter((l) => l.page === page && l.variante === 'double').map((l) => l[mesure]);
    temoin.push({ taux: Number(taux), page, mesure, ok: Math.min(...d) > Math.max(...o), origine_max: Math.max(...o), double_min: Math.min(...d) });
  }
}
// la série est publiable pour une mesure si son témoin passe à chaque niveau et sur chaque page
const okPar = Object.fromEntries(['recalc_ms', 'classe_ms'].map((m) => [m, temoin.filter((t) => t.mesure === m).every((t) => t.ok)]));
const ok = okPar.recalc_ms || okPar.classe_ms;
const serie = `t${TAUX.join('-')}-p${PASSAGES}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}${ok ? '' : '-TEMOIN-ECHOUE'}`;
writeFileSync(path.join(ICI, `brut/rendu-${serie}.json`), JSON.stringify({ chrome: versionChrome, idle: ligneTop.trim(), taux: TAUX, passages: PASSAGES, boucle: BOUCLE,
  octets: Object.fromEntries(NOMS.map((v) => [v, Buffer.byteLength(VARIANTES[v])])), temoin, mesures_publiables: okPar, series }, null, 1));
if (!ok) { console.error(`TÉMOIN DE DURÉE ÉCHOUÉ : ${JSON.stringify(temoin.filter((t) => !t.ok))} ; données gardées sous brut/rendu-${serie}.json`); process.exit(1); }
console.log(`TÉMOINS OK pour ${Object.keys(okPar).filter((m) => okPar[m]).join(', ')} : feuille servie vérifiée à chaque chargement, variante double sans écart de rendu et plus lente sans recouvrement ; série ${serie} ; Chrome ${versionChrome}`);
