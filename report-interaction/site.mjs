// Page de banc et ses variantes de chargement des scripts, servies en local, compressées en gzip.
//   site  : http://site.localhost:<port>/<variante>.html   (scripts propres, images, CSS)
//   tiers : http://tiers.localhost:<port>/…                 (gtag.js et fbevents.js réels, chat synthétique)
// Variantes :
//   A classique      jQuery bloquant dans le head, scripts du thème synchrones en pied, tiers async
//   B defer          scripts propres en defer (inline dépendant de jQuery enveloppé), tiers async
//   C report-tiers   B + chargeur AwpDelayScripts : GA 2 500 ms, Pixel 3 000 ms, chat 7 000 ms, plafond 5 s
//   E report-hors-mesure  C, mais GA4 laissé en async (seuls Pixel et chat reportés)
//   D wprocket       A passé par Delay JS de WP Rocket 3.23.5.1 (lazyload-scripts 2.0.5) : tout reporté, jQuery compris
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const NM = path.join(ICI, 'node_modules');
const V = path.join(ICI, 'vendor');
export const VARIANTES = ['A', 'B', 'C', 'E', 'D'];
export const NOMS = { A: 'classique', B: 'defer', C: 'report-tiers', E: 'report-hors-mesure', D: 'wprocket-tout' };

const FICHIERS_SITE = {
  '/js/jquery.min.js': path.join(NM, 'jquery/dist/jquery.min.js'),
  '/js/jquery-migrate.min.js': path.join(NM, 'jquery-migrate/dist/jquery-migrate.min.js'),
  '/js/slick.min.js': path.join(NM, 'slick-carousel/slick/slick.min.js'),
  '/js/jquery.magnific-popup.min.js': path.join(NM, 'magnific-popup/dist/jquery.magnific-popup.min.js'),
  '/css/slick.css': path.join(NM, 'slick-carousel/slick/slick.css'),
  '/css/magnific-popup.css': path.join(NM, 'magnific-popup/dist/magnific-popup.css'),
};
const AWP = fs.readFileSync(path.join(V, 'awp-delay-scripts.js'), 'utf8')  // snippet awp-delay-scripts du wiki, commentaire corrigé pour l'inclusion inline (2026-10-20);
const WPR = fs.readFileSync(path.join(V, 'wp-rocket/lazyload-scripts.min.js'), 'utf8');
const WPR_IE = fs.readFileSync(path.join(V, 'wp-rocket/HTML.php'), 'utf8').match(/return '(if\(navigator\.userAgent\.match.*?)';/)[1];
const WPR_EXCLUSIONS = JSON.parse(fs.readFileSync(path.join(V, 'wp-rocket/dynamic-lists.json'), 'utf8')).delay_js_exclusions;

// --- scripts du thème (jQuery) ---
const THEME_JS = `/* theme.js : comportements du thème, jQuery */
jQuery(function ($) {
  var $nav = $('#nav');
  $('.burger').on('click', function (e) {
    e.preventDefault();
    $nav.toggleClass('is-open');
    $(this).attr('aria-expanded', $nav.hasClass('is-open') ? 'true' : 'false');
  });
  $('.faq-q').on('click', function () {
    var $i = $(this).closest('.faq-item');
    $i.toggleClass('open');
    $(this).attr('aria-expanded', $i.hasClass('open') ? 'true' : 'false');
    $i.find('.faq-a').stop(true, true).slideToggle(200);
  });
  $('.carousel').slick({ dots: true, arrows: true, lazyLoad: 'ondemand', adaptiveHeight: false });
  $('.gallery').magnificPopup({ delegate: 'a', type: 'image', gallery: { enabled: true } });
  $(window).on('scroll', function () { $('.site-header').toggleClass('scrolled', $(window).scrollTop() > 10); });
  performance.mark('theme-ready');
});
performance.mark('theme-exec');
`;
const PLUGIN_INLINE = `jQuery(function ($) {
  $('#totop').on('click', function () { $('html, body').animate({ scrollTop: 0 }, 300); return false; });
  performance.mark('plugin-inline');
});`;
const JS_EXTRA = `var themeData = {"ajaxurl":"\\/wp-admin\\/admin-ajax.php","i18n":{"menu":"Menu","close":"Fermer"}};`;

