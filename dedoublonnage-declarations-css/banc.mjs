// Banc : CSS Dedup (UDJO) puis minification puis compression, sur un corpus de feuilles réelles ; témoins de cascade dans Chrome.
// Usage : node banc.mjs   (après node recuperer.mjs) — écrit brut/*.json et sorties/ (non commité)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import zlib from 'node:zlib';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { dedup, analyze } from 'css-dedup';
import { transform } from 'lightningcss';
import postcss from 'postcss';
import cssnano from 'cssnano';
import { minify as cssoMinify } from 'csso';
import CleanCSS from 'clean-css';
import { chromium } from 'playwright';
import { CORPUS } from './recuperer.mjs';

const ICI = new URL('./', import.meta.url);
const lire = (rel) => readFileSync(new URL(rel, ICI), 'utf8');
const version = (p) => JSON.parse(lire(`node_modules/${p}/package.json`)).version;
mkdirSync(new URL('brut/', ICI), { recursive: true });
mkdirSync(new URL('sorties/', ICI), { recursive: true });

// --- dédoublonnage ---
const MODES = {
  aucun: null,
  f: {},
  fs: { savingsOnly: true },
  fa: { aggressive: true },
  fas: { aggressive: true, savingsOnly: true },
};

// --- minification ---
const MINIF = {
  aucune: (css) => ({ css }),
  lightningcss: (css, nom) => {
    const warnings = [];
    const r = transform({ filename: nom, code: Buffer.from(css), minify: true, errorRecovery: true });
    return { css: r.code.toString(), avertissements: r.warnings.length };
  },
  cssnano: async (css) => ({ css: (await postcss([cssnano({ preset: 'default' })]).process(css, { from: undefined })).css }),
  csso: (css) => ({ css: cssoMinify(css).css }),
  cleancss1: (css) => { const r = new CleanCSS({ level: 1 }).minify(css); return { css: r.styles, erreurs: r.errors.length }; },
  cleancss2: (css) => { const r = new CleanCSS({ level: 2 }).minify(css); return { css: r.styles, erreurs: r.errors.length }; },
};

const octets = (s) => Buffer.byteLength(s, 'utf8');
const gzip = (s) => zlib.gzipSync(Buffer.from(s), { level: 6 }).length;
const brotli = (s, q = 11) => {
  const b = Buffer.from(s);
  return zlib.brotliCompressSync(b, { params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: q,
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: b.length,
  } }).length;
};

function valide(css, entree) {
  try { postcss.parse(css); } catch (e) { return `PostCSS : ${e.message}`; }
  if (octets(css) < octets(entree) / 2) return `sortie de ${octets(css)} octets pour ${octets(entree)} en entrée`;
  return null;
}

// --- structure : règles de style, sélecteurs (listes dépliées), déclarations ---
// sujet universel : composé le plus à droite sans classe, id, balise ni attribut (`> *`, `:nth-child()` seul, `::selection`),
// que Chromium range dans le seau universel et essaie sur chaque élément (rule_set.cc)
function sujetUniversel(sel) {
  let t = sel.trim();
  for (let i = 0; i < 5; i++) t = t.replace(/\([^()]*\)/g, '()');
  const c = t.split(/\s*[>+~]\s*|\s+/).filter(Boolean).at(-1) || '';
  return !/[.#\[]/.test(c) && !/^[a-zA-Z]/.test(c);
}
function structureCss(css) {
  let regles = 0, selecteurs = 0, declarations = 0, universels = 0;
  postcss.parse(css).walkRules((r) => {
    if (r.parent && r.parent.type === 'atrule' && /keyframes$/i.test(r.parent.name)) return;   // 0%, from, to : pas des sélecteurs
    regles++;
    let sels; try { sels = r.selectors; } catch { sels = [r.selector]; }
    selecteurs += sels.length; universels += sels.filter(sujetUniversel).length;
  });
  postcss.parse(css).walkDecls(() => { declarations++; });
  return { regles, selecteurs, declarations, universels };
}
// témoins de la détection, vérifiés au lancement
for (const [sel, attendu] of [['.row > *', true], ['.a :nth-child(2)', true], ['::selection', true], ['*', true], ['.btn', false],
  ['ul li', false], ['[data-x]', false], ['.a:not(.b > *)', false], ['.t > tbody > tr:nth-of-type(odd) > *', true]]) {
  if (sujetUniversel(sel) !== attendu) throw new Error(`TÉMOIN sujetUniversel : ${sel}`);
}

// --- conservation des déclarations : (portée, sélecteur, propriété, valeur normalisée) ---
function couples(css) {
  const s = new Set();
  postcss.parse(css).walkRules((rule) => {
    const chaine = [];
    for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
      chaine.unshift(p.type === 'atrule' ? `@${p.name} ${p.params}` : p.selector);
    }
    const portee = chaine.join(' > ').replace(/\s+/g, ' ');
    let sels;
    try { sels = rule.selectors; } catch { sels = [rule.selector]; }
    for (const node of rule.nodes || []) {
      if (node.type !== 'decl') continue;
      const v = node.value.replace(/\s+/g, ' ').trim().toLowerCase();
      for (const sel of sels) s.add(`${portee} | ${sel.trim().replace(/\s+/g, ' ')} | ${node.prop.toLowerCase()}${node.important ? ' !important' : ''} = ${v}`);
    }
  });
  return s;
}
const ALIAS = { 'word-wrap': 'overflow-wrap', 'grid-gap': 'gap', 'grid-row-gap': 'row-gap', 'grid-column-gap': 'column-gap' };
function ecart(avant, apres) {
  const perdus = [...avant].filter((x) => !apres.has(x));
  const gagnes = [...apres].filter((x) => !avant.has(x));
  // pour chaque couple perdu : les couples de la sortie de même portée, même sélecteur, même propriété (ou son alias)
  const prefixe = (x) => x.slice(0, x.lastIndexOf(' = '));
  const parPrefixe = new Map();
  for (const x of apres) { const k = prefixe(x); if (!parPrefixe.has(k)) parPrefixe.set(k, []); parPrefixe.get(k).push(x); }
  const voisins = perdus.map((x) => {
    const k = prefixe(x);
    const [portee, sel, prop] = k.split(' | ');
    const [nomProp, imp] = prop.split(' ');
    const alias = ALIAS[nomProp] ? `${portee} | ${sel} | ${ALIAS[nomProp]}${imp ? ' ' + imp : ''}` : null;
    return { perdu: x, sortie: [...(parPrefixe.get(k) || []), ...((alias && parPrefixe.get(alias)) || [])] };
  });
  return { perdus: perdus.length, gagnes: gagnes.length, voisins, liste_gagnes: gagnes };
}

