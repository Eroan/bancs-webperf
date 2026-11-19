# Résultats : animations pendant un blocage du thread principal

Série `brut/series-2026-11-19T07-23-23-867Z-p5.json` : Chrome 158 (158.0.8127.37), boîte de 40 × 40 px en aller-retour sur 200 px en 1000 ms, Playwright 1.65.0, 5 passages × 3 blocages de 800 ms, repos 700 ms, relevé du 2026-11-19. « Bouge » : amplitude ≥ 20 px dans la fenêtre du blocage (bornes réduites de 50 ms de chaque côté).

| Variante | Blocages où la boîte bouge | Images reçues pendant un blocage, médiane [min, max] | Amplitude pendant un blocage (px), médiane [min, max] | Repos où la boîte bouge |
|---|---|---|---|---|
| CSS `@keyframes`, `transform` | 15/15 | 42 [42, 42] | 136.5 [80, 137] | 15/15 |
| CSS `@keyframes`, `transform` avec `var()` dans l'image clé (recette du billet) | 15/15 | 42 [42, 42] | 136.5 [83, 137] | 15/15 |
| CSS `@keyframes`, `left` | 0/15 | 0 [0, 0] | 0 [0, 0] | 15/15 |
| CSS, propriété `@property` animée, appliquée à `transform` | 0/15 | 0 [0, 0] | 0 [0, 0] | 15/15 |
| Web Animations API, `element.animate()` sur `transform` | 15/15 | 42 [42, 42] | 136.5 [83, 137] | 15/15 |
| boucle `requestAnimationFrame` qui écrit `style.transform` | 0/15 | 0 [0, 0] | 0 [0, 0] | 15/15 |
| GSAP 3.15.1, `gsap.to(el, { x })` | 0/15 | 0 [0, 0] | 0 [0, 0] | 15/15 |
| Motion 14.14.0, `animate(el, { transform })` | 15/15 | 42 [42, 42] | 136.5 [83, 137] | 15/15 |
| Motion 14.14.0, `animate(el, { x })` | 15/15 | 42 [42, 42] | 136.5 [83.5, 137] | 15/15 |

Durée réelle des blocages : 800 à 800 ms.

## Témoins

- Témoin positif (`css-transform` bouge pendant chaque blocage) : OK.
- Témoin négatif (`raf-transform` ne bouge pendant aucun blocage) : OK.
- Chaque variante anime pendant chaque repos : OK.
