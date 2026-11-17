// Serveur du banc : pages /v/<variante>/<N> et fichiers /dist/… précompressés (Brotli si accepté).
// Port libre choisi par le système, imprimé sur la sortie (« port <n> »), marqueur /__banc.
import http from 'node:http';
import fs from 'node:fs';
import { generer } from './donnees.mjs';

const STYLE = 'body{font:16px/1.4 system-ui,sans-serif;margin:8px}.outils{display:flex;gap:.5em;align-items:center;margin:8px 0}#filtre{flex:1;min-width:0}#liste{list-style:none;margin:0;padding:0}.ligne{display:flex;gap:.5em;padding:4px 0;border-bottom:1px solid #ddd}.nom{flex:1}.fav{min-width:44px;min-height:32px}[hidden]{display:none!important}';
// Sonde posée avant tout script : Event Timing (seuil 16 ms), tâches longues, horodatage de chaque geste reçu.
const SONDE = `window.__et=[];window.__lt=[];window.__g=[];
new PerformanceObserver(l=>{for(const e of l.getEntries())__et.push({i:e.interactionId,n:e.name,d:e.duration,s:e.startTime,ps:e.processingStart,pe:e.processingEnd})}).observe({type:'event',buffered:true,durationThreshold:16});
new PerformanceObserver(l=>{for(const e of l.getEntries())__lt.push({s:e.startTime,d:e.duration})}).observe({type:'longtask',buffered:true});
addEventListener('pointerdown',e=>__g.push({t:'pointerdown',s:e.timeStamp}),true);addEventListener('keydown',e=>__g.push({t:'keydown',s:e.timeStamp}),true);`;
const TEMOIN = `document.getElementById('temoin').addEventListener('click',()=>{const t=performance.now();while(performance.now()-t<100);});`;
const OUTILS_ALPINE = (tri) => `<div class="outils"><input id="filtre" type="search" aria-label="Filtrer" x-model="q"> <button id="tri" type="button"${tri}>Trier par prix</button> <span id="compteur" x-text="nbFav + ' favori(s)'">0 favori(s)</span></div>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function corps(v, items) {
  if (v === 'alpine') return `<div id="app" x-data="liste">${OUTILS_ALPINE(' @click="trierPrix()"')}<ul id="liste"><template x-for="i in visibles" :key="i.id"><li class="ligne" :data-id="i.id"><span class="nom" x-text="i.nom"></span> <span class="prix" x-text="i.prixTexte"></span> <button class="fav" type="button" aria-label="Favori" :aria-pressed="String(!!favs[i.id])" @click="basculer(i.id)" x-text="favs[i.id] ? '★' : '☆'"></button></li></template></ul></div>`;
  if (v === 'alpine-ssr') return `<div id="app" x-data="listeSsr">${OUTILS_ALPINE('')}<ul id="liste">${items.map((i) => `<li class="ligne" data-id="${i.id}" data-nom="${esc(i.nom)}" x-show="montre($el.dataset.nom)"><span class="nom">${esc(i.nom)}</span> <span class="prix">${esc(i.prixTexte)}</span> <button class="fav" type="button" aria-label="Favori" aria-pressed="false" :aria-pressed="String(!!favs[${i.id}])" @click="basculer(${i.id})" x-text="favs[${i.id}] ? '★' : '☆'">☆</button></li>`).join('')}</ul></div>`;
  return '<div id="app"></div>';
}
function page(v, n) {
  const items = generer(n);
  const json = v === 'alpine-ssr' ? '' : `<script type="application/json" id="donnees">${JSON.stringify(items).replace(/</g, '\\u003c')}</script>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${v} ${n}</title><style>${STYLE}</style><script>${SONDE}</script><script type="module" src="/dist/${v}/app.js"></script></head><body><button id="temoin" type="button">Témoin</button>${json}${corps(v, items)}<script>${TEMOIN}</script></body></html>`;
}

const serveur = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__banc') { res.end('banc-composant-interactif'); return; }
  let m = u.pathname.match(/^\/v\/([a-z0-9-]+)\/(\d+)$/);
  if (m && fs.existsSync(`dist/${m[1]}/app.js`)) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(page(m[1], Number(m[2]))); return;
  }
  m = u.pathname.match(/^\/dist\/([a-z0-9-]+)\/app\.js$/);
  if (m && fs.existsSync(`dist/${m[1]}/app.js`)) {
    const br = /\bbr\b/.test(req.headers['accept-encoding'] || '');
    const f = `dist/${m[1]}/app.js${br ? '.br' : ''}`;
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store', ...(br ? { 'content-encoding': 'br' } : {}) });
    res.end(fs.readFileSync(f)); return;
  }
  res.writeHead(404); res.end('404');
});
serveur.listen(0, '127.0.0.1', () => console.log(`port ${serveur.address().port}`));
