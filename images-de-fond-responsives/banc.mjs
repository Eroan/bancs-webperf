// Banc « image de fond responsive » : voir PROTOCOLE.md.
// Trois moteurs, un script : Chrome stable (Playwright), Firefox stable (puppeteer-core, BiDi), WebKit de Playwright.
// Sortie : <SORTIE>/mesures.json. Une ligne TEMOINS OK, sinon sortie 1. Le compte des images vient du journal du serveur.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { chromium, webkit } from 'playwright';
import puppeteer from 'puppeteer-core';
import { FICHIERS } from './fixtures.mjs';

const PASSAGES = +(process.env.PASSAGES || 3);
const SORTIE = process.env.SORTIE;
if (!SORTIE) { console.error('SORTIE manquant'); process.exit(2); }
const SEULEMENT = (process.env.GROUPES || '').split(',').filter(Boolean);
const DELAI_IMAGE = 120;
const consoleFonds = fs.readFileSync('extraits/console-fonds.js', 'utf8');
const BLOCS = Object.fromEntries(['bloc-recommande', 'bloc-variables'].map(b => [b, { html: fs.readFileSync(`extraits/${b}.html`, 'utf8'), css: fs.readFileSync(`extraits/${b}.css`, 'utf8') }]));
const enBanc = s => s.replaceAll('/img/', '/i/@ID/');

// PNG : uni (taille) ou bruité (lcp : un aplat serait écarté du LCP pour trop peu d'octets par pixel).
function crc32(b) { let r = ~0; for (const x of b) { let c = (r ^ x) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; r = (r >>> 8) ^ c; } return ~r >>> 0; }
function bloc(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); }
function png(w, h, pixel) {
  const brut = Buffer.alloc((w * 3 + 1) * h); let o = 0;
  for (let y = 0; y < h; y++) { brut[o++] = 0; for (let x = 0; x < w; x++) { const [r, g, b] = pixel(x, y); brut[o++] = r; brut[o++] = g; brut[o++] = b; } }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloc('IHDR', ih), bloc('IDAT', zlib.deflateSync(brut, { level: 1 })), bloc('IEND', Buffer.alloc(0))]);
}
let graine = 12345; const alea = () => (graine = (graine * 1103515245 + 12345) & 0x7fffffff) & 255;
const SPECIAUX = {
  'magenta.png': png(1000, 500, () => [255, 0, 255]),
  'hero-1x.png': png(1400, 800, () => [alea(), alea(), alea()]),
  'hero-2x.png': png(2800, 1600, () => [alea(), alea(), alea()]),
};

// Lecture d'une capture PNG (RGB ou RGBA 8 bits, non entrelacée) : largeur et nombre de pixels magenta de la première ligne.
function lirePng(buf) {
  let o = 8, w = 0, h = 0, canaux = 0; const idat = [];
  while (o < buf.length) {
    const l = buf.readUInt32BE(o), t = buf.toString('latin1', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + l);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); canaux = d[9] === 6 ? 4 : 3; if (d[8] !== 8 || d[12] !== 0) throw new Error('PNG non géré'); }
    if (t === 'IDAT') idat.push(d);
    o += 12 + l;
  }
  const brut = zlib.inflateSync(Buffer.concat(idat)), pas = w * canaux;
  const filtre = brut[0]; if (filtre > 4) throw new Error('filtre PNG');
  const ligne = Buffer.alloc(pas);
  for (let i = 0; i < pas; i++) {
    const a = i >= canaux ? ligne[i - canaux] : 0, x = brut[1 + i];
    ligne[i] = (filtre === 0 || filtre === 2 ? x : filtre === 1 || filtre === 4 ? x + a : x + (a >> 1)) & 255;
  }
  let magenta = 0;
  for (let i = 0; i < w; i++) { const r = ligne[i * canaux], g = ligne[i * canaux + 1], b = ligne[i * canaux + 2]; if (r > 180 && g < 110 && b > 180) magenta++; }
  return { largeur: w, hauteur: h, magenta };
}

