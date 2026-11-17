# Protocole : composant interactif, Solid 2.0, Alpine 3.17 et React 19

Écrit le 2026-11-17, avant toute série. Méthode : article « Banc comparatif reproductible »
du wiki technique interne de l'agence (`banc-comparatif-reproductible-mesurer-des-variantes`).

## Question

Pour un composant interactif posé sur une page (liste filtrable, favoris, tri), que coûtent
Solid 2.0.0, Alpine 3.17.5, React 19.3.1 et les autres bibliothèques de composants courantes
(Preact, Svelte, Vue) :

1. en JavaScript livré (brut, gzip, Brotli) ;
2. en travail du fil principal au chargement (rendu initial jusqu'à « prêt ») ;
3. en latence d'interaction (durée Event Timing, ce que verrait l'INP) ;
4. en mémoire (tas JavaScript, nœuds DOM) ?

Alpine est l'outil de l'agence ; React sert de repère (déjà mesuré au wiki pour Astro et
Next.js) ; un témoin en JavaScript sans bibliothèque donne le plancher.

## Composant (identique dans chaque variante)

Liste de N produits (données fixes générées par `donnees.mjs`, embarquées dans la page en
`<script type="application/json">`) : nom, prix déjà formaté. Barre d'outils : champ de filtre
(sous-chaîne du nom, insensible à la casse, même fonction `correspond()` partout), bouton de
tri par prix (croissant puis décroissant), compteur de favoris. Chaque ligne a un bouton
favori (`aria-pressed`). Structure DOM commune : `#filtre`, `#tri`, `#compteur`,
`li.ligne[data-id]`, `button.fav`.

## Variantes (une seule variable : la façon de rendre et de mettre à jour)

| Variante | Rendu | Filtre |
|---|---|---|
| `vanilla` (témoin plancher) | lignes créées par `document.createElement`, une fois | attribut `hidden` basculé |
| `alpine` | `x-for` avec `:key` sur les données | `x-for` sur la liste filtrée |
| `alpine-ssr` | lignes dans le HTML (rendu serveur), Alpine ne fait que lier | `x-show` par ligne ; **pas de tri** (Alpine ne réordonne pas un HTML existant) |
| `solid` | `<For>` (JSX compilé, `@solidjs/vite-plugin` 3.0.1), rendu client | `<For>` sur un `createMemo` filtré |
| `react` | `.map()` avec `key` (`@vitejs/plugin-react` 6.3.0), `createRoot` | `useMemo` filtré |
| `preact` | Preact 11.2.0, mêmes composants que `react` (hooks de `preact/hooks`, `@preact/preset-vite` 2.10.6) | `useMemo` filtré |
| `svelte` | Svelte 5.57.3, runes (`$state`, `$derived`), `{#each … (id)}`, `mount` (`@sveltejs/vite-plugin-svelte` 7.3.1) | `$derived` filtré |
| `vue` | Vue 3.5.45, SFC `<script setup>`, `v-for` avec `:key` (`@vitejs/plugin-vue` 6.0.11) | `computed` filtré |
| `vue-vapor` (RC) | Vue 3.6.0-rc.15, même SFC en `<script setup vapor>`, `createVaporApp` ; **préversion**, chiffres à relire à la sortie stable | `computed` filtré |

