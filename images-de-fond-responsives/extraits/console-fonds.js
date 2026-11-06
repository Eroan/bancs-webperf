// À coller dans la console, page chargée : images parties d'une feuille de style (css) ou d'un préchargement (link), puis image LCP.
const images = performance.getEntriesByType('resource')
  .filter(r => ['css', 'link'].includes(r.initiatorType) && /\.(avif|webp|jpe?g|png|gif)(\?|$)/i.test(r.name))
  .map(r => ({ origine: r.initiatorType, url: r.name, debut_ms: Math.round(r.startTime) }));
const lcp = await new Promise(fin => {
  new PerformanceObserver(l => fin(l.getEntries().at(-1))).observe({ type: 'largest-contentful-paint', buffered: true });
  setTimeout(() => fin(null), 1000);
});
console.table(images);
({ images, lcp: lcp && { url: lcp.url, balise: lcp.element?.tagName } });