// Serveur : pages et feuilles en mémoire, images journalisées par identifiant de cas.
const cas = new Map();
const journal = [];
const srv = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/__banc') { r.writeHead(200); return r.end('images-de-fond-responsives'); }
  const [, zone, id, ...reste] = u.pathname.split('/');
  const nom = reste.join('/');
  const ext = path.extname(nom).slice(1);
  if (nom.includes('.') && ext !== 'css') {
    journal.push({ id, zone, nom, t: Date.now() });
    const f = SPECIAUX[nom] ? { type: 'image/png', octets: SPECIAUX[nom] } : FICHIERS[ext];
    if (!f) { r.writeHead(404); return r.end(); }
    return void setTimeout(() => { r.writeHead(200, { 'content-type': f.type, 'cache-control': 'max-age=3600', 'content-length': f.octets.length }); r.end(f.octets); }, DELAI_IMAGE);
  }
  const c = cas.get(id);
  if (!c) { r.writeHead(404); return r.end(); }
  if (zone === 'c') { r.writeHead(200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-store' }); return r.end(c.css.replaceAll('@ID', id)); }
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); r.end(c.html.replaceAll('@ID', id));
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${srv.address().port}`;
if (await (await fetch(base + '/__banc')).text() !== 'images-de-fond-responsives') { console.error('BANC ABSENT'); process.exit(1); }

const dormir = ms => new Promise(z => setTimeout(z, ms));
const temoins = [];
const temoin = (ok, m) => { if (!ok) temoins.push(m); };

const pw = (type, opts) => async () => {
  const b = await type.launch(opts);
  return {
    b, version: b.version(),
    async ouvrir({ w, h, dpr }) {
      const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
      const page = await c.newPage();
      return { page, fermer: () => c.close(), taille: (l, ha) => page.setViewportSize({ width: l, height: ha }), capture: async () => Buffer.from(await page.screenshot({ type: 'png' })), cdp: type === chromium ? () => c.newCDPSession(page) : null };
    },
  };
};
const MOTEURS = {
  chrome: pw(chromium, { channel: 'chrome' }),
  webkit: pw(webkit, {}),
  firefox: async () => {
    const b = await puppeteer.launch({ browser: 'firefox', executablePath: '/Applications/Firefox.app/Contents/MacOS/firefox', headless: true });
    return {
      b, version: (await b.version()).replace(/^firefox\//i, ''),
      async ouvrir({ w, h, dpr }) {
        const c = await b.createBrowserContext();
        const page = await c.newPage();
        await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
        return { page, fermer: () => c.close(), taille: (l, ha, d) => page.setViewport({ width: l, height: ha, deviceScaleFactor: d ?? dpr }), capture: async () => Buffer.from(await page.screenshot({ type: 'png' })), cdp: null };
      },
    };
  },
};

let n = 0;
const requetes = id => journal.filter(e => e.id === id).map(e => e.nom);
async function calme(id, ms = 350) {
  let vu = -1, depuis = Date.now();
  for (;;) {
    const k = requetes(id).length;
    if (k !== vu) { vu = k; depuis = Date.now(); }
    if (Date.now() - depuis >= ms) return;
    await dormir(40);
  }
}
const H = (corps, tete = '') => `<!doctype html><html lang=fr><meta charset=utf-8><title>banc</title>${tete}<link rel=stylesheet href="/c/@ID/s.css"><body style="margin:0">${corps}`;
const FOND = '<div class=h style="height:600px"></div>';

// Un cas : page neuve, attente du calme réseau, DPR relu. suite(s) reçoit la session et l'identifiant.
async function jouer(m, geo, html, css, suite, attente) {
  const id = `c${++n}`;
  cas.set(id, { html, css });
  const s = await m.ouvrir(geo);
  if (attente) await attente(s);
  await s.page.goto(`${base}/p/${id}/`, { waitUntil: 'load', timeout: 60000 });
  await calme(id);
  const dpr = await s.page.evaluate(() => window.devicePixelRatio);
  temoin(dpr === geo.dpr, `DPR ${geo.dpr} demandé, ${dpr} relu (${m.nom})`);
  const plus = suite ? await suite(s, id) : undefined;
  const req = requetes(id);
  await s.fermer();
  cas.delete(id);
  return { dpr, req, ...(plus || {}) };
}

const DPRS = [1, 1.25, 1.5, 2, 2.625, 3];
const JEUX = { '1x-2x': [1, 2], '1x-1.5x-2x': [1, 1.5, 2], '1x-2x-3x': [1, 2, 3] };
const CONFIGS = [[400, 800, 1], [400, 800, 2], [400, 800, 3], [412, 915, 2.625], [1400, 900, 1], [1400, 900, 1.25], [1400, 900, 2]];
const MQ = (mob, bur) => `.h{background-image:${bur}}@media (max-width:767px){.h{background-image:${mob}}}`;
const SET_J = p => `image-set(url("/i/@ID/${p}-1x.jpg") 1x,url("/i/@ID/${p}-2x.jpg") 2x)`;
const SET_A = p => `image-set(url("/i/@ID/${p}-1x.avif") type("image/avif") 1x,url("/i/@ID/${p}-2x.avif") type("image/avif") 2x,url("/i/@ID/${p}-1x.jpg") type("image/jpeg") 1x,url("/i/@ID/${p}-2x.jpg") type("image/jpeg") 2x)`;
const IMGS = (p, e) => `/i/@ID/${p}-1x.${e} 1x, /i/@ID/${p}-2x.${e} 2x`;
const PL = (attrs) => `<link rel=preload as=image ${attrs}>`;

const FORMES = {
  'sans-preload': { tete: '', css: MQ('url("/i/@ID/hero-800.jpg")', 'url("/i/@ID/hero-1600.jpg")') },
  'densite': { tete: PL(`imagesrcset="${IMGS('hero', 'jpg')}"`), css: `.h{background-image:${SET_J('hero')}}` },
  'largeur-imagesizes': { tete: PL('imagesrcset="/i/@ID/hero-800.jpg 800w, /i/@ID/hero-1600.jpg 1600w" imagesizes="100vw"'), css: MQ('url("/i/@ID/hero-800.jpg")', 'url("/i/@ID/hero-1600.jpg")') },
  'href-seul': { tete: PL('href="/i/@ID/hero-1600.jpg"'), css: MQ('url("/i/@ID/hero-800.jpg")', 'url("/i/@ID/hero-1600.jpg")') },
  'media': { tete: PL('href="/i/@ID/hero-800.jpg" media="(max-width:767px)"') + PL('href="/i/@ID/hero-1600.jpg" media="(min-width:768px)"'), css: MQ('url("/i/@ID/hero-800.jpg")', 'url("/i/@ID/hero-1600.jpg")') },
  'media-densite': { tete: PL(`imagesrcset="${IMGS('mob', 'jpg')}" media="(max-width:767px)"`) + PL(`imagesrcset="${IMGS('bur', 'jpg')}" media="(min-width:768px)"`), css: MQ(SET_J('mob'), SET_J('bur')) },
  'media-densite-type': { tete: PL(`imagesrcset="${IMGS('mob', 'avif')}" type="image/avif" media="(max-width:767px)"`) + PL(`imagesrcset="${IMGS('bur', 'avif')}" type="image/avif" media="(min-width:768px)"`), css: MQ(SET_A('mob'), SET_A('bur')) },
};

const ECRITURES = {
  'complet': 'image-set(url(a1.avif) type("image/avif") 1x,url(a2.avif) type("image/avif") 2x,url(j1.jpg) type("image/jpeg") 1x,url(j2.jpg) type("image/jpeg") 2x)',
  'jpeg-en-tete': 'image-set(url(j.jpg) type("image/jpeg") 1x,url(a.avif) type("image/avif") 1x)',
  'avif-1x-seul': 'image-set(url(a1.avif) type("image/avif") 1x,url(j1.jpg) type("image/jpeg") 1x,url(j2.jpg) type("image/jpeg") 2x)',
  'type-sans-densite': 'image-set(url(a.avif) type("image/avif"),url(j.jpg) type("image/jpeg"))',
  'type-inconnu': 'image-set(url(x.xyz) type("image/x-inconnu"),url(j.jpg))',
  'doublon-densite': 'image-set(url(premier.jpg) 1x,url(second.jpg) 1x)',
  'ordre-inverse': 'image-set(url(j2.jpg) 2x,url(j1.jpg) 1x)',
  'seulement-2x': 'image-set(url(j2.jpg) 2x)',
  'seulement-1x': 'image-set(url(j1.jpg) 1x)',
  'dpi': 'image-set(url(j1.jpg) 96dpi,url(j2.jpg) 192dpi)',
  'dppx': 'image-set(url(j1.jpg) 1dppx,url(j2.jpg) 2dppx)',
  'chaine': 'image-set("j1.jpg" 1x,"j2.jpg" 2x)',
  'degrade': 'image-set(linear-gradient(red,blue) 1x,url(j2.jpg) 2x)',
  'prefixe': '-webkit-image-set(url(a.avif) type("image/avif") 1x,url(j.jpg) type("image/jpeg") 1x)',
};
const SYNTAXES = { ...ECRITURES, 'x-seul': 'image-set(url("a.jpg") 1x)', 'calc': 'image-set(url("a.jpg") calc(1x + 1x))', 'imbrique': 'image-set(image-set(url("a.jpg") 1x) 1x)', 'largeur-w': 'image-set(url("a.jpg") 800w)' };

const GROUPES = {
  async selection(m) {
    const r = {};
    for (const dpr of DPRS) for (const [jeu, ds] of Object.entries(JEUX)) {
      const fic = d => `/i/@ID/d${d}.jpg`;
      const liste = ds.map(d => `${fic(d)} ${d}x`).join(', ');
      const techs = {
        'image-set': [H(FOND), `.h{background-image:image-set(${ds.map(d => `url("${fic(d)}") ${d}x`).join(',')})}`],
        'srcset': [H(`<img alt="" srcset="${liste}">`), ''],
        'preload': [H(FOND, PL(`imagesrcset="${liste}"`)), ''],
      };
      for (const [t, [html, css]] of Object.entries(techs)) {
        const x = await jouer(m, { w: 1400, h: 900, dpr }, html, css);
        (r[`${dpr}|${jeu}|${t}`] = x.req);
        temoin(x.req.length === 1, `selection ${m.nom} ${dpr} ${jeu} ${t} : ${x.req.length} requêtes`);
        if (dpr === 1) temoin(x.req[0] === 'd1.jpg', `selection ${m.nom} DPR 1 ${jeu} ${t} : ${x.req}`);
        if (dpr === 2) temoin(x.req[0] === 'd2.jpg', `selection ${m.nom} DPR 2 ${jeu} ${t} : ${x.req}`);
      }
    }
    return r;
  },
  async doublon(m) {
    const r = {};
    for (const [w, h, dpr] of CONFIGS) for (const [f, { tete, css }] of Object.entries(FORMES)) {
      const x = await jouer(m, { w, h, dpr }, H(FOND, tete), css);
      r[`${w}x${h}@${dpr}|${f}`] = x.req;
      if (f === 'sans-preload') temoin(x.req.length === 1, `doublon ${m.nom} sans préchargement ${w}@${dpr} : ${x.req}`);
    }
    return r;
  },
  async combinaisons(m) {
    const r = {};
    for (const dpr of [1, 2]) {
      for (const [k, v] of Object.entries(ECRITURES)) {
        const x = await jouer(m, { w: 1400, h: 900, dpr }, H(FOND), `.h{background-image:${v}}`, s => s.page.evaluate(() => ({ calcule: getComputedStyle(document.querySelector('.h')).backgroundImage })));
        r[`${dpr}|${k}`] = { req: x.req, calcule: x.calcule.replace(/http:\/\/127\.0\.0\.1:\d+\/c\/c\d+\//g, '') };
        if (k === 'type-inconnu') temoin(!x.req.includes('x.xyz') && x.req.includes('j.jpg'), `${m.nom} type inconnu : ${x.req}`);
      }
      const y = await jouer(m, { w: 1400, h: 900, dpr }, H(FOND), '.h{background-image:url(repli.jpg);background-image:image-set(url(x.xyz) type("image/x-inconnu"))}', s => s.page.evaluate(() => getComputedStyle(document.querySelector('.h')).backgroundImage.slice(0, 20)));
      r[`${dpr}|tous-types-inconnus`] = { req: y.req, calcule: '' };
    }
    return r;
  },
  async taille(m) {
    const V = {
      'url': ['url(magenta.png)', 'auto'],
      'sans-densite': ['image-set(url(magenta.png))', 'auto'],
      'type-sans-densite': ['image-set(url(magenta.png) type("image/png"))', 'auto'],
      '1x': ['image-set(url(magenta.png) 1x)', 'auto'],
      '2x': ['image-set(url(magenta.png) 2x)', 'auto'],
      '0.5x': ['image-set(url(magenta.png) 0.5x)', 'auto'],
      '2x-cover': ['image-set(url(magenta.png) 2x)', 'cover'],
    };
    const r = {};
    for (const dpr of [1, 2]) for (const [k, [v, t]] of Object.entries(V)) {
      const x = await jouer(m, { w: 1400, h: 900, dpr }, H('<div class=h style="width:1400px;height:800px"></div>'), `html,body{background:#fff}.h{background-repeat:no-repeat;background-position:0 0;background-size:${t};background-image:${v}}`, async s => {
        await dormir(150);
        const p = lirePng(await s.capture());
        const echelle = p.largeur / 1400;
        return { css: Math.round(p.magenta / echelle), echelle };
      });
      r[`${dpr}|${k}`] = { css: x.css, echelle: x.echelle };
      if (k === 'url') temoin(x.css === 1000, `taille ${m.nom} url() DPR ${dpr} : ${x.css} px`);
    }
    return r;
  },
  async media(m) {
    const r = {};
    const SET = p => `image-set(url(${p}-1x.jpg) 1x,url(${p}-2x.jpg) 2x)`;
    const bascule = async (s, id) => {
      const avant = requetes(id).length;
      await s.taille(1400, 900); await calme(id, 500);
      const grand = requetes(id).slice(avant);
      const k = requetes(id).length;
      await s.taille(400, 800); await calme(id, 500);
      return { grand, retour: requetes(id).slice(k) };
    };
    const geo = { w: 400, h: 800, dpr: 1 };
    r.mq = await jouer(m, geo, H(FOND), MQ(SET('mob'), SET('bur')), bascule);
    r.ecrase = await jouer(m, geo, H(FOND), `.h{background-image:${SET('bur')}}@media (max-width:767px){.h{background-image:${SET('mob')}}}`);
    r.conteneur = await jouer(m, geo, H(`<div style="container-type:inline-size">${FOND}</div>`), `.h{background-image:${SET('bur')}}@container (max-width:600px){.h{background-image:${SET('mob')}}}`, bascule);
    r['conteneur-sans-base'] = await jouer(m, geo, H(`<div style="container-type:inline-size">${FOND}</div>`), `@container (max-width:600px){.h{background-image:${SET('mob')}}}@container (min-width:601px){.h{background-image:${SET('bur')}}}`, bascule);
    r['conteneur-base-mobile-1400'] = await jouer(m, { w: 1400, h: 900, dpr: 1 }, H(`<div style="container-type:inline-size">${FOND}</div>`), `.h{background-image:${SET('mob')}}@container (min-width:601px){.h{background-image:${SET('bur')}}}`);
    const un = `.h{background-image:${SET('x')}}`;
    r['hors-ecran'] = await jouer(m, geo, H(`<div style="height:5000px"></div>${FOND}`), un);
    r['display-none'] = await jouer(m, geo, H('<div class=h style="display:none;height:600px"></div>'), un);
    r['parent-none'] = await jouer(m, geo, H(`<div style="display:none">${FOND}</div>`), un);
    r['visibility-hidden'] = await jouer(m, geo, H('<div class=h style="visibility:hidden;height:600px"></div>'), un);
    r['content-visibility'] = await jouer(m, geo, H(`<div style="height:5000px"></div><div style="content-visibility:auto">${FOND}</div>`), un);
    temoin(r['display-none'].req.length === 0, `media ${m.nom} display:none : ${r['display-none'].req}`);
    return r;
  },
  async changement(m) {
    if (m.nom === 'webkit') return { sans_api: true };
    const r = {};
    const css = '.h{background-image:image-set(url(j1.jpg) 1x,url(j2.jpg) 2x)}';
    r.parcours = await jouer(m, { w: 1400, h: 900, dpr: 1 }, H(FOND), css, async (s, id) => {
      const c = s.cdp ? await s.cdp() : null;
      const pose = async d => {
        if (c) await c.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: d, mobile: false });
        else await s.taille(1400, 900, d);
        await calme(id, 600);
        return s.page.evaluate(() => window.devicePixelRatio);
      };
      const nouvelles = async f => { const k = requetes(id).length; await f(); await calme(id, 600); return requetes(id).slice(k); };
      let d2;
      const vers2 = await nouvelles(async () => { d2 = await pose(2); });
      const recalcul = await nouvelles(() => s.page.evaluate(() => { document.querySelector('.h').style.backgroundPosition = '1px 1px'; return getComputedStyle(document.querySelector('.h')).backgroundPosition; }));
      const nouvel_element = await nouvelles(() => s.page.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<div class="h" style="height:50px"></div>'); return document.body.offsetHeight; }));
      let d1;
      const retour1 = await nouvelles(async () => { d1 = await pose(1); });
      temoin(d2 === 2 && d1 === 1, `changement ${m.nom} : DPR relus ${d2} puis ${d1}`);
      return { vers2, recalcul, nouvel_element, retour1 };
    });
    return r;
  },
  async reseau(m) {
    if (m.nom !== 'chrome') return { non_teste: true };
    const css = '.h{background-image:image-set(url(j1.jpg) 1x,url(j2.jpg) 2x,url(j3.jpg) 3x)}';
    const x = await jouer(m, { w: 400, h: 800, dpr: 3 }, H(FOND), css, s => s.page.evaluate(() => ({ et: navigator.connection.effectiveType, rtt: navigator.connection.rtt })), async s => {
      const c = await s.cdp();
      await c.send('Network.enable');
      await c.send('Network.emulateNetworkConditions', { offline: false, latency: 2500, downloadThroughput: 6000, uploadThroughput: 6000 });
    });
    temoin(x.et === 'slow-2g', `reseau : effectiveType ${x.et}`);
    return x;
  },
  async variables(m) {
    const r = {};
    const V1 = 'style="height:600px;--a1:url(/i/@ID/a1.avif);--a2:url(/i/@ID/a2.avif);--j1:url(/i/@ID/j1.jpg);--j2:url(/i/@ID/j2.jpg)"';
    const cssV = '.h{background-image:image-set(var(--a1) type("image/avif") 1x,var(--a2) type("image/avif") 2x,var(--j1) type("image/jpeg") 1x,var(--j2) type("image/jpeg") 2x)}';
    for (const dpr of [1, 2]) {
      r[`${dpr}|options-en-variables`] = await jouer(m, { w: 1400, h: 900, dpr }, H(`<div class=h ${V1}></div>`), cssV);
      r[`${dpr}|ensemble-en-variable`] = await jouer(m, { w: 1400, h: 900, dpr }, H(`<div class=h style='height:600px;--fond:image-set(url(/i/@ID/a1.avif) type("image/avif") 1x,url(/i/@ID/a2.avif) type("image/avif") 2x)'></div>`), '.h{background-image:var(--fond)}');
    }
    const geo = { w: 1400, h: 900, dpr: 1 };
    const relatif = (html, css) => jouer(m, geo, html, css, async (s, id) => ({ chemins: journal.filter(e => e.id === id).map(e => `/${e.zone}/.../${e.nom}`) }));
    r['relative-attribut-style'] = await relatif(H('<div class=h style="height:600px;--f:url(rel.jpg)"></div>'), '.h{background-image:var(--f)}');
    r['relative-style-html'] = await relatif(H(FOND, '<style>:root{--f:url(rel.jpg)}</style>'), '.h{background-image:var(--f)}');
    r['relative-feuille'] = await relatif(H(FOND), ':root{--f:url(rel.jpg)}.h{background-image:var(--f)}');
    r['repli-sans-var'] = await jouer(m, geo, H(FOND), '.h{background-image:url(repli.jpg);background-image:fonction-inconnue(url(a.jpg) 1x)}');
    r['repli-avec-var'] = await jouer(m, geo, H('<div class=h style="height:600px;--a:url(/i/@ID/a.jpg)"></div>'), '.h{background-image:url(repli.jpg);background-image:fonction-inconnue(var(--a) 1x)}');
    r['supports-connu'] = await jouer(m, geo, H('<div class=h style="height:600px;--a:url(/i/@ID/a.jpg)"></div>'), '.h{background-image:url(repli.jpg)}@supports (background-image:image-set(url("x") type("image/avif"))){.h{background-image:image-set(var(--a) type("image/jpeg") 1x)}}');
    r['supports-inconnu'] = await jouer(m, geo, H('<div class=h style="height:600px;--a:url(/i/@ID/a.jpg)"></div>'), '.h{background-image:url(repli.jpg)}@supports (background-image:fonction-inconnue(url("x"))){.h{background-image:fonction-inconnue(var(--a))}}');
    temoin(r['repli-sans-var'].req.includes('repli.jpg'), `variables ${m.nom} repli sans var : ${r['repli-sans-var'].req}`);
    return r;
  },
  async lcp(m) {
    const r = {};
    const css = '.h{height:800px;background-size:cover;background-image:image-set(url(hero-1x.png) 1x,url(hero-2x.png) 2x)}';
    for (const dpr of [1, 2]) {
      const x = await jouer(m, { w: 1400, h: 900, dpr }, H('<div class=h></div>'), css, s => s.page.evaluate(async () => {
        const pris = PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint');
        const e = pris ? await new Promise(ok => { const t = setTimeout(() => ok([]), 1500); new PerformanceObserver(l => { clearTimeout(t); ok(l.getEntries()); }).observe({ type: 'largest-contentful-paint', buffered: true }); }) : [];
        const d = e.at(-1);
        return { pris, url: d?.url?.split('/').pop() ?? null, balise: d?.element?.tagName ?? null, surface: d?.size ?? null, calcule: getComputedStyle(document.querySelector('.h')).backgroundImage.replace(/http:\/\/127\.0\.0\.1:\d+\/c\/c\d+\//g, ''), rt: performance.getEntriesByType('resource').filter(a => /\.png/.test(a.name)).map(a => ({ type: a.initiatorType, nom: a.name.split('/').pop() })) };
      }));
      r[dpr] = x;
      temoin(x.rt.length === 1, `lcp ${m.nom} DPR ${dpr} : ${JSON.stringify(x.rt)}`);
    }
    // Extrait de console tel que publié (mode console de DevTools sous Chrome), sur une page sans doublon puis sur une page à doublon.
    const fond = '.h{height:800px;background-size:cover;background-image:image-set(url("/i/@ID/hero-1x.png") 1x,url("/i/@ID/hero-2x.png") 2x)}';
    const extrait = async (nomCas, tete) => {
      r[nomCas] = await jouer(m, { w: 1400, h: 900, dpr: 2 }, H('<div class=h></div>', tete), fond, async s => {
        let res;
        if (s.cdp) {
          const c = await s.cdp();
          const v = await c.send('Runtime.evaluate', { expression: consoleFonds, replMode: true, awaitPromise: true, returnByValue: true });
          temoin(!v.exceptionDetails, `extrait de console Chrome : ${JSON.stringify(v.exceptionDetails || '')}`);
          res = v.result.value;
        } else {
          const lignes = consoleFonds.trimEnd().split('\n');
          lignes.push('return ' + lignes.pop());
          res = await s.page.evaluate(`(async()=>{${lignes.join('\n')}})()`);
        }
        temoin(res?.lcp?.url?.includes('hero-2x.png'), `extrait de console ${m.nom} : LCP ${JSON.stringify(res?.lcp)}`);
        return { sortie: { images: res.images.map(a => ({ origine: a.origine, nom: a.url.split('/').pop() })), lcp: { nom: res.lcp.url.split('/').pop(), balise: res.lcp.balise } } };
      });
    };
    await extrait('console-sans-doublon', PL('imagesrcset="/i/@ID/hero-1x.png 1x, /i/@ID/hero-2x.png 2x"'));
    await extrait('console-doublon', PL('href="/i/@ID/hero-1x.png"'));
    return r;
  },
  // Les blocs publiés dans l'article, lus dans extraits/ et servis tels quels (seul le préfixe /img/ change).
  async publie(m) {
    const r = {};
    for (const [w, h, dpr] of CONFIGS) {
      const a = BLOCS['bloc-recommande'];
      const x = await jouer(m, { w, h, dpr }, enBanc(`<!doctype html><html lang=fr><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>banc</title>${a.html}<link rel=stylesheet href="/c/@ID/s.css"><body style="margin:0"><section class=hero style="height:600px"></section>`), enBanc(a.css));
      r[`${w}x${h}@${dpr}|bloc-recommande`] = x.req;
      temoin(x.req.length === 1 && x.req[0].endsWith('.avif'), `publie ${m.nom} bloc-recommande ${w}@${dpr} : ${x.req}`);
      const v = BLOCS['bloc-variables'];
      const [tete, corps] = v.html.split('<!-- Dans le corps');
      const y = await jouer(m, { w, h, dpr }, enBanc(`<!doctype html><html lang=fr><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>banc</title>${tete}<link rel=stylesheet href="/c/@ID/s.css"><body style="margin:0"><!-- Dans le corps${corps}`).replace('class="hero" style="', 'class="hero" style="height:600px;'), enBanc(v.css));
      r[`${w}x${h}@${dpr}|bloc-variables`] = y.req;
      temoin(y.req.length === 1 && y.req[0].endsWith('.avif'), `publie ${m.nom} bloc-variables ${w}@${dpr} : ${y.req}`);
    }
    return r;
  },
  async syntaxe(m) {
    const id = `c${++n}`; cas.set(id, { html: H(''), css: '' });
    const s = await m.ouvrir({ w: 800, h: 600, dpr: 1 });
    await s.page.goto(`${base}/p/${id}/`, { waitUntil: 'load' });
    const r = await s.page.evaluate(V => Object.fromEntries(Object.entries(V).map(([k, v]) => [k, CSS.supports('background-image', v)])), SYNTAXES);
    r.__avif = await s.page.evaluate(async url => { const i = new Image(); i.src = url; try { await i.decode(); return i.naturalWidth; } catch { return 0; } }, `/i/${id}/temoin.avif`);
    await s.fermer(); cas.delete(id);
    temoin(r['x-seul'] === true, `syntaxe ${m.nom} : image-set(url 1x) refusé`);
    temoin(r.__avif === 16, `syntaxe ${m.nom} : AVIF témoin non décodé (${r.__avif})`);
    return r;
  },
};

const noms = Object.keys(MOTEURS);
const mesures = Object.fromEntries(noms.map(k => [k, []]));
const versions = {};
for (let p = 0; p < PASSAGES; p++) {
  const ordre = noms.map((_, i) => noms[(i + p) % noms.length]);
  for (const nom of ordre) {
    const m = await MOTEURS[nom](); m.nom = nom; versions[nom] = m.version;
    const res = {};
    for (const [g, f] of Object.entries(GROUPES)) {
      if (SEULEMENT.length && !SEULEMENT.includes(g)) continue;
      const t0 = Date.now();
      res[g] = await f(m);
      console.log(`passage ${p + 1} ${nom} ${g} : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    }
    mesures[nom].push(res);
    await m.b.close();
  }
}
srv.close();
fs.writeFileSync(path.join(SORTIE, 'mesures.json'), JSON.stringify({ versions, passages: PASSAGES, delai_image_ms: DELAI_IMAGE, mesures }, null, 1));
if (temoins.length) { console.error('TEMOINS EN ECHEC\n' + temoins.join('\n')); process.exit(1); }
console.log('TEMOINS OK');
process.exit(0);
