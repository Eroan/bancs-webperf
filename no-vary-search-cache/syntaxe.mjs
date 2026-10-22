// Banc : quelles syntaxes de No-Vary-Search Chrome et Firefox appliquent. Voir PROTOCOLE.md, « Syntaxe ».
// Usage : PASSAGES=5 SORTIE=<dossier> node syntaxe.mjs
import http from 'node:http';
import fs from 'node:fs';
import { chromium } from 'playwright';
import puppeteer from 'puppeteer-core';

const PASSAGES = Number(process.env.PASSAGES || 5);
const SORTIE = process.env.SORTIE || 'brut/essai';
const FIREFOX = process.env.FIREFOX || '/Applications/Firefox.app/Contents/MacOS/firefox';
const VALEURS = ['params', 'except=()', 'params, except=("page")', 'except=("page")', 'params=("utm_source")', null];
let hits = [];
const srv = http.createServer((req, res) => {
  if (req.url.startsWith('/favicon')) { res.writeHead(404); res.end(); return; }
  hits.push(req.url);
  const m = req.url.match(/^\/c(\d+)\//); const v = VALEURS[Number(m[1])];
  const h = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'max-age=600' };
  if (v) h['No-Vary-Search'] = v;
  res.writeHead(200, h);
  res.end(`<!doctype html><meta charset="utf-8"><title>banc</title>
<a id="utm" href="/c${m[1]}/p?utm_source=b&page=1">utm</a> <a id="page" href="/c${m[1]}/p?utm_source=a&page=2">page</a>`);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;

async function parcours(nouvellePage, fermer, i, lien) {
  hits = [];
  const { page, ctx } = await nouvellePage();
  await page.goto(`${base}/c${i}/p?utm_source=a&page=1`);
  await Promise.all([page.waitForNavigation(), page.click(`#${lien}`)]);
  const search = await page.evaluate(() => location.search);
  await fermer(ctx);
  return { redemandee: hits.length > 1, requetes: [...hits], search };
}

const mesures = [];
const chrome = await chromium.launch({ channel: 'chrome' });
const firefox = await puppeteer.launch({ browser: 'firefox', executablePath: FIREFOX, headless: true });
const moteurs = {
  [`Chrome ${chrome.version()}`]: [async () => { const ctx = await chrome.newContext(); return { ctx, page: await ctx.newPage() }; }, (ctx) => ctx.close()],
  [`Firefox ${(await firefox.version()).replace('firefox/', '')}`]: [async () => { const ctx = await firefox.createBrowserContext(); return { ctx, page: await ctx.newPage() }; }, (ctx) => ctx.close()],
};
for (let p = 0; p < PASSAGES; p++) {
  for (const [moteur, [np, fermer]] of Object.entries(moteurs)) {
    for (let i = 0; i < VALEURS.length; i++) {
      for (const lien of ['utm', 'page']) {
        const r = await parcours(np, fermer, i, lien);
        mesures.push({ moteur, valeur: VALEURS[i], change: lien === 'utm' ? 'utm_source' : 'page', passage: p + 1, ...r });
      }
    }
  }
}
await chrome.close(); await firefox.close(); srv.close();
fs.mkdirSync(SORTIE, { recursive: true });
fs.writeFileSync(`${SORTIE}/syntaxe.json`, JSON.stringify({ moteurs: Object.keys(moteurs), playwright: '1.64.1', passages: PASSAGES, mesures }, null, 1));
console.log(`${Object.keys(moteurs).join(', ')} ; ${mesures.length} parcours -> ${SORTIE}/syntaxe.json`);
