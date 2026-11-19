// Un processus par couple (minificateur, mode) : minifie chaque page du corpus et écrit sorties/<mode>/<minificateur>/.
// Usage : node travailleur.mjs <minificateur> <html|max>   (appelé par banc.mjs)
// Imprime une ligne par page : fichier, ok|echec, message ; un échec n'écrit pas de sortie (page comptée non minifiée).
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createMinifiers } from './minifieurs.mjs';

const [nom, mode] = process.argv.slice(2);
const lignes = readFileSync(new URL('./brut/corpus.tsv', import.meta.url), 'utf8').trim().split('\n').slice(1).map((l) => l.split('\t'));
const minifierConfig = JSON.parse(readFileSync(new URL('./html-minifier.config.json', import.meta.url), 'utf8'));
// Variantes du banc (hors projet) : HTML Minifier sans une option, pour isoler sa part du gain et de la casse.
const VARIANTES = { 'minifier-sans-vides': { removeEmptyElements: false }, 'minifier-sans-css-inutilise': { removeUnusedCSS: false } };
const m = VARIANTES[nom]
  ? createMinifiers({ isHtmlOnly: mode === 'html', minifierConfig: { ...minifierConfig, ...VARIANTES[nom] } }).minifier
  : createMinifiers({ isHtmlOnly: mode === 'html', minifierConfig })[nom];
if (!m) { console.error(`minificateur inconnu : ${nom}`); process.exit(2); }
if (m.init) await m.init();
const dir = new URL(`./sorties/${mode}/${nom}/`, import.meta.url);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (const [fichier, , url, code, , , empreinte] of lignes) {
  if (code !== '200' || !empreinte) continue;
  const brut = readFileSync(new URL(`./corpus/${fichier}`, import.meta.url));
  try {
    const sortie = await m.minify(m.isBufferInput ? brut : brut.toString('utf8'), url);
    const b = Buffer.isBuffer(sortie) ? sortie : Buffer.from(String(sortie), 'utf8');
    if (b.length === 0) throw new Error('sortie vide');
    writeFileSync(new URL(fichier, dir), b);
    console.log(`${fichier}\tok\t`);
  } catch (e) {
    console.log(`${fichier}\techec\t${String(e && e.message || e).split('\n')[0].slice(0, 200)}`);
  }
}
