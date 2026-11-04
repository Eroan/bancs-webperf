// Rétablit des groupes de fichiers de Lantern en 0.0.65 dans Lighthouse 13.6.0 (VARIANTE=reseau,rendu,lcptexte,graphe).
import { register } from 'node:module';
register('./variante-crochet.mjs', import.meta.url, { data: { groupes: (process.env.VARIANTE || '').split(',').filter(Boolean) } });
