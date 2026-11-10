# Protocole : dédoublonner les déclarations CSS (UDJO), gain après minification et compression, sûreté de la cascade

Écrit le 2026-11-10, avant la série. Point de départ : le billet « CSS Optimization: Is Using Declarations Just Once (UDJO)
Still Effective Today? » (Jens Oliver Meiert, CSS-Tricks, 10 novembre 2026), qui mesure avec son outil CSS Dedup la taille
brute de feuilles de 30 sites avant et après dédoublonnage, et dit ne pas avoir mesuré l'effet après compression (gzip,
Brotli) ni comparé aux minificateurs.

## Questions

1. Sur des feuilles réelles de l'écosystème WordPress et de frameworks, que gagne CSS Dedup 1.13.3 en octets bruts selon le
   mode (`-f`, `-f -s`, `-f -a`, `-f -a -s`) ?
2. Ce gain survit-il à la minification, selon que le minificateur regroupe déjà des règles (Lightning CSS, cssnano, csso,
   clean-css niveau 2) ou non (clean-css niveau 1) ?
3. Ce gain survit-il à la compression de transfert (gzip niveau 6, Brotli qualité 11) ?
4. Le mode par défaut refuse-t-il les fusions qui changent la cascade, et le mode agressif les accepte-t-il, sur des cas
   construits où le résultat attendu est connu ?
5. Au-delà du poids (question ajoutée le 2026-11-10, après la première série de tailles) : que coûte le dédoublonnage au
   rendu, en règles appariées par élément et en durée de recalcul de style, et change-t-il les styles calculés d'une page
   réelle ?

## Corpus

Huit feuilles publiques, version épinglée, récupérées par `recuperer.mjs` et contrôlées par `SHA256SUMS` (non commitées,
dossier `corpus/`) :

| Fichier | Source |
|---|---|
| `generatepress-3.6.1-main.css` | `themes.svn.wordpress.org/generatepress/3.6.1/assets/css/main.css` |
| `astra-4.14.2-main.min.css` | `themes.svn.wordpress.org/astra/4.14.2/assets/css/minified/main.min.css` |
| `kadence-1.6.0-global.min.css` | `themes.svn.wordpress.org/kadence/1.6.0/assets/css/global.min.css` |
| `woocommerce-11.2.2.css` | `plugins.svn.wordpress.org/woocommerce/tags/11.2.2/assets/css/woocommerce.css` |
| `elementor-4.4.0-frontend.css` | `plugins.svn.wordpress.org/elementor/tags/4.4.0/assets/css/frontend.css` |
| `wordpress-7.1.4-block-library.css` | `core.svn.wordpress.org/tags/7.1.4/wp-includes/css/dist/block-library/style.css` |
| `bootstrap-5.3.8.css` | `cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.css` |
| `bulma-1.0.4.css` | `cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.css` |

Deux feuilles sont déjà minifiées par leur éditeur (Astra, Kadence) : elles entrent telles quelles.

## Chaîne mesurée

Pour chaque feuille : dédoublonnage (aucun, `-f`, `-f -s`, `-f -a`, `-f -a -s`, par l'API `dedup()` de CSS Dedup 1.13.3),
puis minification (aucune, Lightning CSS 1.33.0 `minify: true` sans cible, cssnano 9.9.0 préréglage par défaut, csso 5.0.5
par défaut, clean-css 5.3.3 niveau 1 et niveau 2), puis taille en octets UTF-8 brute, gzip (zlib de Node, niveau 6) et
Brotli (zlib de Node, mode texte, qualités 5 et 11). Brotli 5 est ajouté après une première série (seule colonne ajoutée,
série entière rejouée). La structure de chaque feuille (règles de style, sélecteurs des listes dépliés, déclarations) est
comptée par PostCSS. L'ordre dédoublonnage puis minification est celui que conseille la
documentation de CSS Dedup (cartes de source). Une variante inverse (Lightning CSS puis `-f -s`) mesure le cas « appliqué
à une feuille déjà minifiée » du billet.

Aucune durée n'est mesurée : la charge du processeur est relevée dans `brut/machine.txt` sans bloquer le départ.

## Contrôles de la série

- **Garde de complétude** : 8 feuilles × 5 dédoublonnages × 6 minifications = 240 mesures, plus 8 de la variante inverse ;
  le banc échoue à un autre compte.
- **Garde de validité** : chaque sortie se relit par PostCSS sans erreur et garde plus de la moitié des octets de son entrée.
- **Conservation des déclarations** : pour chaque sortie de CSS Dedup, ensemble des couples (portée, sélecteur simple de la
  liste, propriété, valeur normalisée) comparé à celui de la feuille d'entrée. Un écart n'est pas forcément une erreur
  (graphies équivalentes ramenées à la plus courte, sélecteur répété fusionné) : chaque écart s'imprime et se relit.
- **Témoin de taille** : la taille brute sans dédoublonnage ni minification égale la taille du fichier sur disque.

## Témoins de cascade

Feuilles construites de quelques règles, rendues dans Chrome stable installé (Playwright, `channel: 'chrome'`), couleur
calculée d'éléments témoins avant et après chaque mode. Une fusion « à la main » (sélecteurs regroupés sur la dernière
occurrence, sans contrôle) sert de témoin négatif : elle doit changer le rendu, sinon le cas ne prouve rien.

