// Variante isolée (dépendances incompatibles avec le paquet principal) : sortie dans ../../dist/vue-vapor/app.js
import { build } from 'vite';
import plugin from '@vitejs/plugin-vue';
await build({
  configFile: false, logLevel: 'warn', plugins: [plugin()], mode: 'production', root: import.meta.dirname,
  build: {
    outDir: '../../dist/vue-vapor', emptyOutDir: true, minify: true, target: 'es2022', modulePreload: false,
    rollupOptions: { input: 'src/main.js', output: { entryFileNames: 'app.js', codeSplitting: false } },
  },
});
