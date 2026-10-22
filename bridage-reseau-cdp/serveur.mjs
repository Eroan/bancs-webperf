// Serveur du banc : document HTML de taille fixe dont les en-têtes partent après un délai,
// image sans délai. HTTP/1.1, sans compression, no-store. Port libre, imprimé au démarrage.
// GET /doc?delai=<ms>&taille=<octets>&id=<n>   GET /img?id=<n>   GET /__banc   GET /journal?id=<n>
import http from 'node:http';

const journal = new Map();  // id -> { recu, entetes } en ms (horloge du serveur), relatif à la réception
const IMG = Buffer.alloc(2048, 0x20);

const serveur = http.createServer((req, res) => {
  const t0 = performance.now();
  const u = new URL(req.url, 'http://x');
  const id = u.searchParams.get('id') || '';
  if (u.pathname === '/__banc') { res.end('banc-bridage-reseau-cdp'); return; }
  if (u.pathname === '/journal') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(journal.get(id) || null)); return;
  }
  if (u.pathname === '/img') {
    res.writeHead(200, { 'Content-Type': 'image/x-banc', 'Cache-Control': 'no-store', 'Content-Length': IMG.length });
    res.end(IMG); return;
  }
  if (u.pathname === '/doc') {
    const delai = Number(u.searchParams.get('delai') || 0);
    const taille = Number(u.searchParams.get('taille') || 2048);
    const tete = `<!doctype html><meta charset="utf-8"><title>banc</title><img src="/img?id=${id}" alt="">`;
    const corps = Buffer.from(tete + '<p>' + 'x'.repeat(Math.max(0, taille - tete.length - 3)));
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': corps.length });
      res.flushHeaders();
      journal.set(id, { entetes: performance.now() - t0 });
      res.end(corps);
    }, delai);
    return;
  }
  res.statusCode = 404; res.end();
});
serveur.keepAliveTimeout = 0;
serveur.listen(0, '127.0.0.1', () => console.log(`port ${serveur.address().port}`));