| Cas | Feuille | Élément | Attendu |
|---|---|---|---|
| `sur` | `.a{color:red}.b{color:red}` | `.a`, `.b` | fusion appliquée, rouge partout |
| `intercale` | `.a{color:red}.x{color:blue}.b{color:red}` | `class="a x"` | bleu ; la fusion naïve donne rouge |
| `blocs` | même règle `.a` puis `.b` dans deux `@media (min-width:1px)` séparés par `.x{color:blue}` | `class="a x"` | bleu |
| `hack` | `.a{color:red}` et `.b::-moz-selection{color:red}` | `.a` | rouge ; la liste regroupée est invalide dans Chrome |
| `hack-sans-liste` | cas `hack` avec `ignoreSelectorsDefaults: false` | `.a` | mesure seule |

## Coût de rendu et équivalence sur une page réelle (`rendu.mjs`)

Feuille : Bootstrap 5.3.8 du corpus, chaque variante de dédoublonnage (aucune, `-f`, `-f -s`, `-f -a`, `-f -a -s`) minifiée
par Lightning CSS (forme servie), plus un témoin positif `double` (la feuille d'origine écrite deux fois : rendu identique,
deux fois plus de règles). Pages : `cheatsheet` (presque tous les composants) et `album` des exemples officiels
(`bootstrap-5.3.8-examples.zip` de la publication GitHub v5.3.8, empreinte contrôlée), servies par un serveur Node local
(port libre, `no-store`), la feuille de la page remplacée par la variante ; chaque chargement vérifie que la variante a été
servie en entier. Aucune requête ne sort (interceptée, 204). Chrome stable installé en fenêtre, 1350 × 940, contexte neuf par
chargement.

- **Structure et équivalence** (une fois, ×1, sans durée) : règles appariées par élément (`CSS.getMatchedStylesForNode`,
  règles d'auteur, pseudo-éléments compris), total et maximum ; styles calculés de chaque élément du `body` et de ses
  `::before` et `::after`, toutes propriétés, comparés à la variante d'origine, animations infinies figées à 0 et finies
  menées à terme. Témoin : `double` sans aucun écart.
- **Statistiques de sélecteurs de Chrome** (ajoutées le 2026-11-10 après l'échec du premier témoin de durée, ci-dessous) :
  trace d'un recalcul complet forcé, catégorie `disabled-by-default-blink.debug`, événements `SelectorStats` ; somme, sur les
  sélecteurs des feuilles d'auteur, des tentatives de correspondance, correspondances, rejets rapides et microsecondes
  (durée sous trace, indicative). Le banc échoue si la trace ne porte aucune statistique.
- **Durée** : recalcul de style lu par `Performance.getMetrics` (`RecalcStyleDuration`, `RecalcStyleCount`), au chargement
  et sur 20 recalculs complets forcés (`body` passé en `display: none` puis rendu, lecture de `offsetHeight`), durée par
  recalcul. Deux niveaux de processeur : ×1 (Mac Studio M4 Max, indice de Lighthouse ~4 140) et ×9 (indice ~439, taux le plus
  proche de 460 mesuré par `calibrage.mjs`, copie de celui de `report-interaction/`). Dix passages par variante et par page,
  ordre des variantes tourné à chaque passage, un passage d'échauffement jeté. Machine au repos exigée : médiane de quatre relevés de `top` à 85 % d’inactivité au moins.
  Témoin de durée : à chaque niveau et sur chaque page, la plus courte mesure de `double` dépasse la plus longue de l'origine,
  sinon le banc échoue (données gardées sous un nom qui le dit). Premier critère, fixé avant toute mesure : `double` plus lent de
  plus de 20 % en médiane ; série du 2026-11-10 arrêtée à ×1 sur `cheatsheet` (2,30 ms contre 2,04 ms, +13 %) : un doublement
  des règles ne double pas le recalcul, l'appariement n'en étant qu'une part. Critère remplacé par la non-recouvrance des
  plages, série relancée en entière.
- **Second déclencheur** (ajouté après l'échec de ce second critère : `double` à +10 % en médiane, plages recouvrantes sur les
  quatre couples) : le basculement de `display` reconstruit aussi l'arbre de rendu, coût fixe qui peut noyer l'appariement.
  Après la première mesure, 40 basculements d'une classe sur `html`, avec une règle `html.banc-bascule *{--banc-bascule:1}`
  injectée hors de la feuille testée : chaque basculement restyle tous les éléments sans reconstruire l'arbre (essai : 903
  éléments sur 905 par `elementCount` de `UpdateLayoutTree`). Témoin évalué pour chaque déclencheur ; une mesure n'est
  publiable que si son témoin passe partout. Troisième et dernière série ; sans témoin passé, aucune durée n'est publiée comme
  écart, seule la borne (un doublement de la feuille dans la dispersion) l'est.

## Limites

Équivalence du rendu contrôlée sur deux pages Bootstrap seulement ; pour les autres feuilles, le contrôle de conservation ne
voit pas un déplacement dans la cascade, et la sûreté est celle que documente CSS Dedup, éprouvée sur les témoins. Durée de
recalcul sur une seule feuille et un seul poste (macOS) ; le coût d'analyse de la feuille (parse) n'est pas isolé. Brotli et
gzip de Node (zlib), pas ceux d'un serveur ou d'un CDN ; zstd non mesuré.
