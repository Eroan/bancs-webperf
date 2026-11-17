// Banc : chargement, mémoire et interactions du composant pour chaque variante et chaque taille.
// Usage : SORTIE=<dossier> node banc.mjs <taux CPU> <passages> <tailles ex. 100,1000> [variantes ex. solid,react]
// Écrit <SORTIE>/passages-x<taux>-<passages>p.jsonl (une ligne par passage, refus compris) et imprime une ligne par passage.
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { generer } from './donnees.mjs';
import { correspond, trier } from './src/commun.js';

const [TAUX, PASSAGES, TAILLES, LISTE] = [Number(process.argv[2] || 1), Number(process.argv[3] || 1), (process.argv[4] || '100,1000').split(',').map(Number), process.argv[5]];
const TOUTES = ['vanilla', 'alpine', 'alpine-ssr', 'solid', 'solid-1', 'react', 'preact', 'svelte', 'vue', 'vue-vapor'];
const VARIANTES = LISTE ? LISTE.split(',') : TOUTES;
const SORTIE = process.env.SORTIE || 'brut';
const FICHIER = `${SORTIE}/passages-x${TAUX}-${PASSAGES}p.jsonl`;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// Serveur du banc, port lu sur sa sortie, marqueur relu
const srv = spawn('node', ['site.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
const PORT = await new Promise((ok, ko) => { srv.stdout.on('data', (d) => { const m = String(d).match(/port (\d+)/); if (m) ok(Number(m[1])); }); setTimeout(() => ko(new Error('serveur muet')), 5000); });
const O = `http://127.0.0.1:${PORT}`;
if ((await (await fetch(`${O}/__banc`)).text()) !== 'banc-composant-interactif') throw new Error('BANC ABSENT');

// Parcours : geste, et pour chacun l'état attendu (calculé ici, indépendamment des variantes)
function parcours(v, n) {
  const items = generer(n), tri = v !== 'alpine-ssr';
  let sens = 0, q = '', favs = 0;
  const etat = () => { let f = items.filter((i) => correspond(i.nom, q)); if (sens) f = trier(f, sens); return { vis: f.length, premier: f[0]?.id ?? null, compteur: `${favs} favori(s)` }; };
  const g = [];
  g.push({ nom: 'temoin', tap: '#temoin', attendu: etat() });
  g.push({ nom: 'favori', tap: '#liste .ligne:nth-child(3 of .ligne) .fav', apres: () => { favs = 1; }, });   // « of .ligne » : le <template> d'Alpine est aussi un enfant
  if (tri) { g.push({ nom: 'tri1', tap: '#tri', apres: () => { sens = 1; } }); g.push({ nom: 'tri2', tap: '#tri', apres: () => { sens = -1; } }); }
  g.push({ nom: 'focus', tap: '#filtre' });                                                              // juste avant la frappe : un autre tap retirerait le focus
  g.push({ nom: 'touche-l', touche: 'l', apres: () => { q = 'l'; } });
  g.push({ nom: 'touche-a', touche: 'a', apres: () => { q = 'la'; } });
  g.push({ nom: 'retour1', touche: 'Backspace', apres: () => { q = 'l'; } });
  g.push({ nom: 'retour2', touche: 'Backspace', apres: () => { q = ''; } });
  for (const x of g) { if (x.apres) x.apres(); if (!x.attendu) x.attendu = etat(); }
  return g;
}
const TOUCHES = { l: { key: 'l', code: 'KeyL', text: 'l', windowsVirtualKeyCode: 76 }, a: { key: 'a', code: 'KeyA', text: 'a', windowsVirtualKeyCode: 65 }, Backspace: { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, commands: ['deleteBackward'] } };

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const VERSION = browser.version();
console.log(`Chrome ${VERSION}, taux x${TAUX}, ${PASSAGES} passage(s), tailles ${TAILLES.join(',')}, port ${PORT}`);
fs.mkdirSync(SORTIE, { recursive: true });

async function passage(v, n, p) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: TAUX });
  await cdp.send('Performance.enable');
  const octets = { html: 0, js: 0 };
  page.on('response', async (r) => { try { const s = (await r.request().sizes()).responseBodySize; if (r.url().endsWith('.js')) octets.js += s; else if (r.url().includes('/v/')) octets.html += s; } catch {} });
  const res = { v, n, passage: p, taux: TAUX, chrome: VERSION, refus: [] };
  await page.goto(`${O}/v/${v}/${n}`);
  await page.waitForFunction(() => window.__pret, null, { timeout: 30000 });
  await attendre(1000);
  res.pret = await page.evaluate(() => window.__pret);
  if (res.pret.n !== n) res.refus.push(`pret: ${res.pret.n} lignes au lieu de ${n}`);
  res.innerWidth = await page.evaluate(() => innerWidth);
  await cdp.send('HeapProfiler.collectGarbage');
  res.metriques = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.filter((m) => /^(ScriptDuration|TaskDuration|LayoutDuration|RecalcStyleDuration|Nodes|JSHeapUsedSize|JSEventListeners)$/.test(m.name)).map((m) => [m.name, m.value]));
  res.longues = await page.evaluate(() => __lt.map((x) => x.d));
  // Gestes : coordonnées relevées page au repos, puis 700 ms entre deux gestes, état relu 300 ms après chacun
  const gestes = parcours(v, n);
  const pos = await page.evaluate((sels) => sels.map((s) => { if (!s) return null; const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }), gestes.map((g) => g.tap || null));
  res.gestes = [];
  for (const [k, g] of gestes.entries()) {
    if (g.tap) await cdp.send('Input.synthesizeTapGesture', { x: pos[k].x, y: pos[k].y, duration: 50, tapCount: 1, gestureSourceType: 'touch' });
    else { const t = TOUCHES[g.touche]; await cdp.send('Input.dispatchKeyEvent', { type: t.text ? 'keyDown' : 'rawKeyDown', ...t }); await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: t.key, code: t.code, windowsVirtualKeyCode: t.windowsVirtualKeyCode }); }
    await attendre(300);
    const lu = await page.evaluate(() => { const vis = [...document.querySelectorAll('#liste .ligne')].filter((e) => e.checkVisibility()); return { vis: vis.length, premier: vis[0] ? Number(vis[0].dataset.id) : null, compteur: document.getElementById('compteur').textContent.trim(), fav3: document.querySelector('#liste .ligne[data-id="3"] .fav')?.getAttribute('aria-pressed') }; });
    const ok = lu.vis === g.attendu.vis && lu.premier === g.attendu.premier && lu.compteur === g.attendu.compteur && (k < 1 || lu.fav3 === 'true');
    if (!ok) res.refus.push(`${g.nom}: lu ${JSON.stringify(lu)} attendu ${JSON.stringify(g.attendu)}`);
    res.gestes.push({ nom: g.nom, lu });
    await attendre(400);
  }
  await attendre(1000);
  const { et, gs } = await page.evaluate(() => ({ et: __et, gs: __g }));
  // Chaque geste reçu (pointerdown ou keydown) → son interactionId par l'entrée de même startTime → plus grande durée de l'interaction
  const recus = gs.filter((x) => x.t === 'pointerdown' || x.t === 'keydown');
  if (recus.length !== gestes.length) res.refus.push(`gestes reçus ${recus.length} au lieu de ${gestes.length}`);
  for (const [k, g] of res.gestes.entries()) {
    // Tap tactile : pas d'entrée pointerdown ; le click qui porte l'interactionId démarre ~50 ms après le pointerdown reçu.
    // On prend la première entrée à interactionId non nul entre ce geste et le suivant.
    const r = recus[k]; if (!r) continue;
    const fin = recus[k + 1] ? recus[k + 1].s : Infinity;
    const e = et.filter((x) => x.i && x.s >= r.s - 1 && x.s < fin).sort((a, b) => a.s - b.s)[0];
    const lies = e ? et.filter((x) => x.i === e.i) : [];
    g.duree = lies.length ? Math.max(...lies.map((x) => x.d)) : null;   // null : toutes les entrées sous 16 ms
    g.traitement = lies.length ? Math.max(...lies.map((x) => x.pe - x.ps)) : null;
    g.attente = lies.length ? Math.min(...lies.map((x) => x.ps - x.s)) : null;
  }
  // Témoin : traitement du clic entre 100 et 120 ms et durée au moins égale (la durée inclut la présentation du tap, arrondie à 8 ms)
  const tem = res.gestes[0];
  if (!(tem.traitement >= 100 && tem.traitement <= 120 && tem.duree >= tem.traitement)) res.refus.push(`témoin hors plage : traitement ${tem.traitement}, durée ${tem.duree}`);
  res.octets = octets;
  await ctx.close();
  return res;
}

const ordre = [...VARIANTES];
for (let p = 1; p <= PASSAGES; p++) {
  const tour = ordre.slice(p - 1).concat(ordre.slice(0, p - 1));    // départ décalé à chaque passage
  for (const v of tour) for (const n of (p % 2 ? TAILLES : [...TAILLES].reverse())) {
    let r;
    try { r = await passage(v, n, p); } catch (e) { r = { v, n, passage: p, taux: TAUX, chrome: VERSION, refus: [`exception : ${e.message.split('\n')[0]}`] }; }
    fs.appendFileSync(FICHIER, JSON.stringify(r) + '\n');
    const d = (r.gestes || []).map((g) => `${g.nom}=${g.duree ?? '<16'}`).join(' ');
    console.log(`p${p} ${v.padEnd(10)} N=${String(n).padEnd(4)} pret ${r.pret ? r.pret.t.toFixed(0).padStart(5) : '  —  '} ms  ${r.refus.length ? 'REFUS ' + r.refus.join(' | ') : 'ok'}  ${d}`);
  }
}
await browser.close();
srv.kill();
console.log(`TÉMOINS : ${FICHIER}`);
