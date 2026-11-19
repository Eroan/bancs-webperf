// Banc : pour chaque moteur et chaque variante, instant d'exécution du script externe
// relativement à l'arrivée de la seconde partie du document (envoyée après une pause).
import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';
import { demarrer, VARIANTES } from './serveur.mjs';

const PASSAGES = +(process.env.PASSAGES || 5);
const PAUSE = +(process.env.PAUSE || 2000);
const NOM = process.env.NOM || `serie-p${PASSAGES}-pause${PAUSE}`;
const MOTEURS = [
  ['chrome', () => chromium.launch({ channel: 'chrome' })],
  ['firefox', () => firefox.launch()],
  ['webkit', () => webkit.launch()],
];

const { serveur, port, journal } = await demarrer(PAUSE);
const base = `http://127.0.0.1:${port}`;
if (await (await fetch(`${base}/__banc`)).text() !== 'banc-scripts-document-en-flux') { console.error('BANC ABSENT'); process.exit(1); }

const resultats = { date: new Date().toISOString(), pause_ms: PAUSE, passages: PASSAGES, playwright: '1.65.0', moteurs: {}, mesures: [] };
const COQUILLES = ['courte', 'longue'];
const noms = Object.keys(VARIANTES).flatMap(v => COQUILLES.map(c => `${v}/${c}`));
for (const [moteur, lancer] of MOTEURS) {
  const navigateur = await lancer();
  resultats.moteurs[moteur] = navigateur.version();
  for (let p = 1; p <= PASSAGES; p++) {
    const ordre = noms.map((_, i) => noms[(i + p) % noms.length]);   // variantes alternées
    for (const variante of ordre) {
      const contexte = await navigateur.newContext();
      const page = await contexte.newPage();
      const erreurs = [];
      page.on('pageerror', e => erreurs.push(String(e)));
      await page.goto(`${base}/v/${variante}`, { waitUntil: 'load', timeout: PAUSE + 15000 });
      const m = await page.evaluate(() => ({
        exec: window.__exec || [], t_coquille: window.__t_coquille, t_fin: window.__t_fin,
        t_dcl: window.__t_dcl, t_load: window.__t_load,
        fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1),
        ressource: performance.getEntriesByType('resource').filter(r => r.name.includes('/s/'))
          .map(r => ({ startTime: Math.round(r.startTime), responseEnd: Math.round(r.responseEnd) })),
      }));
      const debut = journal.filter(j => j.url === `/v/${variante}`).at(-1)?.t;
      const req = journal.filter(j => j.url === `/s/${variante.split('/')[0]}.js`).at(-1)?.t;
      m.serveur_script_ms = (debut && req) ? req - debut : null;
      resultats.mesures.push({ moteur, passage: p, variante, erreurs, ...m });
      const e = m.exec[0];
      console.log(`${moteur} p${p} ${variante.padEnd(19)} exec=${e ? e.t : 'AUCUNE'} fin_present=${e ? e.fin : '-'} coquille=${Math.round(m.t_coquille)} suite=${Math.round(m.t_fin)} dcl=${Math.round(m.t_dcl)} fcp=${m.fcp} script_demande=${m.serveur_script_ms} script_recu=${m.ressource[0]?.responseEnd}${erreurs.length ? ' ERREURS ' + erreurs.join(' | ') : ''}`);
      await contexte.close();
    }
  }
  await navigateur.close();
}
serveur.close();
const scripts = journal.filter(j => j.url.startsWith('/s/')).length;
resultats.requetes_scripts = scripts;
writeFileSync(`brut/${NOM}.json`, JSON.stringify(resultats, null, 1));
console.log(`moteurs ${JSON.stringify(resultats.moteurs)} ; requêtes de scripts au journal : ${scripts} ; brut/${NOM}.json`);
