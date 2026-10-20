// Calibrage du bridage processeur : indice de Lighthouse (computeBenchmarkIndex, Lighthouse 13.5.0)
// calculé DANS la page, sous Emulation.setCPUThrottlingRate, Chrome stable en fenêtre (pas headless).
// Usage : node calibrage.mjs [taux…]   → <SORTIE>/calibrage.json (SORTIE=brut par défaut)
//         CIBLES="460,173" : imprime aussi, pour chaque indice visé, le taux qui l'approche (ligne « TAUX <cible> <taux> »)
import fs from 'node:fs';
import { chromium } from 'playwright';

const TAUX = process.argv.slice(2).map(Number).filter(Boolean);
const LISTE = TAUX.length ? TAUX : [1, 4, 6, 7, 8, 9, 10, 12, 16, 20, 22, 24, 26, 28, 30];
const REPET = 3;

function computeBenchmarkIndex() {   // copie de lighthouse/core/lib/page-functions.js (13.5.0)
  function benchmarkIndexGC() {
    const start = Date.now(); let iterations = 0;
    while (Date.now() - start < 500) {
      let s = ''; for (let j = 0; j < 10000; j++) s += 'a';
      if (s.length === 1) throw new Error('never'); iterations++;
    }
    return Math.round(iterations / 10 / ((Date.now() - start) / 1000));
  }
  function benchmarkIndexNoGC() {
    const arrA = [], arrB = []; for (let i = 0; i < 100000; i++) arrA[i] = arrB[i] = i;
    const start = Date.now(); let iterations = 0;
    while (iterations % 10 !== 0 || Date.now() - start < 500) {
      const src = iterations % 2 === 0 ? arrA : arrB, tgt = iterations % 2 === 0 ? arrB : arrA;
      for (let j = 0; j < src.length; j++) tgt[j] = src[j]; iterations++;
    }
    return Math.round(iterations / 10 / ((Date.now() - start) / 1000));
  }
  return (benchmarkIndexGC() + benchmarkIndexNoGC()) / 2;
}

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const res = [];
for (let r = 0; r < REPET; r++) {
  for (const taux of LISTE) {              // alternance des taux à chaque répétition
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.setContent('<!doctype html><title>calibrage</title><p>calibrage</p>');
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: taux });
    const bi = await p.evaluate(`(${computeBenchmarkIndex.toString()})()`);
    res.push({ taux, repet: r + 1, bi });
    console.log(`x${taux}  BI ${bi}`);
    await ctx.close();
  }
}
const version = browser.version();
await browser.close();
const SORTIE = process.env.SORTIE || 'brut';
fs.writeFileSync(`${SORTIE}/calibrage.json`, JSON.stringify({ chrome: version, date: new Date().toISOString(), res }, null, 1));
for (const taux of LISTE) {
  const v = res.filter(x => x.taux === taux).map(x => x.bi).sort((a, b) => a - b);
  console.log(`x${String(taux).padEnd(3)} médiane ${v[Math.floor(v.length / 2)]} [${v[0]}, ${v.at(-1)}]`);
}

// Taux retenu par indice visé : celui des taux MESURÉS dont la médiane est la plus proche de la cible (écart en rapport,
// pas en différence) ; la règle BI(x1) / cible surestime le taux (×9 au lieu de ×8 pour 460 sur le poste du banc).
const med = t => { const v = res.filter(x => x.taux === t).map(x => x.bi).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
const bi1 = med(1);
console.log(`BI_X1 ${bi1}`);
for (const c of (process.env.CIBLES || '').split(',').map(Number).filter(Boolean)) {
  const t = LISTE.reduce((best, x) => Math.abs(Math.log(med(x) / c)) < Math.abs(Math.log(med(best) / c)) ? x : best, LISTE[0]);
  console.log(`TAUX ${c} ${t} (indice ${med(t)})`);
}
