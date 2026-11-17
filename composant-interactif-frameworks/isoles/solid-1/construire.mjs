// Variante isolée (dépendances incompatibles avec le paquet principal) : sortie dans ../../dist/solid-1/app.js
import { build } from 'vite';
import plugin from 'vite-plugin-solid';
await build({
  configFile: false, logLevel: 'warn', plugins: [plugin()], mode: 'production', root: import.meta.dirname,
  build: {
    outDir: '../../dist/solid-1', emptyOutDir: true, minify: true, target: 'es2022', modulePreload: false,
    rollupOptions: { input: 'src/main.jsx', output: { entryFileNames: 'app.js', codeSplitting: false } },
  },
});
