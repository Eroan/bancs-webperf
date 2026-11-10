// Récupère le corpus (feuilles publiques à version épinglée) dans corpus/ et contrôle les empreintes.
// Usage : node recuperer.mjs            → télécharge ce qui manque, vérifie SHA256SUMS (sortie 1 sur écart)
//         node recuperer.mjs --ecrire   → (première fois) écrit SHA256SUMS d'après les fichiers téléchargés
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export const CORPUS = [
  ['generatepress-3.6.1-main.css', 'https://themes.svn.wordpress.org/generatepress/3.6.1/assets/css/main.css'],
  ['astra-4.14.2-main.min.css', 'https://themes.svn.wordpress.org/astra/4.14.2/assets/css/minified/main.min.css'],
  ['kadence-1.6.0-global.min.css', 'https://themes.svn.wordpress.org/kadence/1.6.0/assets/css/global.min.css'],
  ['woocommerce-11.2.2.css', 'https://plugins.svn.wordpress.org/woocommerce/tags/11.2.2/assets/css/woocommerce.css'],
  ['elementor-4.4.0-frontend.css', 'https://plugins.svn.wordpress.org/elementor/tags/4.4.0/assets/css/frontend.css'],
  ['wordpress-7.1.4-block-library.css', 'https://core.svn.wordpress.org/tags/7.1.4/wp-includes/css/dist/block-library/style.css'],
  ['bootstrap-5.3.8.css', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.css'],
  ['bulma-1.0.4.css', 'https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.css'],
];

const DIR = new URL('./corpus/', import.meta.url);
// pages de rendu (rendu.mjs) : exemples officiels de la publication GitHub v5.3.8
const EXEMPLES = 'https://github.com/twbs/bootstrap/releases/download/v5.3.8/bootstrap-5.3.8-examples.zip';
const EXEMPLES_SHA = 'b851efe3b1589a4487c44a6b55671bbba54abb7740673be9c47a1e271ead1782';
const SUMS = new URL('./SHA256SUMS', import.meta.url);
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

async function main() {
  mkdirSync(DIR, { recursive: true });
  for (const [nom, url] of CORPUS) {
    const f = new URL(nom, DIR);
    if (existsSync(f)) continue;
    const r = await fetch(url);
    const type = r.headers.get('content-type') || '';
    if (r.status !== 200 || !type.startsWith('text/css')) throw new Error(`${url} → ${r.status} ${type}`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    console.log(`téléchargé ${nom}`);
  }
  const ex = new URL('exemples/', DIR);
  mkdirSync(ex, { recursive: true });
  const zip = new URL('ex.zip', ex);
  if (!existsSync(zip)) {
    const r = await fetch(EXEMPLES);
    if (r.status !== 200) throw new Error(`${EXEMPLES} → ${r.status}`);
    writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
    console.log('téléchargé bootstrap-5.3.8-examples.zip');
  }
  if (sha(readFileSync(zip)) !== EXEMPLES_SHA) { console.error('EMPREINTE DIFFÉRENTE : bootstrap-5.3.8-examples.zip'); process.exit(1); }
  if (!existsSync(new URL('bootstrap-5.3.8-examples/cheatsheet/index.html', ex))) execFileSync('unzip', ['-q', '-o', zip.pathname, '-d', ex.pathname]);
  const lignes = CORPUS.map(([nom]) => `${sha(readFileSync(new URL(nom, DIR)))}  ${nom}`);
  if (process.argv.includes('--ecrire')) {
    writeFileSync(SUMS, lignes.join('\n') + '\n');
    console.log(`SHA256SUMS écrit (${lignes.length} fichiers)`);
    return;
  }
  const attendu = new Map(readFileSync(SUMS, 'utf8').trim().split('\n').map((l) => l.split(/\s+/).reverse()));
  let ecarts = 0;
  for (const l of lignes) {
    const [h, nom] = l.split(/\s+/);
    if (attendu.get(nom) !== h) { ecarts++; console.error(`EMPREINTE DIFFÉRENTE : ${nom}`); }
  }
  if (ecarts || attendu.size !== CORPUS.length) process.exit(1);
  console.log(`corpus vérifié : ${CORPUS.length} fichiers, empreintes conformes`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
