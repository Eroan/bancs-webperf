// Audits llms-txt, robots-txt, ard-schema selon la réponse du serveur, par Lighthouse 13.5.0 et 13.6.0.
import { spawn } from 'node:child_process';
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const SORTIE = process.env.SORTIE; if (!SORTIE || !process.env.CHROME_PATH) throw new Error('SORTIE et CHROME_PATH requis');
const LLMS = '# Titre du site\n\nDescription du site, assez longue pour le contrôle.\n\n- [Page](https://exemple.com/page)\n';
const MANIFESTE = JSON.stringify({ entries: [{ identifier: 'urn:air:exemple.com:outils:demo', displayName: 'Demo', type: 'application/json', url: 'https://exemple.com/agent.json' }] });
const COMPLET = JSON.stringify({ entries: [{ identifier: 'urn:air:exemple.com:outils:demo', displayName: 'Demo', type: 'application/json', url: 'https://exemple.com/agent.json', representativeQueries: ['commander une démonstration', 'consulter un tarif'] }] });
const J = { 'content-type': 'application/json' };
// cas : nom -> { chemin: [statut, corps, en-têtes] } ; entete/tete : ajouts à la page
const CAS = {
  'llms 200': { '/llms.txt': [200, LLMS] }, 'llms 404': { '/llms.txt': [404, 'absent'] }, 'llms 429': { '/llms.txt': [429, 'trop'] }, 'llms 500': { '/llms.txt': [500, 'erreur'] },
  'robots 200': { '/robots.txt': [200, 'User-agent: *\nAllow: /\n'] }, 'robots 404': { '/robots.txt': [404, 'absent'] }, 'robots 429': { '/robots.txt': [429, 'trop'] }, 'robots 500': { '/robots.txt': [500, 'erreur'] },
  'ard aucun signal': {},
  'ard .well-known/ard.json': { '/.well-known/ard.json': [200, MANIFESTE, J] },
  'ard .well-known/ard.json avec representativeQueries': { '/.well-known/ard.json': [200, COMPLET, J] },
  'ard .well-known/ai-catalog.json': { '/.well-known/ai-catalog.json': [200, MANIFESTE, J] },
  'ard link rel=ard': { '/m.json': [200, MANIFESTE, J], tete: '<link rel="ard" href="/m.json">' },
  'ard link rel=ai-catalog': { '/m.json': [200, MANIFESTE, J], tete: '<link rel="ai-catalog" href="/m.json">' },
  'ard en-tête Link rel=ard': { '/m.json': [200, MANIFESTE, J], entete: { link: '</m.json>; rel="ard"' } },
  'ard Agentmap dans robots.txt': { '/m.json': [200, MANIFESTE, J], '/robots.txt': [200, 'User-agent: *\nAllow: /\nAgentmap: /m.json\n'] },
  'ard link rel=ard en 404': { tete: '<link rel="ard" href="/absent.json">' },
};
function serveur(cas) {
  const s = http.createServer((q, r) => {
    const u = q.url.split('?')[0]; const c = cas[u];
    if (u === '/') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8', ...(cas.entete || {}) });
      r.end(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Banc</title>${cas.tete || ''}</head><body><h1>Banc</h1></body></html>`); return; }
    if (c && Array.isArray(c)) { r.writeHead(c[0], { 'content-type': 'text/plain; charset=utf-8', ...(c[2] || {}) }); r.end(c[1]); return; }
    r.writeHead(404); r.end('absent');
  });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok({ s, port: s.address().port })));
}
const lancer = args => new Promise(ok => { const p = spawn(process.execPath, args, { stdio: 'ignore' }); p.on('close', ok); });
const res = []; const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'banc-audits-')), 'r.json');
for (const [nom, cas] of Object.entries(CAS)) {
  const audit = nom.startsWith('llms') ? 'llms-txt' : nom.startsWith('robots') ? 'robots-txt' : 'ard-schema';
  const { s, port } = await serveur(cas);
  for (const v of ['lh135', 'lh136']) {
    await lancer([`node_modules/${v}/cli/index.js`, `http://127.0.0.1:${port}/`, `--only-audits=${audit}`, '--output=json', `--output-path=${out}`, '--quiet', '--chrome-flags=--headless=new']);
    const a = JSON.parse(fs.readFileSync(out, 'utf8')).audits[audit];
    res.push({ cas: nom, audit, version: v, score: a.score, mode: a.scoreDisplayMode, explication: a.explanation || '', details: (a.details?.items || []).map(x => x.issue || x.message || '').filter(Boolean) });
    console.log(nom, v, a.scoreDisplayMode, a.score);
  }
  s.close();
}
fs.writeFileSync(path.join(SORTIE, 'audits.json'), JSON.stringify(res));
console.log('FIN');
