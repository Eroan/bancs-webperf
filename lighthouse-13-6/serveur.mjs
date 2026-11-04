// Pages locales du banc. HTTP/1.1, sans compression, port libre lu par l'appelant.
import http from 'node:http';
const MARQUEUR = 'banc-lighthouse-13-6';
const rempli = (n, c = 'x') => Buffer.alloc(n, c);
function bmp(w, h) { // image valide sans dépendance : BMP 24 bits, dégradé
  const ligne = (w * 3 + 3) & ~3, taille = 54 + ligne * h, b = Buffer.alloc(taille);
  b.write('BM'); b.writeUInt32LE(taille, 2); b.writeUInt32LE(54, 10); b.writeUInt32LE(40, 14);
  b.writeInt32LE(w, 18); b.writeInt32LE(h, 22); b.writeUInt16LE(1, 26); b.writeUInt16LE(24, 28); b.writeUInt32LE(ligne * h, 34);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = 54 + y * ligne + x * 3; b[o] = x % 256; b[o + 1] = y % 256; b[o + 2] = (x + y) % 256; }
  return b;
}
const JS = Buffer.concat([Buffer.from('/*'), rempli(300 * 1024), Buffer.from('*/\ndocument.documentElement.dataset.m="1";\n')]);
const CSS = Buffer.concat([Buffer.from('/*'), rempli(300 * 1024), Buffer.from('*/\nbody{margin:0}\n')]);
const IMG = bmp(800, 500);
const TEXTE = '<h1 style="font:700 11vw/1.1 Georgia,serif;margin:0">Banc de mesure de la première peinture</h1>';
const page = (tete, corps) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Banc</title><meta name="description" content="Banc">${tete}</head><body>${corps}</body></html>`;
const PAGES = {
  '/texte-preload': page('<link rel="preload" as="image" href="/r/preload.bmp"><link rel="preload" as="script" href="/r/preload.js">', TEXTE),
  '/module-tete': page('<script type="module" src="/r/app.js"></script>', TEXTE),
  '/css-bloquante': page('<link rel="stylesheet" href="/r/grand.css">', TEXTE),
  '/image-locale': page('', '<img src="/r/hero.bmp" alt="" width="800" height="500" style="width:100%;height:auto;display:block">'),
};
const FLUX = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Banc</title><meta name="description" content="Banc"><script type="module" src="/r/app.js"></script></head><body>${TEXTE}<!--${'x'.repeat(4096)}-->`;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.bmp': 'image/bmp' };
const RESS = { '/r/preload.bmp': IMG, '/r/preload.js': JS, '/r/app.js': JS, '/r/grand.css': CSS, '/r/hero.bmp': IMG };
export function demarrer() {
  const s = http.createServer((q, r) => {
    const u = q.url.split('?')[0];
    if (u === '/__banc') { r.end(MARQUEUR); return; }
    if (u === '/module-flux') { // document envoyé en deux temps : peinture avant la fin de l'analyse, module évalué après
      r.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      r.write(FLUX); setTimeout(() => r.end('</body></html>'), 400); return; }
    if (PAGES[u]) { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); r.end(PAGES[u]); return; }
    if (RESS[u]) { r.writeHead(200, { 'content-type': TYPES[u.slice(u.lastIndexOf('.'))], 'cache-control': 'no-store' }); r.end(RESS[u]); return; }
    r.writeHead(404); r.end();
  });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok({ s, port: s.address().port })));
}
export const LOCALES = [...Object.keys(PAGES).map(p => p.slice(1)), 'module-flux'];
export { MARQUEUR };
