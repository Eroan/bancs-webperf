# Protocole : une animation continue-t-elle pendant un blocage du thread principal ? CSS, Web Animations API, boucle rAF, GSAP et Motion

Écrit le 2026-11-19, après un passage pilote d'un passage par variante (témoins séparés, voir plus bas) et avant la série.
Point de départ : le billet « CSS vs. JavaScript: the performance implications of different animation strategies »
(Josh W. Comeau, mis à jour le 2026-06-03), qui montre par une démonstration interactive qu'une animation CSS continue
quand le thread principal est occupé, qu'une boucle `requestAnimationFrame` et GSAP se figent, et que Motion continue
parce qu'il passe par la Web Animations API. La documentation de Motion (« Performance ») ajoute que ses transformations
indépendantes (`x`) sont accélérées comme `transform`, et qu'une variable CSS animée ne l'est pas, même appliquée à
`transform`.

## Question

Pendant un blocage de 800 ms du thread principal, la boîte animée continue-t-elle de se déplacer à l'écran, selon la
technique d'animation et la propriété animée ?

## Variantes

Une boîte de 40 × 40 px va et vient sur 200 px en 1 000 ms, mouvement linéaire, en boucle (`page/index.html`) :

| Variante | Technique |
|---|---|
| `css-transform` | `@keyframes` sur `transform: translateX()` (témoin positif attendu) |
| `css-var-billet` | recette du billet : `translateX(calc(var(--bounce-magnitude) * -1))` dans l'image clé |
| `css-left` | `@keyframes` sur `left` (propriété de mise en page) |
| `css-property` | propriété personnalisée déclarée par `@property` et animée, appliquée à `transform` |
| `waapi-transform` | `element.animate()` sur `transform` |
| `raf-transform` | boucle `requestAnimationFrame` qui écrit `style.transform` (témoin négatif attendu) |
| `gsap-x` | GSAP 3.15.1, `gsap.to(el, { x })` |
| `motion-transform` | Motion 14.14.0, `animate(el, { transform })` |
| `motion-x` | Motion 14.14.0, `animate(el, { x })` (transformation indépendante) |

## Mesure

Chrome stable installé, piloté par Playwright 1.65.0 (`channel: 'chrome'`, sans affichage), contexte neuf à chaque
passage, fenêtre de 400 × 100 px, facteur de pixel 1, aucun bridage. Après le chargement, 500 ms d'attente, puis la capture
continue du protocole DevTools (`Page.startScreencast`, PNG, chaque image accusée) démarre ; trois cycles « blocage de
800 ms (boucle active dans la page), repos de 700 ms ». La page enregistre les bornes de chaque blocage en temps absolu
(`performance.timeOrigin + performance.now()`), alignées sur l'horodatage de chaque image (`metadata.timestamp`). La
position de la boîte est le centre des pixels rouges de la ligne médiane de l'image.

Pour chaque blocage : images reçues et amplitude du déplacement entre `début + 50 ms` et `fin − 50 ms` ; même relevé
pendant le repos qui suit. Une variante « continue » pendant un blocage si l'amplitude atteint 20 px (déplacement attendu
d'une animation qui continue : environ 140 px sur la fenêtre de 700 ms).

Série : 5 passages, variantes alternées dans chaque passage, soit 15 blocages par variante. Aucune durée n'est publiée :
le résultat est un compte « n/15 blocages où la boîte a bougé ». La charge du processeur ne fausse pas ce compte (une
image perdue réduit l'amplitude sans l'annuler) ; elle est relevée dans `brut/machine.txt`.

## Témoins

- **Instrument actif pendant le blocage** : `css-transform` reçoit des images et bouge pendant chaque blocage ;
  `raf-transform` ne bouge pendant aucun. Pilote du 2026-11-19 (Chrome 158.0.8127.37, un passage) : 42 images et 73 à
  137 px pendant chaque blocage contre 0 image.
- **Chaque variante anime** : amplitude de 20 px au moins pendant chaque repos, sinon la variante est en échec (une
  animation qui ne démarre pas passerait pour figée).
- **Démarrage** : la page publie `__banc.demarre` et ses erreurs ; le banc refuse une variante en erreur.

## Extrait de console publié

L'extrait que le wiki donne pour faire le test à la main (`extrait-console.js`, boucle active de 1 000 ms) est rejoué
tel quel, évalué comme dans la console (`Runtime.evaluate` avec `replMode`), un passage par variante, bornes du blocage
relevées côté banc : `EXTRAIT=extrait-console.js PASSAGES=1 node banc.mjs`, synthèse dans `RESULTATS-extrait-console.md`.
