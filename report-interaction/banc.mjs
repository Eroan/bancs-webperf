// Banc : report des scripts à la première interaction, cinq variantes × parcours mobiles, Chrome stable en fenêtre.
// Usage : node banc.mjs <cpu> <passages> [scenarios=passif,tap2,tap4,tap7,scrolltap] [variantes=A,B,C,E,D] [reseau=slow4g|aucun]
// Sorties : $SORTIE/serie-cpu<cpu>-<reseau>-<horodatage>.json (une entrée par passage ; SORTIE=brut par défaut), lues par synthese.py.
// Scénario « temoin » : à jouer sur A et B seulement (en D, WP Rocket retient aussi l'écouteur du témoin).
import fs from 'node:fs';
import { chromium } from 'playwright';
import { demarrer, VARIANTES, NOMS } from './site.mjs';

const CPU = +(process.argv[2] || 8);
const PASSAGES = +(process.argv[3] || 2);
const SCENARIOS = (process.argv[4] || 'passif,tap2,tap4,tap7,scrolltap').split(',');
const VLIST = (process.argv[5] || VARIANTES.join(',')).split(',');
const RESEAU = process.argv[6] || 'slow4g';
// Slow 4G de Lighthouse (bridage devtools) : 562,5 ms, 1,44 Mbit/s descendant, 0,675 Mbit/s montant
const SLOW4G = { offline: false, latency: 562.5, downloadThroughput: 1.44e6 / 8, uploadThroughput: 0.675e6 / 8 };
const FB_CONFIG = fs.readFileSync(new URL('./vendor/tiers/fb-config.js', import.meta.url));
const FIN = 20000;   // durée d'observation d'un passage (ms après le début de la navigation)

// Parcours : instants en ms depuis le début de la navigation
const PARCOURS = {
  passif: [],
  tap2: [{ t: 2000, a: 'tap', cible: '#faq-q1' }, { t: 3500, a: 'tap', cible: '.burger' }],
  tap4: [{ t: 4000, a: 'tap', cible: '#faq-q1' }, { t: 5500, a: 'tap', cible: '.burger' }],
  tap7: [{ t: 7000, a: 'tap', cible: '#faq-q1' }, { t: 8500, a: 'tap', cible: '.burger' }],
  // défilement d'abord (geste le plus fréquent sur mobile), puis menu ouvert et refermé : cible fixe, insensible au défilement
  scrolltap: [{ t: 1500, a: 'swipe' }, { t: 2500, a: 'tap', cible: '.burger' }, { t: 4000, a: 'tap', cible: '.burger' }],
  temoin: [{ t: 8500, a: 'scroll' }, { t: 9000, a: 'tap', cible: '#temoin' }, { t: 10500, a: 'tap', cible: '#temoin' }],
};

