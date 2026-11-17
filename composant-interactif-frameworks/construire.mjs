// Construit chaque variante en un seul fichier dist/<variante>/app.js (Vite, production), puis écrit
// les versions .gz (niveau 9) et .br (niveau 11) servies par site.mjs, et dist/poids.json.
// Usage : node construire.mjs [variantes…]   (sans argument : toutes, variantes isolées comprises)
import fs from 'node:fs';
import zlib from 'node:zlib';
import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import solid from '@solidjs/vite-plugin';
import react from '@vitejs/plugin-react';
import preact from '@preact/preset-vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import vue from '@vitejs/plugin-vue';

const VARIANTES = {
  vanilla: { entree: 'src/vanilla.js', plugins: [] },
  alpine: { entree: 'src/alpine.js', plugins: [] },
  'alpine-ssr': { entree: 'src/alpine-ssr.js', plugins: [] },
  solid: { entree: 'src/solid.jsx', plugins: [solid()] },
  react: { entree: 'src/react.jsx', plugins: [react()] },
  preact: { entree: 'src/preact.jsx', plugins: [preact()] },
  svelte: { entree: 'src/svelte.js', plugins: [svelte()] },
  vue: { entree: 'src/vue.js', plugins: [vue()] },
};
const choix = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VARIANTES);
for (const v of choix) {
  const { entree, plugins } = VARIANTES[v];
  await build({
    configFile: false, logLevel: 'warn', plugins, mode: 'production',
    build: {
      outDir: `dist/${v}`, emptyOutDir: true, minify: true, target: 'es2022', modulePreload: false,
      rollupOptions: { input: entree, output: { entryFileNames: 'app.js', codeSplitting: false } },
    },
  });
}
export function compresser(dossier) {
  const poids = fs.existsSync('dist/poids.json') ? JSON.parse(fs.readFileSync('dist/poids.json', 'utf8')) : {};
  for (const v of fs.readdirSync(dossier)) {
    const f = `${dossier}/${v}/app.js`; if (!fs.existsSync(f)) continue;
    const brut = fs.readFileSync(f);
    const gz = zlib.gzipSync(brut, { level: 9 });
    const br = zlib.brotliCompressSync(brut, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: brut.length } });
    fs.writeFileSync(f + '.gz', gz); fs.writeFileSync(f + '.br', br);
    poids[v] = { brut: brut.length, gzip: gz.length, brotli: br.length, fichiers: fs.readdirSync(`${dossier}/${v}`).filter((x) => !/\.(gz|br)$/.test(x)) };
  }
  fs.writeFileSync('dist/poids.json', JSON.stringify(poids, null, 1));
  return poids;
}
// Variantes isolées (Vue 3.6 RC, Solid 1.9) : leur propre node_modules
if (!process.argv.slice(2).length) for (const d of ['vue-vapor', 'solid-1']) execFileSync('node', [`isoles/${d}/construire.mjs`], { stdio: 'inherit' });
const p = compresser('dist');
for (const [v, x] of Object.entries(p)) console.log(`${v.padEnd(11)} brut ${String(x.brut).padStart(7)}  gzip ${String(x.gzip).padStart(6)}  brotli ${String(x.brotli).padStart(6)}  ${x.fichiers.join(',')}`);
