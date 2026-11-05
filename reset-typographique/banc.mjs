// Banc « reset typographique CSS » : voir PROTOCOLE.md.
// Trois moteurs, un script : Chrome stable (Playwright), Firefox stable (puppeteer-core, BiDi), WebKit de Playwright.
// Sortie : <SORTIE>/mesures.json, captures dans <SORTIE>/captures/. Une ligne TEMOINS OK, sinon sortie 1.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import puppeteer from 'puppeteer-core';

const PASSAGES = +(process.env.PASSAGES || 3);
const SORTIE = process.env.SORTIE;
if (!SORTIE) { console.error('SORTIE manquant'); process.exit(2); }
const SYS = '/System/Library/Fonts/Supplemental/';
const feuille = fs.readFileSync('vendor/tidy-typography.css', 'utf8');
const bloc = fs.readFileSync('extraits/bloc-recommande.css', 'utf8');
const consoleSupport = fs.readFileSync('extraits/console-support.js', 'utf8');

// Serveur : pages en mémoire, polices en no-store, délai demandé par ?d=<ms>.
const pages = new Map();
const srv = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/__banc') { r.writeHead(200); return r.end('reset-typographique'); }
  if (u.pathname.startsWith('/f/')) {
    const nom = u.pathname.slice(3);
    const file = nom === 'verdana.ttf' ? SYS + 'Verdana.ttf' : path.resolve('polices', nom);
    if (!fs.existsSync(file)) { r.writeHead(404); return r.end(); }
    return void setTimeout(() => { r.writeHead(200, { 'content-type': 'font/woff2', 'cache-control': 'no-store' }); r.end(fs.readFileSync(file)); }, +(u.searchParams.get('d') || 0));
  }
  const h = pages.get(u.pathname);
  r.writeHead(h ? 200 : 404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); r.end(h || '');
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${srv.address().port}`;
if (await (await fetch(base + '/__banc')).text() !== 'reset-typographique') { console.error('BANC ABSENT'); process.exit(1); }
let n = 0;
const put = html => { const id = `/p${++n}`; pages.set(id, html); return base + id; };

const MOTEURS = {
  chrome: async () => { const b = await chromium.launch({ channel: 'chrome' }); return { b, version: b.version(), pw: true }; },
  firefox: async () => { const b = await puppeteer.launch({ browser: 'firefox', executablePath: '/Applications/Firefox.app/Contents/MacOS/firefox', headless: true }); return { b, version: (await b.version()).replace('firefox/', ''), pw: false }; },
  webkit: async () => { const b = await webkit.launch(); return { b, version: b.version(), pw: true }; },
};
const dormir = ms => new Promise(z => setTimeout(z, ms));
const temoins = [];
const temoin = (ok, m) => { if (!ok) temoins.push(m); };

async function ouvrir(moteur) {
  const o = await MOTEURS[moteur]();
  const page = await o.b.newPage();
  if (o.pw) await page.setViewportSize({ width: 1400, height: 900 }); else await page.setViewport({ width: 1400, height: 900 });
  return { ...o, page };
}
const lorem = 'Le navigateur assemble les lignes de ce paragraphe, puis il calcule la hauteur du bloc et la position des suivants, sans attendre la fin du chargement.';
const charger = async (page, html) => { await page.goto(put(html), { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready.then(() => 1)); };
const capture = (page, moteur, nom, passage, clip) => passage === 0 ? page.screenshot({ path: path.join(SORTIE, 'captures', `${moteur}-${nom}.png`), clip }) : null;
const clipStd = { x: 0, y: 0, width: 760, height: 360 };

const GROUPES = {
  async bascule(moteur, passage) {
    const ordre = ['none', 'from-font', '0.545']; const r = {};
    for (let i = 0; i < 3; i++) {
      const v = ordre[(i + passage) % 3];
      const { b, page } = await ouvrir(moteur);
      await page.goto(put(`<!doctype html><html lang=fr><style>@font-face{font-family:W;src:url(/f/verdana.ttf?d=1500&u=${++n}) format("truetype");font-display:swap}
        body{margin:20px;font:16px/1.5 W,"Times New Roman";font-size-adjust:${v}} #t{white-space:nowrap}</style><body><span id=t>${lorem}</span><p id=p style="width:500px">${lorem}</p>`), { waitUntil: 'domcontentloaded' });
      await dormir(300);
      const mes = () => page.evaluate(() => ({ etat: document.fonts.status, nombre: getComputedStyle(document.body).fontSizeAdjust, largeur: +document.getElementById('t').getBoundingClientRect().width.toFixed(1), hauteur: +document.getElementById('p').getBoundingClientRect().height.toFixed(1) }));
      const pendant = await mes();
      await dormir(1600);
      await page.evaluate(() => document.fonts.ready.then(() => 1));
      await dormir(100);
      const apres = await mes();
      temoin(pendant.etat === 'loading', `${moteur} bascule ${v} : pendant = ${pendant.etat}`);
      temoin(apres.etat === 'loaded', `${moteur} bascule ${v} : après = ${apres.etat}`);
      r[v] = { pendant, apres };
      await b.close();
    }
    temoin(r.none.pendant.largeur !== r.none.apres.largeur, `${moteur} bascule : none ne change pas de largeur`);
    return r;
  },
  async heritage(moteur) {
    const { b, page } = await ouvrir(moteur); const r = {};
    for (const v of ['none', 'from-font']) {
      await charger(page, `<!doctype html><style>body{font:16px Verdana;font-size-adjust:${v}} code{font-family:"Courier New"} h2{font-family:Georgia;font-size:32px;font-weight:700}</style><body><span id=a>Texte courant</span> <code id=c>code en ligne</code><h2><span id=g>Titre en Georgia</span></h2>`);
      r[v] = await page.evaluate(() => Object.fromEntries(['a', 'c', 'g'].map(i => { const e = document.getElementById(i); return [i, { largeur: +e.getBoundingClientRect().width.toFixed(1), nombre: getComputedStyle(e).fontSizeAdjust }]; })));
    }
    temoin(r.none.c.nombre === 'none', `${moteur} heritage : none calculé ${r.none.c.nombre}`);
    await b.close(); return r;
  },
  async opentype(moteur) {
    const { b, page } = await ouvrir(moteur); const r = {};
    for (const f of ['tout', 'defaut', 'liste', 'liste-tnum', 'liste-subs-sups', 'liste-opsz14']) {
      await charger(page, `<!doctype html><style>@font-face{font-family:I;src:url(/f/inter-${f}.woff2) format("woff2");font-weight:100 900}
        span{font:64px I;white-space:nowrap;display:inline-block}.t{font-variant-numeric:tabular-nums}.off{font-optical-sizing:none}</style>
        <span id=p1>1111</span><br><span id=p0>0000</span><br><span id=t1 class=t>1111</span><br><span id=t0 class=t>0000</span><br><span id=oa>Hamburgefonstiv</span><br><span id=on class=off>Hamburgefonstiv</span>`);
      r[f] = await page.evaluate(() => { const w = i => +document.getElementById(i).getBoundingClientRect().width.toFixed(1); return { p1: w('p1'), p0: w('p0'), t1: w('t1'), t0: w('t0'), opszAuto: w('oa'), opszNone: w('on'), etat: [...document.fonts].map(x => x.status).join() }; });
      temoin(r[f].etat === 'loaded', `${moteur} opentype ${f} : police ${r[f].etat}`);
    }
    temoin(r.tout.t1 === r.tout.t0, `${moteur} opentype : tabular-nums sans effet sur le fichier complet`);
    await b.close(); return r;
  },
  async textbox(moteur, passage) {
    const { b, page } = await ouvrir(moteur); const r = {};
    for (const [k, css] of [['sans', ''], ['avec', 'p,li,h2{text-box:trim-both cap alphabetic}']]) {
      await charger(page, `<!doctype html><html lang=fr><style>body{font:16px/1.6 Georgia;margin:20px} p{margin-block:1em;width:500px} ${css}</style><p id=a>${lorem}</p><p id=b>${lorem}</p><ul><li id=l>élément de liste</li></ul>
        <h2 style="font:700 40px/1.2 Georgia;margin:30px 0;background:#eee;overflow:hidden;width:600px">Été Éjgpqy Ç</h2>`);
      r[k] = await page.evaluate(() => { const g = i => document.getElementById(i).getBoundingClientRect(); return { hauteurP: +g('a').height.toFixed(1), pas: +(g('b').top - g('a').top).toFixed(1), hauteurLi: +g('l').height.toFixed(1), trim: getComputedStyle(document.getElementById('a')).textBoxTrim }; });
      await capture(page, moteur, 'textbox-' + k, passage, clipStd);
    }
    temoin(r.avec.trim === 'trim-both' && r.sans.trim === 'none', `${moteur} textbox : trim ${r.sans.trim}/${r.avec.trim}`);
    await b.close(); return r;
  },
  async feuille(moteur, passage) {
    const { b, page } = await ouvrir(moteur);
    await charger(page, `<!doctype html><html lang=fr><style>${feuille} body{font-family:Georgia}</style><article class=article-container><h1 id=h1>Titre</h1><h3 id=h3>Inter</h3><h6 id=h6>Petit</h6><p id=p>${lorem}</p><blockquote id=bq>Citation</blockquote><figure><figcaption id=fc>Légende de figure</figcaption></figure>
      <ul id=u><li>Premier élément gpqy</li><li>Deuxième élément gpqy</li><li>Troisième élément gpqy</li></ul><ul id=m style="list-style:none;padding:0"><li><a href=#>Accueil gpqy</a></li><li><a href=#>Services gpqy</a></li></ul></article>`);
    const r = await page.evaluate(() => {
      const fs = i => parseFloat(getComputedStyle(document.getElementById(i)).fontSize);
      const l = [...document.querySelectorAll('#u li')].map(e => e.getBoundingClientRect());
      return { h1: fs('h1'), h3: fs('h3'), h6: fs('h6'), p: fs('p'), blockquote: fs('bq'), figcaption: fs('fc'), tailleLi: parseFloat(getComputedStyle(document.querySelector('#u li')).fontSize), hauteurLi: +l[0].height.toFixed(1), pasLi: +(l[1].top - l[0].top).toFixed(1), hauteurLien: +document.querySelector('#m a').getBoundingClientRect().height.toFixed(1) };
    });
    const y = await page.evaluate(() => document.querySelector('#u').getBoundingClientRect().top);
    await capture(page, moteur, 'feuille-liste', passage, { x: 0, y: Math.max(0, Math.floor(y) - 10), width: 760, height: 130 });
    await b.close(); return r;
  },
  async selecteurs(moteur) {
    const { b, page } = await ouvrir(moteur);
    await charger(page, `<!doctype html><style>
      :heading,#liste{color:rgb(255,0,0)}
      :is(:heading,h3),#pardonnant{color:rgb(255,0,0)}
      #temoin{color:rgb(255,0,0)}
      @supports selector(:heading){#garde{color:rgb(255,0,0)}}</style>
      <h2 id=h>t</h2><h3 id=h3>t</h3><div id=r role=heading aria-level=2>t</div><p id=liste>t</p><p id=pardonnant>t</p><p id=temoin>t</p><p id=garde>t</p>`);
    const r = await page.evaluate(() => {
      const rouge = i => getComputedStyle(document.getElementById(i)).color === 'rgb(255, 0, 0)';
      let m = { h2: null, role: null };
      try { m = { h2: document.getElementById('h').matches(':heading'), role: document.getElementById('r').matches(':heading') }; } catch (e) { m = { h2: 'SyntaxError', role: 'SyntaxError' }; }
      return { supports: CSS.supports('selector(:heading)'), listeSimple: rouge('liste'), listePardonnante: rouge('pardonnant'), h3DansIs: rouge('h3'), temoin: rouge('temoin'), garde: rouge('garde'), ...m };
    });
    temoin(r.temoin, `${moteur} selecteurs : règle témoin non appliquée`);
    await b.close(); return r;
  },
  async variation(moteur) {
    const { b, page } = await ouvrir(moteur); const r = {};
    const cas = {
      'parent wght, sans *': ['', '.g{font-variation-settings:"wght" 900}'],
      'parent wght, avec *': ['*{font-variation-settings:"GRAD" var(--vf-grad,0)}', '.g{font-variation-settings:"wght" 900}'],
      'parent wght, règle sur body': ['body{font-variation-settings:"GRAD" var(--vf-grad,0)}', '.g{font-variation-settings:"wght" 900}'],
      'parent font-weight, avec *': ['*{font-variation-settings:"GRAD" var(--vf-grad,0)}', '.g{font-weight:900}'],
    };
    for (const [k, [regle, g]] of Object.entries(cas)) {
      await charger(page, `<!doctype html><style>@font-face{font-family:I;src:url(/f/inter-tout.woff2) format("woff2");font-weight:100 900}
        body{font:20px I} ${regle} ${g} .icone{font-variation-settings:"FILL" 1}</style><div class=g>Parent <span id=s>enfant du parent réglé</span></div><div class=icone><i id=i>x</i></div>`);
      r[k] = await page.evaluate(() => ({ enfant: getComputedStyle(document.getElementById('s')).fontVariationSettings, largeur: +document.getElementById('s').getBoundingClientRect().width.toFixed(1), icone: getComputedStyle(document.getElementById('i')).fontVariationSettings }));
    }
    temoin(r['parent wght, sans *'].enfant.includes('wght'), `${moteur} variation : réglage du parent perdu sans la règle *`);
    await b.close(); return r;
  },
  async position(moteur, passage) {
    const { b, page } = await ouvrir(moteur); const r = {};
    const regle = `@supports (font-variant-position: sub){:is(sub,.sub){vertical-align:baseline;font-size:100%;line-height:inherit;font-variant-position:sub}}
      @supports (font-variant-position: super){:is(sup,.sup){vertical-align:baseline;font-size:100%;line-height:inherit;font-variant-position:super}}`;
    const face = `@font-face{font-family:IT;src:url(/f/inter-tout.woff2) format("woff2");font-weight:100 900}@font-face{font-family:IL;src:url(/f/inter-liste.woff2) format("woff2");font-weight:100 900}`;
    const polices = { Arial: 'Arial', 'STIX Two Text': 'STIX Two Text', 'Inter tout': 'IT', 'Inter liste': 'IL' };
    const ligne = (nom, f, i) => `<p style="font-family:'${f}'">${nom} : H<sub id=s${i}>2</sub>O, 10 m<sup>2</sup>, 1<sup>er</sup> <span id=n${i}>2</span></p>`;
    const corps = Object.entries(polices).map(([nom, f], i) => ligne(nom, f, i)).join('');
    const lire = () => page.evaluate(k => Object.fromEntries(k.map((nom, i) => [nom, { courant: +document.getElementById('n' + i).getBoundingClientRect().width.toFixed(2), indice: +document.getElementById('s' + i).getBoundingClientRect().width.toFixed(2) }])), Object.keys(polices));
    await charger(page, `<!doctype html><style>${face} body{font-size:36px;margin:10px}p{margin:6px 0}</style>${corps}`);
    await capture(page, moteur, 'position-defaut', passage, clipStd);
    r.defaut = await lire();
    await charger(page, `<!doctype html><style>${face} body{font-size:36px;margin:10px}p{margin:6px 0} ${regle}</style>${corps}`);
    await capture(page, moteur, 'position-regle', passage, clipStd);
    r.regle = await lire();
    temoin(r.defaut.Arial.indice < r.defaut.Arial.courant, `${moteur} position : indice du navigateur non réduit`);
    await b.close(); return r;
  },
  async cqi(moteur) {
    const { b, page } = await ouvrir(moteur);
    await charger(page, `<!doctype html><style>
      :root{--step-0:clamp(1rem,.9rem + 1cqi,1.125rem);--step-3:clamp(2rem,1.6rem + 3cqi,2.75rem)}
      @property --reg{syntax:"<length>";inherits:true;initial-value:0px} :root{--reg:clamp(2rem,1.6rem + 3cqi,2.75rem)}
      body{font-size:var(--step-0);margin:0} .c{container-type:inline-size;width:300px} h2{font-size:var(--step-3);margin:0} .r{font-size:var(--reg)} .l{font-size:var(--step-0)} .c2{container-type:inline-size;width:300px;font-size:var(--step-3)}</style>
      <h2 id=hors>hors conteneur</h2><p id=pb>texte hors conteneur</p>
      <div class=c><h2 id=dans>dans le conteneur</h2><p id=pd>texte hérité dans le conteneur</p><p id=pl class=l>texte qui redéclare</p><h2 id=reg class=r>jeton enregistré</h2></div><div class=c2 id=auto>le conteneur lui-même</div>`);
    const r = await page.evaluate(() => Object.fromEntries(['hors', 'pb', 'dans', 'pd', 'pl', 'reg', 'auto'].map(i => [i, +parseFloat(getComputedStyle(document.getElementById(i)).fontSize).toFixed(1)])));
    temoin(r.hors !== r.dans, `${moteur} cqi : hors et dans égaux`);
    await b.close(); return r;
  },
  async quotes(moteur, passage) {
    const { b, page } = await ouvrir(moteur); const r = {};
    const q = `<div lang=fr><q id=f>citation <q>imbriquée</q></q> (fr)</div><div lang=en><q id=e>quote <q>nested</q></q> (en)</div><div lang=en-GB><q id=g>quote <q>nested</q></q> (en-GB)</div>`;
    const cas = {
      defaut: '',
      billet: `:where(:lang(en)) > * { quotes: "\\"" "\\"" "'" "'"; }
:where(:lang(en-GB)) > * { quotes: "'" "'" "\\"" "\\""; }
:where(:lang(fr)) > * { quotes: "«\\\\00202F" "\\\\00202F»" "\\"" "\\""; }
q::before { content: open-quote; } q::after { content: close-quote; }`,
      corrige: ':where(q:lang(fr)) { quotes: "«\\202F" "\\202F»" "“" "”"; }',
    };
    for (const [k, css] of Object.entries(cas)) {
      await charger(page, `<!doctype html><style>body{font:28px Georgia;margin:10px} ${css}</style>${q}`);
      r[k] = await page.evaluate(() => Object.fromEntries(['f', 'e', 'g'].map(i => { const e = document.getElementById(i); return [i, { quotes: getComputedStyle(e).quotes, largeur: +e.getBoundingClientRect().width.toFixed(1) }]; })));
      await capture(page, moteur, 'quotes-' + k, passage, { x: 0, y: 0, width: 760, height: 130 });
    }
    temoin(r.defaut.f.largeur > 0 && r.defaut.e.largeur > 0, `${moteur} quotes : q absent`);
    await b.close(); return r;
  },
  async cesure(moteur) {
    const { b, page } = await ouvrir(moteur);
    const mot = 'anticonstitutionnellement', Mot = 'Anticonstitutionnellement';
    const cases = {
      'manual, lang=fr': ['fr', 'hyphens:manual', mot],
      'auto, lang=fr': ['fr', 'hyphens:auto;-webkit-hyphens:auto', mot],
      'auto, lang=fr, majuscule': ['fr', 'hyphens:auto;-webkit-hyphens:auto', Mot],
      'auto, lang=de, majuscule': ['de', 'hyphens:auto;-webkit-hyphens:auto', 'Donaudampfschifffahrtsgesellschaft'],
      'auto, sans lang': ['', 'hyphens:auto;-webkit-hyphens:auto', mot],
      'auto, lang=fr, hyphenate-limit-chars: 30': ['fr', 'hyphens:auto;-webkit-hyphens:auto;hyphenate-limit-chars:30', mot],
      'auto, lang=fr, majuscule, break-word': ['fr', 'hyphens:auto;-webkit-hyphens:auto;overflow-wrap:break-word', Mot],
      'auto, lang=fr, majuscule, anywhere': ['fr', 'hyphens:auto;-webkit-hyphens:auto;overflow-wrap:anywhere', Mot],
    };
    const corps = Object.entries(cases).map(([k, [l, css, m]], i) => `<p id=c${i} ${l ? `lang=${l}` : ''} style="${css}">${m}</p>`).join('');
    await charger(page, `<!doctype html><style>p{font:16px/20px Georgia;width:130px;margin:0 0 8px}td{padding:0}.nv{width:40px}</style>${corps}
      <div class=nv><table><tr><td id=tb><span style="overflow-wrap:break-word">Anticonstitutionnellement</span></td></tr></table></div><div class=nv><table><tr><td id=ta><span style="overflow-wrap:anywhere">Anticonstitutionnellement</span></td></tr></table></div>`);
    const r = await page.evaluate(k => ({ debordement: Object.fromEntries(k.map((nom, i) => [nom, document.getElementById('c' + i).scrollWidth])), celluleBreakWord: +document.getElementById('tb').getBoundingClientRect().width.toFixed(1), celluleAnywhere: +document.getElementById('ta').getBoundingClientRect().width.toFixed(1) }), Object.keys(cases));
    temoin(r.debordement['manual, lang=fr'] > 130, `${moteur} cesure : manual ne déborde pas`);
    await b.close(); return r;
  },
  async support(moteur) {
    const { b, page } = await ouvrir(moteur);
    await charger(page, '<!doctype html><p id=p>x</p>');
    const r = await page.evaluate(() => {
      const s = {};
      for (const d of ['display: block', 'hyphenate-limit-chars: 6 3 3', 'hyphenate-character: "x"', 'hyphenate-limit-lines: 2', 'hyphenate-limit-zone: 8%', 'hyphenate-limit-last: always', '-webkit-hyphenate-limit-before: 4', '-webkit-hyphenate-limit-lines: 2', 'hanging-punctuation: first allow-end last', 'text-wrap: pretty', 'text-wrap: stable', 'text-box: trim-both cap alphabetic', 'font-variant-emoji: text', 'font-variant-position: sub', 'font-size-adjust: from-font', 'text-size-adjust: none', '-webkit-text-size-adjust: none', '-webkit-font-smoothing: antialiased']) s[d] = CSS.supports(`(${d})`);
      const c = getComputedStyle(document.getElementById('p')), initiales = {};
      for (const n of ['font-optical-sizing', 'font-kerning', 'font-variant-ligatures', 'text-decoration-skip-ink', 'text-rendering']) initiales[n] = c.getPropertyValue(n);
      return { s, initiales };
    });
    temoin(r.s['display: block'] === true, `${moteur} support : témoin faux`);
    await b.close(); return r;
  },
  async rendu(moteur) {
    const { b, page } = await ouvrir(moteur);
    const t = 'AVAVAV To Ty We fi fl office';
    await charger(page, `<!doctype html><style>span{font:16px "Times New Roman";white-space:nowrap}.k{font-kerning:none}.o{text-rendering:optimizeLegibility}.n{font-kerning:normal}</style>
      <span id=d>${t}</span><br><span id=o class=o>${t}</span><br><span id=n class=n>${t}</span><br><span id=k class=k>${t}</span>`);
    const r = await page.evaluate(() => Object.fromEntries([['defaut', 'd'], ['optimizeLegibility', 'o'], ['font-kerning: normal', 'n'], ['font-kerning: none', 'k']].map(([k, i]) => [k, +document.getElementById(i).getBoundingClientRect().width.toFixed(2)])));
    temoin(r['font-kerning: none'] > r.defaut, `${moteur} rendu : font-kerning none pas plus large`);
    await b.close(); return r;
  },
  async bloc(moteur, passage) {
    const { b, page } = await ouvrir(moteur);
    await charger(page, `<!doctype html><html lang=fr-FR><style>${bloc}
      body{font:16px/1.5 Georgia;margin:10px} article p.etroit{width:130px} .classe{hyphens:none}</style><article>
      <h2 id=h>Titre</h2><p id=p class=etroit>Anticonstitutionnellement, les caractéristiques typographiques internationales.</p><p id=c class="etroit classe">texte</p><ul><li id=l>élément</li></ul><p><code id=co>code</code> <span id=sc>texte</span></p>
      <p><q id=f>citation <q>imbriquée</q></q> et <q id=e lang=en>quote</q></p><table id=t><tr><td>1</td></tr></table></article><p id=hors>hors article</p>`);
    const r = await page.evaluate(() => {
      const c = i => getComputedStyle(document.getElementById(i));
      return { hStyle: c('h').textWrapStyle, hHyphens: c('h').hyphens, pStyle: c('p').textWrapStyle, pHyphens: c('p').hyphens, pLimite: c('p').hyphenateLimitChars ?? null, pOverflow: c('p').overflowWrap, liHyphens: c('l').hyphens, codeHyphens: c('co').hyphens, voisinHyphens: c('sc').hyphens, classeHyphens: c('c').hyphens, horsHyphens: c('hors').hyphens, tableau: c('t').fontVariantNumeric, qFr: c('f').quotes, qEn: c('e').quotes, debordementP: document.getElementById('p').scrollWidth };
    });
    await capture(page, moteur, 'bloc', passage, clipStd);
    temoin(r.classeHyphens === 'none', `${moteur} bloc : une classe ne l'emporte pas (${r.classeHyphens})`);
    temoin(r.voisinHyphens === 'auto' && r.codeHyphens === 'manual', `${moteur} bloc : code ${r.codeHyphens}, texte voisin ${r.voisinHyphens}`);
    r.console = await page.evaluate(consoleSupport);
    await b.close(); return r;
  },
};

const moteurs = Object.keys(MOTEURS);
const sortie = { passages: PASSAGES, versions: {}, mesures: {} };
for (let p = 0; p < PASSAGES; p++) {
  for (let i = 0; i < moteurs.length; i++) {
    const m = moteurs[(i + p) % moteurs.length];
    sortie.mesures[m] ??= [];
    const courant = {};
    for (const [g, f] of Object.entries(GROUPES)) {
      courant[g] = await f(m, p);
      process.stderr.write(`${m} p${p} ${g}\n`);
    }
    sortie.mesures[m].push(courant);
    if (!sortie.versions[m]) { const o = await MOTEURS[m](); sortie.versions[m] = o.version; await o.b.close(); }
  }
}
fs.writeFileSync(path.join(SORTIE, 'mesures.json'), JSON.stringify(sortie, null, 1));
srv.close();
if (temoins.length) { console.error('TEMOINS EN ECHEC :\n' + temoins.join('\n')); process.exit(1); }
console.log('TEMOINS OK', JSON.stringify(sortie.versions));
process.exit(0);
