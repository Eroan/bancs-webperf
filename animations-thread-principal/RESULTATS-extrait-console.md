# Résultats : animations pendant un blocage du thread principal

Série `brut/series-2026-11-19T07-30-16-438Z-p1-extrait.json` : Chrome 158 (158.0.8127.37), boîte de 40 × 40 px en aller-retour sur 200 px en 1000 ms, Playwright 1.65.0, 1 passages × 3 blocages par l'extrait de console `extrait-console.js` (1 000 ms), repos 700 ms, relevé du 2026-11-19. « Bouge » : amplitude ≥ 20 px dans la fenêtre du blocage (bornes réduites de 50 ms de chaque côté).

| Variante | Blocages où la boîte bouge | Images reçues pendant un blocage, médiane [min, max] | Amplitude pendant un blocage (px), médiane [min, max] | Repos où la boîte bouge |
|---|---|---|---|---|
| CSS `@keyframes`, `transform` | 3/3 | 54 [54, 54] | 156.5 [103, 163] | 3/3 |
| CSS `@keyframes`, `transform` avec `var()` dans l'image clé (recette du billet) | 3/3 | 54 [54, 54] | 153.5 [103, 163] | 3/3 |
| CSS `@keyframes`, `left` | 0/3 | 0 [0, 0] | 0 [0, 0] | 3/3 |
| CSS, propriété `@property` animée, appliquée à `transform` | 0/3 | 0 [0, 0] | 0 [0, 0] | 3/3 |
| Web Animations API, `element.animate()` sur `transform` | 3/3 | 54 [54, 55] | 153.5 [106.5, 163] | 3/3 |
| boucle `requestAnimationFrame` qui écrit `style.transform` | 0/3 | 0 [0, 0] | 0 [0, 0] | 3/3 |
| GSAP 3.15.1, `gsap.to(el, { x })` | 0/3 | 0 [0, 0] | 0 [0, 0] | 3/3 |
| Motion 14.14.0, `animate(el, { transform })` | 3/3 | 54 [54, 54] | 150 [105, 165] | 3/3 |
| Motion 14.14.0, `animate(el, { x })` | 3/3 | 54 [54, 54] | 150 [104.5, 164.5] | 3/3 |

Durée réelle des blocages : 1000 à 1003 ms.

## Témoins

- Témoin positif (`css-transform` bouge pendant chaque blocage) : OK.
- Témoin négatif (`raf-transform` ne bouge pendant aucun blocage) : OK.
- Chaque variante anime pendant chaque repos : OK.
