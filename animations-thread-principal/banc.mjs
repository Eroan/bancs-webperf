// Banc : une boîte animée par différentes techniques pendant que le thread principal est bloqué ; la capture d'écran
// continue du protocole DevTools (Page.startScreencast) relève la position de la boîte image par image.
// Usage : PASSAGES=5 BLOC=800 REPOS=700 node banc.mjs   → brut/series-<horodatage>-p<N>.json
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { PNG } from 'pngjs';

export const VARIANTES = ['css-transform', 'css-var-billet', 'css-left', 'css-property', 'waapi-transform', 'raf-transform', 'gsap-x', 'motion-transform', 'motion-x'];
const PASSAGES = Number(process.env.PASSAGES || 5), BLOC = Number(process.env.BLOC || 800), REPOS = Number(process.env.REPOS || 700), CYCLES = 3;
const CHOIX = process.env.VARIANTES ? process.env.VARIANTES.split(',') : VARIANTES;
// EXTRAIT=extrait-console.js : le blocage est l'extrait publié, évalué comme dans la console (replMode) ; ses bornes
// sont relevées côté banc (avant l'envoi, au retour), faute d'être écrites par la page.
const EXTRAIT = process.env.EXTRAIT ? readFileSync(new URL(process.env.EXTRAIT, import.meta.url), 'utf8') : null;

// --- serveur local, port libre lu à l'exécution, marqueur relu ---
const FICHIERS = {
  '/': ['page/index.html', 'text/html; charset=utf-8'],
  '/vendor/gsap.min.js': ['node_modules/gsap/dist/gsap.min.js', 'text/javascript'],
  '/vendor/motion.js': ['node_modules/motion/dist/motion.js', 'text/javascript'],
  '/__banc': [null, 'text/plain'],
};
const serveur = createServer((req, res) => {
  const chemin = new URL(req.url, 'http://x').pathname;
  const f = FICHIERS[chemin];
  if (!f) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': f[1], 'cache-control': 'no-store' });
  res.end(f[0] ? readFileSync(new URL(f[0], import.meta.url)) : 'banc-animations');
});
await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
const ORIGINE = `http://127.0.0.1:${serveur.address().port}`;
if ((await (await fetch(ORIGINE + '/__banc')).text()) !== 'banc-animations') { console.log('BANC ABSENT'); process.exit(1); }

// --- position de la boîte rouge dans une image PNG (centre horizontal des pixels rouges) ---
function position(b64) {
  const png = PNG.sync.read(Buffer.from(b64, 'base64'));
  let somme = 0, n = 0;
  const y = Math.floor(png.height / 2);
  for (let x = 0; x < png.width; x++) {
    const i = (png.width * y + x) * 4;
    if (png.data[i] > 200 && png.data[i + 1] < 80 && png.data[i + 2] < 80) { somme += x; n++; }
  }
  return n ? somme / n : null;
}

const navigateur = await chromium.launch({ channel: 'chrome', headless: true });
const version = navigateur.version();
console.log(`Chrome ${version}, origine ${ORIGINE}, ${PASSAGES} passages, bloc ${BLOC} ms, repos ${REPOS} ms, ${CYCLES} cycles`);
const serie = { date: new Date().toISOString(), chrome: version, playwright: '1.65.0', gsap: '3.15.1', motion: '14.14.0', PASSAGES, BLOC, REPOS, CYCLES, passages: [] };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

for (let p = 0; p < PASSAGES; p++) {
  for (const v of CHOIX) { // variantes alternées à chaque passage, contexte neuf à chaque fois
    const ctx = await navigateur.newContext({ viewport: { width: 400, height: 100 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`${ORIGINE}/?v=${v}`, { waitUntil: 'load' });
    const etat = await page.evaluate(() => window.__banc);
    if (!etat.demarre || etat.erreurs.length) { console.log(`ÉCHEC démarrage ${v} : ${etat.erreurs.join(' ; ')}`); process.exit(1); }
    const cdp = await ctx.newCDPSession(page);
    const images = [];
    cdp.on('Page.screencastFrame', (e) => {
      images.push({ t: e.metadata.timestamp * 1000, x: position(e.data) });
      cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
    });
    await pause(500);
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: 400, maxHeight: 100 });
    await pause(REPOS);
    const blocsBanc = [];
    for (let c = 0; c < CYCLES; c++) {
      if (EXTRAIT) {
        const a = Date.now();
        const r = await cdp.send('Runtime.evaluate', { expression: EXTRAIT, replMode: true, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) { console.log('ÉCHEC extrait : ' + JSON.stringify(r.exceptionDetails)); process.exit(1); }
        blocsBanc.push([a, Date.now()]);
      } else await page.evaluate((ms) => window.__bloquer(ms), BLOC);
      await pause(REPOS);
    }
    await cdp.send('Page.stopScreencast');
    const blocs = EXTRAIT ? blocsBanc : (await page.evaluate(() => window.__banc)).blocs;
    serie.passages.push({ passage: p, variante: v, blocs, images });
    await ctx.close();
    process.stdout.write(`p${p} ${v} : ${images.length} images, ${blocs.length} blocs\n`);
  }
}
await navigateur.close();
serveur.close();
mkdirSync(new URL('./brut/', import.meta.url), { recursive: true });
const nom = `brut/series-${serie.date.replace(/[:.]/g, '-')}-p${PASSAGES}${EXTRAIT ? '-extrait' : ''}${process.env.VARIANTES ? '-partielle' : ''}.json`;
writeFileSync(new URL(nom, import.meta.url), JSON.stringify(serie));
console.log(`écrit ${nom}`);