Frameworks écartés : Lit (web components, autre usage que le composant posé sur une page),
Angular (cadre d'application entière). Vue 3.6 n'existe qu'en RC au 2026-11-17 : `vue`
mesure la version stable, `vue-vapor` le mode à réactivité fine annoncé.

Tailles : **N = 100** (widget courant) et **N = 1 000** (catalogue chargé).

Construction : Vite 8.3.8, `build` de production, un seul fichier JS par variante
(`vanilla`, `alpine` et `alpine-ssr` passent aussi par Vite, pour la même minification).
Alpine importé du paquet npm (`import Alpine from 'alpinejs'`), comme dans un projet
outillé. Solid sans rendu serveur ni hydratation (non mesurés).

## Fixe

- Chrome stable piloté par Playwright, **en fenêtre** (clôture des entrées Event Timing),
  contexte neuf à chaque passage, viewport 412 × 823, DPR 1,75, `isMobile`, tactile.
- Pas de bridage réseau : un seul hôte local, fichiers servis précompressés en Brotli ; les
  poids se comparent sur les fichiers, pas en temps de téléchargement.
- Processeur bridé par CDP au taux qui amène l'indice de Lighthouse calculé dans la page à
  ~460 (mobile milieu de gamme visé par le ×4 de Lighthouse ; `calibrage.mjs`, repris de
  `report-interaction/`).

## Relevés

- `pret` : `performance.now()` au premier rendu complet (marque posée par chaque variante,
  avec le nombre de lignes présentes, qui doit valoir N).
- Après `pret` + 1 s : `Performance.getMetrics` (ScriptDuration, TaskDuration,
  LayoutDuration, RecalcStyleDuration, Nodes, JSHeapUsedSize après
  `HeapProfiler.collectGarbage`), tâches longues (somme au-delà de 50 ms).
- Parcours (CDP `Input.dispatchMouseEvent` / `dispatchKeyEvent`, 700 ms entre deux gestes,
  coordonnées relevées page au repos) : témoin, favori ligne 3, tri, tri, « l », « a »,
  Retour arrière, Retour arrière. Pour chaque geste : plus grande durée Event Timing de son
  `interactionId` (observateur posé en tête de page, seuil 16 ms), puis, 300 ms plus tard,
  état contrôlé (lignes visibles, premier `data-id` visible, compteur) contre l'attendu
  calculé dans Node.

## Passages et conclusion

10 passages par variante et par taille, variantes alternées (départ décalé à chaque
passage). Durées en médiane [min, max] ; un écart ne s'écrit que si les plages ne se
recouvrent pas.

## Contrôles

- **Machine au repos** : médiane de quatre relevés de `top` (premier jeté) ≥ 85 %
  d'inactivité, sinon refus (`run.sh`) ; indice à ×1 ≥ 3 500.
- **Témoin de durée** : bouton hors bibliothèque dont le gestionnaire occupe 100 ms ; temps de
  traitement du clic (`processingEnd - processingStart`) attendu entre 100 et 120 ms, durée
  Event Timing au moins égale, sinon passage rejeté. Révisé au passage pilote du 2026-11-17
  (×1) : la durée du témoin allait de 128 à 152 ms, présentation du tap comprise (arrondi à
  8 ms), une plage 100 à 140 ms sur la durée rejetait des passages corrects.
- **Complétude** : `pret` refusé si le nombre de lignes ≠ N ; geste refusé si l'état après
  coup diffère de l'attendu (filtre, ordre, compteur). Un passage refusé est consigné, pas
  remplacé en silence.
- **Version lancée** lue par le pilote (`browser.version()`) et écrite avec les résultats.

## Limites connues

- Rendu client seulement pour Solid et React ; l'hydratation d'un HTML serveur n'est
  mesurée que pour Alpine (`alpine-ssr`).
- Composant unique : le coût d'un ensemble de composants ou d'un routeur n'est pas mesuré.
- Build CSP d'Alpine (`@alpinejs/csp`) non mesuré.

## Constats du pilote et de la série (2026-11-17)

Pilote à ×1, un passage, quatre défauts de l'instrument corrigés avant la série :

- le tap sur favori et sur tri retirait le focus du champ : le tap de focus passe juste
  avant la frappe ;
- `:nth-child(3)` comptait le `<template>` d'Alpine et visait la ligne 2 :
  `:nth-child(3 of .ligne)` ;
- `.ligne{display:flex}` l'emportait sur l'attribut `hidden` du témoin `vanilla` :
  `[hidden]{display:none!important}` dans la feuille commune ;
- un tap tactile ne produit pas d'entrée Event Timing `pointerdown` ; l'interaction est
  retrouvée par la première entrée à `interactionId` non nul entre deux gestes reçus.

Le mode Vapor se contrôle sur le fichier construit (gabarit HTML compilé), une sonde à
l'exécution par `_instance.vapor` rendant un faux négatif.

Série `brut/serie-2026-11-17T22-31` : taux ×9 (indice 452), 200 passages sur 200 retenus.
Inactivité médiane au départ 90,1 %, 82,8 % au relevé pris juste après le calibrage (relevé
informatif, sans garde), 94,5 % à la fin. Les durées des gestes au doigt (témoin, favori,
tri, focus) ont une traîne jusqu'à 200 à 424 ms dans toutes les variantes, témoin `vanilla`
compris (témoin : 152 ms [128, 320]) : pour ces gestes, seules les médianes se comparent. Les
gestes au clavier n'ont pas cette traîne.