// Sonde injectée avant tout script (monde principal, avant le patch d'addEventListener de WP Rocket)
const SONDE = () => {
  const m = window.__m = { lcp: [], lt: [], loaf: [], ev: [], ptr: [], effets: {}, menu: [], clics: [], fcp: null };
  const po = (type, f, o = {}) => { try { new PerformanceObserver(l => l.getEntries().forEach(f)).observe({ type, buffered: true, ...o }); } catch (e) { m['err_' + type] = String(e); } };
  po('largest-contentful-paint', e => m.lcp.push([Math.round(e.startTime), e.element ? (e.element.id || e.element.className || e.element.tagName) : null]));
  po('paint', e => { if (e.name === 'first-contentful-paint') m.fcp = Math.round(e.startTime); });
  po('longtask', e => m.lt.push([Math.round(e.startTime), Math.round(e.duration)]));
  po('long-animation-frame', e => m.loaf.push([Math.round(e.startTime), Math.round(e.duration), Math.round(e.blockingDuration),
    e.scripts.map(s => [String(s.sourceURL || s.invoker || '').replace(/^https?:\/\/[^/]+/, '').slice(0, 60), Math.round(s.duration), Math.round(s.startTime)])]));
  po('event', e => { if (e.interactionId) m.ev.push([e.name, Math.round(e.startTime), e.duration, Math.round(e.processingStart - e.startTime), Math.round(e.processingEnd - e.processingStart), e.interactionId, e.target ? (e.target.id || e.target.className) : null]); }, { durationThreshold: 16 });
  addEventListener('click', e => m.clics.push([Math.round(performance.now()), e.isTrusted, e.target && (e.target.id || e.target.className)]), { capture: true, passive: true });
  addEventListener('pointerdown', e => m.ptr.push([Math.round(e.timeStamp), e.target && (e.target.id || e.target.className)]), { capture: true, passive: true });
  const note = (k) => { if (m.effets[k] == null) m.effets[k] = Math.round(performance.now()); };
  new MutationObserver(recs => {
    for (const r of recs) {
      const el = r.target;
      if (r.type === 'attributes' && el.nodeType === 1) {
        if (el.id === 'nav') { const o = el.classList.contains('is-open'); if (!m.menu.length || m.menu.at(-1)[1] !== o) m.menu.push([Math.round(performance.now()), o]); if (o) note('menu'); }
        if (el.classList && el.classList.contains('faq-item') && el.classList.contains('open')) note('faq');
        if (el.classList && el.classList.contains('carousel') && el.classList.contains('slick-initialized')) note('slick');
      }
      if (r.type === 'childList') for (const n of r.addedNodes) { if (n.id === 'chat-bubble') note('chat'); }
      if (r.type === 'characterData' || (r.type === 'childList' && el.id === 'temoin-out')) note('temoin');
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
};

const sleepJusqua = async (t) => { const d = t - Date.now(); if (d > 0) await new Promise(r => setTimeout(r, d)); };

const srv = await demarrer();
if ((await (await fetch(srv.SITE.replace('site.localhost', '127.0.0.1') + '/__banc')).text()) !== 'banc-report') { console.error('BANC ABSENT'); process.exit(1); }
const browser = await chromium.launch({ channel: 'chrome', headless: false });
const brut = [];

// Coordonnées des cibles (CSS px dans le viewport), relevées une fois sur une page au repos, sans bridage :
// pendant la série, aucun appel qui passe par le fil principal de la page ne précède un geste.
const COORD = await (async () => {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(`${srv.SITE}/B.html?coord=1`, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const c = await p.evaluate(() => {
    const ctr = sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; };
    const out = { '#faq-q1': ctr('#faq-q1'), '.burger': ctr('.burger') };
    const t = document.querySelector('#temoin'); const y = Math.round(t.getBoundingClientRect().top + scrollY - 300);
    scrollTo(0, y); out.scrollTemoin = y; out['#temoin'] = ctr('#temoin');
    return out;
  });
  await ctx.close();
  return c;
})();
console.log('coordonnées', JSON.stringify(COORD));

async function passage(v, sc, n) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'fr-FR',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36',
  });
  const sortants = [];            // toute requête hors banc : journalisée, jamais envoyée
  await ctx.route(u => !/^http:\/\/(site|tiers)\.localhost:/.test(u.href), async (route) => {
    const r = route.request(); const url = r.url();
    sortants.push({ t: Date.now(), url, post: (r.postData() || '').slice(0, 2000), type: r.resourceType() });
    if (/connect\.facebook\.net\/signals\/config/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: FB_CONFIG });
    return route.fulfill({ status: 204, body: '' });
  });
  await ctx.addInitScript(SONDE);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  if (RESEAU === 'slow4g') await cdp.send('Network.emulateNetworkConditions', SLOW4G);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(String(e).slice(0, 200)));
  const nJournal = srv.journal.length;
  const t0 = Date.now();
  await p.goto(`${srv.SITE}/${v}.html?p=${n}`, { waitUntil: 'commit' });
  const actions = [], gestes = [];
  for (const a of PARCOURS[sc]) {
    await sleepJusqua(t0 + a.t);
    const tAct = Date.now();
    // geste synthétisé par le navigateur, sans attendre la page : un doigt n'attend pas que le fil principal se libère
    if (a.a === 'tap') gestes.push(cdp.send('Input.synthesizeTapGesture', { ...COORD[a.cible], duration: 60, tapCount: 1, gestureSourceType: 'touch' }).catch(e => ({ erreur: String(e) })));
    else if (a.a === 'swipe') gestes.push(cdp.send('Input.synthesizeScrollGesture', { x: 200, y: 600, yDistance: -150, speed: 600, preventFling: true, gestureSourceType: 'touch' }).catch(e => ({ erreur: String(e) })));
    else if (a.a === 'scroll') gestes.push(p.evaluate(y => scrollTo(0, y), COORD.scrollTemoin).catch(e => ({ erreur: String(e) })));
    actions.push({ ...a, retardMs: tAct - (t0 + a.t) });
  }
  const resGestes = await Promise.all(gestes);
  actions.forEach((a, i) => { a.ok = !(resGestes[i] && resGestes[i].erreur); if (!a.ok) a.raison = resGestes[i].erreur.slice(0, 120); });
  await sleepJusqua(t0 + FIN);
  // image de clôture pour les entrées Event Timing en attente
  await p.screenshot({ clip: { x: 0, y: 0, width: 10, height: 10 } }).catch(() => {});
  const m = await p.evaluate(() => ({ ...window.__m, timeOrigin: performance.timeOrigin,
    nav: (() => { const e = performance.getEntriesByType('navigation')[0]; return e ? { responseEnd: Math.round(e.responseEnd), dcl: Math.round(e.domContentLoadedEventEnd), load: Math.round(e.loadEventEnd) } : null; })(),
    marks: performance.getEntriesByType('mark').map(x => [x.name, Math.round(x.startTime)]),
    menuOuvert: document.getElementById('nav').classList.contains('is-open'),
    faqOuverte: document.querySelector('.faq-item').classList.contains('open'),
    jq: typeof window.jQuery === 'function', ga: !!(window.google_tag_manager || window.google_tag_data), fb: !!(window.fbq && window.fbq.loaded && window.fbq.version !== '2.0'),
    ressources: performance.getEntriesByType('resource').map(r => [r.name.replace(/^https?:\/\/[^/]+/, '').slice(0, 50), Math.round(r.startTime), Math.round(r.responseEnd), r.transferSize]),
  }));
  await ctx.close();
  const rel = t => Math.round(t - m.timeOrigin);
  const hits = sortants.map(s => {
    let k = 'autre';
    if (/\/g\/collect/.test(s.url)) k = 'ga:' + ((s.url.match(/[?&]en=([^&]+)/) || s.post.match(/(?:^|&)en=([^&\s]+)/) || [])[1] || '?');
    else if (/facebook\.com\/tr/.test(s.url)) k = 'fb:' + ((s.url.match(/[?&]ev=([^&]+)/) || [])[1] || '?');
    else if (/signals\/config/.test(s.url)) k = 'fb-config';
    return { k, t: rel(s.t), url: s.url.slice(0, 300), post: s.post ? s.post.slice(0, 200) : undefined, type: s.type };
  });
  const chat = srv.journal.slice(nJournal).filter(j => j.type === 'chat').map(j => ({ t: rel(j.t), ms: +j.ms }));
  return { variante: v, nom: NOMS[v], scenario: sc, passage: n, cpu: CPU, reseau: RESEAU, actions, hits, chat, erreurs, ...m };
}