// --- série de tailles ---
const mesures = [];
const conservation = [];
const dedups = [];
for (const [nom] of CORPUS) {
  const src = lire(`corpus/${nom}`);
  const brutDisque = readFileSync(new URL(`corpus/${nom}`, ICI)).length;
  const couplesSrc = couples(src);
  const constats = analyze(src, { from: nom }).findings;
  const constatsAgressifs = analyze(src, { from: nom, aggressive: true }).findings;
  for (const [mode, opts] of Object.entries(MODES)) {
    let css = src;
    if (opts) {
      const r = dedup(src, { from: nom, ...opts });
      css = r.css;
      const err = valide(css, src);
      if (err) throw new Error(`${nom} ${mode} : ${err}`);
      writeFileSync(new URL(`sorties/${nom.replace(/\.css$/, '')}.${mode}.css`, ICI), css);
      dedups.push({ fichier: nom, mode, appliques: r.applied.length, ignores: r.skipped.length,
        retenus: r.withheld ? r.withheld.count : 0, octets: r.bytes, structure: structureCss(css) });
      conservation.push({ fichier: nom, mode, ...ecart(couplesSrc, couples(css)) });
    } else {
      dedups.push({ fichier: nom, mode, constats: constats.length, constats_agressifs: constatsAgressifs.length, structure: structureCss(src) });
    }
    for (const [minif, fn] of Object.entries(MINIF)) {
      const r = await fn(css, nom);
      const err = valide(r.css, css === src ? src : css);
      if (err) throw new Error(`${nom} ${mode} ${minif} : ${err}`);
      const m = { fichier: nom, mode, minif, brut: octets(r.css), gzip6: gzip(r.css), br5: brotli(r.css, 5), br11: brotli(r.css) };
      if (r.avertissements !== undefined) m.avertissements = r.avertissements;
      if (r.erreurs !== undefined) m.erreurs = r.erreurs;
      if (mode === 'aucun' && minif === 'aucune' && m.brut !== brutDisque) throw new Error(`TÉMOIN DE TAILLE : ${nom} ${m.brut} ≠ ${brutDisque}`);
      mesures.push(m);
    }
  }
  // variante inverse : minifiée par Lightning CSS, puis -f -s
  const min = MINIF.lightningcss(src, nom).css;
  const r = dedup(min, { from: nom, savingsOnly: true });
  const err = valide(r.css, min);
  if (err) throw new Error(`${nom} inverse : ${err}`);
  mesures.push({ fichier: nom, mode: 'lightningcss+fs', minif: 'inverse', brut: octets(r.css), gzip6: gzip(r.css), br5: brotli(r.css, 5), br11: brotli(r.css),
    appliques: r.applied.length });
  console.log(`${nom} : ${Object.keys(MODES).length * Object.keys(MINIF).length + 1} mesures`);
}
const ATTENDU = CORPUS.length * (Object.keys(MODES).length * Object.keys(MINIF).length + 1);
if (mesures.length !== ATTENDU) { console.error(`COMPLÉTUDE : ${mesures.length} mesures, ${ATTENDU} attendues`); process.exit(1); }

