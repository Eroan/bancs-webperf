const FICHIERS = {
  reseau: ['core/NetworkAnalyzer.js', 'simulation/Simulator.js', 'simulation/ConnectionPool.js', 'simulation/TCPConnection.js'],
  rendu: ['graph/NetworkNode.js'],
  lcptexte: ['metrics/LargestContentfulPaint.js'],
  graphe: ['graph/PageDependencyGraph.js', 'graph/CPUNode.js'],
};
const LANTERN = '/models/trace/lantern/';
let vers65 = new Set();
let compte = { rediriges: 0 };
export function initialize({ groupes }) { vers65 = new Set(groupes.flatMap(g => FICHIERS[g])); }
function racines(url) {
  const m = url.match(/^(file:.*\/)(te65|lh136\/node_modules\/@paulirish\/trace_engine|@paulirish\/trace_engine)(\/models\/trace\/lantern\/)(.*)$/);
  return m ? { base: m[1], paquet: m[2], rel: m[4] } : null;
}
let racine67 = null;
export async function resolve(spec, ctx, next) {
  const r = await next(spec, ctx);
  const a = racines(r.url);
  if (!a) return r;
  if (a.paquet !== 'te65') racine67 = a.base + a.paquet;
  const v65 = a.base.replace(/node_modules\/.*$/, 'node_modules/') + 'te65';
  if (vers65.has(a.rel)) return { ...r, url: `${v65}${LANTERN}${a.rel}` };
  if (a.paquet === 'te65' && racine67) return { ...r, url: `${racine67}${LANTERN}${a.rel}` };
  return r;
}
