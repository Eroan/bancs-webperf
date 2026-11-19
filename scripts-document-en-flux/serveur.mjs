// Serveur du banc : un document HTML envoyé en deux parties séparées par une pause,
// et le script de chaque variante servi sans délai. Port choisi par le système.
import http from 'node:http';

export const VARIANTES = {
  'defer':        '<script defer src="/s/defer.js"></script>',
  'async':        '<script async src="/s/async.js"></script>',
  'module':       '<script type="module" src="/s/module.js"></script>',
  'module-async': '<script type="module" async src="/s/module-async.js"></script>',
  // Témoins du report de WebKit : script async servi après 300 ms, donc après le premier rendu d'une coquille longue.
  'async-lent':        '<script async src="/s/async-lent.js"></script>',
  'module-async-lent': '<script type="module" async src="/s/module-async-lent.js"></script>',
};
export const DELAI_LENT_MS = 300;

const SCRIPT = `(() => {
  const t = performance.now();
  (window.__exec ||= []).push({ t: Math.round(t), readyState: document.readyState, fin: !!document.getElementById('fin') });
})();
`;

// Coquille « longue » : environ 1 500 caractères de texte visible, pour franchir le seuil
// de premier rendu des moteurs qui retardent la première peinture d'une page presque vide.
const TEXTE = ('Texte de la coquille rendu avant la suite du document. ').repeat(28);

export function demarrer(pauseMs) {
  const journal = [];
  const serveur = http.createServer((req, res) => {
    const t0 = Date.now();
    journal.push({ url: req.url, t: t0 });
    if (req.url === '/__banc') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('banc-scripts-document-en-flux'); return; }
    const s = req.url.match(/^\/s\/([a-z-]+)\.js$/);
    if (s && VARIANTES[s[1]]) {
      const envoyer = () => { res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' }); res.end(SCRIPT); };
      if (s[1].endsWith('-lent')) setTimeout(envoyer, DELAI_LENT_MS); else envoyer();
      return;
    }
    const v = req.url.match(/^\/v\/([a-z-]+)\/(courte|longue)$/);
    if (v && VARIANTES[v[1]]) {
      const texte = v[2] === 'longue' ? `<p>${TEXTE}</p>` : '';
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${v[1]}</title>
<script>document.addEventListener('DOMContentLoaded', () => { window.__t_dcl = performance.now(); });
window.addEventListener('load', () => { window.__t_load = performance.now(); });</script>
${VARIANTES[v[1]]}
</head><body><main id="coquille"><h1>Coquille</h1><p>Première partie du document.</p>${texte}</main>
<script>window.__t_coquille = performance.now();</script>
`);
      setTimeout(() => {
        res.end(`<section id="fin"><p>Seconde partie, envoyée après ${pauseMs} ms.</p></section>
<script>window.__t_fin = performance.now();</script>
</body></html>
`);
      }, pauseMs);
      return;
    }
    res.writeHead(404, { 'content-type': 'text/plain' }); res.end('absent');
  });
  return new Promise(ok => serveur.listen(0, '127.0.0.1', () => ok({ serveur, port: serveur.address().port, journal })));
}