// --- chat synthétique : travail fixe (s'allonge avec le bridage), ~150 Ko, écouteur de clic global
function chatJs(tiers) {
  const dico = JSON.stringify(Array.from({ length: 1800 }, (_, i) => ({ k: 'cle_' + i, fr: 'Libellé de traduction numéro ' + i, en: 'Translation label number ' + i })));
  return `/* widget de chat SYNTHÉTIQUE du banc : coût calibré, pas un produit réel */
(function () {
  var D = ${dico};
  var t0 = performance.now();
  var idx = {}; for (var r = 0; r < 24; r++) { for (var i = 0; i < D.length; i++) { idx[D[i].k + r] = JSON.parse(JSON.stringify(D[i])); } }
  var s = ''; for (var j = 0; j < 240000; j++) { s += String.fromCharCode(97 + (j % 26)); }
  var panel = document.createElement('div'); panel.id = 'chat-panel'; panel.hidden = true;
  for (var n = 0; n < 250; n++) { var m = document.createElement('p'); m.textContent = D[n].fr; panel.appendChild(m); }
  var b = document.createElement('button'); b.id = 'chat-bubble'; b.type = 'button'; b.textContent = 'Discuter';
  b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:50;padding:12px 16px;border-radius:24px;border:0;background:#0a7;color:#fff';
  document.body.appendChild(panel); document.body.appendChild(b);
  document.addEventListener('click', function () { var x = 0; for (var k = 0; k < 400000; k++) { x += k % 7; } window.__chatClic = x; }, true);
  performance.mark('chat-exec');
  fetch('${tiers}/chat/ready?ms=' + Math.round(performance.now() - t0), { mode: 'no-cors' });
})();
`;
}

// --- descripteurs des scripts dans leur forme « WordPress » (variante A) ---
function scripts(tiers) {
  const GA_ID = 'G-BANC000001', FB_ID = '100000000000001';
  return [
    { pos: 'head', own: true, tag: `<script src="/js/jquery.min.js" id="jquery-core-js"></script>` },
    { pos: 'head', own: true, tag: `<script src="/js/jquery-migrate.min.js" id="jquery-migrate-js"></script>` },
    { pos: 'head', tier: 'ga', role: 'lib', src: `${tiers}/gtag/js?id=${GA_ID}`, tag: `<script async src="${tiers}/gtag/js?id=${GA_ID}"></script>` },
    { pos: 'head', tier: 'ga', role: 'inline', tag: `<script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');</script>` },
    { pos: 'head', tier: 'fb', role: 'inline', tag: `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','${tiers}/en_US/fbevents.js');fbq('init', '${FB_ID}');fbq('track', 'PageView');</script>` },
    { pos: 'foot', own: true, tag: `<script id="theme-js-extra">${JS_EXTRA}</script>` },
    { pos: 'foot', own: true, tag: `<script src="/js/slick.min.js" id="slick-js"></script>` },
    { pos: 'foot', own: true, tag: `<script src="/js/jquery.magnific-popup.min.js" id="magnific-js"></script>` },
    { pos: 'foot', own: true, tag: `<script src="/js/theme.js" id="theme-js"></script>` },
    { pos: 'foot', own: true, jqInline: true, tag: `<script id="totop-js-after">${PLUGIN_INLINE}</script>` },
    { pos: 'foot', tier: 'chat', role: 'lib', src: `${tiers}/chat/widget.js`, tag: `<script async src="${tiers}/chat/widget.js" id="chat-js"></script>` },
  ];
}

const deferTag = t => t.replace(/<script src=/, '<script defer src=');
const wrapDCL = t => t.replace(/(<script[^>]*>)([\s\S]*)<\/script>/, (m, a, c) => `${a}window.addEventListener('DOMContentLoaded', function () { ${c} });</script>`);
const DELAI_AWP = { ga: 2500, fb: 3000, chat: 7000 };
const awpTag = s => s.src
  ? `<script type="delay/oninteraction" data-delay="${DELAI_AWP[s.tier]}"${s.tier === 'chat' ? ' id="chat-js"' : ''} src="${s.src}"></script>`
  : s.tag.replace('<script>', `<script type="delay/oninteraction" data-delay="${DELAI_AWP[s.tier]}">`);