for (let n = 1; n <= PASSAGES; n++) {
  for (const sc of SCENARIOS) {
    const ordre = VLIST.map((_, i) => VLIST[(i + n - 1) % VLIST.length]);   // départ décalé à chaque passage
    for (const v of ordre) {
      const r = await passage(v, sc, n);
      brut.push(r);
      const g = r.hits.find(h => h.k === 'ga:page_view'), f = r.hits.find(h => h.k === 'fb:PageView');
      console.log(`p${n} ${sc.padEnd(9)} ${v} ${r.nom.padEnd(18)} LCP ${r.lcp.at(-1)?.[0] ?? '-'} | menu ${r.effets.menu ?? '-'} faq ${r.effets.faq ?? '-'} | GA pv ${g ? g.t : '-'} FB pv ${f ? f.t : '-'} chat ${r.chat[0]?.t ?? '-'} | err ${r.erreurs.length}`);
    }
  }
}
const chrome = browser.version();
await browser.close(); srv.fermer();
const f = `${process.env.SORTIE || 'brut'}/serie-cpu${CPU}-${RESEAU}-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
fs.writeFileSync(f, JSON.stringify({ chrome, playwright: '1.64.1', date: new Date().toISOString(), cpu: CPU, reseau: RESEAU, passages: PASSAGES, scenarios: SCENARIOS, variantes: VLIST, brut }, null, 1));
console.log('écrit', f);
