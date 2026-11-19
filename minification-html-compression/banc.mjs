// Banc : minifie le corpus (un processus par couple minificateur × mode), puis mesure brut, gzip 6, Brotli 5 et 11,
// aller-retour de compression et conservation du contenu. Écrit brut/mesures.tsv et brut/echecs.tsv.
// Usage : node banc.mjs   (après node recuperer.mjs)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import zlib from 'node:zlib';
import { Parser } from 'htmlparser2';
import { createHash } from 'node:crypto';
import { decodeHTML } from 'entities';

const COUPLES = {
  html: ['swchtml', 'minifier', 'htmlnano', 'minifyhtml', 'minimize', 'minifier-sans-vides'],
  max: ['swchtml', 'minifier', 'htmlnano', 'minify', 'minifyhtml', 'minimize', 'minifier-sans-vides', 'minifier-sans-css-inutilise'],
};
const BALISES = ['a', 'img', 'source', 'picture', 'script_src', 'link', 'meta', 'iframe', 'video', 'svg', 'use', 'input', 'button', 'form'];
const VIDES = ['i', 'span']; // éléments vides : icônes posées par une classe

const corpus = readFileSync(new URL('./brut/corpus.tsv', import.meta.url), 'utf8').trim().split('\n').slice(1)
  .map((l) => l.split('\t')).filter((c) => c[3] === '200' && c[6]);

// --- instruments ---
function compresser(b) {
  const gz = zlib.gzipSync(b, { level: 6 });
  const p = (q) => ({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: q, [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: b.length } });
  const br5 = zlib.brotliCompressSync(b, p(5));
  const br11 = zlib.brotliCompressSync(b, p(11));
  const ok = zlib.gunzipSync(gz).equals(b) && zlib.brotliDecompressSync(br5).equals(b) && zlib.brotliDecompressSync(br11).equals(b);
  return { brut: b.length, gz: gz.length, br5: br5.length, br11: br11.length, allerRetour: ok };
}

export function conservation(html) {
  const comptes = Object.fromEntries([...BALISES, ...VIDES.map((v) => v + '_vide')].map((k) => [k, 0]));
  let texte = '', exclu = 0;
  const pile = []; // [nom, a_du_contenu]
  const p = new Parser({
    onopentag(nom, attrs) {
      if (nom in comptes) comptes[nom]++;
      if (nom === 'script' && attrs.src) comptes.script_src++;
      if (['script', 'style', 'template', 'noscript'].includes(nom)) exclu++;
      for (const e of pile) e[1] = true;
      pile.push([nom, false]);
    },
    ontext(t) {
      if (!exclu) texte += t;
      if (t.trim()) for (const e of pile) e[1] = true;
    },
    onclosetag(nom) {
      if (['script', 'style', 'template', 'noscript'].includes(nom)) exclu = Math.max(0, exclu - 1);
      // dépile jusqu'à l'élément fermé (balises fermantes omises)
      for (let k = pile.length - 1; k >= 0; k--) {
        if (pile[k][0] === nom) {
          const [n, plein] = pile[k];
          if (VIDES.includes(n) && !plein) comptes[n + '_vide']++;
          pile.length = k;
          break;
        }
      }
    },
  }, { decodeEntities: false });
  p.write(html); p.end();
  // texte visible sans aucun blanc : une fusion de blocs (blancs retirés entre deux paragraphes) ne compte pas,
  // une perte ou un ajout de caractère compte
  const t = decodeHTML(texte).replace(/\s+/g, '');
  return { texte: t.length, texte_sha: createHash('sha1').update(t).digest('hex').slice(0, 16), ...comptes };
}

// --- contrôle de l'instrument de conservation ---
{
  const tem = '<p>Un <a href="/x">lien</a> et <i class="ic"></i> <a href="/y">deux</a></p><script>var t="<a>"</script>';
  const moins = '<p>Un <a href="/x">lien</a> et  deux</p><script>var t="<a>"</script>';
  const a = conservation(tem), b = conservation(tem), c = conservation(moins);
  const zero = JSON.stringify(a) === JSON.stringify(b);
  const un = a.a - c.a === 1 && a.i_vide - c.i_vide === 1;
  console.log(`TÉMOIN conservation : identique ${zero ? 'OK' : 'ÉCHEC'} ; un lien et une icône retirés ${un ? 'OK' : 'ÉCHEC'} (a ${a.a}→${c.a}, i vides ${a.i_vide}→${c.i_vide})`);
  if (!zero || !un) process.exit(1);
}

// --- minification ---
const echecs = [];
for (const [mode, noms] of Object.entries(COUPLES)) {
  for (const nom of noms) {
    let sortie;
    try {
      sortie = execFileSync(process.execPath, ['travailleur.mjs', nom, mode], { cwd: new URL('.', import.meta.url), encoding: 'utf8', maxBuffer: 1 << 26, timeout: 30 * 60 * 1000 });
    } catch (e) {
      sortie = e.stdout || '';
      echecs.push([mode, nom, '*', `processus interrompu : ${String(e.message).split('\n')[0]}`]);
    }
    const ls = sortie.trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
    const ko = ls.filter((l) => l[1] !== 'ok');
    for (const l of ko) echecs.push([mode, nom, l[0], l[2]]);
    console.log(`${mode}\t${nom}\t${ls.length - ko.length}/${corpus.length} minifiées, ${ko.length} échec(s)`);
  }
}

// --- mesures ---
const entete = ['fichier', 'mode', 'minificateur', 'statut', 'brut', 'gz6', 'br5', 'br11', 'texte', 'texte_sha', ...BALISES, ...VIDES.map((v) => v + '_vide')];
const lignes = [entete.join('\t')];
let allerRetourKo = 0, attendues = 0, produites = 0;
for (const [fichier] of corpus) {
  const orig = readFileSync(new URL(`./corpus/${fichier}`, import.meta.url));
  const co = compresser(orig); if (!co.allerRetour) allerRetourKo++;
  const cons = conservation(orig.toString('utf8'));
  const ligne = (mode, nom, statut, c, k) => [fichier, mode, nom, statut, c.brut, c.gz, c.br5, c.br11, k.texte, k.texte_sha, ...BALISES.map((b) => k[b]), ...VIDES.map((v) => k[v + '_vide'])].join('\t');
  lignes.push(ligne('-', 'aucune', 'ok', co, cons));
  for (const [mode, noms] of Object.entries(COUPLES)) {
    for (const nom of noms) {
      attendues++;
      const f = new URL(`./sorties/${mode}/${nom}/${fichier}`, import.meta.url);
      if (!existsSync(f)) { lignes.push(ligne(mode, nom, 'echec', co, cons)); continue; } // échec : page comptée non minifiée
      produites++;
      const b = readFileSync(f);
      const c = compresser(b); if (!c.allerRetour) allerRetourKo++;
      lignes.push(ligne(mode, nom, 'ok', c, conservation(b.toString('utf8'))));
    }
  }
}
writeFileSync(new URL('./brut/mesures.tsv', import.meta.url), lignes.join('\n') + '\n');
writeFileSync(new URL('./brut/echecs.tsv', import.meta.url), ['mode\tminificateur\tfichier\tmessage', ...echecs.map((e) => e.join('\t'))].join('\n') + '\n');
console.log(`COMPLÉTUDE : ${produites}/${attendues} sorties, ${attendues - produites} échec(s) comptés non minifiés ; ${corpus.length} pages`);
console.log(`ALLER-RETOUR compression : ${allerRetourKo === 0 ? 'OK' : allerRetourKo + ' ÉCHEC(S)'}`);
if (allerRetourKo) process.exit(1);
