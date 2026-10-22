// Banc : No-Vary-Search et cache disque de Chrome selon le Cache-Control du HTML. Voir PROTOCOLE.md.
// Usage : PASSAGES=10 SORTIE=<dossier> node banc.mjs   (serveur intégré, port libre)
import http from 'node:http';
import fs from 'node:fs';
import { chromium } from 'playwright';

const PASSAGES = Number(process.env.PASSAGES || 10);
const SORTIE = process.env.SORTIE || 'brut/essai';
const NVS = 'params=("utm_source")';
const CAS = {
  'max-age=600': { 'Cache-Control': 'max-age=600', 'No-Vary-Search': NVS },
  'sans Cache-Control, ETag': { ETag: '"v1"', 'No-Vary-Search': NVS },
  'no-cache, ETag': { 'Cache-Control': 'no-cache', ETag: '"v1"', 'No-Vary-Search': NVS },
  'max-age=0, must-revalidate, ETag': { 'Cache-Control': 'max-age=0, must-revalidate', ETag: '"v1"', 'No-Vary-Search': NVS },
  'no-store': { 'Cache-Control': 'no-store', 'No-Vary-Search': NVS },
  'sans Cache-Control ni validateur (WordPress par défaut)': { 'No-Vary-Search': NVS },
  'témoin : max-age=600 sans No-Vary-Search': { 'Cache-Control': 'max-age=600' },
};
let cas, requetes = [];
const srv = http.createServer((req, res) => {
  if (req.url.startsWith('/favicon')) { res.writeHead(404); res.end(); return; }
  const h = { 'Content-Type': 'text/html; charset=utf-8', ...CAS[cas] };
  const revalidation = Boolean(h.ETag) && req.headers['if-none-match'] === h.ETag;
  requetes.push({ url: req.url, revalidation });
  if (revalidation) { res.writeHead(304, h); res.end(); return; }
  res.writeHead(200, h);
  res.end('<!doctype html><meta charset="utf-8"><title>banc</title><a id="l" href="/p?utm_source=b">b</a>');
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch({ channel: 'chrome' });
const mesures = [];
const noms = Object.keys(CAS);
for (let p = 0; p < PASSAGES; p++) {
  for (const k of noms.map((_, i) => noms[(i + p) % noms.length])) {   // ordre tourné
    cas = k; requetes = [];
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${base}/p?utm_source=a`);
    await Promise.all([page.waitForNavigation(), page.click('#l')]);
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      return { deliveryType: n.deliveryType, transferSize: n.transferSize, locationSearch: location.search };
    });
    mesures.push({ cas: k, passage: p + 1, requetes, ...nav });
    await ctx.close();
  }
}
const chrome = browser.version();
await browser.close(); srv.close();
fs.mkdirSync(SORTIE, { recursive: true });
fs.writeFileSync(`${SORTIE}/mesures.json`, JSON.stringify({ chrome, playwright: '1.64.1', passages: PASSAGES, cas: CAS, mesures }, null, 1));
console.log(`chrome ${chrome} ; ${mesures.length} parcours -> ${SORTIE}/mesures.json`);