// Transformation Delay JS de WP Rocket 3.23.5.1 (HTML::replace_scripts), exclusions par défaut de dynamic-lists.json
function wprocketTag(tag) {
  for (const p of WPR_EXCLUSIONS) { if (new RegExp(p, 'i').test(tag)) return tag; }
  const m = tag.match(/^<\s*script(\s*[^>]*?)?>([\s\S]*?)<\s*\/\s*script\s*>$/i);
  let attr = (m[1] || '').trim(), content = m[2];
  if (!attr) return `<script type="text/rocketlazyloadscript">${content}</script>`;
  attr = attr.replace(/type\s*=\s*(["'])(.*?)\1/i, 'data-rocket-type=$1$2$1');
  attr = attr.replace(/src\s*=\s*(["'])(.*?)\1/i, 'data-rocket-src=$1$2$1');
  return `<script type="text/rocketlazyloadscript" ${attr.trim()}>${content}</script>`;
}

export function page(v, tiers) {
  const S = scripts(tiers);
  let headInit = '';
  const out = { head: [], foot: [] };
  for (const s of S) {
    let t = s.tag;
    if (v === 'B' || v === 'C' || v === 'E') {
      if (s.own && /<script src=/.test(t)) t = deferTag(t);
      if (s.jqInline) t = wrapDCL(t);
    }
    // GA : seule la bibliothèque est reportée, la file dataLayer inline reste (C) ; E laisse GA4 entier
    if ((v === 'C' && s.tier && !(s.tier === 'ga' && s.role === 'inline')) || (v === 'E' && s.tier && s.tier !== 'ga')) t = awpTag(s);
    if (v === 'D') t = wprocketTag(t);
    out[s.pos].push(t);
  }
  const inl = c => c.replace(/<\/script/gi, '<\\/script');   // un </script> dans un commentaire fermerait l'inline
  if (v === 'C' || v === 'E') headInit = `<script>${inl(AWP)}</script>`;
  if (v === 'D') headInit = `<script>${inl(WPR)}</script><script>${WPR_IE}</script>`;
  const faq = [1, 2, 3].map(i => `<div class="faq-item"><button class="faq-q" type="button" aria-expanded="false" id="faq-q${i}">Question fréquente n° ${i} : délais et conditions ?</button><div class="faq-a"><p>Réponse détaillée à la question ${i}. Les délais dépendent du service choisi et de la période.</p></div></div>`).join('\n');
  const slides = [1, 2, 3, 4, 5].map(i => `<div><img data-lazy="/img/slide${i}.webp" width="600" height="400" alt="Réalisation ${i}"></div>`).join('');
  const photos = [1, 2, 3, 4].map(i => `<a href="/img/photo${i}.webp"><img src="/img/slide${i}.webp" loading="lazy" width="600" height="400" alt="Photo ${i}"></a>`).join('');
  const texte = Array.from({ length: 6 }, (_, i) => `<p>Paragraphe ${i + 1}. Nous accompagnons les entreprises dans leurs projets, de l'étude au suivi, avec une équipe locale et des délais tenus. Chaque intervention commence par un diagnostic et se termine par un compte rendu.</p>`).join('\n');
  return `<!doctype html>
<html lang="fr"><head>${headInit}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Banc report des scripts : ${NOMS[v]}</title>
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/slick.css">
<link rel="stylesheet" href="/css/magnific-popup.css">
${out.head.join('\n')}
</head>
<body class="variante-${v}">
<header class="site-header"><a class="logo" href="#">Entreprise</a>
<button class="burger" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
<nav id="nav"><ul><li><a href="#">Services</a></li><li><a href="#">Réalisations</a></li><li><a href="#">Tarifs</a></li><li><a href="#">Contact</a></li></ul></nav>
</header>
<main>
<img class="hero" src="/img/hero.webp" width="720" height="450" fetchpriority="high" alt="Atelier">
<h1>Votre projet, accompagné de bout en bout</h1>
<section class="faq">${faq}</section>
<section><h2>Réalisations</h2><div class="carousel">${slides}</div></section>
${texte}
<section><h2>Galerie</h2><div class="gallery">${photos}</div></section>
<p><button id="temoin" type="button">Témoin</button> <span id="temoin-out">0</span></p>
<p><a id="totop" href="#">Haut de page</a></p>
</main>
<footer><p>Pied de page</p></footer>
<script>document.getElementById('temoin').addEventListener('click', function () { var t = performance.now(); while (performance.now() - t < 100) {} document.getElementById('temoin-out').textContent = String(+document.getElementById('temoin-out').textContent + 1); });</script>
${out.foot.join('\n')}
</body></html>`;
}

const STYLE = `*{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#222}
.site-header{position:fixed;top:0;left:0;right:0;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;background:#fff;z-index:40;border-bottom:1px solid #ddd}
.site-header.scrolled{box-shadow:0 2px 6px rgba(0,0,0,.15)}
.burger{font:inherit;padding:8px 14px;border:1px solid #333;background:#fff;border-radius:4px}
#nav{display:none;position:absolute;top:56px;left:0;right:0;background:#fff;border-bottom:1px solid #ddd}#nav.is-open{display:block}
#nav ul{margin:0;padding:8px 12px;list-style:none}#nav li{padding:8px 0}
main{padding:64px 12px 24px}.hero{width:100%;height:auto;display:block;aspect-ratio:16/10}
h1{font-size:1.5rem;line-height:1.25}.faq-q{display:block;width:100%;text-align:left;font:inherit;padding:12px;margin:6px 0 0;border:1px solid #bbb;background:#f6f6f6}
.faq-a{display:none;padding:0 12px;border:1px solid #bbb;border-top:0}
.carousel img{width:100%;height:auto}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gallery img{width:100%;height:auto;display:block}
#temoin{font:inherit;padding:10px 16px}`;

function envoyer(req, res, corps, type, extra = {}) {
  const h = { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra };
  if (/gzip/.test(req.headers['accept-encoding'] || '') && /text|javascript|css|json/.test(type)) {
    h['Content-Encoding'] = 'gzip'; res.writeHead(200, h); return res.end(zlib.gzipSync(corps, { level: 6 }));
  }
  res.writeHead(200, h); res.end(corps);
}

export async function demarrer({ portSite = 0, portTiers = 0 } = {}) {
  const journal = [];
  let SITE, TIERS;
  const CHAT = { js: null };
  const site = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const m = u.pathname.match(/^\/([ABCDE])\.html$/);
    if (m) return envoyer(req, res, page(m[1], TIERS), 'text/html; charset=utf-8');
    if (u.pathname === '/__banc') return envoyer(req, res, 'banc-report', 'text/plain');
    if (u.pathname === '/css/style.css') return envoyer(req, res, STYLE, 'text/css');
    if (u.pathname === '/js/theme.js') return envoyer(req, res, THEME_JS, 'application/javascript');
    if (FICHIERS_SITE[u.pathname]) return envoyer(req, res, fs.readFileSync(FICHIERS_SITE[u.pathname]), u.pathname.endsWith('.css') ? 'text/css' : 'application/javascript');
    if (u.pathname.startsWith('/img/')) { const f = path.join(ICI, 'site', u.pathname); if (fs.existsSync(f)) return envoyer(req, res, fs.readFileSync(f), 'image/webp'); }
    res.statusCode = 404; res.end();
  });
  const tiers = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (u.pathname === '/gtag/js') return envoyer(req, res, fs.readFileSync(path.join(V, 'tiers/gtag.js')), 'application/javascript', cors);
    if (u.pathname === '/en_US/fbevents.js') return envoyer(req, res, fs.readFileSync(path.join(V, 'tiers/fbevents.js')), 'application/javascript', cors);
    if (u.pathname === '/chat/widget.js') return envoyer(req, res, CHAT.js, 'application/javascript', cors);
    if (u.pathname === '/chat/ready') { journal.push({ t: Date.now(), type: 'chat', ms: u.searchParams.get('ms') }); res.writeHead(204, cors); return res.end(); }
    res.statusCode = 404; res.end();
  });
  await new Promise(r => site.listen(portSite, '127.0.0.1', r));
  await new Promise(r => tiers.listen(portTiers, '127.0.0.1', r));
  SITE = `http://site.localhost:${site.address().port}`;
  TIERS = `http://tiers.localhost:${tiers.address().port}`;
  CHAT.js = chatJs(TIERS);
  return { SITE, TIERS, journal, fermer: () => { site.close(); tiers.close(); } };
}

// Lancement direct : serveur seul (pour Lighthouse ou un contrôle à la main)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = await demarrer({ portSite: +(process.argv[2] || 8701), portTiers: +(process.argv[3] || 8702) });
  console.log(`site ${s.SITE}  tiers ${s.TIERS}`);
}
