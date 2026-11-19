// Récupère une fois les pages de sites.json dans corpus/ et écrit brut/corpus.tsv (code, type, taille, empreinte).
// Usage : node recuperer.mjs           → télécharge les pages absentes de corpus/, réécrit brut/corpus.tsv
//         node recuperer.mjs --verifier → ne télécharge rien, contrôle corpus/ contre brut/corpus.tsv (sortie 1 sur écart)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SITES = JSON.parse(readFileSync(new URL('./sites.json', import.meta.url), 'utf8'));
const DIR = new URL('./corpus/', import.meta.url);
const TSV = new URL('./brut/corpus.tsv', import.meta.url);
const UA = 'minifier-benchmarks/0.0'; // agent utilisateur du projet j9t/minifier-benchmarks
const sha = (b) => createHash('sha256').update(b).digest('hex');
export const nomFichier = (i, nom) =>
  String(i + 1).padStart(3, '0') + '-' + nom.normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) + '.html';

if (process.argv.includes('--verifier')) {
  const lignes = readFileSync(TSV, 'utf8').trim().split('\n').slice(1).map((l) => l.split('\t'));
  let ecarts = 0, presents = 0;
  for (const [fichier, , , code, , , empreinte] of lignes) {
    if (code !== '200' || !empreinte) continue;
    const f = new URL(fichier, DIR);
    if (!existsSync(f)) { console.log(`ABSENT ${fichier}`); ecarts++; continue; }
    presents++;
    if (sha(readFileSync(f)) !== empreinte) { console.log(`EMPREINTE ${fichier}`); ecarts++; }
  }
  console.log(`corpus : ${presents} pages contrôlées, ${ecarts} écart(s)`);
  process.exit(ecarts ? 1 : 0);
}

mkdirSync(DIR, { recursive: true });
const entrees = Object.entries(SITES);
const lignes = new Array(entrees.length);
let suivant = 0;
async function ouvrier() {
  while (suivant < entrees.length) {
    const i = suivant++;
    const [nom, url] = entrees[i];
    const fichier = nomFichier(i, nom);
    const f = new URL(fichier, DIR);
    let code = '', type = '', taille = '', empreinte = '', finale = '';
    try {
      if (existsSync(f)) {
        const b = readFileSync(f); code = '200'; type = 'text/html (déjà présent)'; taille = b.length; empreinte = sha(b); finale = url;
      } else {
        const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip, br' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
        code = String(r.status); type = r.headers.get('content-type') || ''; finale = r.url;
        const b = Buffer.from(await r.arrayBuffer());
        taille = b.length;
        if (r.status === 200 && /text\/html/i.test(type) && b.length > 1024) { writeFileSync(f, b); empreinte = sha(b); }
      }
    } catch (e) { code = 'ERREUR ' + e.message.split('\n')[0]; }
    lignes[i] = [fichier, nom, url, code, type, taille, empreinte, finale].join('\t');
    process.stdout.write(`${fichier}\t${code}\t${taille}\n`);
  }
}
await Promise.all(Array.from({ length: 8 }, ouvrier));
const date = new Date().toISOString();
writeFileSync(TSV, `fichier\tnom\turl\tcode\ttype\toctets\tsha256\turl_finale\n` + lignes.join('\n') + '\n');
writeFileSync(new URL('./brut/corpus-releve.txt', import.meta.url), `relevé ${date}, agent ${UA}, Node ${process.version}\n`);
const gardes = lignes.filter((l) => l.split('\t')[6]).length;
console.log(`corpus : ${gardes}/${entrees.length} pages gardées (200, text/html, > 1 024 octets)`);
if (gardes === 0) process.exit(1);