// --- témoins de cascade ---
const CAS = {
  sur: { css: '.a{color:red}.b{color:red}', html: '<p id="e1" class="a">a</p><p id="e2" class="b">b</p>',
    naif: '.a,.b{color:red}' },
  intercale: { css: '.a{color:red}.x{color:blue}.b{color:red}', html: '<p id="e1" class="a x">a x</p><p id="e2" class="b">b</p>',
    naif: '.x{color:blue}.a,.b{color:red}' },
  blocs: { css: '@media (min-width:1px){.a{color:red}}.x{color:blue}@media (min-width:1px){.b{color:red}}',
    html: '<p id="e1" class="a x">a x</p><p id="e2" class="b">b</p>',
    naif: '.x{color:blue}@media (min-width:1px){.a,.b{color:red}}' },
  hack: { css: '.a{color:red}.b::-moz-selection{color:red}', html: '<p id="e1" class="a">a</p><p id="e2" class="b">b</p>',
    naif: '.a,.b::-moz-selection{color:red}' },
};
const VARIANTES = {
  f: {},
  fa: { aggressive: true },
  'f-sans-liste': { ignoreSelectorsDefaults: false },
};
const navigateur = await chromium.launch({ channel: 'chrome', headless: true });
const versionChrome = navigateur.version();
const temoins = [];
async function rendre(css, html) {
  const ctx = await navigateur.newContext();
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><style>${css}</style>${html}`);
  const r = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[id^=e]')].map((e) => [e.id, getComputedStyle(e).color])));
  await ctx.close();
  return r;
}
for (const [cas, d] of Object.entries(CAS)) {
  const ref = await rendre(d.css, d.html);
  const naif = await rendre(d.naif, d.html);
  const ligne = { cas, reference: ref, naif, naif_change: JSON.stringify(ref) !== JSON.stringify(naif), variantes: {} };
  for (const [v, opts] of Object.entries(VARIANTES)) {
    const r = dedup(d.css, opts);
    const rendu = await rendre(r.css, d.html);
    ligne.variantes[v] = { css: r.css.replace(/\s+/g, ' ').trim(), appliques: r.applied.length,
      ignores: r.skipped.map((s) => s.reason), rendu, change: JSON.stringify(ref) !== JSON.stringify(rendu) };
  }
  temoins.push(ligne);
}
await navigateur.close();
// garde : le cas sûr doit fusionner sans changer le rendu, et chaque fusion naïve d'un cas piégé doit changer le rendu
const sur = temoins.find((t) => t.cas === 'sur');
if (!(sur.variantes.f.appliques > 0 && !sur.variantes.f.change)) { console.error('TÉMOIN POSITIF : le cas sûr n\'a pas fusionné'); process.exit(1); }
for (const t of temoins) if (t.cas !== 'sur' && !t.naif_change) { console.error(`TÉMOIN NÉGATIF : la fusion naïve de ${t.cas} ne change pas le rendu`); process.exit(1); }

let idle = '';
try { idle = execFileSync('top', ['-l', '1', '-n', '0']).toString().split('\n').find((l) => l.includes('CPU usage')) || ''; } catch {}
const machine = [
  `date : ${new Date().toISOString()}`,
  `os : ${os.type()} ${os.release()} ${os.arch()} ; ${os.cpus()[0].model}`,
  `node : ${process.version}`,
  `chrome : ${versionChrome}`,
  ...['css-dedup', 'lightningcss', 'cssnano', 'csso', 'clean-css', 'postcss', 'playwright'].map((p) => `${p} : ${version(p)}`),
  `charge : ${idle.trim()}`,
].join('\n') + '\n';
writeFileSync(new URL('brut/machine.txt', ICI), machine);
writeFileSync(new URL('brut/tailles.json', ICI), JSON.stringify(mesures, null, 1));
writeFileSync(new URL('brut/dedoublonnage.json', ICI), JSON.stringify(dedups, null, 1));
writeFileSync(new URL('brut/conservation.json', ICI), JSON.stringify(conservation, null, 1));
writeFileSync(new URL('brut/temoins.json', ICI), JSON.stringify(temoins, null, 1));
console.log(machine);
console.log(`TÉMOINS OK : ${mesures.length}/${ATTENDU} mesures, taille brute = disque, cas sûr fusionné, ${temoins.length - 1} fusions naïves qui changent le rendu`);
