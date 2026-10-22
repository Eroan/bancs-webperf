// Banc : ce que retarde le bridage réseau CDP. Voir PROTOCOLE.md.
// Usage : PORT=<port du serveur> PASSAGES=10 SORTIE=<dossier> node banc.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const PORT = process.env.PORT;
const PASSAGES = Number(process.env.PASSAGES || 10);
const SORTIE = process.env.SORTIE || 'brut/essai';
const BASE = `http://127.0.0.1:${PORT}`;

// Slow 4G de Lighthouse (constants.js) : 150 ms × 3,75 ; 1,6 Mbit/s × 0,9 ; 750 kbit/s × 0,9
const S4G = { latency: 562.5, downloadThroughput: 1474.56 * 1024 / 8, uploadThroughput: 675 * 1024 / 8 };
const CONDITIONS = {
  aucun: null,
  L40:  { m: 'Network.emulateNetworkConditions', p: { offline: false, latency: 40, downloadThroughput: -1, uploadThroughput: -1 } },
  L562: { m: 'Network.emulateNetworkConditions', p: { offline: false, latency: 562.5, downloadThroughput: -1, uploadThroughput: -1 } },
  S4G:  { m: 'Network.emulateNetworkConditions', p: { offline: false, ...S4G } },
  R562: { m: 'Network.emulateNetworkConditionsByRule', p: { matchedNetworkConditions: [{ urlPattern: '', latency: 562.5, downloadThroughput: -1, uploadThroughput: -1 }] } },
};
const DELAIS = [0, 300, 800];
const TAILLES = [2048, 102400];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const version = browser.version();
const mesures = [];
let id = 0;

async function charge(code, delai, taille) {
  id += 1;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const ev = {};
  cdp.on('Network.requestWillBeSent', (e) => { if (e.type === 'Document' && !ev.rid) { ev.rid = e.requestId; ev.envoi = e.timestamp; } });
  cdp.on('Network.responseReceived', (e) => { if (e.requestId === ev.rid) { ev.recu = e.timestamp; ev.timing = e.response.timing; } });
  cdp.on('Network.loadingFinished', (e) => { if (e.requestId === ev.rid) ev.fini = e.timestamp; });
  await cdp.send('Network.enable');
  const c = CONDITIONS[code];
  if (c) await cdp.send(c.m, c.p);
  const url = `${BASE}/doc?delai=${delai}&taille=${taille}&id=${id}`;
  await page.goto(url, { waitUntil: 'load' });
  const nt = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const i = performance.getEntriesByType('resource').find((r) => r.name.includes('/img'));
    const p = (o, k) => (o ? Math.round(o[k] * 10) / 10 : null);
    return {
      requestStart: p(n, 'requestStart'), responseStart: p(n, 'responseStart'), responseEnd: p(n, 'responseEnd'),
      domInteractive: p(n, 'domInteractive'),
      img: i ? { requestStart: p(i, 'requestStart'), responseStart: p(i, 'responseStart'), responseEnd: p(i, 'responseEnd') } : null,
    };
  });
  const serveur = await (await fetch(`${BASE}/journal?id=${id}`)).json();
  const ms = (a, b) => (a != null && b != null ? Math.round((b - a) * 10000) / 10 : null);
  mesures.push({
    code, delai, taille, id, ...nt,
    cdp: {
      recu: ms(ev.envoi, ev.recu), fini: ms(ev.envoi, ev.fini),
      receiveHeadersStart: ev.timing ? Math.round(ev.timing.receiveHeadersStart * 10) / 10 : null,
      sendEnd: ev.timing ? Math.round(ev.timing.sendEnd * 10) / 10 : null,
    },
    serveur,
  });
  await ctx.close();
}

const codes = Object.keys(CONDITIONS);
for (let p = 0; p < PASSAGES; p++) {
  const ordre = codes.map((_, i) => codes[(i + p) % codes.length]);   // ordre tourné à chaque passage
  for (const code of ordre) for (const delai of DELAIS) for (const taille of TAILLES) await charge(code, delai, taille);
  process.stdout.write(`passage ${p + 1}/${PASSAGES}\n`);
}
await browser.close();
fs.mkdirSync(SORTIE, { recursive: true });
fs.writeFileSync(`${SORTIE}/mesures.json`, JSON.stringify({ chrome: version, playwright: '1.64.1', passages: PASSAGES, conditions: CONDITIONS, mesures }, null, 1));
console.log(`chrome ${version} ; ${mesures.length} chargements -> ${SORTIE}/mesures.json`);
